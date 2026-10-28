#!/usr/bin/env python3
"""Outcome evals for HFS skills (contract: hfs-development-kit/skills/_meta/OUTCOME_EVALS.md).

Trigger evals (skill_eval.py) ask "does the right skill fire?". Outcome evals ask
"when it fires, is the result right?" - a deterministic judge script checks the
agent's workdir against planted ground truth. The model never grades itself.

Two modes, both dispatched from skill_eval.py:

  --validate-judges  NO model calls. For every case: judge(golden) must exit 0 and
                     judge(each mutant) must exit 1. The cheap CI gate.
  --outcomes         For every case: fresh temp workdir holding ONLY the fixture,
                     headless `claude -p` with the skill under test loaded
                     explicitly, then the judge. pass^k = all k runs pass.

Isolation of the agent run (the thing being measured is the skill, not the
operator's environment):
  - the skill is mounted as a session-only plugin (`--plugin-dir`), copied from
    the skills dir WITHOUT its evals/ subtree, and invoked by its namespaced name
    `hfs-eval:<skill>` - no collision with ~/.claude/skills symlinks;
  - `--setting-sources project,local` (no user hooks/plugins/skills/permissions),
    `--strict-mcp-config` (no MCP unless a case requires one and --mcp-config
    provides it), `--tools` restricted to file tools + a narrow Bash allowlist,
    `--permission-mode acceptEdits --permission-prompts none` (anything not
    allowlisted is denied; never --dangerously-skip-permissions);
  - truth/, golden/, mutants/, checks/ never enter the workdir, and Read rules deny
    the source skills dir and any evals/{truth,golden,mutants,checks} path.

Run statuses: PASS | FAIL | TIMEOUT | JUDGE_ERROR | AGENT_ERROR | SKILL_NOT_LOADED.
Only PASS counts toward pass^k. A case whose `requires:` is unavailable is
SKIPPED (never passed). sandbox:home -> see agent_env().

Baseline recorded every run: {case_set_hash, skill_hashes, upstream_pins}.
index_hash is deliberately absent: outcome runs load the skill explicitly, so
the production index (trigger competition) is not part of the measured surface.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shlex
import shutil
import subprocess
import tempfile
import time
import uuid
from datetime import date
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[2]
DEFAULT_HISTORY_DIR = WORKSPACE / "ske" / "evals" / "history"
OUTCOME_MODEL = "claude-sonnet-5-5"
CLAUDE_BIN = "claude"
PLUGIN_NAME = "hfs-eval"
JUDGE_TIMEOUT_S = 120

REQUIRED_KEYS = ("id", "skill", "prompt", "fixture", "truth", "check", "budget", "runs")
HIDDEN_DIRS = ("truth", "golden", "mutants", "checks")  # never visible to the agent
FILE_TOOLS = ["Read", "Write", "Edit", "Glob", "Grep", "Bash", "Skill"]
NARROW_BASH = ["Bash(ls:*)", "Bash(mkdir:*)", "Bash(wc:*)", "Bash(diff:*)"]
NETWORK_TOOLS = ["WebFetch", "WebSearch"]
MCP_REQ = re.compile(r"^mcp:([A-Za-z0-9_.-]+)$")
ENV_REQ = re.compile(r"^env:([A-Za-z_][A-Za-z0-9_]*)$")
SANDBOX_HOME = "sandbox:home"


class Fatal(SystemExit):
    """Malformed case set / environment - fail loudly, never a silent pass."""

    def __init__(self, msg: str):
        super().__init__(f"FATAL: {msg}")


# --------------------------------------------------------------------------- cases

def load_outcomes(skills_dir: Path, skills: list[str] | None = None,
                  case_ids: list[str] | None = None) -> list[dict]:
    """Discover skills/*/evals/outcomes.yaml; validate the selected cases.

    Id uniqueness is checked estate-wide; full (path) validation only for the
    selected cases, so one half-written case elsewhere doesn't mask a filter.
    """
    import yaml

    if not skills_dir.is_dir():
        raise Fatal(f"skills dir not found: {skills_dir}")
    files = sorted(skills_dir.glob("*/evals/outcomes.yaml"))
    seen: dict[str, Path] = {}
    selected: list[dict] = []
    for f in files:
        doc = yaml.safe_load(f.read_text())
        if not isinstance(doc, dict) or not isinstance(doc.get("outcomes"), list):
            raise Fatal(f"{f}: top-level 'outcomes:' list missing")
        for case in doc["outcomes"]:
            if not isinstance(case, dict) or "id" not in case:
                raise Fatal(f"{f}: outcome entry without 'id'")
            cid = case["id"]
            if cid in seen:
                raise Fatal(f"duplicate outcome id {cid!r} in {f} and {seen[cid]}")
            seen[cid] = f
            skill_name = f.parent.parent.name
            if skills and skill_name not in skills:
                continue
            if case_ids and cid not in case_ids:
                continue
            selected.append(_validate_case(case, f))
    if case_ids:
        missing = sorted(set(case_ids) - {c["id"] for c in selected})
        if missing:
            raise Fatal(f"--case id(s) not found in selected skills: {missing}")
    if not selected:
        scope = f" (skill={skills}, case={case_ids})" if skills or case_ids else ""
        raise Fatal(f"no outcome cases under {skills_dir}{scope}")
    return selected


