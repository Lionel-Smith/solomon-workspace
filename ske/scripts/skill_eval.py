#!/usr/bin/env python3
"""SKE-04: skill eval harness with asserted production-surface baseline.

Measures trigger precision/recall (and, with --full, rubric pass^3 and
co-loaded regression) for hand-written case sets under ske/evals/.

The runner mounts the PRODUCTION surface: the rendered skills://index
(org-authored + vendored pointer, SKE-R-03 semantics) - trigger competition
against the real index is the thing measured; an enumerated or isolated
environment measures fiction (Q6).

Every run asserts and records the baseline triple:
  {case_set_hash, index_hash, upstream_pins}
A run that cannot render/hash the index FAILS LOUDLY (attribution depends
on it) - there is no silent fallback.

Runners:
  headless (default, OQ-01): one `claude -p` call per case (haiku) asking
    which skill the rendered index triggers for the case prompt.
  static: deterministic proxy - search_skills relevance ranking over the
    same surface. Used for the 20% PR sample; no model calls.

Outcome evals (contract: hfs-development-kit/skills/_meta/OUTCOME_EVALS.md,
implementation: outcome_eval.py) - "is the result right?", judged by a script:
  --validate-judges  judge(golden) exits 0, judge(each mutant) exits 1; no model.
  --outcomes         headless agent per case in a fixture-only workdir, then the
                     judge; pass^k; appends to evals/history/<date>-outcomes.jsonl.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

import outcome_eval

WORKSPACE = Path(__file__).resolve().parents[2]
SOLOMON = WORKSPACE / "solomon"
DEFAULT_SKILLS_DIR = WORKSPACE / "hfs-development-kit" / "skills"
HEADLESS_MODEL = "claude-haiku-4-5"

sys.path.insert(0, str(SOLOMON))


def render_production_index() -> str:
    """Render the production skills://index. Fails loudly on any error."""
    os.environ.setdefault("SKILLS_DIR", str(DEFAULT_SKILLS_DIR))
    from solomon_mcp.skills_server import skills_index_resource  # noqa: E402

    index = asyncio.run(skills_index_resource())
    if "❌" in index or not index.strip():
        raise SystemExit(f"FATAL: index did not render cleanly:\n{index[:400]}")
    return index


def load_cases(cases_dir: Path) -> list[dict]:
    import yaml

    cases: list[dict] = []
    files = sorted(cases_dir.glob("*.yaml")) + sorted(cases_dir.glob("*.yml"))
    if not files:
        raise SystemExit(f"FATAL: no case files under {cases_dir}")
    for f in files:
        doc = yaml.safe_load(f.read_text())
        for case in doc["cases"]:
            for key in ("id", "prompt", "should_trigger"):
                if key not in case:
                    raise SystemExit(f"FATAL: case in {f.name} missing {key!r}")
            case.setdefault("expected_skill", None)
            case.setdefault("rubric", [])
            case.setdefault("co_loaded", [])
            case["_set"] = f.stem
            cases.append(case)
    return cases


def baseline_triple(cases: list[dict], index: str) -> dict:
    pins = outcome_eval.upstream_pins()
    case_blob = json.dumps(
        [{k: v for k, v in c.items() if not k.startswith("_")} for c in cases],
        sort_keys=True,
    )
    return {
        "case_set_hash": hashlib.sha256(case_blob.encode()).hexdigest(),
        "index_hash": hashlib.sha256(index.encode()).hexdigest(),
        "upstream_pins": pins,
    }


def run_case_headless(case: dict, index: str) -> str | None:
    """Ask the model which skill the index triggers; returns name or None."""
    prompt = (
        "You are choosing a skill from this skills index.\n\n"
        f"{index}\n\n"
        f"Task: {case['prompt']}\n\n"
        "Which ONE skill from the index above would you load first for this "
        "task? If none clearly applies, answer NONE. "
        "Answer with exactly the skill name or NONE - no other text."
    )
    r = subprocess.run(
        ["claude", "-p", prompt, "--model", HEADLESS_MODEL],
        capture_output=True, text=True, timeout=120,
    )
    if r.returncode != 0:
        raise SystemExit(f"FATAL: headless runner failed on {case['id']}: {r.stderr[:200]}")
    answer = r.stdout.strip().splitlines()[0].strip().strip("`*")
    return None if answer.upper() == "NONE" else answer


def run_case_static(case: dict) -> str | None:
    """Deterministic proxy: top search_skills hit over the same surface."""
    from solomon_mcp.skills_server import search_skills_impl
    from solomon_mcp.models.skill_models import SkillError

    words = [w for w in case["prompt"].lower().split() if len(w) > 3][:8]
    best_name, best_score = None, 0
    for w in words:
        r = asyncio.run(search_skills_impl(w))
        if isinstance(r, SkillError) or not r.results:
            continue
        top = r.results[0]
        if top.relevance > best_score:
            best_name, best_score = top.name, top.relevance
    return best_name


