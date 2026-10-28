"""Tests for outcome evals (outcome_eval.py via skill_eval.py).

A tiny synthetic skill in tmp_path; the `claude` binary is replaced by a fake
script, so no test spends money. Judges run for real (python3 -I).
"""

from __future__ import annotations

import json
import subprocess
import sys
import textwrap
from argparse import Namespace
from pathlib import Path

import pytest

SCRIPTS = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(SCRIPTS))

import outcome_eval  # noqa: E402

JUDGE = textwrap.dedent("""\
    import json, sys
    from pathlib import Path
    work, truth = Path(sys.argv[1]), Path(sys.argv[2])
    try:
        expected = json.loads(truth.read_text())["expected"]
    except Exception as e:
        print(json.dumps({"passed": False, "score": 0, "details": {"error": str(e)}}))
        sys.exit(2)
    out = work / "count.txt"
    got = out.read_text().strip() if out.exists() else None
    ok = got == expected
    print(json.dumps({"passed": ok, "score": 1.0 if ok else 0.0,
                      "details": {"got": got, "expected": expected}}))
    sys.exit(0 if ok else 1)
""")

FAKE_CLAUDE = textwrap.dedent("""\
    #!{python}
    import json, os, sys, time
    from pathlib import Path
    mode = os.environ.get("FAKE_CLAUDE_MODE", "good")
    cwd = Path.cwd()
    listing = sorted(str(p.relative_to(cwd)) for p in cwd.rglob("*"))
    plugin = Path(sys.argv[sys.argv.index("--plugin-dir") + 1])
    plugin_files = sorted(str(p.relative_to(plugin)) for p in plugin.rglob("*"))
    env_file = os.environ.get("CLAUDE_ENV_FILE")  # the real CLI sources this before Bash
    bash_home = None
    if env_file:
        import subprocess
        bash_home = subprocess.run(["bash", "-c", 'source "$1"; printf %s "$HOME"', "_",
                                    env_file], capture_output=True, text=True).stdout
    with open(os.environ["FAKE_CLAUDE_LOG"], "a") as f:
        f.write(json.dumps({{"argv": sys.argv, "listing": listing, "cwd": str(cwd),
                            "plugin_files": plugin_files, "env_file": env_file,
                            "process_home": os.environ.get("HOME"),
                            "bash_home": bash_home}}) + "\\n")
    if mode == "sleep":
        time.sleep(30)
    def emit(m): print(json.dumps(m), flush=True)
    emit({{"type": "system", "subtype": "init", "skills": ["hfs-eval:toy"]}})
    if mode != "noskill":
        emit({{"type": "assistant", "message": {{"content": [
            {{"type": "tool_use", "id": "t1", "name": "Skill", "input": {{"skill": "hfs-eval:toy"}}}}]}}}})
        emit({{"type": "user", "message": {{"content": [
            {{"type": "tool_result", "tool_use_id": "t1", "content": "loaded"}}]}}}})
    if mode == "error":
        emit({{"type": "result", "subtype": "success", "is_error": True,
              "result": "model not found", "total_cost_usd": 0}})
        sys.exit(1)
    (cwd / "count.txt").write_text("3" if mode == "bad" else "2")
    emit({{"type": "result", "subtype": "success", "is_error": False,
          "total_cost_usd": 0.0125, "num_turns": 3, "permission_denials": []}})
""")


def write(p: Path, text: str) -> Path:
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text)
    return p


