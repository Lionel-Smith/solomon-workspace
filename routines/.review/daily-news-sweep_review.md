# Plan Review — daily-news-sweep.md

**Reviewer:** plan-review-loop (self-review by authoring LLM)
**Target score:** ≥ 90
**Max iterations:** 3
**Iterations used:** 2
**Final result:** **96/100 — Excellent**

---

## Review Iteration 1/3

### Issues Found: 6 (2 critical, 4 warning)

- **[CRIT-001]** Date format placeholders (`{{ weekday_long }}` etc.) lack explicit timezone + format instruction. Anthropic-cloud Claude may render UTC instead of America/Nassau, breaking the "must be ready by 06:55 NAS" guarantee in section 1. → Fix: explicit "Use America/Nassau local time, format `Weekday, Month D, YYYY`."
- **[CRIT-002]** section 3 step 4 uses "char-trigram cosine" as the dedup algorithm — too underspecified for autonomous execution. Different implementations of cosine on character trigrams produce different similarity scores, especially for short titles. → Fix: switch to lowercase-word-Jaccard with explicit stopword list and the same 0.85 threshold.
- **[WARN-001]** section 3 step 7 reads "format and dispatch per sections 4 and 5" — two distinct actions collapsed into one step. Implementation clarity benefits from splitting. → Recommendation: split into step 7 (format) + step 8 (dispatch).
- **[WARN-002]** section 4 stale suffix `(stale, {{ N }}d)` — N undefined as integer days-since-publication. → Recommendation: explicit `N = floor((now - published_at).total_seconds() / 86400)`.
- **[WARN-003]** section 3 step 5 govtech / Bahamas / Caribbean tags can compound (+6 or +9 for a single article). Intentional but unstated; a reviewer would assume bug. → Recommendation: one-line "tags compound intentionally" note.
- **[WARN-004]** section 6 soft-warning template `{{ N }}K` — rounding semantics not specified. → Recommendation: explicit `N = round(total_tokens / 1000)`.

### Applied Fixes

(deferred to iteration 2)

### Quality Score: 91.5

Structural: 95/100 | Technical: 88/100 | Implementation: 86/100 | Constraint adherence: 95/100 | Self-containment: 100/100

Combined (weighted: structural 25% / technical 25% / implementation 25% / constraint 15% / self-containment 10%):
25 × 0.95 + 25 × 0.88 + 25 × 0.86 + 15 × 0.95 + 10 × 1.00 = **91.5**

### Decision: CONTINUE

Score ≥ 90 but 2 CRITICAL issues remain. Per `plan-review-loop` terminal conditions, the loop stops on "zero CRITICAL issues" AND "quality ≥ 90." Both required. Iterating.

---

## Review Iteration 2/3

### Issues Found: 0 critical, 0 warning

All 6 issues from iteration 1 resolved.

### Applied Fixes

- [CRIT-001] ✅ Date header now explicitly: "America/Nassau local time formatted as `Weekday, Month D, YYYY` — e.g., `Tuesday, May 26, 2026`. Do NOT use UTC. Do NOT zero-pad the day."
- [CRIT-002] ✅ Dedup algorithm switched to lowercase-word-Jaccard with explicit stopword list (`the / a / an / of / and / or / to / for / in / on / with`), formula `|A ∩ B| / |A ∪ B| ≥ 0.85`, keep earlier-listed source.
- [WARN-001] ✅ Step 7 split into 7 (format) + 8 (dispatch), each with concrete sub-section pointer.
- [WARN-002] ✅ Stale suffix N defined as `floor((now - published_at).total_seconds() / 86400)`.
- [WARN-003] ✅ Govtech tag note added: "tags compound intentionally, so an article tagged with two of these gets +6."
- [WARN-004] ✅ Soft warning N defined as `round(total_tokens / 1000)`.

### Quality Score: 96

Structural: 95/100 (unchanged — sections same) | Technical: 96/100 (+8 from CRIT-002 + WARN-002 + WARN-004) | Implementation: 95/100 (+9 from CRIT-001 + WARN-001 + WARN-003) | Constraint adherence: 96/100 (+1, slight improvement from clearer date/dedup) | Self-containment: 100/100 (unchanged — no external refs)

Combined (weighted: structural 25% / technical 25% / implementation 25% / constraint 15% / self-containment 10%):
25 × 0.95 + 25 × 0.96 + 25 × 0.95 + 15 × 0.96 + 10 × 1.00 = **95.9 → 96**

### Decision: COMPLETE

Both terminal conditions met:
- ✅ Zero CRITICAL issues
- ✅ Quality score ≥ 90 (actual: 96)

Loop terminated after 2 iterations (target met before max=3).

---

## Final Assessment

**Score:** 96/100 — **Excellent** (per skill rubric: ≥ 90 ready for production).

**Strengths:**
- Self-contained: every URL, threshold, payload, and failure mode is in the file itself; no "see plan section X" references.
- Connector payloads named with exact field shape so BE-08 ingestion can parse without ambiguity.
- 7-bullet ceiling + Jaccard dedup + citation-link-only rules enforce the session's "critical" constraints structurally.
- WhatsApp dispatch fallback (per OQ-04) embedded inline so a missing connector at runtime doesn't break the Routine.
- Three-tier cost budget (target / soft / hard) with explicit rounding and dispatch behavior on overrun.

**Residual risks (not blockers):**
- The Jaccard threshold (0.85) is a guess. After ≥ 30 days of real runs, review `cadence_news_digests` for false-positive dedups and tune.
- The relevance tag scoring (`govtech:+3`, `AI agents:+3`) reflects Lionel's current priorities. If priorities shift, edit step 5 — no schema change.
- The "tags compound intentionally" rule means a single article about "Bahamian AI agents for govtech" could score +9 and crowd out a +6 article. Acceptable for v1; revisit if observed.

**Smoke test (task 3) — user-side action required:**
Create a one-off Routine in Anthropic UI (claude.ai/code/routines) with this prompt + the connectors {slack, whatsapp, firecrawl}. "Run now" and verify:
1. Output matches section 4 markdown shape (1 title line + 5-7 bullets, no emojis, no color refs).
2. Slack #dev-news receives the digest.
3. WhatsApp delivery succeeds OR the OQ-04 fallback note appears in `output_artifacts.notes`.
4. `output_artifacts.connector_calls` has both Slack + WhatsApp entries (or just Slack if WhatsApp connector unavailable).
5. Total token usage < 50K (target met).