def _validate_case(case: dict, yaml_path: Path) -> dict:
    cid = case["id"]
    where = f"{yaml_path} case {cid!r}"
    for key in REQUIRED_KEYS:
        if key not in case:
            raise Fatal(f"{where} missing {key!r}")
    evals = yaml_path.parent
    skill_dir = evals.parent
    if case["skill"] != skill_dir.name:
        raise Fatal(f"{where}: skill {case['skill']!r} != directory {skill_dir.name!r}")
    budget = case["budget"]
    for key in ("max_turns", "timeout_s"):
        if not isinstance(budget, dict) or not _pos_int(budget.get(key)):
            raise Fatal(f"{where}: budget.{key} must be a positive integer")
    if not _pos_int(case["runs"]):
        raise Fatal(f"{where}: runs must be a positive integer")
    requires = case.get("requires") or []
    if not isinstance(requires, list):
        raise Fatal(f"{where}: requires must be a list")
    if not all(isinstance(r, str) for r in requires):
        raise Fatal(f"{where}: requires entries must be strings")

    paths = {}
    for key, kind in (("fixture", "dir"), ("truth", "file"), ("check", "file")):
        p = (evals / case[key]).resolve()
        if not p.is_relative_to(evals.resolve()):
            raise Fatal(f"{where}: {key} escapes evals/: {case[key]}")
        if not (p.is_dir() if kind == "dir" else p.is_file()):
            raise Fatal(f"{where}: {key} {kind} not found: {p}")
        paths[key] = p
    fixture = paths["fixture"]
    for hidden in HIDDEN_DIRS:
        if fixture.is_relative_to((evals / hidden).resolve()):
            raise Fatal(f"{where}: fixture lives under {hidden}/ - it would leak to the agent")
    for link in (p for p in fixture.rglob("*") if p.is_symlink()):
        # relative links that stay inside the fixture are copied as links (dangling is fine);
        # anything else could expose truth/golden/mutants/checks to the agent
        target = os.readlink(link)
        lexical = Path(os.path.normpath(link.parent / target))
        if os.path.isabs(target) or not lexical.is_relative_to(fixture):
            raise Fatal(f"{where}: fixture symlink escapes the fixture: {link} -> {target}")

    out = dict(case)
    out["requires"] = requires
    out.update({"_evals": evals, "_skill_dir": skill_dir, "_fixture": fixture,
                "_truth": paths["truth"], "_check": paths["check"]})
    return out


def _pos_int(v) -> bool:
    return isinstance(v, int) and not isinstance(v, bool) and v > 0


# --------------------------------------------------------------------------- judge

