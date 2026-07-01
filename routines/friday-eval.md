---
slug: friday-eval
ritual_type: eval
version: 1.1
last_reviewed_at: 2026-07-01
author: Lionel + Solomon
changelog:
  - "1.1 (2026-07-01): added environment prerequisites (live 2026-06-29 run hit BOTH gaps: SAMSON_INTERNAL_TOKEN unset AND proxy 403 on samson host); fixed dataset path (repo-root-relative, not solomon-workspace/-prefixed); proxy-403 disambiguation in Safety."
---

# Friday Eval — solomon-core-v1

You are running Solomon's weekly capability eval against the `solomon-core-v1` golden dataset. The eval is the cadence's calibration loop — it tells Lionel when the multi-agent system has drifted from its baseline behavior. This Routine fires Friday 16:00 America/Nassau (one hour after `friday-retro`), invokes each of 10 dataset tasks against the appropriate Solomon agent, scores responses via LLM-as-judge, computes a pass-rate, and flags drift if the pass-rate drops ≥10% week-over-week.

## 1. Goal

For each of the 10 tasks in `solomon-core-v1`, dispatch to the target Solomon agent via Samson's MCP API, capture the response, judge it 0.0-1.0 against the golden output with the verbatim Appendix C.4.1 prompt, and aggregate to a single pass-rate. Compare to the prior week's run and emit a drift signal. Dispatch the summary to Slack `#dev-retro` as a reply to that day's friday-retro thread when possible (so eval results sit alongside the week's promotion proposals).

## 2. Trigger Context

