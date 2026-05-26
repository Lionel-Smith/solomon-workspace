# Plan Review — friday-retro.md

**Reviewer:** plan-review-loop (self-review by authoring LLM)
**Target score:** ≥ 90
**Max iterations:** 3
**Iterations used:** 2
**Final result:** **96/100 — Excellent**

---

## Review Iteration 1/3

### Issues Found: 5 (3 critical, 2 warning)

- **[CRIT-001]** Step 7's "Fetch the current contents of the target file via the Routine's repo access (clone or read)" is too loose — leaves repo resolution ambiguous. Different target paths map to different repos (workspace `CLAUDE.md` → solomon-workspace; `.claude/skills/*` → solomon-workspace via symlink; `solomon/CLAUDE.md` → solomon repo). Autonomous Claude may pick the wrong repo and produce a diff against stale content. → Fix: explicit repo-resolution rule per target path prefix.
- **[CRIT-002]** Step 7 specifies `git apply --check` for diff validation, but Anthropic-cloud Routines may not have shell access (tool availability depends on Routine config). If shell unavailable, validation silently degrades. → Fix: defensive "if shell available use git apply --check; else do logical check — read target file + verify line numbers in diff exist."
- **[CRIT-003]** Session constraint reads: `"If <3 learnings captured: post 'quiet week' + 3 Kata reflection prompts instead of forced promotions."` But the iter-1 draft has the Kata thread always firing with 4 prompts in both modes — that's a constraint mismatch. Correct reading: quiet-week mode body = 3 Kata prompts (no thread reply); normal mode = promotions in body + 4-prompt Kata in thread reply. → Fix: differentiate Kata template + dispatch by mode.
- **[WARN-001]** Step 5 `target_type_hint` rule says "≥ 50% of members" — ambiguous when only 3 members exist (50% of 3 = 1.5, ambiguity on whether 2 satisfies). → Recommendation: add explicit "≥ 2 members AND ≥ 50%" floor.
- **[WARN-002]** Block Kit `value` field is described as `"<JSON-encoded {...}>"` — but a JSON string value containing JSON requires escape handling that autonomous Claude may miss. → Recommendation: explicit "JSON-string, escaped" note with `\"` examples.

### Applied Fixes

(deferred to iteration 2)

### Quality Score: 92

Structural: 95/100 | Technical: 90/100 | Implementation: 88/100 | Constraint adherence: 92/100 | Self-containment: 100/100

Combined (weighted: structural 25% / technical 25% / implementation 25% / constraint 15% / self-containment 10%):
25 × 0.95 + 25 × 0.90 + 25 × 0.88 + 15 × 0.92 + 10 × 1.00 = **92**

### Decision: CONTINUE

Score ≥ 90 but 3 CRITICAL issues remain. Per `plan-review-loop` terminal conditions, both "zero CRITICAL" AND "quality ≥ 90" required. Iterating.

---

## Review Iteration 2/3

### Issues Found: 0 critical, 0 warning

All 5 issues from iteration 1 resolved.

### Applied Fixes

- [CRIT-001] ✅ Step 7 now explicit: `solomon-workspace/CLAUDE.md` → solomon-workspace repo; `solomon/CLAUDE.md` → solomon; `hfs-aiops/CLAUDE.md` → hfs-aiops; `.claude/skills|commands|agents/*` → default to solomon-workspace (the `.claude/` is symlinked from there). Only the 3 repos in this Routine's `repos` config are clone-able.
- [CRIT-002] ✅ Step 7 now has fallback validation: "if shell access is available, run `git apply --check`. If not (Anthropic cloud Routine context), do a logical check: confirm every `@@ -X,Y` line range exists in the current file and the context lines match." This handles both Anthropic-cloud and Local Routine execution modes.
- [CRIT-003] ✅ Output Format §4 now differentiates Kata by mode:
  - Quiet-week mode: 3 Kata prompts as the main message body (Target / Actual / Next experiment) — skip "Obstacles" since there's no obstacle to address from a quiet week.
  - Normal mode: 4-prompt Kata as a thread reply (Target / Actual / Obstacles / Next experiment).
  Dispatch §5 Call 2 explicitly notes "normal mode only; skip in quiet-week mode."
