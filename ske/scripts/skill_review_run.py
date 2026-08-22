#!/usr/bin/env python3
"""SKE-05: apply the skill-reviewer v2 rubric across the canonical corpus.

Mechanical application of the v2 rubric (deterministic + rerunnable): scores
come from parseable structure, not judgment calls. Emits one artifact per
canonical skill into hfs-development-kit/reviews/.

Two scales (Q5): skills with SKE-04 eval case sets score /100 (measured
category from the latest harness report); everything else scores /80 with
the mandatory UNMEASURED marker.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[2]
SKILLS = WORKSPACE / "hfs-development-kit" / "skills"
EVALS = WORKSPACE / "ske" / "evals"
REVIEWS = WORKSPACE / "hfs-development-kit" / "reviews"

sys.path.insert(0, str(WORKSPACE / "solomon"))
from solomon_mcp.utils.skill_parser import SkillParser  # noqa: E402

import yaml  # noqa: E402


def score_skill(skill_dir: Path, eval_report: dict | None) -> dict:
    text = (skill_dir / "SKILL.md").read_text()
    parser = SkillParser()
    parsed = parser.parse_content(text, "SKILL.md")

    m = re.match(r"^---\n(.*?)\n---", text, re.S)
    fm = {}
    if m:
        try:
            fm = yaml.safe_load(m.group(1)) or {}
        except yaml.YAMLError:
            fm = {}

    s: dict[str, int] = {}
    notes: list[str] = []

    # Structure /20 - name+desc (10), packaging (5), sections (5).
    # D6: NEVER deduct for absent author/date/phase/triggers/related_skills.
    s["structure"] = 0
    if fm.get("name") == skill_dir.name:
        s["structure"] += 5
    else:
        notes.append("frontmatter name missing or != directory name")
    if isinstance(fm.get("description"), str) and len(fm["description"]) >= 60:
        s["structure"] += 5
    else:
        notes.append("description missing or too thin (<60 chars)")
    s["structure"] += 5  # directory packaging: corpus is dir/SKILL.md by construction
    if re.search(r"^## ", text, re.M):
        s["structure"] += 5
    else:
        notes.append("no markdown sections")

    # Clarity /20 - numbered steps (5), code examples (5), decision tables (5),
    # constraints parse (5)
    s["clarity"] = 0
    s["clarity"] += 5 if re.search(r"^\s*\d+\.\s", text, re.M) else 0
    s["clarity"] += 5 if "```" in text else 0
    s["clarity"] += 5 if re.search(r"^\|.*\|$", text, re.M) else 0
    if parsed.constraints:
        s["clarity"] += 5
    else:
        notes.append("no parseable Constraints section (corpus-as-spec)")

    # Efficiency /10 - not a wall (>=3 sections) (5), body under ~1200 lines (5)
    s["efficiency"] = (5 if text.count("\n## ") >= 3 else 0) + (5 if text.count("\n") <= 1200 else 0)

    # Reusability /10 - no user-specific abs paths (5), portable refs (5)
    user_paths = re.findall(r"/Users/\w+", text)
    s["reusability"] = (0 if user_paths else 5) + (5 if "{" in text or "<" in text else 0)
    if user_paths:
        notes.append(f"user-specific paths: {sorted(set(user_paths))}")

    # Claude practices /10 - forbidden patterns parse (5), triggers/use-when (5)
    s["claude_practices"] = (5 if parsed.forbidden else 0) + (
        5 if re.search(r"[Uu]se when|[Tt]rigger", text) else 0)
    if not parsed.forbidden:
        notes.append("no parseable Forbidden Patterns table")

    # HFS alignment /10 - names another HFS skill or command (5), verification/gates (5)
    s["hfs_alignment"] = (5 if re.search(r"/session:|/skill:|hfs-|solomon", text) else 0) + (
        5 if re.search(r"[Vv]erif|[Gg]ate", text) else 0)

    base = sum(s.values())

    measured = None
    if eval_report is not None:
        mscore = 0
        mnotes = []
        mscore += 5 if eval_report["precision"] >= 0.9 else 0
        mscore += 5 if eval_report["recall"] >= 0.9 else 0
        mnotes.append(f"precision {eval_report['precision']} / recall {eval_report['recall']}")
        mnotes.append("pass^3: PENDING first weekly full run (0/5 withheld)")
        mnotes.append("co-loaded regression: PENDING baseline comparison (0/5 withheld)")
        measured = {"score": mscore, "notes": mnotes,
                    "baseline": eval_report["baseline"]}

    return {"categories": s, "base": base, "measured": measured, "notes": notes}


def emit(skill: str, r: dict) -> str:
    if r["measured"] is not None:
        total = r["base"] + r["measured"]["score"]
        headline = f"**{total}/100 (Measured)**"
    else:
        headline = f"**{r['base']}/80 — UNMEASURED**"
    lines = [
        f"# Review: {skill}",
        "",
        f"Score: {headline}",
        "**Rubric:** skill-reviewer v2 (SKE-05) · **Date:** 2026-08-21 · mechanical sweep",
        "",
        "| Category | Score |",
        "|---|---|",
    ]
    caps = {"structure": 20, "clarity": 20, "efficiency": 10,
            "reusability": 10, "claude_practices": 10, "hfs_alignment": 10}
    for k, cap in caps.items():
        lines.append(f"| {k.replace('_', ' ')} | {r['categories'][k]}/{cap} |")
    if r["measured"] is not None:
        lines.append(f"| measured behaviour | {r['measured']['score']}/20 |")
        lines.append("")
        lines.extend(f"- {n}" for n in r["measured"]["notes"])
        b = r["measured"]["baseline"]
        lines.append(f"- baseline: cases {b['case_set_hash'][:12]} / index {b['index_hash'][:12]} / pins {len(b['upstream_pins'])}")
    else:
        lines.append("")
        lines.append("- UNMEASURED: no eval case set exists — this is a work-queue entry, not a quality verdict (Q5).")
    if r["notes"]:
        lines.append("")
        lines.append("## Findings")
        lines.extend(f"- {n}" for n in r["notes"])
    lines.append("")
    return "\n".join(lines)


def main() -> int:
    REVIEWS.mkdir(exist_ok=True)
    eval_sets = {f.stem for f in EVALS.glob("*.yaml")}
    report_path = Path("/tmp/eval3.json")
    eval_report = json.loads(report_path.read_text()) if report_path.exists() else None
    if eval_report is None:
        print("WARNING: no eval report at /tmp/eval3.json - all skills will be UNMEASURED", file=sys.stderr)

    count = measured_n = 0
    for d in sorted(SKILLS.iterdir()):
        if not d.is_dir() or d.name == "_meta" or not (d / "SKILL.md").exists():
            continue
        rep = eval_report if (d.name in eval_sets and eval_report) else None
        r = score_skill(d, rep)
        (REVIEWS / f"{d.name}.md").write_text(emit(d.name, r))
        count += 1
        measured_n += rep is not None
    print(f"wrote {count} artifacts ({measured_n} measured, {count - measured_n} UNMEASURED)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
