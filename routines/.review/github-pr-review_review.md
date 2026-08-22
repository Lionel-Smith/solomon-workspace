# Plan Review — github-pr-review.md

**Reviewer:** plan-review-loop (self-review by authoring LLM)
**Target score:** ≥ 90
**Max iterations:** 3
**Iterations used:** 2
**Final result:** **96/100 — Excellent**

---

## Review Iteration 1/3

### Issues Found: 0 critical, 3 warning

- **[WARN-001]** section 3 step 5 mentioned "bare `assert`s in production code" — but "production code" is loose. Different cloud-Claude instances might interpret as "main branch" or "non-debug" — neither matches the intent. → Recommendation: clarify "outside `tests/` directories (asserts strip under `python -O`)."
- **[WARN-002]** section 3 step 2 skip-trivial regex covered docs/, .md, .github/, CHANGELOG, LICENSE — but conspicuously NOT dependency files. A PR that only touches `requirements.txt` (e.g., bumping httpx version) shouldn't skip review — version bumps often carry infra implications. → Recommendation: tighten the allowlist to documented-doc-paths only and explicitly note dependency files are NOT skip-eligible.
- **[WARN-003]** section 5 Call 1 hardcoded `side: "RIGHT"` for all line-specific comments. Most findings are on added/context lines (correctly RIGHT), but findings on deleted lines need `side: "LEFT"`. → Recommendation: add inline note explaining the side decision per finding.

### Applied Fixes

(deferred to iteration 2)

### Quality Score: 95

Structural: 95/100 | Technical: 93/100 | Implementation: 95/100 | Constraint adherence: 96/100 | Self-containment: 100/100

Combined: 25 × 0.95 + 25 × 0.93 + 25 × 0.95 + 15 × 0.96 + 10 × 1.00 = **95.15 → 95**

### Decision: ITERATE for polish

Both terminal conditions met (zero criticals + score ≥ 90), and the multi-session-dependent mandate does NOT apply (3 downstream consumers BE-08 + BE-09 + BE-11, not "more than 3"). But applying iter 2 lightly to clear the 3 WARN findings for cumulative pattern-library hygiene.

---

## Review Iteration 2/3

### Issues Found: 0 critical, 0 warning

All 3 warnings from iteration 1 resolved.

### Applied Fixes

- [WARN-001] ✅ section 3 step 5 clarified: "bare `assert` statements in files outside `tests/` directories (asserts strip under `python -O`)." Provides both the directory boundary AND the rationale so cloud-Claude understands why the rule exists.
- [WARN-002] ✅ section 3 step 2 skip-trivial regex tightened to `^(docs?/|.*\.md$|\.github/|CHANGELOG[^/]*$|LICENSE[^/]*$|README[^/]*$)$` and explicit note added: "dependency files (`requirements.txt`, `pyproject.toml`, `package.json`) are NOT in this allowlist; they often carry infra changes that deserve review."
- [WARN-003] ✅ section 5 Call 1 `comments[]` extended with inline comment: "For findings on deleted lines (rare — usually a finding is about a removed-but-needed line), use side: 'LEFT' and reference the base-side line number instead of head-side. Most findings target added/context lines → side: 'RIGHT' is the default."

### Quality Score: 96

Structural: 95/100 (unchanged) | Technical: 96/100 (+3 from WARN-002 + WARN-003) | Implementation: 96/100 (+1 from WARN-001 explicit production-code rule) | Constraint adherence: 96/100 (unchanged) | Self-containment: 100/100 (unchanged)

Combined: 25 × 0.95 + 25 × 0.96 + 25 × 0.96 + 15 × 0.96 + 10 × 1.00 = **96.15 → 96**

### Decision: COMPLETE

Both terminal conditions met:
- ✅ Zero CRITICAL issues
- ✅ Quality score ≥ 90 (actual: 96)

---

## Final Assessment

**Score:** 96/100 — **Excellent** (per skill rubric: ≥ 90 ready for production).

**Strengths:**
- First GitHub-event-triggered Routine — fully Samson-independent at runtime (event payload carries all context). The Anthropic GitHub App handles the event-to-Routine bridge.
- Two-channel dispatch correctly placed: GitHub (primary, where the PR author reviews) + Slack `#cadence-status` (secondary, for Lionel's audit-trail glance).
- Skip-trivial heuristic with explicit allowlist + dependency-file carve-out. Catches doc PRs without skipping infra PRs disguised as small changes.
- Severity rubric maps to action: HIGH = forbidden pattern (worth blocking conceptually), MEDIUM = constraint violation (worth discussing), LOW = style nit (`_(optional reads)_` qualifier signals lower urgency).
- Repo-specific constraint loading: reads the target repo's CLAUDE.md so review constraints match repo conventions. HFS defaults fallback if CLAUDE.md missing.
- Comment-only stance enforced in section 5 Call 1 (`event: "COMMENT"`) + section 6 Never list. The merge decision stays with humans by design.
- Same-head_sha dedup rule (section 6 Never list) prevents wasted re-runs on PR synchronize-with-no-diff-change events.
- `[skip-cadence-review]` title flag gives the PR author an opt-out without bot-config changes.

**Residual risks (not blockers):**
- GitHub line-specific comments occasionally fail if the line is part of a context window that's outside the diff or if GitHub's API rejects the position. The `else: include in summary review comment` fallback handles this, but worth verifying the fallback fires correctly on the first real PR review.
- The HFS-default forbidden-pattern set (when target repo has no CLAUDE.md) is general — won't catch repo-specific anti-patterns. Acceptable; the per-repo CLAUDE.md is the right place to encode specifics. Each repo should have a CLAUDE.md (most already do).
- Daily-slot warning at 4/5 doesn't actively skip any PR review — the 5th still fires. The 6th PR on a single day would simply not trigger the Routine (Anthropic's cap), creating silent gaps. Worth a Sunday-meta-reporter signal "today exhausted PR-review slots — N PRs un-reviewed."
- LOW-severity findings could be noisy. Worth a 30-day review of false-positive rate; if >40%, raise the LOW threshold or remove the section entirely.

**Smoke test (task 3) — partial available, full deferred until BE-08 ships:**

This Routine can be tested against a real PR today since it has no Samson runtime dependency. Until BE-08 ships, findings won't persist into `cadence_events` and the meta-notif Slack post won't be correlated with a `cadence_routine_runs` row.

**Partial test now:**
1. Create one-off Routine in Anthropic UI with connectors `{github, slack}` + repos: all 8 OQ-10 repos.
2. Trigger via opening a small test PR on `solomon-workspace`.
3. Verify Routine fires within ~30 seconds of PR open.
4. Verify: GitHub review posted with `event=COMMENT`, no `APPROVE` or `REQUEST_CHANGES`; line-specific comments appear where applicable; summary body shows severity-grouped findings.
5. Verify Slack `#cadence-status` receives one-line meta-notif with PR link + finding count.
6. Total tokens < 30K.

Full smoke test (with BE-08 ingestion + drift tracking) deferred.

Recommended test sequence: try (a) trivial PR (docs-only, 5 lines — verify auto-skip), (b) small PR with 1 forbidden pattern intentionally (verify HIGH finding catch), (c) PR with `[skip-cadence-review]` title flag (verify opt-out).