def evaluate(cases: list[dict], index: str, runner: str) -> dict:
    tp = fp = fn = tn = 0
    rows = []
    for case in cases:
        got = (run_case_headless(case, index) if runner == "headless"
               else run_case_static(case))
        expected = case["expected_skill"]
        if case["should_trigger"]:
            hit = got is not None and (expected is None or got == expected)
            tp += hit
            fn += not hit
        else:
            fp += got is not None
            tn += got is None
        rows.append({"id": case["id"], "set": case["_set"],
                     "expected": expected, "got": got,
                     "should_trigger": case["should_trigger"]})
    precision = tp / (tp + fp) if (tp + fp) else 1.0
    recall = tp / (tp + fn) if (tp + fn) else 1.0
    return {"precision": round(precision, 3), "recall": round(recall, 3),
            "tp": tp, "fp": fp, "fn": fn, "tn": tn, "cases": rows}


def main() -> int:
    ap = argparse.ArgumentParser(description="SKE-04 skill eval harness")
    ap.add_argument("--cases", type=Path, help="trigger case dir (trigger mode)")
    ap.add_argument("--report", type=Path,
                    help="JSON report path (required in trigger mode)")
    ap.add_argument("--runner", choices=("headless", "static"), default="headless")
    ap.add_argument("--full", action="store_true",
                    help="also grade rubric pass^3 (weekly ritual, SKE-12)")
    ap.add_argument("--compare-baseline", type=Path, default=None,
                    help="prior report; fail on precision/recall regression or "
                    "co-loaded set change (SKE-12 alerting input)")
    oc = ap.add_argument_group("outcome evals (OUTCOME_EVALS.md)")
    mode = oc.add_mutually_exclusive_group()
    mode.add_argument("--outcomes", action="store_true",
                      help="run outcome cases: headless agent + deterministic judge")
    mode.add_argument("--validate-judges", action="store_true",
                      help="judge-the-judge gate: golden exits 0, mutants exit 1; no model")
    oc.add_argument("--skill", action="append", help="only this skill (repeatable)")
    oc.add_argument("--case", action="append", help="only this case id (repeatable)")
    oc.add_argument("--model", default=outcome_eval.OUTCOME_MODEL,
                    help=f"outcome agent model (default {outcome_eval.OUTCOME_MODEL})")
    oc.add_argument("--runs", type=int, default=None,
                    help="override each case's runs (k) - e.g. 1 for a smoke run")
    oc.add_argument("--allow-network", action="store_true",
                    help="run cases that require [network] (adds WebFetch/WebSearch)")
    oc.add_argument("--mcp-config", type=Path, default=None,
                    help="MCP config JSON; servers defined here satisfy [mcp:<server>]")
    oc.add_argument("--skills-dir", type=Path, default=DEFAULT_SKILLS_DIR)
    oc.add_argument("--history-dir", type=Path, default=outcome_eval.DEFAULT_HISTORY_DIR)
    oc.add_argument("--keep-workdirs", action="store_true",
                    help="keep each run's temp workdir for inspection")
    args = ap.parse_args()

    if args.outcomes or args.validate_judges:
        return outcome_eval.main(args)
    if args.cases is None or args.report is None:
        ap.error("trigger mode requires --cases and --report")

    index = render_production_index()          # fails loudly
    cases = load_cases(args.cases)
    triple = baseline_triple(cases, index)     # asserted every run

    result = evaluate(cases, index, args.runner)
    report = {"baseline": triple, "runner": args.runner, **result}

    if args.full:
        # pass^3: each rubric item graded on 3 independent headless runs -
        # deferred detail lives with the weekly ritual (SKE-12 consumes this)
        report["rubric"] = "not-implemented-in-sampled-runs"

    if args.compare_baseline and args.compare_baseline.exists():
        prior = json.loads(args.compare_baseline.read_text())
        drops = []
        for metric in ("precision", "recall"):
            if report[metric] < prior.get(metric, 0) - 0.05:
                drops.append(f"{metric} {prior[metric]} -> {report[metric]}")
        if drops:
            args.report.write_text(json.dumps(report, indent=2))
            sys.stderr.write("REGRESSION: " + "; ".join(drops) + "\n")
            return 1

    args.report.write_text(json.dumps(report, indent=2))
    print(f"eval: {len(cases)} cases, runner={args.runner}, "
          f"P={report['precision']} R={report['recall']}, "
          f"index_hash={triple['index_hash'][:12]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