- [WARN-001] ✅ `target_type_hint` rule tightened to `"≥ 2 members AND ≥ 50% members + valid → use the hint"`.
- [WARN-002] ✅ Block Kit `value` field now shows escaped JSON-string example with `\"` quotes.

### Quality Score: 96

Structural: 95/100 (unchanged) | Technical: 96/100 (+6 from CRIT-001 + CRIT-002) | Implementation: 96/100 (+8 from CRIT-003 + WARN-001 + WARN-002) | Constraint adherence: 97/100 (+5 from CRIT-003 exact-match to constraint) | Self-containment: 100/100 (unchanged)

Combined: 25 × 0.95 + 25 × 0.96 + 25 × 0.96 + 15 × 0.97 + 10 × 1.00 = **96.3 → 96**

### Decision: COMPLETE

Both terminal conditions met:
- ✅ Zero CRITICAL issues
- ✅ Quality score ≥ 90 (actual: 96)

Loop terminated after 2 iterations (target met before max=3).

---

## Final Assessment

**Score:** 96/100 — **Excellent** (per skill rubric: ≥ 90 ready for production).

**Strengths:**
- Authentication failure is highest-priority Safety branch with explicit Slack-only single-line dispatch (per `pattern_routine_samson_auth_failure` memory).
- Jaccard 0.85 clustering with explicit stopwords (consistent with daily-news-sweep and daily-solomon-standup per `pattern_autonomous_dedup_jaccard`).
- 3-tier cost budget at retro-specific levels (80K/120K/250K) reflecting heavier diff-generation work (per `pattern_routine_cost_budget_three_tier`).
- target_type heuristic mapping covers all 4 valid types + default fallback, with first-match-wins ordering.
- Mode-differentiated Kata template (3 quiet-week / 4 normal) matches the session constraint exactly.
- Diff validation has shell + logical fallback for Routine-context portability.
- Block Kit `value` field documented with escape handling so BE-06's webhook can parse promotion IDs on click.

**Residual risks (not blockers):**
- The Samson `/cadence/learnings?queued_for_week=...` endpoint is **NEW** per plan §4.3 — won't exist until BE-08 ships. This Routine prompt is correct in calling it; smoke test will hit Safety §6 auth/404 path until that endpoint lands.
- BE-06's apply-worker webhook handler must match the `value` JSON shape exactly (`promotion_local_id`, `target_type`, `target_path`, `source_learning_ids`). Contract drift between this Routine and BE-06 would silently break promotion flows. Worth verifying when BE-06 is authored.
- Diff staleness: if a learning was captured Monday and a relevant CLAUDE.md edit landed Tuesday, the Friday retro's diff might already be applied. The Mem0 dedup step (§3 step 6) helps but isn't airtight. Acceptable; revisit after ≥ 4 retros.

**Smoke test (task 3) — user-side action required:**
Until BE-08 ships the `/cadence/learnings` endpoint and BE-06 ships the apply-worker, full smoke test isn't possible. **Partial smoke test now feasible:**
1. Create one-off Routine in Anthropic UI with this prompt + connectors `{slack, mem0}` + secret `SAMSON_INTERNAL_TOKEN` + repos `{solomon, hfs-aiops, solomon-workspace}`.
2. "Run now" — Samson API will 401/404 (endpoint doesn't exist yet).
3. Verify Safety §6 auth-failure path: single line posted to Slack `#dev-retro`, no Block Kit blocks, no Kata thread.
4. Total tokens < 80K.

Full smoke test (with live API + apply-worker) deferred until BE-08 and BE-06 land.
