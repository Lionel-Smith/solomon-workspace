---
slug: github-ci-triage
ritual_type: ci_triage
version: 1.0
last_reviewed_at: 2026-05-06
author: Lionel + Solomon
---

# GitHub CI Failure Triage

You are triaging a failed GitHub Actions workflow on one of the 8 active HFS repositories. This Routine fires when `workflow_run.completed` arrives with `conclusion=failure` via the Anthropic GitHub App's event bridge. Your job is to fetch the failed job logs, classify the failure against a fixed 5-category rubric, post a triage summary to Slack `#ci-failures`, and file a Linear issue **only if** the classification is `real-bug`. Samson-independent at runtime; Samson's `ci_triage_ingestion_handler` (BE-08) handles the flaky-counter state across runs and escalates flaky-≥3 to its own Linear issue.

## 1. Goal

For a single failed workflow_run, fetch the failed job's logs via GitHub API, classify the failure into exactly one of 5 categories (`flaky`, `env`, `real-bug`, `dependency`, `timeout`), post a triage summary to Slack, and conditionally file a Linear issue (only for `real-bug`). Suppress duplicate triage when the same workflow has failed ≥3 times in the last hour (rate-limit gate). Every run emits a parseable summary so Samson can ingest classification + test_id for cross-run flaky tracking.

## 2. Trigger Context

- **Trigger type:** GitHub event via Anthropic GitHub App.
- **Event filter:** `workflow_run.completed` AND `conclusion=failure`.
- **Eligible repos** (per OQ-10): `solomon`, `hfs-aiops`, `esther-mcp`, `esther-models`, `solomon-dashboard`, `esther-preview`, `hfs-development-kit`, `solomon-workspace`. Skip with no-op if event arrives from any other repo.
- **Event payload provides:** `repo`, `workflow_run_id`, `workflow_name`, `head_branch`, `head_sha`, `conclusion`, `html_url`, `event` (push|pull_request|schedule|workflow_dispatch).
- **Max runs/day:** 3 (per Appendix D budget — CI failures are bursty; rate-limit gate in §3 step 2 prevents storm).
- **Samson-independent at runtime:** no calls to Samson from this Routine. Samson's `ci_triage_ingestion_handler` (BE-08) maintains the flaky-counter in `cadence_events.metadata` and escalates flaky-≥3 to its own Linear issue downstream.

## 3. Steps

Execute in order. Step 2's rate-limit gate prevents Routine-spam on CI-storm conditions.

1. **Validate event payload.** Confirm `repo` is in the OQ-10 8-repo allowlist. Confirm `workflow_run_id`, `workflow_name`, `head_sha`, `conclusion=failure` present. If any check fails, exit cleanly with `output_artifacts.notes: "ineligible event — no triage attempted"`.

2. **Rate-limit gate:** count prior `workflow_run.completed` failure events for the SAME `{repo, workflow_id}` in the last 60 minutes via GitHub API: `GET /repos/{repo}/actions/workflows/{workflow_id}/runs?status=failure&created=>{now-1h}` (the trigger payload provides `workflow_id` numeric — use that, not the human-readable `workflow_name`, in the API path). If count ≥ 3 (this would be the 4th in the hour), suppress: post a single line to Slack `#ci-failures`: `Triage suppressed — {{ repo }}/{{ workflow_name }} has failed ≥3× in the last hour; see prior triage in this channel. Workflow URL: {{ html_url }}` and exit cleanly. Do NOT classify, do NOT file Linear.

3. **Fetch failed job logs** via GitHub API:
   - List failed jobs: `GET /repos/{repo}/actions/runs/{workflow_run_id}/jobs?filter=latest`
   - For each job with `conclusion=failure` (typically 1, sometimes more on matrix builds), fetch logs: `GET /repos/{repo}/actions/jobs/{job_id}/logs`
   - Cap total log content at 100KB across all failed jobs; if larger, take first 100KB per job + note `_Logs truncated at 100KB per job_`

4. **Classify into exactly ONE category** using this rubric (apply in order, first match wins):

   | Category | Signal |
   |---|---|
   | `env` | Log contains: runner image pull failure, network unreachable to GitHub Actions infra, GitHub Actions service incident, runner offline mid-run, agent disconnected, or rate-limited by external service that's not the project's dependency |
   | `dependency` | Log contains: `pip install` / `npm install` / `apt-get` / `brew install` failure, lock-file conflict, package not found on registry, version-resolution conflict, dependency security-audit blocker |
   | `timeout` | Log contains: job exceeded the 6-hour GitHub default OR the workflow-defined `timeout-minutes`; or step-level "::error::Process completed with exit code 124" (timeout); or "ERROR: The action 'X' has timed out" |
   | `flaky` | The workflow has had at least one **passing** run in its last 10 runs (workflow-level signal, not per-test). Query `GET /repos/{repo}/actions/workflows/{workflow_id}/runs?per_page=10` and check `runs[].conclusion`. If any of the prior 9 runs are `success`, the current failure is flaky. The cross-run per-test counter is Samson's responsibility via `test_id`. |
   | `real-bug` | Default if no above category matches. Failure is a genuine assertion/exception/lint/type error introduced by the changes under test |

