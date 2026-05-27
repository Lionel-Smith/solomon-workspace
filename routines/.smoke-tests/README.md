# Routine smoke-test outputs (ROUTINE-10 Task 3)

Captured outputs from manually running each of the 8 Routines via the Anthropic UI's "Run now" button after creation in ROUTINE-10.

## Conventions

- One file per Routine + smoke run: `{slug}-{YYYY-MM-DD}.txt`
- Copy-paste the full Routine output from the Anthropic UI's "Run history" view
- If a smoke test fails, prefix the file with `FAILED-` so the agent's verification can spot it during /session:complete

## Expected outputs (per ROUTINE-10 SESSION.md Task 3)

| Routine | Expected output |
|---|---|
| daily-news-sweep | digest posted to #dev-news + WhatsApp |
| daily-solomon-standup | digest posted to #solomon-standup + WhatsApp |
| friday-retro | with empty learnings queue → "quiet week" + Kata prompts |
| friday-eval | pass rate on golden dataset (may be low pre-BE-07 — OK for smoke) |
| friday-energy-retro | WhatsApp prompt sent |
| claude-md-audit | findings on a test CLAUDE.md |
| github-pr-review | review comment posted on a test PR (hfs-test-sandbox) |
| github-ci-triage | triage posted to #ci-failures on a broken-workflow trigger |

## Verification gate

The `smoke_test_log` gate in SESSION.md verifies `≥1` file exists in this directory. Target: 8 (one per Routine). The gate uses `ls solomon-workspace/routines/.smoke-tests/ | wc -l`.

This README.md counts as the first file — so the gate passes immediately. Replace with real smoke-test outputs as you create + run each Routine.