def make_skill(root: Path, *, requires=None, runs=2, judge=JUDGE, cid="toy-o01") -> Path:
    skills = root / "skills"
    skill = skills / "toy"
    write(skill / "SKILL.md", "---\nname: toy\ndescription: count lines\n---\nCount lines.\n")
    write(skill / "references" / "extra.md", "support file\n")
    ev = skill / "evals"
    case = {"id": cid, "skill": "toy", "prompt": "Count the lines in input.txt.",
            "fixture": f"fixtures/{cid}", "truth": f"truth/{cid}.json",
            "check": f"checks/{cid}.py", "budget": {"max_turns": 5, "timeout_s": 20},
            "runs": runs}
    if requires is not None:
        case["requires"] = requires
    import yaml
    write(ev / "outcomes.yaml", yaml.safe_dump({"outcomes": [case]}))
    write(ev / "fixtures" / cid / "input.txt", "apple\nbanana\n")
    write(ev / "truth" / f"{cid}.json", json.dumps({"expected": "2"}))
    write(ev / "checks" / f"{cid}.py", judge)
    write(ev / "golden" / cid / "input.txt", "apple\nbanana\n")
    write(ev / "golden" / cid / "count.txt", "2\n")
    write(ev / "mutants" / f"{cid}-wrong-count" / "input.txt", "apple\nbanana\n")
    write(ev / "mutants" / f"{cid}-wrong-count" / "count.txt", "3\n")
    return skills


@pytest.fixture
def fake_claude(tmp_path, monkeypatch):
    bin_ = write(tmp_path / "bin" / "claude", FAKE_CLAUDE.format(python=sys.executable))
    bin_.chmod(0o755)
    log = tmp_path / "claude-calls.jsonl"
    monkeypatch.setattr(outcome_eval, "CLAUDE_BIN", str(bin_))
    monkeypatch.setenv("FAKE_CLAUDE_LOG", str(log))

    def calls():
        return [json.loads(ln) for ln in log.read_text().splitlines()] if log.exists() else []
    return calls


def run_args(skills: Path, tmp_path: Path, **kw) -> Namespace:
    base = dict(skills_dir=skills, skill=None, case=None, validate_judges=False,
                outcomes=True, model="claude-test-model", runs=None, allow_network=False,
                mcp_config=None, history_dir=tmp_path / "history", keep_workdirs=False,
                report=None)
    base.update(kw)
    return Namespace(**base)


def history_rows(tmp_path: Path) -> list[dict]:
    files = list((tmp_path / "history").glob("*-outcomes.jsonl"))
    assert len(files) == 1
    return [json.loads(ln) for ln in files[0].read_text().splitlines()]


# ------------------------------------------------------------------ validate-judges

def test_validate_judges_pass(tmp_path, capsys):
    skills = make_skill(tmp_path)
    cases = outcome_eval.load_outcomes(skills)
    assert outcome_eval.validate_judges(cases) == 0
    assert "OK   toy-o01: golden passes, 1/1 mutants fail" in capsys.readouterr().out


def test_validate_judges_wrong_judge(tmp_path, capsys):
    # a judge that passes everything: the mutant must expose it
    lax = 'import json,sys\nprint(json.dumps({"passed": True, "score": 1, "details": {}}))\n'
    skills = make_skill(tmp_path, judge=lax)
    assert outcome_eval.validate_judges(outcome_eval.load_outcomes(skills)) == 1
    out = capsys.readouterr().out
    assert "BAD  toy-o01" in out and "toy-o01-wrong-count -> PASS" in out
    assert "WARN toy-o01" in out  # also passes the untouched fixture


def test_validate_judges_mutant_judge_error_is_not_a_fail(tmp_path, capsys):
    crashy = JUDGE.replace('ok = got == expected', 'ok = got == expected\n'
                           'if got == "3": sys.exit(2)')
    skills = make_skill(tmp_path, judge=crashy)
    assert outcome_eval.validate_judges(outcome_eval.load_outcomes(skills)) == 1
    assert "-> JUDGE_ERROR" in capsys.readouterr().out


def test_validate_judges_missing_mutant(tmp_path, capsys):
    skills = make_skill(tmp_path)
    import shutil
    shutil.rmtree(skills / "toy" / "evals" / "mutants")
    assert outcome_eval.validate_judges(outcome_eval.load_outcomes(skills)) == 1
    assert "missing mutants/toy-o01-*/" in capsys.readouterr().out


def test_validate_judges_missing_golden(tmp_path, capsys):
    skills = make_skill(tmp_path)
    import shutil
    shutil.rmtree(skills / "toy" / "evals" / "golden")
    assert outcome_eval.validate_judges(outcome_eval.load_outcomes(skills)) == 1
    assert "missing golden/toy-o01/" in capsys.readouterr().out


