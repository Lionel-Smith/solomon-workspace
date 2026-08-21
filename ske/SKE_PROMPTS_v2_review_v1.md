# SKE_PROMPTS_v2 Review Report (v1)

**Document:** /Users/lionel/Documents/GitHub/solomon-workspace/ske/SKE_PROMPTS_v2.md  
**Review Mode:** Full Panel Review  
**Date:** 2026-08-20

---

## Confirmed Findings

### CRITICAL

**TECHNICAL-02: SKE-11 dependencies missing SKE-01/SKE-02**  
SKE-11 only declares `<requires>SKE-04</requires>`, but its tasks diff against `skills_inventory.json` fields (coverage, name_collisions, description_chars) introduced by SKE-01 and populated to 44/44 by SKE-02, violating the document's own stated rule that dependency edges are 'true data-flow claims only' (line 6). The true data-flow dependency on SKE-01/SKE-02 is missing from the DAG.

> Evidence: `<requires status="pending">SKE-04</requires>`

**INFRAGATES-01: SKE-R-04 fixture dependency on SKE-R-01 missing**  
SKE-R-04 consumes a test fixture that SKE-R-01 creates, but its `<dependencies>` block only lists SKE-R-03. The true data-flow dependency on SKE-R-01 is missing from the executable graph.

> Evidence: "The round-trip fixture at tests/fixtures/skill_sections/ is shared with SKE-R-04 - create it here if absent; do not change its format contract unilaterally. ... Depends on SKE-R-03: the corpus test iterates devkit after the _meta relocation, and the index gate assumes the two-root registration. ... `<dependencies><requires status="pending">SKE-R-03</requires></dependencies>`"

**INFRAGATES-02: SKE-R-07 lacks backup before destructive overwrites**  
SKE-R-07's user-executed step overwrites live files in `~/.claude/commands/` with no backup step, unlike the sibling destructive-op session SKE-R-06 which explicitly backs up before its purge.

> Evidence: "Task 6 (USER): cp each promoted+edited file over its ~/.claude/commands/ counterpart - hand the exact commands to Lionel and stop"

### WARNING

**STRUCTURAL-01: Task numbering mismatch in SKE-R-07**  
Task titles reference 'Task 0' and 'Task 6' but the actual `<task id>` attributes in this session are only 1-4, so the labels don't match the session's own numbering and could mislead a reader about how many steps exist or which step is the user-handoff step.

> Evidence: "`<task id="1" action="CREATE"><title>Task 0 (D13): copy plan.md, session.md, preflight.md, review.md from ~/.claude/commands/ into hfs-development-kit/claude-config/commands/ verbatim (promotion commit, no content edits)</title></task> ... <task id="4" action="RUN"><title>Task 6 (USER): cp each promoted+edited file over its ~/.claude/commands/ counterpart - hand the exact commands to Lionel and stop</title>`"

**TECHNICAL-03: Unresolved assumption in SKE-06b task 2**  
A task title in an implementation-prompts document contains an unresolved question mark instead of a concrete instruction, indicating the root-cause/scope of the parser change was not verified before the session was written (Problem Analysis: 'have we verified assumptions about root cause?').

> Evidence: "Accept the v1.12 additive elements (ignore-unknown already? verify; add explicit parse only where needed)"

**TECHNICAL-04: Undefined stability threshold in SKE-13**  
SKE-13's critical constraint gates the entire session on the SKE-11 baseline being 'stable' but never defines a quantified stability threshold, unlike SKE-12 which explicitly quantifies its alert threshold (>5 pts), leaving the `gate_class="machine"`-adjacent condition check unverifiable/ambiguous.

> Evidence: "Condition gate at run start: if the SKE-11 baseline is NOT stable (any post-SKE-11 eval run regressed), complete this session as a documented no-op"

**INFRAGATES-03: SKE-05/SKE-11 missing SKE-02 dependency**  
SKE-05's review-artifact generation and SKE-11's disclosure refactor both operate on the skill corpus 'post-disposition' (the state SKE-02 establishes), but neither lists SKE-02 as a `<requires>` edge — only wave ordering, not the dependency graph, currently enforces the order.

> Evidence: "Run against every canonical devkit skill post-disposition; commit artifacts to hfs-development-kit/reviews/ ... `<dependencies><requires status="pending">SKE-04</requires></dependencies>`"

**INFRAGATES-04: SKE-R-04 verification lacks SKILLS_DIR export**  
SKE-R-03 (a declared dependency of SKE-R-04) removes the SKILLS_DIR default and makes it fail loudly if unset, yet SKE-R-04's own verification commands (tests_pass, corpus_yield, pattern_floor) invoke pytest without setting SKILLS_DIR, while SKE-R-03's checks explicitly export it.

> Evidence: "`<check name="tests_pass" gate_class="machine" command=".venv/bin/python -m pytest tests/test_skills_server.py tests/test_ret_encoding.py -q">exit 0</check>`"

---

## Downgraded to Plausible

**TECHNICAL-01: Orphan baseline reference '3726824f-lineage'**  
SKE-11 verification references a '3726824f-lineage baseline' for skills_inventory.json that no session in the document establishes, creating an orphan reference the machine gate cannot resolve.

> **Refutation:** "Canonical baseline for this run: `skills_inventory.json` sha256 `3726824f277dd063…` (pyyaml backend, 658,933 bytes)."

---

## Suggestions

**TECHNICAL-05: SKE-05 gate checks stale count**  
SKE-05 runs after SKE-02 (wave1) raises org-authored skill count to 44/44, but its gate still checks against the pre-disposition count of 43, an imprecise but non-blocking mismatch (44 also satisfies '>= 43').

> Evidence: "`test $(ls hfs-development-kit/reviews/*.md | wc -l) -ge 43 &&amp; echo ok`—one artifact per canonical skill"

---

## Counts

**confirmed_crit=3 | confirmed_warn=5 | plausible=1 | suggestions=1**
