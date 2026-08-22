# Loop Hygiene Audit — July 2026

**Session:** LHV-04 (Loop Hardening v2, Plan section 3-F5) · **Date:** 2026-08-20
**Scope:** docs-only. Interval and trigger *metadata* analysis. No routine prompt
body is modified here — prompt-content changes stay behind `plan-review-loop >= 90`
per R5.3, and any trigger change recommended below needs its own implementation
session (this file only records the disposition and its reasoning).

**Governing principle** (from the loop-engineering article the LHV plan cites):
*match the interval to how often the watched thing changes.* A routine that fires
faster than its subject changes burns budget producing no-delta reports; one that
fires slower than its subject changes misses events.

---

## 1. Pitch item 1 is moot — pr-review is already event-driven

The LHV pitch proposed moving `github-pr-review` from a cron schedule to a GitHub
event trigger. Discovery on 2026-07-07 found this had already shipped. Three
independent pieces of evidence:

| Evidence | Location | Content |
|---|---|---|
| Prompt declares the trigger | `routines/github-pr-review.md:21-22` | "**Trigger type:** GitHub event via Anthropic GitHub App." / "**Event filter:** `pull_request.opened` OR `pull_request.synchronize`." |
| Routine is registered | `routines/.created.yml:94` | `anthropic_routine_id: trig_01JGRqeXAHwCJaxRJ575bK7t` |
| Deployment recorded | `routines/REMEDIATION_2026-07-01.md:82` | `[x] github-pr-review (trig_01JGRq...): re-pasted v1.1; connectors → Slack` |

`github-ci-triage` is likewise event-driven (`workflow_run`), so **both** GitHub
routines already satisfy the principle: they fire exactly when the watched thing
changes, and cost nothing on a quiet day.

**Item 1 requires no work.** It is folded into this audit as evidence, not as a task.

---

## 2. Interval vs. change-rate — the five scheduled routines

Schedules from `routines/.created.yml`; cron is `TZ=America/Nassau`.

| Routine | Routine ID | Cron (NAS) | What it watches | How fast that changes | Fit |
|---|---|---|---|---|---|
| `daily-news-sweep` | `trig_01A9w6skLbgrA4GgmKJmr6rP` | `30 6 * * 1-5` — Mon–Fri 06:30 | External dev news, releases, ecosystem posts | Continuously, many times/day | **Deliberately slower.** Digest-shaped: the value is one batched read, not low latency |
| `daily-solomon-standup` | `trig_01RC8mKuTeeLB3MyHNtxuMWY` | `0 7 * * 1-5` — Mon–Fri 07:00 | Samson agent activity overnight | Daily-ish, tied to agent runs | **PAUSED** — blocked, not an interval question (section 3) |
| `friday-retro` | `trig_01TxzYbSqjbtPxxtDhrYYbeh` | `0 15 * * 5` — Fri 15:00 | Commits + completed sessions across `solomon`, `hfs-aiops`, `solomon-workspace` | Bursty; several sessions/week | **Matched.** A retro's subject is the accumulated week, not any single commit |
| `friday-eval` | `trig_01NcDtKZEJp6AMQXan6cU1gf` | `0 16 * * 5` — Fri 16:00 | `solomon-core-v1` eval-suite results | Episodic — only when Solomon or the model changes | **Mismatched.** Fires weekly regardless of whether anything moved |
| `friday-energy-retro` | `trig_011tUwDSykbionaLAqEYiSnW` | `0 17 * * 5` — Fri 17:00 | Lionel's own week — energy, focus, load | Weekly by construction | **Matched.** A reflection ritual, not a monitor |

---

## 3. Dispositions

### `daily-news-sweep` — Disposition: keep

Its subject changes far faster than daily, so by the literal principle it is
"under-polling". That is correct here and should not be changed: the deliverable
is a *digest* a human reads once each morning, so the interval is set by the
reader's cadence, not the source's. Firing more often would produce more reports,
not more value. Live at v1.2 on the `cadence-web` environment
(`REMEDIATION_2026-07-01.md:74`).

### `daily-solomon-standup` — Disposition: defer

**Currently PAUSED** and must stay paused. Two independent blockers, neither of
which is about the interval:

1. Prerequisites unmet — needs `SAMSON_INTERNAL_TOKEN` + `MEM0_API_KEY`, custom
   network access allowlisting `samson.highfunctioningsolutions.com` and
   `api.mem0.ai`, and the `#solomon-standup` Slack channel
   (`inventory.yml`, `daily-solomon-standup` block).