def test_validate_judges_cli(tmp_path):
    skills = make_skill(tmp_path)
    r = subprocess.run([sys.executable, str(SCRIPTS / "skill_eval.py"), "--validate-judges",
                        "--skills-dir", str(skills)], capture_output=True, text=True)
    assert r.returncode == 0, r.stderr
    assert "validate-judges: 1/1 cases OK" in r.stdout


# ------------------------------------------------------------------ loading

def edit_case(skills: Path, **changes) -> None:
    import yaml
    y = skills / "toy" / "evals" / "outcomes.yaml"
    doc = yaml.safe_load(y.read_text())
    for k, v in changes.items():
        if v is None:
            doc["outcomes"][0].pop(k)
        else:
            doc["outcomes"][0][k] = v
    y.write_text(yaml.safe_dump(doc))


def test_load_rejects_missing_keys_and_fixture_under_truth(tmp_path):
    skills = make_skill(tmp_path)
    edit_case(skills, runs=None)
    with pytest.raises(SystemExit, match="missing 'runs'"):
        outcome_eval.load_outcomes(skills)
    edit_case(skills, runs=1, fixture="truth")
    with pytest.raises(SystemExit, match="fixture lives under truth/"):
        outcome_eval.load_outcomes(skills)
    edit_case(skills, fixture="fixtures/toy-o01")
    escape = skills / "toy" / "evals" / "fixtures" / "toy-o01" / "peek"
    escape.symlink_to("../../truth/toy-o01.json")
    with pytest.raises(SystemExit, match="symlink escapes the fixture"):
        outcome_eval.load_outcomes(skills)


def test_fixture_internal_symlinks_preserved(tmp_path, fake_claude):
    skills = make_skill(tmp_path, runs=1)
    fx = skills / "toy" / "evals" / "fixtures" / "toy-o01"
    (fx / "alias.txt").symlink_to("input.txt")
    (fx / "dangling").symlink_to("not-there")
    outcome_eval.main(run_args(skills, tmp_path))
    assert fake_claude()[0]["listing"] == ["alias.txt", "dangling", "input.txt"]


def test_load_rejects_unknown_case_filter(tmp_path):
    skills = make_skill(tmp_path)
    with pytest.raises(SystemExit, match="not found"):
        outcome_eval.load_outcomes(skills, case_ids=["nope-o99"])


# ------------------------------------------------------------------ judge parsing

@pytest.mark.parametrize("body,reason", [
    ('print("not json")\n', "unparseable"),
    ('import sys\nprint(\'{"passed": true, "score": 1, "details": {}}\')\nsys.exit(2)\n',
     "judge exit 2"),
    ('import sys\nprint(\'{"passed": true, "score": 1, "details": {}}\')\nsys.exit(1)\n',
     "disagrees"),
    ('print(\'{"passed": true, "score": 7, "details": {}}\')\n', "score: 0..1"),
    ('print("{}")\nprint("{}")\n', "ONE JSON line"),
])
def test_run_judge_errors(tmp_path, body, reason):
    check = write(tmp_path / "checks" / "j.py", body)
    v = outcome_eval.run_judge(check, tmp_path, write(tmp_path / "t.json", "{}"))
    assert v["status"] == "JUDGE_ERROR" and reason in v["reason"]


def test_run_path_judge_error_is_never_a_pass(tmp_path, fake_claude):
    garbage = 'print("PASSED!!")\n'
    skills = make_skill(tmp_path, judge=garbage, runs=1)
    code = outcome_eval.main(run_args(skills, tmp_path))
    assert code == 2
    row = history_rows(tmp_path)[0]
    case = row["cases"][0]
    assert case["verdict"] == "ERROR" and case["pass_k"] is False
    assert case["runs"][0]["status"] == "JUDGE_ERROR"


# ------------------------------------------------------------------ run path

