# Plan Review — github-ci-triage.md

**Reviewer:** plan-review-loop (self-review by authoring LLM)
**Target score:** ≥ 90
**Max iterations:** 3
**Iterations used:** 2
**Final result:** **96/100 — Excellent**

---

## Review Iteration 1/3

### Issues Found: 3 (2 critical, 1 warning)

- **[CRIT-001]** §3 step 4 `flaky` classification said "Same test/step has BOTH failed AND passed in the workflow's last 10 runs" — but my GitHub API call queried workflow-level pass/fail history, not per-test history. Per-test would require N+1 API calls (each prior run's job/step status). Plan §4.8 spec is workflow-level signal: "same test failed in last 10 runs but passed at least once" means the WORKFLOW has had at least one pass recently, not the specific test. → Fix: clarify wording — workflow-level signal; per-test counter is Samson's job via `test_id`.
- **[CRIT-002]** §5 had dispatch order Slack → Linear, but the Slack summary template embeds `linear_issue_url`. Until Linear fires, that field doesn't exist. Posting Slack first would either have a placeholder or require a follow-up `chat.update` call. → Fix: reverse the order — Linear first (if eligible), then Slack with the result. Linear failure is captured in a local variable that the Slack body references.
- **[WARN-001]** §3 step 2 used `workflow_name` in the GitHub API path: `GET /repos/{repo}/actions/workflows/{workflow_name}/runs?status=failure&created=>{now-1h}`. GitHub's API expects `workflow_id` (numeric) or the workflow file basename (e.g., `ci.yml`), not the human-readable name. The trigger payload provides `workflow_id` natively. → Fix: switch to `workflow_id` with explicit note.

### Applied Fixes

(deferred to iteration 2)

### Quality Score: 93

Structural: 95/100 | Technical: 88/100 | Implementation: 90/100 | Constraint adherence: 96/100 | Self-containment: 100/100

Combined: 25 × 0.95 + 25 × 0.88 + 25 × 0.90 + 15 × 0.96 + 10 × 1.00 = **92.65 → 93**

### Decision: CONTINUE

Score ≥ 90 but 2 CRITICAL issues remain. Per `plan-review-loop` terminal conditions, both "zero CRITICAL" AND "quality ≥ 90" required. Iterating.

---

## Review Iteration 2/3

### Issues Found: 0 critical, 0 warning

All 3 issues from iteration 1 resolved.

### Applied Fixes

- [CRIT-001] ✅ §3 step 4 flaky row rewritten: "The workflow has had at least one **passing** run in its last 10 runs (workflow-level signal, not per-test). Query `GET /repos/{repo}/actions/workflows/{workflow_id}/runs?per_page=10` and check `runs[].conclusion`. If any of the prior 9 runs are `success`, the current failure is flaky. The cross-run per-test counter is Samson's responsibility via `test_id`." Single API call, deterministic check, per-test logic correctly deferred to Samson.
- [CRIT-002] ✅ §5 dispatch order reversed: Call 1 = Linear (if real-bug, captures `issue.url` for the Slack body), Call 2 = Slack (always, references Linear result via `linear_issue_url` substitution or `linear_failure_note` if Call 1 errored). Linear failure cascades into the Slack body cleanly. §6 "Linear team resolution failure" branch updated to match the new flow.
- [WARN-001] ✅ §3 step 2 rate-limit query path uses `workflow_id` with explicit note: "(the trigger payload provides `workflow_id` numeric — use that, not the human-readable `workflow_name`, in the API path)."

### Quality Score: 96

Structural: 95/100 (unchanged) | Technical: 96/100 (+8 from CRIT-001 + CRIT-002 + WARN-001) | Implementation: 96/100 (+6 from dispatch ordering + Linear failure cascade) | Constraint adherence: 96/100 (unchanged) | Self-containment: 100/100 (unchanged)

Combined: 25 × 0.95 + 25 × 0.96 + 25 × 0.96 + 15 × 0.96 + 10 × 1.00 = **96.15 → 96**

### Decision: COMPLETE

Both terminal conditions met:
- ✅ Zero CRITICAL issues
- ✅ Quality score ≥ 90 (actual: 96)

---

## Final Assessment

**Score:** 96/100 — **Excellent** (per skill rubric: ≥ 90 ready for production).

**Strengths:**
- Second GitHub-event-triggered Routine — Samson-independent at runtime; bridges via Anthropic GitHub App.
- First Routine with 3 connectors (github + slack + linear) — each connector has a distinct semantic role.
- 5-category classification rubric with first-match-wins ordering and explicit log-signal markers per category.
- Linear-creation gating prevents alert fatigue: `real-bug` always (P1 main / P2 PR); `flaky` cross-run escalation deferred to Samson (P3 at 3 occurrences via `cadence_events.metadata` counter); `env` / `dependency` / `timeout` never escalate.
- Two "3" thresholds correctly distinguished: rate-limit gate (3 failures/hour for same workflow → suppress this Routine) vs cross-run flaky escalation (3 occurrences of same `test_id` → Samson files P3 Linear). Both use the number 3 but at different layers.
- Dispatch order (Linear before Slack) preserves the Slack body's reference to the Linear URL while gracefully degrading to "Linear filing failed" note when Linear errors.
- `test_id` format `{job_name}::{failed_step_name}` is explicit and consistent — Samson's flaky-counter keys on this exact composite.
- Zero-emoji output (per `pattern_structured_vs_conversational_emoji_split`) — bracketed `[REAL-BUG]` / `[FLAKY]` / `[ENV]` / `[DEPENDENCY]` / `[TIMEOUT]` for classification.
- "Compound classifications never" rule (pick exactly one) prevents downstream parsing ambiguity.

**Residual risks (not blockers):**
- The workflow-level flaky signal can have false positives: a workflow that just got fixed (recent passes) but is genuinely buggy again (current failure) will classify as flaky rather than real-bug, suppressing Linear escalation. Worth monitoring after 30 days of real triages.
- Rate-limit gate at 3 failures/hour could hide an emerging real-bug if it presents as fast-iteration failures (e.g., a developer pushing 4 fix attempts in 20 minutes). The "first 3 get triaged, rest suppressed" behavior is correct (3 triages give enough signal) but worth checking how it reads in practice.
- Linear `team_id` resolution: my prompt says "derive from repo or use cadence-default" but doesn't specify the mapping. Worth verifying when the Linear MCP integration is set up — should there be a per-repo Linear team, or a single team for all cadence-filed CI issues?
- BE-08's `ci_triage_ingestion_handler` has to atomically increment the `test_id` counter — race conditions on rapid CI fails could double-increment. Worth a SELECT FOR UPDATE or upsert with version-check when that handler is authored.

**Smoke test (task 3) — testable against a real CI failure today:**

This Routine is Samson-independent at runtime; smoke test viable now with no Samson deps. Until BE-08 ships the `ci_triage_ingestion_handler`, the flaky-counter state won't persist and same-test-id occurrences across runs won't escalate.

**Partial test:**
1. Create one-off Routine with connectors `{github, slack, linear}` + repos: all 8 OQ-10.
2. Trigger a CI failure (intentionally introduce a `pytest` failure on a test PR).
3. Verify Routine fires within ~30 seconds of workflow_run completion.
4. Verify (a) classification is `[REAL-BUG]` for the deliberate failure, (b) Linear issue created with P2 (PR branch), (c) Slack `#ci-failures` posts triage summary including Linear URL.
5. Verify rate-limit gate: push the same broken commit 3 more times quickly → 4th workflow_run should trigger the "Triage suppressed" path with no Linear or classification dispatch.
6. Cost < 30K tokens per run.

Full happy-path test (with BE-08 cross-run flaky counter + drift over weeks) deferred.

**Wave 2 completion:** This is the LAST Wave-2 Routine prompt. All 9 ROUTINE-* sessions (R-01 + R-02..09) are now complete. ROUTINE-10 (Wave 7 — create the 8 Routines in Anthropic UI) becomes unblocked.