def run_judge(check: Path, workdir: Path, truth: Path) -> dict:
    """Invoke the judge exactly per contract. Exit 2 / unparseable = JUDGE_ERROR."""
    cmd = ["python3", "-I", str(check), str(workdir), str(truth)]
    try:
        r = subprocess.run(cmd, capture_output=True, text=True,
                           timeout=JUDGE_TIMEOUT_S, cwd=check.parent)
    except subprocess.TimeoutExpired:
        return {"status": "JUDGE_ERROR", "reason": f"judge timed out after {JUDGE_TIMEOUT_S}s"}
    base = {"exit": r.returncode, "stderr": r.stderr[-500:]}
    if r.returncode not in (0, 1):
        return {**base, "status": "JUDGE_ERROR", "reason": f"judge exit {r.returncode}"}
    lines = [ln for ln in r.stdout.splitlines() if ln.strip()]
    if len(lines) != 1:
        return {**base, "status": "JUDGE_ERROR",
                "reason": f"expected ONE JSON line on stdout, got {len(lines)}"}
    try:
        verdict = json.loads(lines[0])
    except ValueError as e:
        return {**base, "status": "JUDGE_ERROR", "reason": f"unparseable judge output: {e}"}
    passed = verdict.get("passed") if isinstance(verdict, dict) else None
    score = verdict.get("score") if isinstance(verdict, dict) else None
    if (not isinstance(passed, bool)
            or isinstance(score, bool) or not isinstance(score, (int, float))
            or not 0 <= score <= 1
            or not isinstance(verdict.get("details", {}), dict)):
        return {**base, "status": "JUDGE_ERROR",
                "reason": "judge JSON must be {passed: bool, score: 0..1, details: {}}"}
    if passed != (r.returncode == 0):
        return {**base, "status": "JUDGE_ERROR",
                "reason": f"exit {r.returncode} disagrees with passed={passed}"}
    return {**base, "status": "PASS" if passed else "FAIL", "score": float(score),
            "details": verdict.get("details", {})}


def validate_judges(cases: list[dict]) -> int:
    """Judge-the-judge gate: golden must PASS (exit 0), every mutant must FAIL (exit 1)."""
    problems = 0
    for case in cases:
        cid, evals = case["id"], case["_evals"]
        golden = evals / "golden" / cid
        mutants = sorted(p for p in (evals / "mutants").glob(f"{cid}-*") if p.is_dir())
        bad: list[str] = []
        if not golden.is_dir():
            bad.append(f"missing golden/{cid}/")
        if not mutants:
            bad.append(f"missing mutants/{cid}-*/ (need >=1)")
        if golden.is_dir():
            v = _judge_copy(case, golden)
            if v["status"] != "PASS":
                bad.append(f"golden -> {v['status']} ({v.get('reason', 'exit %s' % v.get('exit'))})")
        for m in mutants:
            v = _judge_copy(case, m)
            if v["status"] != "FAIL":
                bad.append(f"mutant {m.name} -> {v['status']} "
                           f"({v.get('reason', 'exit %s' % v.get('exit'))}) - must exit 1")
        if bad:
            problems += 1
            print(f"BAD  {cid}: " + "; ".join(bad))
        else:
            print(f"OK   {cid}: golden passes, {len(mutants)}/{len(mutants)} mutants fail")
        # Not a contract gate, but a do-nothing agent must not pass.
        if _judge_copy(case, case["_fixture"])["status"] == "PASS":
            print(f"WARN {cid}: judge PASSES the untouched fixture - a no-op run would pass")
    print(f"validate-judges: {len(cases) - problems}/{len(cases)} cases OK")
    return 1 if problems else 0


def _judge_copy(case: dict, state: Path) -> dict:
    """Judge a COPY of a state dir so a buggy judge can't mutate golden/mutants."""
    with tempfile.TemporaryDirectory(prefix=f"judge-{case['id']}-") as tmp:
        work = Path(tmp).resolve() / "work"
        shutil.copytree(state, work, symlinks=True)
        return run_judge(case["_check"], work, case["_truth"])


# --------------------------------------------------------------------------- agent run

def unmet_requires(case: dict, allow_network: bool, mcp_servers: set[str]) -> list[str]:
    """Requirements this runner can't satisfy -> the case is SKIPPED, never run unguarded.
    Contract v0.2: network | mcp:<server> | env:<VAR> | sandbox:home; anything else is
    unsupported. env values are never read beyond presence, never logged."""
    missing = []
    for req in case["requires"]:
        m, e = MCP_REQ.match(req), ENV_REQ.match(req)
        if req == "network":
            if not allow_network:
                missing.append("network (pass --allow-network)")
        elif m:
            if m.group(1) not in mcp_servers:
                missing.append(f"{req} (not defined in --mcp-config)")
        elif e:
            if not os.environ.get(e.group(1)):
                missing.append(f"{req} (not set)")
        elif req == SANDBOX_HOME:
            if not claude_supports_env_file():
                missing.append(f"{req} (claude CLI does not honour CLAUDE_ENV_FILE - no sandbox, no run)")
        else:
            missing.append(f"{req} (unsupported by this runner)")
    return missing