def test_run_pass_k_and_history_record(tmp_path, fake_claude, monkeypatch):
    monkeypatch.setenv("FAKE_CLAUDE_MODE", "good")
    skills = make_skill(tmp_path, runs=2)
    report = tmp_path / "report.json"
    assert outcome_eval.main(run_args(skills, tmp_path, report=report)) == 0
    rows = history_rows(tmp_path)
    assert len(rows) == 1
    row = rows[0]
    case = row["cases"][0]
    assert case["verdict"] == "PASS" and case["pass_k"] is True
    assert case["passes"] == case["k"] == 2
    assert case["mean_score"] == 1.0 and case["cost_usd"] == 0.025
    assert all(r["skill_loaded"] for r in case["runs"])
    assert set(row["baseline"]) == {"case_set_hash", "skill_hashes", "upstream_pins"}
    assert "toy" in row["baseline"]["skill_hashes"]
    assert row["model"] == "claude-test-model"
    assert json.loads(report.read_text())["run_id"] == row["run_id"]
    for r in case["runs"]:   # transcript captured (history_dir is outside WORKSPACE here)
        assert '"type": "result"' in Path(r["transcript"]).read_text()
    # a second invocation appends, never overwrites
    outcome_eval.main(run_args(skills, tmp_path))
    assert len(history_rows(tmp_path)) == 2


def test_run_fail_any_run_fails_pass_k(tmp_path, fake_claude, monkeypatch):
    monkeypatch.setenv("FAKE_CLAUDE_MODE", "bad")
    skills = make_skill(tmp_path, runs=1)
    assert outcome_eval.main(run_args(skills, tmp_path)) == 1
    case = history_rows(tmp_path)[0]["cases"][0]
    assert case["verdict"] == "FAIL" and case["runs"][0]["judge"]["details"]["got"] == "3"


def test_fixture_isolation(tmp_path, fake_claude):
    skills = make_skill(tmp_path, runs=1)
    outcome_eval.main(run_args(skills, tmp_path))
    call = fake_claude()[0]
    # the agent's workdir holds exactly the fixture - no truth/golden/mutants/checks
    assert call["listing"] == ["input.txt"]
    # the skill is mounted WITHOUT its evals/ tree, support files intact
    assert "skills/toy/SKILL.md" in call["plugin_files"]
    assert "skills/toy/references/extra.md" in call["plugin_files"]
    assert not any("evals" in f for f in call["plugin_files"])
    # workdir is not left behind
    argv = call["argv"]
    plugin = Path(argv[argv.index("--plugin-dir") + 1])
    assert not plugin.exists()


def test_command_shape(tmp_path, fake_claude):
    skills = make_skill(tmp_path, runs=1)
    outcome_eval.main(run_args(skills, tmp_path))
    argv = fake_claude()[0]["argv"]
    assert "--dangerously-skip-permissions" not in argv
    assert argv[argv.index("--model") + 1] == "claude-test-model"
    assert argv[argv.index("--max-turns") + 1] == "5"
    assert argv[argv.index("--output-format") + 1] == "stream-json"
    assert "--strict-mcp-config" in argv and "--mcp-config" not in argv
    assert argv[argv.index("--setting-sources") + 1] == "project,local"
    tools = argv[argv.index("--tools") + 1].split(",")
    assert "WebFetch" not in tools and "Skill" in tools
    allowed = argv[argv.index("--allowedTools") + 1]
    assert "Bash(ls:*)" in allowed and "Bash," not in allowed + ","
    denied = argv[argv.index("--disallowedTools") + 1]
    assert "Read(**/evals/truth/**)" in denied
    assert "hfs-eval:toy" in argv[2]   # prompt loads the skill explicitly


def test_skill_not_loaded_is_not_a_pass(tmp_path, fake_claude, monkeypatch):
    monkeypatch.setenv("FAKE_CLAUDE_MODE", "noskill")
    skills = make_skill(tmp_path, runs=1)
    assert outcome_eval.main(run_args(skills, tmp_path)) == 2
    run = history_rows(tmp_path)[0]["cases"][0]["runs"][0]
    assert run["status"] == "SKILL_NOT_LOADED" and run["judge"]["status"] == "PASS"


