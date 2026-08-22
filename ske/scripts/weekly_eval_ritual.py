#!/usr/bin/env python3
"""SKE-12: weekly skill-eval ritual.

Runs the full SKE-04 eval, persists the result to ske/evals/history/<date>.jsonl
(LOCAL persistence - the Samson cadence_state leg is a dated pending step; the
existence check failed 2026-08-21: samson DNS SERVFAIL, no cadence endpoint),
and emits an alert when precision or recall drops >5pts vs the previous
recorded run, or when inventory coverage regresses.

Alert path: prints a Slack-formatted message and writes it to
ske/evals/history/ALERT-<date>.txt. The scheduled Routine (weekly-skill-eval,
Sat 09:00 NAS) delivers that text via its Slack connector.
"""

from __future__ import annotations

import json
import subprocess
import sys
from datetime import date
from pathlib import Path

WORKSPACE = Path(__file__).resolve().parents[2]
HISTORY = WORKSPACE / "ske" / "evals" / "history"
THRESHOLD = 0.05


def latest_prior() -> dict | None:
    runs = sorted(HISTORY.glob("*.jsonl"))
    if not runs:
        return None
    return json.loads(runs[-1].read_text().splitlines()[-1])


def main() -> int:
    HISTORY.mkdir(parents=True, exist_ok=True)
    today = sys.argv[1] if len(sys.argv) > 1 else date.today().isoformat()
    report_path = Path(f"/tmp/weekly-eval-{today}.json")

    r = subprocess.run(
        [str(WORKSPACE / "solomon/.venv/bin/python"),
         str(WORKSPACE / "ske/scripts/skill_eval.py"),
         "--cases", str(WORKSPACE / "ske/evals"),
         "--report", str(report_path)],
        capture_output=True, text=True,
    )
    if r.returncode != 0:
        sys.stderr.write(f"eval run failed: {r.stderr[-300:]}\n")
        return 1
    report = json.loads(report_path.read_text())

    inv = json.loads((WORKSPACE / "ske/skills_inventory.json").read_text())
    coverage = inv["coverage"]

    prior = latest_prior()
    row = {"date": today, "precision": report["precision"],
           "recall": report["recall"], "baseline": report["baseline"],
           "coverage": {"reachable": coverage["reachable"], "total": coverage["total"]}}
    (HISTORY / f"{today}.jsonl").write_text(json.dumps(row) + "\n")

    alerts = []
    if prior:
        for metric in ("precision", "recall"):
            if row[metric] < prior[metric] - THRESHOLD:
                alerts.append(f"{metric} {prior[metric]:.2f} -> {row[metric]:.2f}")
        if row["coverage"]["reachable"] < prior["coverage"]["reachable"]:
            alerts.append(f"coverage {prior['coverage']['reachable']} -> {row['coverage']['reachable']}")
    if alerts:
        msg = (
            f":rotating_light: *Weekly skill-eval drift* ({today})\n"
            + "\n".join("- " + a for a in alerts)
            + f"\nbaseline index {row['baseline']['index_hash'][:12]} | history: ske/evals/history/"
        )
        (HISTORY / f"ALERT-{today}.txt").write_text(msg + "\n")
        print(msg)
        return 2
    print(f"weekly eval {today}: P={row['precision']} R={row['recall']} "
          f"coverage {row['coverage']['reachable']}/{row['coverage']['total']} - no drift")
    return 0


if __name__ == "__main__":
    sys.exit(main())