- **Environment prerequisites (cloud — the Routine's environment MUST provide these or every run fails; the 2026-06-29 run failed on BOTH):**
  - Env var: `SAMSON_INTERNAL_TOKEN`.
  - Network access: **Custom**, with `samson.highfunctioningsolutions.com` in Allowed domains (+ the default list). A 403 with `x-deny-reason: host_not_allowed` is the environment proxy, not Samson auth — report it as an environment misconfiguration, not a token failure.
  - Slack: `#dev-retro` must exist with the bot invited (2026-06-29 run fell back into #dev-news).
  - Repo: `solomon-workspace` must be attached to this Routine (it is — the dataset is read from the clone).
- **Schedule:** cron `0 16 * * 5` in `America/Nassau` (Friday 16:00 NAS, one hour after friday-retro).
- **Max runs/day:** 1 (Friday only).
- **Daily slot budget:** counts as 1 of 15 daily Routine slots.
- **Upstream consumer:** Samson `eval_ingestion_handler` (BE-08) writes `cadence_eval_runs` (1 row) + `cadence_eval_results` (10 rows). If drift ≥10%, Samson's Linear client (not this Routine) files a P1 issue via `cadence:eval-drift` tag.

## 3. Steps

Execute in order. Step 2's API calls are load-bearing — see Safety §6 for the auth-failure branch.

1. **Load the dataset** from `cadence/eval/datasets/solomon-core-v1.yaml` **relative to the solomon-workspace repo clone root** (do NOT prefix `solomon-workspace/` — the clone directory IS that repo; per lesson_session_path_doubling_drift, if the literal path misses, resolve the semantic equivalent within the clone). Parse with strict schema validation: every task must have `task_id, description, agent_target, expected_output, tolerance, passing_threshold`. If validation fails, dispatch the auth-failure-shape error (see §6) and exit.

2. **For each of the 10 tasks** (process sequentially to bound concurrency cost):
   a. Resolve `fixture_path` if present: read the file content and inline it into the task payload as `fixture_content` (cap at 8KB; if larger, take first 8KB + note `[truncated]`).
   b. Dispatch to the agent via Samson:
      ```
      POST https://samson.highfunctioningsolutions.com/solomon/run
      Authorization: Bearer <SAMSON_INTERNAL_TOKEN>
      Content-Type: application/json
      Body: {"agent_target": "<from task>", "task_id": "<from task>", "task_description": "<from task>", "fixture_content": "<resolved or null>", "timeout_s": 60}
      ```
      Expected response: `{"task_id", "actual_output", "agent_invoked", "elapsed_s", "tokens_used"}`.
   c. Invoke the LLM-as-judge with the C.4.1 verbatim prompt (see §4 below). The judge receives `task_description`, `expected_output`, `actual_output`, `tolerance`; returns `{"score": 0.0-1.0, "reasoning": "<one sentence>", "passed": true|false}`.
   d. Accumulate the per-task result in memory for the final summary + `output_artifacts.task_results`: `{task_id, score, passed, reasoning, agent_actual_output_snippet (first 200 chars), agent_tokens, judge_tokens}`. Do NOT dispatch until all 10 tasks (or partial set per §7) are processed.

3. **Aggregate:** compute `pass_rate = sum(1 for r in results if r.passed) / len(results)`. Tabulate by `agent_target` for the per-agent breakdown.

4. **Fetch prior week's pass_rate** for drift:
   ```
   GET https://samson.highfunctioningsolutions.com/cadence/routines/friday-eval/runs?limit=1&offset=1
   Authorization: Bearer <SAMSON_INTERNAL_TOKEN>
   ```
   Expected response: `{"runs": [{"iso_week", "pass_rate", "completed_at"}]}` (offset=1 skips the current in-flight run). If no prior run exists (first eval ever), set `drift = null` and emit a `_First eval — no prior week to compare._` note.

5. **Compute drift:** `drift = current_pass_rate - prior_pass_rate` (range -1.0 to +1.0). A negative number means regression.

6. **Format** the output per §4 and **dispatch** per §5.

## 4. Output Format

### LLM-as-Judge prompt (verbatim from plan Appendix C.4.1 — DO NOT improvise)

```
You are evaluating whether an agent's output matches expected output for a benchmark task. Score 0.0–1.0.

**Task:** {{ task_description }}

**Expected output (golden):** {{ expected }}

**Actual output:** {{ actual }}

**Tolerance criteria:** {{ tolerance }}

Reply ONLY with a JSON object: `{"score": 0.0-1.0, "reasoning": "<one sentence>", "passed": true|false}`. The threshold for `passed` is score ≥ 0.7 unless the task specifies otherwise.
```

### Slack summary (dispatched as text — no Block Kit buttons in this Routine)

The date header uses America/Nassau local time at run, formatted as `Weekday, Month D, YYYY`.

```
**Friday Eval — Week {{ iso_week }} — `solomon-core-v1`**

**Pass rate:** N / 10 ({{ pass_rate_pct }}%) — threshold ≥ 70%
**Drift vs prior week:** {{ +N% | -N% | "no prior run" }} {{ "🚨 REGRESSION" if drift <= -0.10 else "" }}

| # | Task | Agent | Pass | Score |
|---|------|-------|------|-------|
| 1 | architecture_dispatch | solomon | {{ Y|N }} | 0.XX |
| 2 | quart_async_pattern | bishop | ... |
... 8 more rows ...

**Per-agent breakdown:** solomon {{X/4}}, bishop {{X/2}}, jacob {{X/1}}, esther {{X/1}}, twins-cane {{X/1}}, samson {{X/1}}

**Top failures (if any, max 3, severity-ordered):**
- task_id: <one-line reasoning from judge>
- ...

_Run cost: ${{cost}}. Dataset version: solomon-core-v1._
```

**Hard rules on the output:**
- The exact emoji `🚨` is the ONLY emoji permitted in this Routine's output, and ONLY in the drift line when `drift ≤ -0.10`. No other emojis anywhere.
- Drift display: `+12%` for positive, `-8%` for negative, `0%` for flat. Always include the % sign.
- "🚨 REGRESSION" tag is appended (with one leading space) to the drift line iff drift ≤ -0.10. Never on positive or flat drift.
- Per-task table always shows all 10 rows even on partial runs (mark missing as `—`).
- Top-failures section: 0-3 entries; if pass_rate ≥ 90%, show empty list with `_None — all tasks passed the threshold._`
- No color references (no `#FFD700`, no `#FF0000`, no red/yellow language).

## 5. Dispatch

One connector call. Both eval results and drift are in the same message — no thread reply needed.

**Slack message:**
```
connector: slack
method: chat.postMessage
payload:
  channel: "#dev-retro"
  thread_ts: <if friday-retro ran today and its ts is recoverable from Samson, reply in thread; else top-level>
  text: <the markdown summary from §4>
  unfurl_links: false
```

**Thread resolution:** call `GET https://samson.highfunctioningsolutions.com/cadence/routines/friday-retro/runs?limit=1` to get today's retro run; if `completed_at` is from today AND the response includes a `slack_message_ts`, use it as `thread_ts`. Otherwise post top-level (no thread_ts).

## 6. Safety

**Authentication failure (highest priority):**
- If step 2 or step 4's Samson call returns HTTP 401 or 403: stop. Post a single line to Slack `#dev-retro`: `**Friday Eval — Week {{ iso_week }}** — Eval unavailable: SAMSON_INTERNAL_TOKEN auth failed. Investigate before next Friday.` Exit cleanly so Samson's ingestion records the failure.
- **Distinguish the environment proxy:** a 403 carrying `x-deny-reason: host_not_allowed` is the cloud environment's network proxy blocking the host, not Samson rejecting the token. Report it as: `Eval unavailable: samson host not in the environment's Allowed domains (proxy 403). Fix the Routine environment, not the token.` The 2026-06-29 run conflated these — they are different fixes.

**Connection failure — infrastructure unavailable (highest priority, before any per-task scoring):**
- This branch triggers when a Samson call fails at the **connection level** — host unresolvable (DNS), connection refused, connection reset, or connection/read timeout — i.e. **no HTTP response is received at all**. This is distinct from a 401/403 (server responded, rejected auth) and from a 5xx (server responded with an error): in both of those the host was reachable.
- On the first such failure, wait 10 seconds and retry once.
- If the retry still cannot reach the host, **STOP the entire run**. Do **NOT** mark tasks `score=0.0`. A host-unreachable condition means the eval *could not run* — it is not evidence that the agents failed, and a fabricated 0% pass rate is indistinguishable from a real capability regression to anyone reading the summary.
- Post a single line to Slack `#dev-retro`: `**Friday Eval — Week {{ iso_week }}** — Eval could not run: Samson unreachable (connection failure, not auth). No pass rate computed. Investigate before next Friday.` Exit cleanly so Samson's ingestion records an **infrastructure-failure** run, not a 0% scored run.
- Rationale: a routine authored for `execution_mode: remote` must not emit a graded result when it is executing somewhere the remote dependencies don't resolve. This branch is the run-level guard; the per-task "5xx after retry" rule below applies only when the host *does* respond with a server error to an individual task.

**Dataset validation failure:**
- If the dataset YAML at `cadence/eval/datasets/solomon-core-v1.yaml` doesn't parse, has != 10 tasks, or has any task missing required fields: dispatch `**Friday Eval — Week {{ iso_week }}** — Eval unavailable: dataset schema invalid. See cadence/decisions/OQ-05.md for spec.` and exit.

**Per-task error (does NOT abort the run):**
- If a single task's Samson invocation 5xx after one retry: mark `score=0.0, passed=false, reasoning="agent invocation failed (5xx after retry)"` and continue. The aggregate pass_rate includes the zero.
- If the judge call fails: same — mark `score=null, passed=false, reasoning="judge call failed"`.
- If `fixture_path` is missing on disk: mark `score=0.0, passed=false, reasoning="fixture not found at {fixture_path}"`. Do NOT halt — other tasks may still run.

**Skip:**
- Political content from fixture inputs (defensive; unlikely).
- Tasks where `agent_target` is not one of the 7 valid agents (corrupted dataset — defensive).

**Retry once:**
- Samson API HTTP 5xx (per task or prior-week-fetch): wait 10 seconds, retry once. If still 5xx, mark the affected task failed.
- Samson connection-level failure (host unresolvable / refused / reset / timeout — no HTTP response): handled by the **Connection failure** branch above — retry once, then abort the whole run with the infra-unavailable notice. Do NOT mark tasks failed.
- Slack dispatch: wait 5 seconds, retry once.

**Never:**
- Improvise the judge prompt. The C.4.1 version in §4 is verbatim and any deviation invalidates drift comparison.
- Skip a task to stay under budget. If budget pressure forces a stop, partial-run dispatch with explicit `_Partial run — M of 10 tasks evaluated; cost cap reached._` prefix.
- Fabricate the prior-week pass_rate. If unfetchable, set `drift=null` with the "no prior run" note.
- File a Linear issue from this Routine. Linear P1 issue creation is Samson's responsibility (BE-08 ingestion handler watches for drift ≤ -0.10).
- Use any emoji except `🚨` in the drift-regression line.
- Broadcast a `0 / 10` (or any sub-100% pass rate) when the underlying cause is that Samson was unreachable. A connection-level failure is an **infrastructure-unavailable** condition (see the Connection-failure branch) — it must produce the "could not run" notice, never a scored pass rate that reads as a capability regression.

## 7. Cost Budget

Plan §4.4 mandates a hard $5 cap. Dollar values are primary; token estimates are for monitoring (Sonnet pricing).

- **Target:** ≤ $1.50/run (≈ 80,000 total tokens with Sonnet).
- **Soft warning:** if cumulative cost > $3.00 (≈ 150,000 tokens) mid-run, append `_Warning: high cost ($N.NN at task M of 10) — judge prompt may be inefficient._` to `output_artifacts.notes` and continue.
- **Hard abort:** if cumulative cost > $5.00 (≈ 250,000 tokens), stop the loop immediately. Dispatch a partial run with the prefix `_Partial run — cost cap reached at task M of 10; remaining marked as not-evaluated._` Mark unevaluated tasks `score=null, passed=null, reasoning="not evaluated — budget cap"`. Pass_rate is computed over evaluated tasks only.
- **Per-task cost reporting:** include the running cost in `output_artifacts.notes` at each task boundary so Samson's ingestion handler can attribute cost per-task in `cadence_eval_results.tokens_used`.
- **Estimated typical cost:** $1.20-1.80 per run with Sonnet (10 agent invocations × ~5K tokens + 10 judge calls × ~3K tokens). Use **Sonnet** for both the agent dispatch and the judge unless a future eval reveals judge-side scoring noise.