_ENV_FILE_SUPPORT: dict[str, bool] = {}


def claude_supports_env_file() -> bool:
    """sandbox:home relies on CLAUDE_ENV_FILE (sourced before every Bash-tool command).
    Static capability check: the resolved CLI must reference that variable."""
    exe = shutil.which(CLAUDE_BIN)
    if exe is None:
        return False
    exe = os.path.realpath(exe)
    if exe not in _ENV_FILE_SUPPORT:
        needle, found, tail = b"CLAUDE_ENV_FILE", False, b""
        with open(exe, "rb") as f:
            while chunk := f.read(1 << 22):
                if needle in tail + chunk:
                    found = True
                    break
                tail = chunk[-len(needle):]
        _ENV_FILE_SUPPORT[exe] = found
    return _ENV_FILE_SUPPORT[exe]


def agent_env(case: dict, root: Path, work: Path) -> dict:
    """Env for the claude subprocess.

    sandbox:home: HOME is NOT changed for the claude process itself - probed 2026-10-16
    (CLI 2.1.296): HOME=<tmp> gives "Not logged in" and claude writes .claude.json,
    .claude/{projects,sessions,backups} into that HOME, which would corrupt the very
    sandbox the judge inspects. Instead CLAUDE_ENV_FILE points at a script (outside the
    workdir) that the CLI sources before every Bash-tool command, so the agent's shell
    runs with HOME=<workdir>/home while claude keeps its own auth/config.
    """
    env = dict(os.environ)
    env.pop("CLAUDE_ENV_FILE", None)   # never inherit the operator's session env script
    if SANDBOX_HOME in case["requires"]:
        home = work / "home"
        home.mkdir(exist_ok=True)
        script = root / "agent-env.sh"
        script.write_text(f"export HOME={shlex.quote(str(home))}\n")
        env["CLAUDE_ENV_FILE"] = str(script)
    return env


def build_plugin(dest: Path, skill_dir: Path) -> Path:
    """Session-only plugin carrying the skill under test, minus its evals/ tree."""
    (dest / ".claude-plugin").mkdir(parents=True)
    (dest / ".claude-plugin" / "plugin.json").write_text(json.dumps(
        {"name": PLUGIN_NAME, "version": "0.0.0",
         "description": "HFS outcome eval: skill under test"}))
    shutil.copytree(skill_dir, dest / "skills" / skill_dir.name,
                    ignore=lambda d, names: ["evals"] if Path(d) == skill_dir else [])
    return dest


def build_prompt(case: dict) -> str:
    return (f"Use the {PLUGIN_NAME}:{case['skill']} skill (load it with the Skill tool "
            f"first, then follow it). Work only inside the current directory.\n\n"
            f"{case['prompt']}")


def build_command(case: dict, work: Path, plugin: Path, model: str, skills_dir: Path,
                  allow_network: bool, mcp_config: Path | None) -> list[str]:
    tools = list(FILE_TOOLS)
    allowed = ["Read", "Glob", "Grep", "Skill",
               f"Edit(/{work}/**)", f"Write(/{work}/**)", *NARROW_BASH]
    if allow_network and "network" in case["requires"]:
        tools += NETWORK_TOOLS
        allowed += NETWORK_TOOLS
    needed_mcp = [m.group(1) for r in case["requires"] if (m := MCP_REQ.match(r))]
    allowed += [f"mcp__{s}" for s in needed_mcp]
    denied = [f"Read(/{skills_dir.resolve()}/**)",
              *(f"Read(**/evals/{h}/**)" for h in HIDDEN_DIRS)]
    cmd = [CLAUDE_BIN, "-p", build_prompt(case),
           "--model", model,
           "--max-turns", str(case["budget"]["max_turns"]),
           "--output-format", "stream-json", "--verbose",
           "--plugin-dir", str(plugin),
           "--setting-sources", "project,local",
           "--strict-mcp-config"]
    if needed_mcp:
        cmd += ["--mcp-config", str(mcp_config)]
    cmd += ["--tools", ",".join(tools),
            "--allowedTools", ",".join(allowed),
            "--disallowedTools", ",".join(denied),
            "--permission-mode", "acceptEdits",
            "--permission-prompts", "none",
            "--no-session-persistence"]
    return cmd


