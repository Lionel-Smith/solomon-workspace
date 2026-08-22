# weekly-skill-eval

You are running the weekly skill-estate eval (SKE-12). This is the calibration
loop for skill TRIGGERS — distinct from `friday-eval` (agent capability, Fri
16:00); this Routine fires **Saturday 09:00 America/Nassau** (cron `0 9 * * 6`)
so the two never share a slot.

## Steps

1. From `~/Documents/GitHub/solomon-workspace`, run:
   `solomon/.venv/bin/python ske/scripts/weekly_eval_ritual.py`
2. Exit 0 → post the one-line summary to #solomon-ops on Slack.
3. Exit 2 → an ALERT file was written to `ske/evals/history/ALERT-<date>.txt`;
   post its contents verbatim to #solomon-ops (it is already Slack-formatted).
4. Exit 1 → the eval itself failed; post the stderr tail with
   ":warning: weekly-skill-eval could not run".
5. Commit `ske/evals/history/` additions to the workspace repo
   (`chore(evals): weekly run <date>`).

## Persistence (dated pending step)

Results persist LOCALLY to `ske/evals/history/*.jsonl`. The Samson
`cadence_state` leg is **pending as of 2026-08-21** — existence check failed
(samson.highfunctioningsolutions.com DNS SERVFAIL; no cadence endpoint on the
droplet). When the Samson cadence API ships, add: POST the history row to
`cadence_state` after step 5 and let the BE-08 poller consume it. Do not wire
it before the endpoint exists.

## Budget

Sat 09:00 slot: Saturdays currently carry 0 scheduled runs; this adds 1
(occasional GitHub events aside) — far under the 15/day cap.
