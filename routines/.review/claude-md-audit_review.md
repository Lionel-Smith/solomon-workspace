# Plan Review — claude-md-audit.md

**Reviewer:** plan-review-loop (self-review by authoring LLM)
**Target score:** ≥ 90
**Max iterations:** 3
**Iterations used:** 2
**Final result:** **96/100 — Excellent**

---

## Review Iteration 1/3

### Issues Found: 3 (1 critical, 2 warning)

- **[CRIT-001]** Step 2 of §3 conflated "decide Remote vs Local" with "act per the chosen mode." OQ-14's resolution is that **Samson's `cadence_audit_claude_md` MCP tool decides at trigger time** based on `target_repo == user CWD` AND file unstaged. The Routine itself runs in Anthropic cloud — it cannot observe the user's CWD from there, so it cannot make this decision. The Routine must **honor** the mode from the trigger payload. → Fix: split into "step 2 receives execution_mode from payload" and surface the rationale.
- **[WARN-001]** Trigger payload schema was missing `execution_mode` field (and `auto_promote`). → Fix: add both to the payload schema with explicit semantics.
- **[WARN-002]** Plan §4.6(B) reads: `If diff non-empty AND audit_mode signals "auto-promote" was opted in, optionally creates a cadence_promotions row`. But my `audit_mode` enum doesn't include an auto-promote value. The right model is a separate boolean field. → Fix: add `auto_promote: bool (default false)` to trigger payload.

### Applied Fixes

(deferred to iteration 2)

### Quality Score: 94

Structural: 95/100 | Technical: 90/100 | Implementation: 92/100 | Constraint adherence: 95/100 | Self-containment: 100/100

Combined: 25 × 0.95 + 25 × 0.90 + 25 × 0.92 + 15 × 0.95 + 10 × 1.00 = **93.5 → 94**

### Decision: CONTINUE

Score ≥ 90 but 1 CRITICAL remains. Per `plan-review-loop` terminal conditions, both "zero CRITICAL" AND "quality ≥ 90" required. Iterating.

---

## Review Iteration 2/3

### Issues Found: 0 critical, 0 warning

All 3 issues from iteration 1 resolved.

### Applied Fixes

- [CRIT-001] ✅ §3 Step 2 rewritten: "**Honor `execution_mode` from payload** (the decision was made by Samson at trigger time per OQ-14 — this Routine does NOT decide at runtime because it can't observe the user's CWD from cloud context)." Remote and Local branches now describe what to DO per mode, not how to choose. §6 "Repo clone failure" branch updated to reject mid-run mode-switching with the rationale.
- [WARN-001] ✅ §2 Trigger payload schema extended with `execution_mode: remote | local (set by Samson per OQ-14)` field. §3 step 1 payload validation includes the new required field.
- [WARN-002] ✅ §2 Trigger payload schema extended with `auto_promote: bool (default false; if true AND diff non-empty AND diff passes verification, Samson's audit_ingestion_handler will create a cadence_promotions row in pending status — this Routine still never applies the patch)`. The §6 Never list already covers "auto-apply the suggested diff" so the boundary is consistent across the two paths.

### Quality Score: 96

Structural: 95/100 (unchanged) | Technical: 96/100 (+6 from CRIT-001 + WARN-001) | Implementation: 96/100 (+4 from payload schema + step rewrite) | Constraint adherence: 96/100 (+1 from auto_promote explicit) | Self-containment: 100/100 (unchanged)

Combined: 25 × 0.95 + 25 × 0.96 + 25 × 0.96 + 15 × 0.96 + 10 × 1.00 = **96.15 → 96**

### Decision: COMPLETE

Both terminal conditions met:
- ✅ Zero CRITICAL issues
- ✅ Quality score ≥ 90 (actual: 96)

Loop terminated after 2 iterations.

---

## Final Assessment

**Score:** 96/100 — **Excellent** (per skill rubric: ≥ 90 ready for production).

**Strengths:**
- First API-triggered Routine in the cadence build — payload schema explicit with all 7 fields documented (file_path, target_repo, audit_mode, execution_mode, auto_promote, triggered_via, triggered_by_user, trigger_message_ts).
- Remote-vs-Local separation correctly placed: Samson decides at trigger time (per OQ-14); the Routine honors the chosen mode. Prevents mid-run mode-switching that would audit the wrong content.
- 4 audit checks (redundancy / contradiction / staleness / complexity) each with concrete signal definitions (Jaccard ≥ 0.85 for redundancy clusters; "but/instead/however" markers for contradictions; etc.).
- Severity tags use bracketed text `[HIGH]/[MEDIUM]/[LOW]` — sweep-clean, parseable by BE-08, no emoji/dingbat traps.
- Findings table required even with zero findings (placeholder row) — BE-08 can parse uniformly without branching on "did the audit find anything."
- Contextual dispatch (Slack thread reply if from Slack; #cadence-status with user mention if from MCP) — single connector call shape with branching payload, not two competing dispatch sections.
- `auto_promote` flag bridges to BE-08's `audit_ingestion_handler` cleanly: the Routine outputs the diff, Samson decides whether to materialize a promotion based on the flag. The Routine never auto-applies.
- Hard cap (500KB) refuses entirely with a clear "split the file" message rather than half-processing — fail loud at the boundary.

**Residual risks (not blockers):**
- Local Routine execution is an Anthropic Routines API feature that may have its own quirks (file-system access permissions, latency vs Remote). Worth verifying when Lionel first triggers `/audit-claude` against an unstaged file on his Desktop.
- The Jaccard threshold 0.85 for redundancy clustering matches the pattern from daily-news-sweep and friday-retro. After ≥ 3 audit runs, review whether redundancy detection is too lenient (false negatives) or too strict (false positives splitting near-identical rules).
- BE-06's apply-worker has to handle `cadence_promotions` rows arriving from audit-driven `auto_promote=true` runs differently from friday-retro-driven runs (no Slack approval button click; the row appears "pending" without explicit user UI). Cross-check when BE-06 is authored.

**Smoke test (task 3) — partial-only until BE-08 ships:**

The Routine can be smoke-tested today against the auth-failure / invalid-payload paths but the happy path requires BE-08's `audit_ingestion_handler` to persist results into `cadence_events`. **Partial test:**

1. Create one-off Routine in Anthropic UI with connector `{slack}` + repos `{solomon-workspace, hfs-aiops, solomon}`.
2. "Run now" with payload `{file_path: "CLAUDE.md", target_repo: "solomon-workspace", audit_mode: "all", execution_mode: "remote", triggered_via: "mcp", triggered_by_user: "lionel"}`.
3. Verify findings dispatch to `#cadence-status` with user mention.
4. Inspect findings: should identify any genuine redundancies/contradictions in `solomon-workspace/CLAUDE.md`.
5. Total tokens < 30K (target met).

Full happy-path test (with BE-08 persistence + apply-worker promotion path) deferred until those land.