def invoke_agent(cmd: list[str], cwd: Path, transcript: Path, timeout_s: int,
                 env: dict | None = None) -> int | None:
    """Run headless claude, streaming stdout to the transcript. None = timed out."""
    with transcript.open("w") as out, (transcript.with_suffix(".stderr.txt")).open("w") as err:
        proc = subprocess.Popen(cmd, cwd=cwd, stdin=subprocess.DEVNULL, stdout=out,
                                stderr=err, text=True, env=env)
        try:
            return proc.wait(timeout=timeout_s)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait()
            return None


def parse_transcript(transcript: Path, skill: str) -> dict:
    """Pull the result message and Skill-tool evidence out of the stream-json transcript."""
    result, init, uses, errored = None, None, {}, set()
    names = {f"{PLUGIN_NAME}:{skill}", skill}
    for line in transcript.read_text().splitlines():
        try:
            msg = json.loads(line)
        except ValueError:
            continue  # stream-json is one object per line; stray text is recorded, not parsed
        if msg.get("type") == "result":
            result = msg
        elif msg.get("type") == "system" and msg.get("subtype") == "init":
            init = msg
        body = msg.get("message")   # a string for e.g. system/permission_denied events
        for block in (body.get("content") or []) if isinstance(body, dict) else []:
            if not isinstance(block, dict):
                continue
            if block.get("type") == "tool_use" and block.get("name") == "Skill":
                arg = block.get("input") or {}
                uses[block.get("id")] = arg.get("skill") or arg.get("command") or arg.get("name")
            elif block.get("type") == "tool_result" and block.get("is_error"):
                errored.add(block.get("tool_use_id"))
    loaded = any(name in names and uid not in errored for uid, name in uses.items())
    return {
        "result": result,
        "skill_loaded": loaded,
        "skill_calls": sorted(str(n) for n in uses.values()),
        "skill_listed": bool(init and f"{PLUGIN_NAME}:{skill}" in (init.get("skills") or [])),
    }


def run_once(case: dict, idx: int, opts: dict) -> dict:
    cid = case["id"]
    root = Path(tempfile.mkdtemp(prefix=f"outcome-{cid}-")).resolve()
    work = root / "work"
    try:
        shutil.copytree(case["_fixture"], work, symlinks=True)  # ONLY the fixture enters
        plugin = build_plugin(root / "plugin", case["_skill_dir"])
        opts["transcripts_dir"].mkdir(parents=True, exist_ok=True)
        transcript = opts["transcripts_dir"] / f"{cid}-r{idx + 1}.jsonl"
        cmd = build_command(case, work, plugin, opts["model"], opts["skills_dir"],
                            opts["allow_network"], opts["mcp_config"])
        t0 = time.monotonic()
        env = agent_env(case, root, work)
        rc = invoke_agent(cmd, work, transcript, case["budget"]["timeout_s"], env)
        duration = round(time.monotonic() - t0, 1)
        run = {"run": idx + 1, "exit": rc, "duration_s": duration,
               "transcript": _rel(transcript),
               "sandbox_home": SANDBOX_HOME in case["requires"]}
        if rc is None:
            return {**run, "status": "TIMEOUT", "score": 0.0, "cost_usd": None,
                    "reason": f"wall clock {case['budget']['timeout_s']}s exceeded"}
        info = parse_transcript(transcript, case["skill"])
        res = info["result"] or {}
        run.update({"cost_usd": res.get("total_cost_usd"), "num_turns": res.get("num_turns"),
                    "agent_subtype": res.get("subtype"),
                    "permission_denials": len(res.get("permission_denials") or []),
                    "skill_loaded": info["skill_loaded"], "skill_listed": info["skill_listed"],
                    "skill_calls": info["skill_calls"]})
        budget_stop = "max_turns" in str(res.get("subtype")) or "max_turns" in str(
            res.get("terminal_reason")) or "budget" in str(res.get("subtype"))
        if info["result"] is None or ((res.get("is_error") or rc != 0) and not budget_stop):
            return {**run, "status": "AGENT_ERROR", "score": 0.0,
                    "reason": "no result message" if info["result"] is None
                    else f"agent error: {str(res.get('result'))[:200]}"}
        verdict = run_judge(case["_check"], work, case["_truth"])
        run["judge"] = {k: verdict.get(k) for k in ("status", "exit", "score", "details", "reason")}
        status = verdict["status"]
        if status != "JUDGE_ERROR" and not info["skill_loaded"]:
            status = "SKILL_NOT_LOADED"   # measured the bare model, not the skill
        return {**run, "status": status, "score": verdict.get("score", 0.0)}
    finally:
        if opts["keep_workdirs"]:
            print(f"  kept workdir: {root}")
        else:
            shutil.rmtree(root, ignore_errors=True)