5. **Determine Linear-creation eligibility:**
   - `real-bug` AND `head_branch == default branch of repo` (main/master): file Linear with **P1** priority.
   - `real-bug` AND `head_branch != default branch` (PR branch): file Linear with **P2** priority.
   - `flaky` / `env` / `dependency` / `timeout`: do NOT file Linear from this Routine. (For `flaky`, Samson's `ci_triage_ingestion_handler` will count + escalate to its own Linear issue once the cross-run threshold of 3 is crossed.)

6. **Compose** outputs per §4 below.

7. **Dispatch** per §5 below — Slack always fires; Linear fires only on `real-bug`.

## 4. Output Format

Three potential outputs: Slack triage summary (always), Linear issue body (only when `real-bug`), and `output_artifacts.classification` (always, for Samson ingestion).

### Slack triage summary (always dispatched to `#ci-failures`)

```
**CI Triage — {{ repo }}/{{ workflow_name }}**

**Classification:** [{{ classification|upper }}]
**Branch:** {{ head_branch }} | **SHA:** {{ head_sha[:7] }} | **Workflow:** {{ html_url }}

**Failed step(s):**
- {{ job_name }} → {{ failed_step_name }}: {{ log_snippet|truncate(150) }}

**Reasoning:** {{ 1-2 sentence explanation of why this classification fits — refer to specific log signals }}

{% if linear_issue_url %}
**Linear:** {{ linear_issue_url }} ({{ priority }})
{% elif classification == "flaky" %}
**Linear:** none (cross-run flaky-counter handled by Samson — Linear P3 fires at 3rd occurrence)
{% else %}
**Linear:** none ([{{ classification|upper }}] — not Linear-eligible per cadence rubric)
{% endif %}

_Logs: ≤100KB per job processed. Same workflow with ≥3 failures in last hour will suppress further triage._
```

### Linear issue body (only when `classification=real-bug`)

```
{{ workflow_name }} failed on {{ repo }}@{{ head_branch }} ({{ head_sha[:7] }})

**Classification:** [REAL-BUG]
**Workflow URL:** {{ html_url }}
**Event:** {{ event_type }} | **Branch:** {{ head_branch }} | **SHA:** {{ head_sha }}

**Failed step:** {{ job_name }} → {{ failed_step_name }}

**Log snippet (last 50 lines of failure):**
```
{{ log_snippet_50_lines }}
```

**Classification reasoning:**
{{ 2-3 sentence explanation tying log signals to "real-bug" rather than the other 4 categories }}

**Triggered by:** github-ci-triage Routine (cadence-layer)
**Priority:** {{ P1 if main else P2 }}
**Auto-filed:** {{ ISO timestamp }}
```

### output_artifacts.classification (always — for Samson ingestion)

Single JSON object with fields: `repo`, `workflow_name`, `workflow_run_id`, `head_branch`, `head_sha`, `classification` (one of `flaky|env|real-bug|dependency|timeout`), `test_id` (composite `"{job_name}::{failed_step_name}"` — Samson's flaky-counter key), `linear_issue_url` (or null), `priority` (`P1|P2|null`).

**Hard rules on the output:**
- Classification tag uses bracketed text: `[REAL-BUG]`, `[FLAKY]`, `[ENV]`, `[DEPENDENCY]`, `[TIMEOUT]`. No emojis or color codes.
- The classification is exactly ONE of the 5 categories — never `[REAL-BUG|FLAKY]` or "mostly real-bug." Pick one.
- Zero emojis across all outputs (Slack, Linear, artifact JSON).
- No color references (no `#FFD700`, no `#FF0000`, no red/yellow language).
- Linear priority strictly: P1 (main, real-bug) | P2 (PR, real-bug) | otherwise no Linear.
- `test_id` field always populated as `{job_name}::{failed_step_name}` — Samson's flaky-counter keys on this exact format.

## 5. Dispatch

Two connector calls (or three if classification=real-bug). **Linear MUST fire first** (when eligible) because the Slack summary embeds the Linear issue URL.

**Call 1 — Linear issue (ONLY if classification=real-bug; SKIP otherwise):**
```
connector: linear
method: issue.create
payload:
  team_id: <HFS Linear team — derive from repo or use cadence-default>
  title: "[{{ priority }}] CI failed: {{ repo }}/{{ workflow_name }} on {{ head_branch }}"
  description: <the Linear issue body from §4>
  priority: <"1" for P1 if main; "2" for P2 if PR>
  labels: ["ci-failure", "cadence-auto-filed", "{{ classification }}"]
```
Capture the response's `issue.url` into a local variable for inclusion in Call 2's Slack body. If Linear fails (HTTP 5xx after retry, team resolution error, etc.), set `linear_issue_url=null` and `linear_failure_note="<error_summary>"` — Call 2 still fires with the failure noted in the Slack body.

**Call 2 — Slack `#ci-failures` (always; references Linear result from Call 1):**
```
connector: slack
method: chat.postMessage
payload:
  channel: "#ci-failures"
  text: <the Slack triage summary from §4 — with linear_issue_url substituted (or "Linear filing failed — <linear_failure_note>; manual file needed." if Call 1 errored)>
  unfurl_links: false
```

If Call 2 fails after Call 1 succeeded: the Linear issue is already filed; record the Slack failure in `output_artifacts.connector_failures`. Lionel can see the new Linear issue even without the Slack notice.

If Call 2 fails AND classification was NOT real-bug (no Call 1): record the Slack failure; Samson's ingestion still gets the classification via `output_artifacts.classification`.

## 6. Safety

**Ineligible event:**
- Repo not in OQ-10 8-repo allowlist: exit cleanly with `output_artifacts.notes: "ineligible event — repo not in allowlist"`.
- `conclusion != "failure"`: exit cleanly (no-op).

**Rate-limit suppression (step 2 trigger):**
- ≥3 same-workflow failures in last hour: post single-line suppression notice to Slack, exit. Do NOT classify, do NOT file Linear.

**Log fetch failure:**
- GitHub API HTTP 5xx fetching logs: wait 10s, retry once. If still 5xx, post a minimal Slack notice `CI Triage — {{ repo }}/{{ workflow_name }} failed; logs unfetchable. Workflow URL: {{ html_url }}` and exit. Classification cannot proceed without logs.
- Job has no logs at all (e.g., setup-step failure before any output): classify based on payload alone — usually `env` (runner setup) or `dependency` (install step). If still ambiguous, classify as `env` (the most defensive choice — doesn't escalate to Linear).

**Classification ambiguity:**
- If two categories' signals both fire (rare — e.g., `env` AND `dependency`), apply the rubric's first-match-wins ordering (env before dependency). Do NOT compound categories.
- If NO signals fire AND the failure is in a test step: classify as `real-bug` (default per rubric).

**Linear team resolution failure:**
- If the Linear connector can't resolve a team for the repo: Call 1 fails with `linear_failure_note="team resolution error"`. Call 2 (Slack) still fires with the failure embedded in the body (`Linear: filing failed — team resolution error; manual file needed.`). Record in `output_artifacts.connector_failures`. The classification is still recorded for Samson ingestion.

**Retry once:**
- GitHub API HTTP 5xx (log fetch or workflow list): wait 10s, retry once. Then proceed with whatever data was retrieved.
- Slack dispatch HTTP 5xx: wait 5s, retry once.
- Linear dispatch HTTP 5xx: wait 5s, retry once.

**Never:**
- File a Linear issue for `flaky`, `env`, `dependency`, or `timeout` classifications. The cross-run flaky escalation is Samson's job (counter + threshold of 3 → P3 Linear).
- File a Linear issue with `priority` other than P1 (main + real-bug) or P2 (PR + real-bug).
- Compound classifications (`[REAL-BUG|FLAKY]`) — pick exactly one per rubric ordering.
- Skip the Slack post even if Linear fires. Slack `#ci-failures` is the human-glance audit trail.
- Use yellow (`#FFD700`) or red (`#FF0000`) in any color-coded output.
- Use any emoji.

## 7. Cost Budget

CI-triage scope — log parsing dominates cost. Mid-weight tier.

- **Target:** ≤ 30,000 total tokens per run (≈ $0.40-0.90 with Sonnet).
- **Soft warning:** if total tokens > 50,000 mid-run, append `_Warning: high token usage (Nk) — logs may be unusually verbose._` to `output_artifacts.notes` and continue.
- **Hard abort:** if total tokens > 100,000, stop log analysis and post a partial triage with the prefix `_Partial triage — token budget exceeded; classification based on log truncation._` Slack still fires; Linear suppressed (insufficient confidence).
- **Estimated typical cost:** ≈ $0.30-0.80 per run with Sonnet (small-to-medium failure logs). Use **Sonnet** — pattern-matching on log signals, not deep reasoning. Use Opus only if a future review surfaces misclassifications on subtle cases (e.g., flaky-vs-real-bug edge cases).