2. Incident 2026-07-03 — `samson.highfunctioningsolutions.com` returns NXDOMAIN
   and the droplet's port 22 is refused. The routine's own data source is down.

Its `0 7 * * 1-5` schedule is defensible *if* it ever unpauses (overnight agent
activity is a daily-granularity subject). Re-evaluate the interval at unpause
time, not now. **This audit does not recommend unpausing.**

### `friday-retro` — Disposition: keep

Weekly is the right granularity for a retro even though commits land more often.
Same reasoning as `daily-news-sweep`: the subject is a pattern across the week,
and a retro fired per-commit would have nothing to reflect on. Blocked on a v1.1
re-paste (`REMEDIATION_2026-07-01.md:92`) — an environment issue, not an interval
one.

### `friday-eval` — Disposition: change

**The one genuine mismatch.** The eval suite measures `solomon-core-v1` behavior,
which changes only when (a) Solomon's own code or skills change, or (b) the
underlying model changes. Neither is weekly. On a quiet week the routine spends a
run to report no delta — precisely the anti-pattern the principle names.

Recommended shape is a **hybrid**, not a straight cron→event swap:

- **Event leg:** fire on merges to `solomon` and `hfs-development-kit`. That is
  when (a) happens, and it is the change the eval exists to catch.
- **Time floor:** retain a *monthly* scheduled run. Case (b) — a model release
  shifting behavior — produces **zero repo events**, so a purely event-driven
  eval would go blind to exactly the drift that motivated having an eval. The
  floor is the safety net, not the primary trigger.

**Do not implement here.** This needs its own session: it touches
`inventory.yml` (`trigger_type`, `github_event_filter`) and the routine's section 2, and
the section 2 edit is prompt-body content gated behind `plan-review-loop >= 90` (R5.3).
Note the routine is currently *blocked on a v1.1 re-paste*
(`REMEDIATION_2026-07-01.md:93`) — which makes this the cheap moment to change it,
before it is re-pasted in its current form.

### `friday-energy-retro` — Disposition: keep

Not a monitor. Its subject is the human week, and the interval *is* the ritual.
The change-rate principle does not apply to a reflection prompt. Live at v2.0,
Slack-only (`REMEDIATION_2026-07-01.md:78`).

---

## 4. Daily-budget re-check for the proposed change

Required by R5.2 whenever a change is proposed. Baseline from `README.md:9-24`:
Anthropic Max-tier caps **15 Routine runs/day**.

| | Today | With `friday-eval` hybrid |
|---|---|---|
| Mon–Thu scheduled | 2 (news, standup*) | 2 — unchanged |
| Mon–Thu total peak | ~6 (2 + 0–5 GitHub events) | ~6 **+ 0–1** eval events on a merge day |
| Fri scheduled | 5 | **4** (eval leaves the Friday block) |
| Fri total peak | ~9 (5 + 0–4 GitHub events) | ~8 **+ 0–1** eval events |

\* standup is paused, so real Mon–Thu scheduled load is currently 1.

**Verdict: the change is budget-neutral-to-favorable.** It removes a guaranteed
weekly run and replaces it with an occasional event-driven one, lowering the
Friday peak from ~9 to ~8. Worst case — a merge lands every weekday — adds at most
5 runs/week while removing 1, so weekday peak reaches ~7 against a cap of 15. The
80%-utilization alert at 12+ runs (`README.md:26`) is not approached under any
combination modeled here. The monthly floor adds 1 run/month, which is noise.

---

## 5. Summary

| Routine | Disposition | Reason |
|---|---|---|
| `daily-news-sweep` | keep | Digest cadence set by the reader, deliberately slower than the source |
| `daily-solomon-standup` | defer | Paused; blocked on prerequisites + the 2026-07-03 DNS/SSH incident |
| `friday-retro` | keep | Subject is the week's pattern, not individual commits |
| `friday-eval` | change | Fires weekly on an episodically-changing subject; hybrid event + monthly floor |
| `friday-energy-retro` | keep | Reflection ritual — interval is the point, not a polling rate |

**Net:** 3 keep, 1 change (recommended, not implemented), 1 defer. Pitch item 1
was already shipped and needs no work. The only real interval mismatch in the
estate is `friday-eval`, and the correct fix is a hybrid rather than the pure
event-driven swap the principle would naively suggest — because the eval's most
important failure mode, model-side drift, emits no events at all.