def run_case(case: dict, opts: dict) -> dict:
    head = {"id": case["id"], "skill": case["skill"]}
    missing = unmet_requires(case, opts["allow_network"], opts["mcp_servers"])
    if missing:
        return {**head, "verdict": "SKIPPED", "reason": "requires " + ", ".join(missing)}
    k = opts["runs"] or case["runs"]
    runs = [run_once(case, i, opts) for i in range(k)]
    statuses = {r["status"] for r in runs}
    if statuses == {"PASS"}:
        verdict = "PASS"
    elif statuses & {"JUDGE_ERROR", "AGENT_ERROR", "SKILL_NOT_LOADED"}:
        verdict = "ERROR"
    else:
        verdict = "FAIL"
    costs = [r["cost_usd"] for r in runs if isinstance(r.get("cost_usd"), (int, float))]
    return {**head, "verdict": verdict, "k": k,
            "pass_k": verdict == "PASS",
            "passes": sum(r["status"] == "PASS" for r in runs),
            "mean_score": round(sum(r["score"] for r in runs) / k, 3),
            "cost_usd": round(sum(costs), 4) if len(costs) == k else None,
            "mean_duration_s": round(sum(r["duration_s"] for r in runs) / k, 1),
            "runs": runs}


def run_outcomes(cases: list[dict], opts: dict) -> tuple[int, dict]:
    run_id = time.strftime("%Y%m%dT%H%M%S") + "-" + uuid.uuid4().hex[:6]
    today = date.today().isoformat()
    history: Path = opts["history_dir"]
    opts["transcripts_dir"] = history / "transcripts" / f"{today}-{run_id}"

    results = []
    for case in cases:
        print(f"-> {case['id']} ({case['skill']})")
        results.append(run_case(case, opts))
    record = {
        "date": today, "mode": "outcomes", "run_id": run_id, "model": opts["model"],
        "baseline": outcome_baseline(cases),
        "flags": {"allow_network": opts["allow_network"],
                  "mcp_servers": sorted(opts["mcp_servers"]),
                  "runs_override": opts["runs"]},
        "summary": _summary(results),
        "cases": results,
    }
    history.mkdir(parents=True, exist_ok=True)
    with (history / f"{today}-outcomes.jsonl").open("a") as f:
        f.write(json.dumps(record) + "\n")
    _print_table(results, record)
    s = record["summary"]
    if s["ran"] == 0:
        print("outcomes: NO case ran (all SKIPPED) - nothing passed")
        return 1, record
    return (2 if s["error"] else 1 if s["fail"] else 0), record


def _summary(results: list[dict]) -> dict:
    count = {v: sum(r["verdict"] == v for r in results)
             for v in ("PASS", "FAIL", "ERROR", "SKIPPED")}
    costs = [r["cost_usd"] for r in results if r.get("cost_usd") is not None]
    return {"cases": len(results), "ran": len(results) - count["SKIPPED"],
            "pass": count["PASS"], "fail": count["FAIL"], "error": count["ERROR"],
            "skipped": count["SKIPPED"], "cost_usd": round(sum(costs), 4)}