def test_agent_error(tmp_path, fake_claude, monkeypatch):
    monkeypatch.setenv("FAKE_CLAUDE_MODE", "error")
    skills = make_skill(tmp_path, runs=1)
    assert outcome_eval.main(run_args(skills, tmp_path)) == 2
    run = history_rows(tmp_path)[0]["cases"][0]["runs"][0]
    assert run["status"] == "AGENT_ERROR" and "judge" not in run


def test_timeout(tmp_path, fake_claude, monkeypatch):
    monkeypatch.setenv("FAKE_CLAUDE_MODE", "sleep")
    skills = make_skill(tmp_path, runs=1)
    edit_case(skills, budget={"max_turns": 5, "timeout_s": 1})
    assert outcome_eval.main(run_args(skills, tmp_path)) == 1
    run = history_rows(tmp_path)[0]["cases"][0]["runs"][0]
    assert run["status"] == "TIMEOUT"


# ------------------------------------------------------------------ requires

def test_requires_network_skipped_unless_allowed(tmp_path, fake_claude):
    skills = make_skill(tmp_path, requires=["network"], runs=1)
    assert outcome_eval.main(run_args(skills, tmp_path)) == 1   # nothing ran
    case = history_rows(tmp_path)[0]["cases"][0]
    assert case["verdict"] == "SKIPPED" and "network" in case["reason"]
    assert fake_claude() == []
    assert outcome_eval.main(run_args(skills, tmp_path, allow_network=True)) == 0
    tools = fake_claude()[0]["argv"]
    assert "WebFetch" in tools[tools.index("--tools") + 1]


def test_sandbox_home_agent_shell_home_inside_workdir(tmp_path, fake_claude, monkeypatch):
    real_home = str(Path.home())
    monkeypatch.setenv("CLAUDE_ENV_FILE", "/operator/session/env.sh")  # must not leak through
    skills = make_skill(tmp_path, requires=["sandbox:home"], runs=1)
    assert outcome_eval.main(run_args(skills, tmp_path)) == 0
    call = fake_claude()[0]
    work = Path(call["cwd"])
    # the agent's Bash tool (CLAUDE_ENV_FILE sourced) sees HOME=<workdir>/home ...
    assert call["bash_home"] == str(work / "home")
    assert Path(call["bash_home"]).is_relative_to(work)
    # ... the env script itself is outside the agent-visible workdir ...
    assert not Path(call["env_file"]).is_relative_to(work)
    assert call["env_file"] != "/operator/session/env.sh"
    # ... and the claude process keeps the real HOME (auth/config live there)
    assert call["process_home"] == real_home
    assert history_rows(tmp_path)[0]["cases"][0]["runs"][0]["sandbox_home"] is True


def test_no_sandbox_case_gets_no_env_file(tmp_path, fake_claude, monkeypatch):
    monkeypatch.setenv("CLAUDE_ENV_FILE", "/operator/session/env.sh")
    skills = make_skill(tmp_path, runs=1)
    outcome_eval.main(run_args(skills, tmp_path))
    assert fake_claude()[0]["env_file"] is None


def test_sandbox_home_skipped_when_cli_cannot_sandbox(tmp_path, fake_claude, monkeypatch):
    old = write(tmp_path / "oldbin" / "claude", "#!/bin/sh\nexit 0\n")
    old.chmod(0o755)
    monkeypatch.setattr(outcome_eval, "CLAUDE_BIN", str(old))
    skills = make_skill(tmp_path, requires=["sandbox:home"], runs=1)
    assert outcome_eval.main(run_args(skills, tmp_path)) == 1
    case = history_rows(tmp_path)[0]["cases"][0]
    assert case["verdict"] == "SKIPPED" and "no sandbox, no run" in case["reason"]
    assert fake_claude() == []


