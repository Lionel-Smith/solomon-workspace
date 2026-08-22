# Plan Review — daily-solomon-standup.md

**Reviewer:** plan-review-loop (self-review by authoring LLM)
**Target score:** ≥ 90
**Max iterations:** 3
**Iterations used:** 2
**Final result:** **96/100 — Excellent**

---

## Review Iteration 1/3

### Issues Found: 5 (2 critical, 3 warning)

- **[CRIT-001]** Step 6's Mem0 query specifies exact payload `{query, window_days}`, but Anthropic's Mem0 connector schema likely uses different field names. A runtime mismatch would cause the dedup step to fail with a 4xx, propagating into proposed-learnings noise (re-proposing already-captured learnings). → Fix: describe the intent + capabilities needed (tag filter + recency); let the cloud-Claude map to the connector's actual schema. Include a Safety fallback for connector errors.
- **[CRIT-002]** Step 6 uses `anti_patterns[].pattern` as the proposed-learning text body, but `pattern` is likely a short code label (e.g., `"except Exception: pass"`) — not a sentence. The output format demands `≤120 chars` learning text that's readable. → Fix: explicit instruction to expand the `pattern` label into a human-readable learning sentence with agent names + frequency, including a worked example.
- **[WARN-001]** Step 3 lead-in "Account for all 7 agents — required" is correct but loose. "Account for" could mean "mention" or "include data for" — ambiguous to autonomous Claude. → Recommendation: rename to "Build the 7-agent roster" with explicit "exactly once" semantic.
- **[WARN-002]** section 4 output rule "All 7 agents appear across Healthy + Blockers" doesn't explicitly bar duplicates. Could be misread as "could appear in both sections." → Recommendation: add "exactly once" + "no agent listed in both sections."
- **[WARN-003]** Cost budget section default-model line ("Default to Sonnet — the work is structured API consumption...") is correct but slightly redundant with the per-token tier guidance above it. Minor polish only. → Recommendation: leave as-is (clarity wins over brevity here).

### Applied Fixes

(deferred to iteration 2)

### Quality Score: 92.5

Structural: 95/100 | Technical: 88/100 | Implementation: 90/100 | Constraint adherence: 95/100 | Self-containment: 100/100

Combined (weighted: structural 25% / technical 25% / implementation 25% / constraint 15% / self-containment 10%):
25 × 0.95 + 25 × 0.88 + 25 × 0.90 + 15 × 0.95 + 10 × 1.00 = **92.5**

### Decision: CONTINUE

Score ≥ 90 but 2 CRITICAL issues remain. Per `plan-review-loop` terminal conditions, loop stops only when BOTH "zero CRITICAL" AND "quality ≥ 90" hold. Iterating.

---

## Review Iteration 2/3

### Issues Found: 0 critical, 0 warning

All 4 actioned issues from iteration 1 resolved (WARN-003 left as-is per recommendation — non-blocking polish only).

### Applied Fixes

- [CRIT-001] ✅ Step 6 Mem0 query now describes intent ("search-by-tag or semantic-search-with-tag-filter with tag `cadence:learn`, last 7 days, limit 50") rather than prescribing exact field names. Adds Safety fallback: if Mem0 errors, skip dedup and proceed with cluster-only learnings (recorded in `output_artifacts.notes`).
- [CRIT-002] ✅ Step 6 now includes explicit "expand each selected cluster's `pattern` field into a human-readable learning sentence" rule with worked example: `pattern "except Exception: pass"` (3 occurrences across bishop + jacob) → `"Bare 'except Exception: pass' caught 3 times this week — prefer specific exceptions and explicit re-raise/log."` Includes agent names + count for Lionel's context.
- [WARN-001] ✅ Step 3 retitled to "Build the 7-agent roster" with explicit "exactly once" semantic and "synthesize a stub entry" instruction for missing agents.
- [WARN-002] ✅ Output rule now reads "All 7 agents appear across Healthy + Blockers **exactly once** (no agent dropped, no agent listed in both sections)."

### Quality Score: 96

Structural: 95/100 (unchanged) | Technical: 96/100 (+8 from CRIT-001 + CRIT-002) | Implementation: 95/100 (+5 from clearer roster step + exactly-once + expansion example) | Constraint adherence: 96/100 (+1 from explicit exactly-once enforcement) | Self-containment: 100/100 (unchanged)

Combined: 25 × 0.95 + 25 × 0.96 + 25 × 0.95 + 15 × 0.96 + 10 × 1.00 = **95.9 → 96**

### Decision: COMPLETE

Both terminal conditions met:
- ✅ Zero CRITICAL issues
- ✅ Quality score ≥ 90 (actual: 96)

Loop terminated after 2 iterations (target met before max=3).

---

## Final Assessment

**Score:** 96/100 — **Excellent** (per skill rubric: ≥ 90 ready for production).

**Strengths:**
- Authentication failure path is the most prominent branch in Safety section 6 (correctly — it's the highest-runtime-risk failure mode and would otherwise silently break the daily cadence).
- 7-agent roster invariant enforced in 3 places (Step 3, section 4 output rule, Safety "Never") — defensive consistency.
- Mem0 dedup query is intent-based rather than payload-prescriptive, with explicit fallback for connector mismatch.
- Anti-pattern expansion example shows cloud-Claude how to turn `"except Exception: pass"` into a useful learning sentence.
- 4-emoji exception (`☀️ 🟢 🚧 💁`) explicitly scoped to template positions, preventing emoji creep elsewhere.

**Residual risks (not blockers):**
- The Samson `/agents/activity` endpoint is **NEW** per plan section 4.2 and won't exist until a Samson session implements it. This Routine prompt is correct in calling it, but the smoke test (task 3) will fail until that endpoint ships. Worth flagging in /session:complete notes.
- Anti-pattern source field (`anti_patterns[].pattern`) is also predicted; the actual schema depends on how Samson's `IngestService` exposes it. May need fix-up commit after Samson side lands.
- Jaccard 0.85 threshold for dedup is consistent with ROUTINE-02 (pattern-level decision) — after ≥ 30 days review actual proposed-vs-captured overlap to tune.

**Smoke test (task 3) — user-side action required:**
Create a one-off Routine in Anthropic UI with this prompt + connectors `{slack, whatsapp, mem0}` + secret `SAMSON_INTERNAL_TOKEN`. The `/agents/activity` endpoint won't exist yet, so the smoke test will hit the Safety section 6 401/5xx path — that's the right thing to verify at this stage:
1. Does the auth failure produce the Slack-only "Standup unavailable" notification?
2. Does the digest format (when manually fed mock JSON) match section 4 exactly with all 7 agents + 4 emojis?
3. Does `output_artifacts.connector_calls` record the Slack post?
4. Total token usage < 50K?

Full smoke test (with live API) deferred until Samson's `/agents/activity` endpoint lands (a future BE-* session).
