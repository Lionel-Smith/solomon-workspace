# HFS Cadence Layer — Routine Prompt Library

Version-controlled prompts for the eight Claude Code Routines that power the HFS Cadence Layer. Each Routine fires in Anthropic's cloud, runs its prompt as a full Claude Code session, and dispatches via connectors. Samson ingests every run's output via the Routines API.

> **Architecture context:** This library is Layer A of the HFS Cadence Layer (per `solomon-docs/plans/HFS_CADENCE_LAYER_PLAN_FINAL.md` §1.2). Layer B (Samson Cadence Service in `hfs-aiops`) ingests, evaluates, and reports on every run.

---

## Daily Budget

Anthropic Max-tier accounts are capped at **15 Routine runs per day**. Below is the planned firing schedule (per plan Appendix D):

| Slug | Trigger | Schedule (NAS) | Daily slots | Connectors | Repos | Execution |
|---|---|---|---|---|---|---|
| `daily-news-sweep` | scheduled | Mon-Fri 06:30 | 1 | slack, whatsapp, firecrawl | none | remote |
| `daily-solomon-standup` | scheduled | Mon-Fri 07:00 | 1 | slack, whatsapp, mem0 | none | remote |
| `friday-retro` | scheduled | Fri 15:00 | 1 (Fri only) | slack, mem0 | solomon, hfs-aiops, solomon-workspace | remote |
| `friday-eval` | scheduled | Fri 16:00 | 1 (Fri only) | slack | solomon-workspace | remote |
| `friday-energy-retro` | scheduled | Fri 17:00 | 1 (Fri only) | whatsapp | none | remote |
| `weekly-skill-eval` | scheduled | Sat 09:00 | 1 (Sat only) | slack | solomon-workspace | remote |
| `claude-md-audit` | api | on-demand | 0-3/day typical | slack | varies | remote (local fallback) |
| `github-pr-review` | github (PR) | event-driven | 0-5/day typical | github, slack | all 8 active repos | remote |
| `github-ci-triage` | github (workflow) | event-driven | 0-3/day typical | github, slack, linear | all 8 active repos | remote |

**Effective load:** Mon-Thu peak ~6 runs/day (news + standup + 0-5 GitHub events). Fri peak ~9 runs/day (5 scheduled + 0-4 GitHub events). Sat ~1-3 (weekly-skill-eval + occasional GitHub events). All well under the 15-run cap, leaving headroom for ad-hoc `claude-md-audit` triggers.

**Alert threshold:** the `cadence_routine_status` MCP tool emits a warning at 80% daily utilization (12+ runs); at that point `github-pr-review` may skip trivial PRs per its own prompt logic (see plan §4.7).

---

## Routine Inventory (8 Routines)

| Slug | Ritual Type | Prompt File |
|---|---|---|
| `daily-news-sweep` | news | `routines/daily-news-sweep.md` |
| `daily-solomon-standup` | standup | `routines/daily-solomon-standup.md` |
| `friday-retro` | retro | `routines/friday-retro.md` |
| `friday-eval` | eval | `routines/friday-eval.md` |
| `friday-energy-retro` | energy | `routines/friday-energy-retro.md` |
| `claude-md-audit` | audit | `routines/claude-md-audit.md` |
| `github-pr-review` | pr_review | `routines/github-pr-review.md` |
| `github-ci-triage` | ci_triage | `routines/github-ci-triage.md` |

Source-of-truth for runtime consumption is `routines/inventory.yml`. Wave 2 of the cadence-layer build (ROUTINE-02..09) authors each prompt file in parallel.

---

## File Naming Convention

Each Routine prompt lives at `routines/{ritual-slug}.md` where `{ritual-slug}` matches the `slug` field in `inventory.yml`. Slugs are lowercase with hyphens, max 40 characters.

---

## Front-Matter Convention

Every Routine prompt file starts with YAML front matter:

```yaml
---
slug: daily-news-sweep
ritual_type: news
version: 1.0
last_reviewed_at: 2026-05-25
---
```