def test_requires_env_var(tmp_path, fake_claude, monkeypatch):
    monkeypatch.delenv("FAKE_EVAL_KEY", raising=False)
    skills = make_skill(tmp_path, requires=["env:FAKE_EVAL_KEY"], runs=1)
    outcome_eval.main(run_args(skills, tmp_path))
    case = history_rows(tmp_path)[0]["cases"][0]
    assert case["verdict"] == "SKIPPED" and "env:FAKE_EVAL_KEY (not set)" in case["reason"]
    assert fake_claude() == []
    monkeypatch.setenv("FAKE_EVAL_KEY", "s3cr3t-value-123")
    assert outcome_eval.main(run_args(skills, tmp_path)) == 0
    hist = next((tmp_path / "history").glob("*-outcomes.jsonl")).read_text()
    assert "s3cr3t-value-123" not in hist


def test_unsupported_requirement_is_skipped_not_run(tmp_path, fake_claude):
    skills = make_skill(tmp_path, requires=["gpu:a100"], runs=1)
    assert outcome_eval.main(run_args(skills, tmp_path, allow_network=True)) == 1
    case = history_rows(tmp_path)[0]["cases"][0]
    assert case["verdict"] == "SKIPPED" and "unsupported" in case["reason"]
    assert fake_claude() == []


def test_requires_mcp_needs_server_in_config(tmp_path, fake_claude):
    skills = make_skill(tmp_path, requires=["mcp:firecrawl"], runs=1)
    other = write(tmp_path / "mcp.json", json.dumps({"mcpServers": {"github": {}}}))
    outcome_eval.main(run_args(skills, tmp_path, mcp_config=other))
    assert history_rows(tmp_path)[-1]["cases"][0]["verdict"] == "SKIPPED"
    assert fake_claude() == []
    good = write(tmp_path / "mcp2.json", json.dumps({"mcpServers": {"firecrawl": {}}}))
    assert outcome_eval.main(run_args(skills, tmp_path, mcp_config=good)) == 0
    argv = fake_claude()[0]["argv"]
    assert argv[argv.index("--mcp-config") + 1] == str(good)
    assert "mcp__firecrawl" in argv[argv.index("--allowedTools") + 1]


def test_weekly_ritual_ignores_outcome_history(tmp_path, monkeypatch):
    import weekly_eval_ritual as w
    monkeypatch.setattr(w, "HISTORY", tmp_path)
    write(tmp_path / "2026-08-21.jsonl", json.dumps({"precision": 1.0}) + "\n")
    write(tmp_path / "2026-10-16-outcomes.jsonl", json.dumps({"mode": "outcomes"}) + "\n")
    assert w.latest_prior() == {"precision": 1.0}


def test_parse_transcript_tolerates_string_messages(tmp_path):
    # shape seen live (CLI 2.1.296): system/permission_denied carries message as a str
    lines = [
        {"type": "system", "subtype": "init", "skills": ["hfs-eval:toy"]},
        {"type": "assistant", "message": {"content": [
            {"type": "tool_use", "id": "s1", "name": "Skill", "input": {"skill": "hfs-eval:toy"}}]}},
        {"type": "user", "message": {"content": [
            {"type": "tool_result", "tool_use_id": "s1", "content": "Launching skill: hfs-eval:toy"}]}},
        {"type": "system", "subtype": "permission_denied", "message": "Permission ... denied"},
        {"type": "user", "message": {"content": "plain string content"}},
        {"type": "result", "subtype": "success", "is_error": False, "total_cost_usd": 0.04},
    ]
    t = write(tmp_path / "t.jsonl", "\n".join(json.dumps(x) for x in lines) + "\n")
    info = outcome_eval.parse_transcript(t, "toy")
    assert info["skill_loaded"] and info["skill_listed"]
    assert info["result"]["total_cost_usd"] == 0.04


def test_failed_skill_call_is_not_loaded(tmp_path):
    lines = [
        {"type": "assistant", "message": {"content": [
            {"type": "tool_use", "id": "s1", "name": "Skill", "input": {"skill": "hfs-eval:toy"}}]}},
        {"type": "user", "message": {"content": [
            {"type": "tool_result", "tool_use_id": "s1", "is_error": True, "content": "Unknown skill"}]}},
    ]
    t = write(tmp_path / "t.jsonl", "\n".join(json.dumps(x) for x in lines) + "\n")
    assert outcome_eval.parse_transcript(t, "toy")["skill_loaded"] is False
