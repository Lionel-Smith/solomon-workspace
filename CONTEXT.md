# Solomon Workflow Domain

The language of Solomon's workflow companion: how review findings are produced, verified, and used to terminate review loops, and how skills are layered and promoted. Spans the serial reviewer path, the plan-review-panel workflow (WFI), and the 3-layer skill stack.

## Language — Review

**Finding**:
A single defect claim a reviewer asserts against a document, carrying a Severity and an anchoring quote.
_Avoid_: issue, comment, note

**Severity**:
The reviewer-assigned weight of a Finding: CRIT, WARN, or SUGG. Assigned at review time, before any verification.
_Avoid_: priority, score

**Raw Finding**:
A Finding as first reported, not yet examined by a Verifier. The serial path only ever has Raw Findings.

**Verdict**:
The result of adversarial verification of a Finding: CONFIRMED (survived refutation) or PLAUSIBLE (downgraded, with a quoted refutation). Verdicts exist only on the panel path; a Verdict never deletes a Finding.
_Avoid_: status, validation

**Reviewer**:
An agent that reads a document against one checklist family and reports Findings. Never verifies its own Findings.

**Verifier**:
A fresh-context agent that attempts to refute exactly one Finding and issues its Verdict. Never authors Findings.

**Panel**:
The plan-review-panel workflow run: parallel Reviewers, then Verifiers, then a single report writer.
_Avoid_: multi-agent review, workflow review (say which workflow)

**Serial review**:
The single-reviewer fallback loop in review.md — no Verifiers, so it produces only Raw Findings.
_Avoid_: fallback review, legacy review

**Trigger class**:
One of four document properties (infrastructure change, production data operation, >3 dependent sessions, content migration) that makes a document eligible for the Panel. Classified per review by model judgment with a recorded one-line justification; deterministic signals may only escalate a document into a Trigger class, never suppress one (ruled 2026-07-18). User flags `--panel`/`--no-panel` override the classification.
_Avoid_: mandatory-2-pass doc, complex doc

**Delta iteration**:
A Panel re-run after fixes were applied: one Verifier per previously-CONFIRMED CRIT confirms its fix landed, plus a single fresh Reviewer scanning the changed sections for regressions. Activated by passing prior findings to the Panel; a Panel without prior findings is a full run (ruled 2026-07-18). The 800k ceiling governs the full run; delta iterations are expected at ~150-250k.
_Avoid_: re-review, second pass

**Termination predicate**:
The condition that ends a review loop early. Panel path: zero CONFIRMED CRIT Findings. Serial path: zero CRIT-severity Raw Findings (severity-existence split — ruled 2026-07-18). Both paths also stop at iteration >= 3. A predicate must only reference vocabulary its own path can produce.
_Avoid_: quality score, score >= 90

## Language — Skill layers

**Canonical skill**:
A skill whose source of truth is `hfs-development-kit/skills/`. All edits land there and sync downward.

**Runtime-local skill**:
A skill present only in `~/.claude/skills/`, with no canonical copy. A transitional state — each one is either promoted or declared Personal.

**Personal skill**:
A runtime-local skill deliberately excluded from canonical, named in the lint exclusion config with a reason.
_Avoid_: out-of-band skill, local skill

**Portability test**:
The promotion rule (ruled 2026-07-18): promote iff a second HFS workspace could plausibly consume the skill as-is — no user-specific paths, accounts, or content. Skills touching HFS infrastructure always promote; single-consumer promotions carry the "young" marker.

**Young skill**:
A promoted skill with only one real consumer so far — usable, but its interface is not yet validated by a second consumer.