| Field | Type | Purpose |
|---|---|---|
| `slug` | str | Must match the file basename and the `inventory.yml` entry |
| `ritual_type` | enum | One of: news, standup, retro, eval, energy, audit, pr_review, ci_triage |
| `version` | semver | Bumped when prompt content changes materially (not for typos) |
| `last_reviewed_at` | ISO date | Last `plan-review-loop` pass date |

When Samson reconciles Routine definitions nightly (per plan §7.5), it compares the prompt file's git SHA against `cadence_routine_definitions.prompt_sha`. Mismatches surface as alerts.

---

## Prompt Review Process

Every Routine prompt must pass `plan-review-loop` at **≥ 90/100** before being pasted into Anthropic. The loop enforces:

- Structural completeness (purpose, steps, dispatch, safety, format)
- Technical validity (connector calls, URL references, schema-compatible outputs)
- Implementation clarity (no ambiguous steps, no placeholders, error handling defined)

The `plan-review-loop` skill mandates **≥ 2 review iterations** for any document feeding more than 3 dependent sessions — every Routine prompt qualifies (each feeds Samson ingestion + evaluation + reporting, plus downstream operational consumers).

---

## Update Procedure

To change a Routine prompt:

1. **Edit** the prompt file in `routines/{slug}.md`.
2. **Run** `plan-review-loop` until score ≥ 90/100 (target 95+ for major revisions).
3. **Commit** the change on a feature branch with message `feat(routines): refine {slug} — {reason}`.
4. **Open PR** for review (especially for `friday-retro`, `friday-eval`, and `claude-md-audit` — high-impact prompts).
5. **After merge**, re-paste the prompt into the Anthropic Routine via the web UI at https://claude.ai/code/routines (replacing the prior version).
6. **Bump** the `version` field in front matter; update `last_reviewed_at`.
7. **Re-register** via `cadence_routine_register` MCP tool, or wait for the nightly reconciler to detect the SHA change and update `cadence_routine_definitions.prompt_sha`.

---

## OQ Decisions That Constrain This Library

| OQ | Topic | Decision | Affects |
|---|---|---|---|
| OQ-02 | News source list | 10-source list (see `cadence/decisions/OQ-02.md`) | `daily-news-sweep.md` |
| OQ-04 | WhatsApp dispatch | Native Routine connector if available by Phase 3; Samson cross-post fallback | `daily-news-sweep.md`, `daily-solomon-standup.md`, `friday-energy-retro.md` |
| OQ-05 | Eval dataset | `solomon-core-v1` (10 tasks, see `cadence/decisions/OQ-05.md`) | `friday-eval.md` |
| OQ-10 | GitHub repos | All 8 active repos (see `cadence/decisions/OQ-10.md`) | `github-pr-review.md`, `github-ci-triage.md` |
| OQ-13 | Versioning | Git SHA via `prompt_sha`; semver in front matter is documentation, not authoritative | All prompt files |
| OQ-14 | Local-Routine fallback | Trigger Local mode when `target_repo` is the working directory AND the file is unstaged | `claude-md-audit.md` |

---

## Cron Timezone

All schedules in `inventory.yml` are interpreted as **America/Nassau** (NAS, UTC-4 standard / UTC-5 DST). The schema's `schedule_cron` field stores a 5-field cron string; the `register_routines.py` script (BE-07) attaches `timezone: America/Nassau` to the Anthropic Routine config at registration time.

---

## Related Files

- `routines/inventory.yml` — machine-readable catalog (8 entries, consumed by BE-07)
- `cadence/decisions/` — OQ resolutions that constrain Routine behavior
- `solomon-docs/plans/HFS_CADENCE_LAYER_PLAN_FINAL.md` — full architecture spec
- `solomon-docs/plans/HFS_CADENCE_LAYER_PROMPTS_FINAL.md` — session-by-session implementation plan
- `hfs-aiops/cadence/` — Samson-side ingestion, evaluation, and reporting (Layer B)
