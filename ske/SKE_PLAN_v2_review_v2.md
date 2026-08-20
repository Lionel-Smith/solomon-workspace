# SKE_PLAN_v2 Review v2

**Date:** 2026-08-20  
**Mode:** Full review  
**Reviewers:** Plan Review Panel (3-reviewer consensus)

---

## Confirmed Findings

### TECHNICAL-01 (WARN)
**Section:** Wave 4 DAG / SKE-R5  
**Claim:** The DAG asserts {07..10} → SKE-R5 as a true data-flow edge (per the plan's own Q7 discipline that DAG edges are data-flow claims, not reading order), but SKE-R5's session body never states what output from SKE-07..SKE-10 the section-sign sweep consumes — the sweep's stated inputs are CONSTITUTION, the v1.12 file (from SKE-06b), skill-creator/reviewer forbidden lists, and an estate-wide grep, none of which SKE-07..SKE-10 produce as a session artifact.

**Evidence Quote:**
> Wave 4: {07..10} → SKE-R5 ; SKE-04 → SKE-11 ; SKE-11 → SKE-12 → SKE-13(cond) → SKE-14

**Verdict:** CONFIRMED

---

### INFRAGATES-01 (WARN)
**Section:** Wave 4 / SKE-14  
**Claim:** SKE-14's skills_usage.py re-run is gated on a fixed calendar date (2026-09-01, Mem0 quota reset) with no deferral/fallback instruction, unlike the Success-claim clause in the same session which explicitly handles the not-yet-due case; given the plan's own ~20-24h/this-week timeline, SKE-14 is likely to run before that date.

**Evidence Quote:**
> Evaluate the Success claim if its date has arrived; otherwise record the evaluation date and the standing instruction (section 7). Re-run `skills_usage.py` after Mem0 quota resets (2026-09-01); update ACTIVE/DORMANT.

**Verdict:** CONFIRMED

---

### INFRAGATES-02 (WARN)
**Section:** Wave 0 SKE-R6 / Wave 1 SKE-02  
**Claim:** Rollback procedures were added to R4 and SKE-06b per panel review v1 (WARN I-03), but two comparably destructive infra-mutating sessions -- SKE-02's one-way promotion of a file into canonical devkit, and SKE-R6's purge of entries from a live settings.local.json -- carry no equivalent rollback note.

**Evidence Quote:**
> promote into devkit (add frontmatter - it currently has none - land canonically, symlink runtime) or declare it Personal in the lint exclusion with a reason.

**Verdict:** CONFIRMED

---

## Downgraded to Plausible

(None)

---

## Suggestions

### STRUCTURAL-01 (SUGG)
**Section:** Section 3, Wave 0 (SKE-00d) vs revision history / line 8  
**Claim:** Session IDs SKE-00 (discovery, already DONE) and SKE-00d (scaffolding, PENDING) differ by a single trailing letter, which risks misreading in fast scanning or cross-doc references (e.g. PROGRESS.md, PROMPTS.md) even though the body text disambiguates them each time they appear.

**Evidence Quote:**
> This file + `ske/SKE_PROGRESS.md` (DAG table, all sessions PENDING except SKE-00 DONE ea2e43c).

---

### TECHNICAL-02 (SUGG)
**Section:** Section 1, 'What changed from v1' table  
**Claim:** The ground-truth population arithmetic is internally inconsistent: the table states '93 names / 95 records across 4 real roots' but the listed breakdown (devkit 43 + ~/.agents 39 + plugins 11 + solomon-repo 1) sums to 94, matching neither the 93 nor the 95 figure quoted in the same cell.

**Evidence Quote:**
> 93 names / 95 records across 4 real roots: devkit 43, `~/.agents` 39, plugins 11, solomon-repo 1 (2.1)

---

### TECHNICAL-03 (SUGG)
**Section:** Wave 0, SKE-R1  
**Claim:** SKE-R1 is flagged P0 and performs the highest-risk write operation in the plan (canonical devkit file mutation via Encoding commits), yet unlike SKE-R4 and SKE-06b, which each carry an explicit 'Rollback (panel I-03):' line per the checklist's rollback-procedure requirement, SKE-R1 states only refusal-on-dirty-target and a commit mechanism with no explicit rollback statement of its own.

**Evidence Quote:**
> Per D14: `apply_encoding` lands the change as an Encoding commit (`ret(<skill>): <title> [entry_id]`), refuses on a dirty target path, and calls `mark_encoded` only after the commit succeeds.

---

## Counts

confirmed_crit=0, confirmed_warn=3, plausible=0, sugg=3
