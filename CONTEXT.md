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
An **org-authored** skill present only in `~/.claude/skills/`, with no canonical copy. A transitional state — each one is either promoted or declared Personal. A Vendored skill is never runtime-local, however it is surfaced.

**Vendored skill**:
A skill authored outside HFS and installed by an external installer that owns a lockfile — `~/.agents/.skill-lock.json` or `~/.claude/plugins/installed_plugins.json`. Never edited in place and never promoted; upgraded by re-install. Its content can change without an HFS commit.
_Avoid_: third-party skill, external skill, upstream skill

**Org-authored skill**:
A skill HFS wrote and can change: every Canonical skill, plus Runtime-local and Personal ones. The population the reachability and conformance gates apply to.
_Avoid_: our skill, first-party skill, internal skill

**Skills index**:
The always-rendered list of Org-authored skills, closing with a pointer to search for Vendored ones. Deliberately narrower than the set a skill search can reach, because it is paid for in every session.
_Avoid_: skill list, catalog, registry

**Wrapper skill**:
An Org-authored skill that loads one Vendored skill and adds HFS-specific rules on top. The HFS half is edited normally; the vendored half only changes by re-install.
_Avoid_: fork, enriched copy

**Upstream pin**:
The lockfile hash a Wrapper skill records as the vendored content it was validated against. Report-only: drift from the live lockfile explains eval movement but never fails a gate. Bumped deliberately when upstream is re-installed.
_Avoid_: version lock, dependency freeze

**Qualified skill reference**:
A root-prefixed skill name (`devkit:code-review`, `agents:code-review`). Bare names resolve only while unique across roots; a collision is refused loudly (`AMBIGUOUS_SKILL`, both qualified names listed), never resolved by root order. Wrapper skills always reference their vendored target in qualified form.
_Avoid_: namespaced skill, full path

**Measured score**:
A skill-reviewer score on the /100 scale, only reachable when the skill has evals and the measured-behaviour category ran. The sole scale a ≥90 gate may reference.

**Unmeasured score**:
A rubric-only skill-reviewer result, reported as x/80 with an explicit UNMEASURED marker — a paper grade and a work queue entry, never a quality verdict. Visually distinct from a Measured score so the two cannot be conflated downstream.
_Avoid_: capped score, provisional score

**Eval baseline**:
The triple a skill-eval run is compared against: the case set, the hash of the rendered Skills index, and the Upstream pins in force. Asserted at eval start, so any metric movement attributes to exactly one of skill drift, environment drift, or upstream drift.
_Avoid_: baseline score, golden run

**Dependency edge**:
A `<requires>` claim in a PROMPTS DAG asserting data flow: the later session reads something the earlier one produces. Never a suggested reading order — the governor executes declared edges, so a false edge converts one stalled session into a stalled wave.
_Avoid_: sequencing, ordering

**Skill-section format**:
The corpus's own convention, specified once in SKILL_FORMAT: `## Constraints` with `### Critical` / `### High Priority` / `### Medium Priority` bullets (the subhead carries the priority), and `## Forbidden Patterns` as a `| Pattern | Reason |` table. Everything that reads or writes these sections cites the spec; a writer and reader pair is validated by a round-trip test, not by matching prose.
_Avoid_: bullet format, section schema

**Encoding commit**:
The single-file git commit an approved RET encoding lands as — `ret(<skill>): <entry title> [entry_id]` — made by `apply_encoding` itself. The entry is marked encoded only after the commit succeeds, and the write is refused if the target path is dirty. Provenance lives in git history; reverting the commit un-encodes cleanly.
_Avoid_: applied proposal, machine edit

**File-ownership list**:
The explicit set of paths a session in a parallel wave may write, declared in its PROMPTS entry. Lists in one wave are disjoint by construction, making the worktree merge trivial by design. A spec or shared file is owned by exactly one session — everyone else consumes it.
_Avoid_: scope, touched files

**Telemetry contract**:
The four rules any in-session telemetry hook obeys: local append only, unconditional exit 0 (a telemetry failure never becomes a session failure), single-digit-millisecond budget with no locks, and a path under `~/.claude/telemetry/`. A lost datapoint is acceptable; a stalled session is not.
_Avoid_: metrics hook, instrumentation

**Success claim**:
The one dated, falsifiable statement a feature stakes its thesis on, recorded in PROGRESS with both outcomes assigned meaning in advance — holding justifies the investment; failing triggers a named redirection, not a shrug. SKE's: within 60 days of Wave 1, ≥11 of the 22 dormant Org-authored skills record a load while eval'd precision/recall holds ≥0.9; failure fires the dormant-pruning trigger.
_Avoid_: KPI, north star, definition of done

**Personal skill**:
A runtime-local skill deliberately excluded from canonical, named in the lint exclusion config with a reason.
_Avoid_: out-of-band skill, local skill

**Portability test**:
The promotion rule (ruled 2026-07-18): promote iff a second HFS workspace could plausibly consume the skill as-is — no user-specific paths, accounts, or content. Skills touching HFS infrastructure always promote; single-consumer promotions carry the "young" marker.

**Young skill**:
A promoted skill with only one real consumer so far — usable, but its interface is not yet validated by a second consumer.
