# Live Routine Audit — 2026-08-23

**Method:** read the live configuration of all 7 registered Routines in the
claude.ai UI, plus one run transcript. This is the first audit of this estate
that checked the *running system* rather than the files in this repo.

**Why that distinction matters:** the running prompt and trigger config are the
ones saved in the Anthropic UI. This repo is a mirror. Every prior audit here
verified documents against other documents, and two of them reached conclusions
the live config contradicts.

---

## 1. Findings

| Routine | Repo says | Live was | Action taken |
|---|---|---|---|
| `github-pr-review` | GitHub event `pull_request.opened` OR `synchronize`, 8 repos | Weekly cron Fri 09:00 **+** GitHub `pull_request.closed` (is_merged=true) on **1** repo | Cron removed; event changed to **Pull request: Opened** |
| `friday-energy-retro` | Fri 17:00 | **Monday** 17:00 | Changed to **Friday** 17:00 |
| `friday-eval` | Fri 16:00 | **Monday** 09:00 | **Paused** (Samson-blocked) |
| `friday-retro` | Fri 15:00 | Fri 15:00 (correct) | **Paused** (Samson-blocked) |
| `daily-solomon-standup` | paused since 2026-07-06 | paused — but ran 30x through **Jul 29** | none (already paused) |
| `claude-md-audit` | api trigger, 3 repos, Slack | matches; **zero runs ever** | none |
| `daily-news-sweep` | Mon-Fri 06:30, `cadence-web` | Mon-Fri **06:00**, `cadence-web` | none (30/30 healthy; 30-min delta is cosmetic) |
| `github-ci-triage` | deferred | absent | none (consistent) |
| `weekly-skill-eval` | prompt file exists (SKE-12) | **absent — never registered** | none (see section 4) |

## 2. The silent failure

`github-pr-review` reported **14 of 14 runs succeeded**. All 14 reviewed nothing.

The GitHub trigger was set to the UI's **"PR merged"** preset — event
`pull_request.closed` with filter `is merged == true` — scoped to a single repo.
That is not the event the prompt is written for, so the event leg never fired.
Every run came from the Friday cron, which delivers no PR payload. The prompt's
own step-1 payload validation then exits cleanly, and a clean exit is recorded
as success.

From the Aug 21 run transcript, verbatim:

> "This scheduled firing delivered the github-pr-review ritual definition itself,
> but no actual trigger payload... This run is a no-op — output_artifacts.notes:
> 'ineligible event — no review attempted (no payload delivered)'."

**Rule this establishes:** a green run count measures "the session exited 0", not
"the work happened". Run-status is not a health signal for any routine whose
prompt has an early-exit guard. Read a transcript.

## 3. Platform constraints discovered

Facts about Anthropic Routines confirmed in the UI on this date. These were not
known when the cadence layer was designed and they invalidate part of its design.

- **One GitHub trigger per routine.** `+ Add another trigger` offers only
  **Schedule** and **API**. GitHub is not re-addable once one exists.
- **A GitHub trigger targets exactly one repository.** The Repository field is a
  single-select combobox, not multi-select.
- **Consequence:** the OQ-10 "8 active repos on one routine" design is not
  expressible. Covering N repos requires N routines. `github-pr-review` currently
  covers `Lionel-Smith/solomon` only.
- The "Runs with" repo chip list is separate from the trigger repo — it controls
  which repos get cloned into the session, and it does accept multiple.
- Preset chips (`PR opened` / `PR merged` / `Release published` / `Issue opened` /
  `Custom`) write into an Event + Filter pair. Picking the wrong preset at
  creation is silent and survives every re-paste of the instructions, because
  instructions and triggers are separate fields.

## 4. Still open

- **`weekly-skill-eval` is unregistered.** The prompt file (added 2026-08-21,
  SKE-12) is absent from `inventory.yml` and `.created.yml`, and no routine
  exists. It is also local-shaped: it shells `solomon/.venv/bin/python`, reads
  `~/Documents/GitHub/solomon-workspace`, and commits to a local checkout. A
  cloud Routine has none of those. It must either be rewritten for the cloud
  sandbox or registered as a Desktop scheduled task. The Mac's scheduled-task
  store was checked on this date and is empty, so it has never run on a schedule.
- **`cadence-samson` is bound to nothing.** It was created 2026-07-05 for
  standup / friday-retro / friday-eval. All three are still on the default
  environment (named "elts try something out"). Bind at unpause time, not before.
- **Model drift.** `github-pr-review` runs on Opus 5; its own cost budget
  specifies Sonnet and estimates $0.30-0.80/run on that basis. Same for the other
  routines — all are on Opus 5 or Default. Not changed here; it is a cost
  decision, not a correctness one.
- **Connector bleed.** `friday-eval`, `friday-retro` and `daily-solomon-standup`
  still carry the auto-added Figma / Gmail / Linear connectors. Harmless while
  paused; trim before unpausing (the UI grants write access without prompting).
- **Repo scope decided 2026-08-23:** the live 8 on `github-pr-review` are
  authoritative; `inventory.yml` should be updated to match rather than the
  reverse. Not yet done.