def _print_table(results: list[dict], record: dict) -> None:
    print(f"\n{'case':<14} {'verdict':<8} {'pass^k':<7} {'score':>6} {'cost$':>8} {'secs':>7}")
    for r in results:
        if r["verdict"] == "SKIPPED":
            print(f"{r['id']:<14} SKIPPED  {r['reason']}")
            continue
        cost = "n/a" if r["cost_usd"] is None else f"{r['cost_usd']:.4f}"
        print(f"{r['id']:<14} {r['verdict']:<8} {r['passes']}/{r['k']:<5} "
              f"{r['mean_score']:>6.3f} {cost:>8} {r['mean_duration_s']:>7.1f}")
        for run in r["runs"]:
            if run["status"] != "PASS":
                why = run.get("reason") or (run.get("judge") or {}).get("reason") or ""
                print(f"    run {run['run']}: {run['status']} {why}".rstrip())
    s = record["summary"]
    print(f"outcomes: {s['pass']} pass, {s['fail']} fail, {s['error']} error, "
          f"{s['skipped']} skipped; cost ${s['cost_usd']}; model={record['model']}; "
          f"case_set_hash={record['baseline']['case_set_hash'][:12]}")


# --------------------------------------------------------------------------- baseline

def upstream_pins() -> list:
    """Upstream pin drift from the inventory (same source as skill_eval.baseline_triple)."""
    try:
        return json.loads((WORKSPACE / "ske" / "skills_inventory.json").read_text()).get(
            "upstream_drift", [])
    except (OSError, ValueError):
        return []  # pins list may be empty pre-SKE-07; None is never recorded


def _tree_hash(root: Path, skip_top: str | None = None) -> str:
    h = hashlib.sha256()
    for p in sorted(root.rglob("*")):
        rel = p.relative_to(root)
        if skip_top and rel.parts[0] == skip_top:
            continue
        if p.is_file():
            h.update(str(rel).encode() + b"\0" + p.read_bytes() + b"\0")
    return h.hexdigest()


def outcome_baseline(cases: list[dict]) -> dict:
    h = hashlib.sha256()
    for c in sorted(cases, key=lambda c: c["id"]):
        h.update(json.dumps({k: v for k, v in c.items() if not k.startswith("_")},
                            sort_keys=True).encode())
        h.update(c["_truth"].read_bytes() + c["_check"].read_bytes())
        h.update(_tree_hash(c["_fixture"]).encode())
    skills = {c["skill"]: c["_skill_dir"] for c in cases}
    return {"case_set_hash": h.hexdigest(),
            "skill_hashes": {s: _tree_hash(d, skip_top="evals") for s, d in sorted(skills.items())},
            "upstream_pins": upstream_pins()}


def _rel(p: Path) -> str:
    try:
        return str(p.resolve().relative_to(WORKSPACE))
    except ValueError:
        return str(p)


def mcp_servers_in(config: Path | None) -> set[str]:
    if config is None:
        return set()
    try:
        doc = json.loads(config.read_text())
    except (OSError, ValueError) as e:
        raise Fatal(f"--mcp-config unreadable: {e}")
    servers = doc.get("mcpServers") if isinstance(doc, dict) else None
    if not isinstance(servers, dict):
        raise Fatal(f"--mcp-config {config} has no 'mcpServers' object")
    return set(servers)


def main(args) -> int:
    """Entry from skill_eval.py (args = its parsed argparse namespace)."""
    cases = load_outcomes(args.skills_dir, args.skill, args.case)
    if args.validate_judges:
        return validate_judges(cases)
    if args.runs is not None and args.runs < 1:
        raise Fatal("--runs must be >= 1")
    opts = {"model": args.model, "runs": args.runs, "allow_network": args.allow_network,
            "mcp_config": args.mcp_config, "mcp_servers": mcp_servers_in(args.mcp_config),
            "skills_dir": args.skills_dir, "history_dir": args.history_dir,
            "keep_workdirs": args.keep_workdirs}
    code, record = run_outcomes(cases, opts)
    if args.report:
        args.report.write_text(json.dumps(record, indent=2))
    return code


if __name__ == "__main__":  # pragma: no cover - use skill_eval.py --outcomes
    raise SystemExit("run via: skill_eval.py --outcomes | --validate-judges")
