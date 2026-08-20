# SKE_PLAN_v2 Review Report

**Panel Date:** 2026-08-20  
**Document:** SKE_PLAN_v2.md  
**Review Mode:** Full  
**Reviewer Class:** Plan Review Panel

---

## Confirmed Findings

### CRITICAL SEVERITY

#### TECHNICAL-01: Unreachable 44th org-authored skill in reachability gate

**Section:** Decisions (D3) / Wave 0 SKE-R3 / SKE-R4 / SKE-02 (44/44 reachability gate)

**Claim:** D3 fixes SKILLS_ROOTS to exactly two roots (devkit=43, ~/.agents/skills=39, totaling 82 per SKE-R3's own health() verify), but D5/SKE-02 mandate '44/44 org-authored reachable' and SKE-R4 asserts 'index entry count = org-authored count' (44). The 44th org-authored skill is the 1 skill living in the 4th root ('solomon-repo 1' per section 1's ground-truth table), which is not a member of SKILLS_ROOTS at all, so it cannot be traversed, indexed, or gated by any session in this plan as written.

**Evidence Quote:**
> **Roots: `SKILLS_ROOTS` = [devkit, `~/.agents/skills` read-only]. `~/.hfs/skills` default removed.** ... 44/44 org-authored reachable before any new skill is authored ... `health()` reports 82 traversable (43+39); index lists 44 + pointer

**Verdict:** CONFIRMED

---

#### INFRAGATES-01: Bishop MCP tool existence unconfirmed

**Section:** SKE-07 (Wave 3)

**Claim:** SKE-07's verification depends on a 'Bishop MCP tool' whose existence is never confirmed anywhere in the plan (no discovery citation, no health-check task) — if it doesn't exist, the session's stated verification cannot pass.

**Evidence Quote:**
> add CONSTITUTION + forbidden checks, three-layer seam rule, Quart/pytest-asyncio + vitest recipes, two-axis review (Standards vs Spec) with Bishop MCP tool + `/bishop:review`. ... Verify: one real diff reviewed two-axis; RET ingests findings as Encoding commits.

**Verdict:** CONFIRMED

---

### WARNING SEVERITY

#### STRUCTURAL-01: Missing Executive Summary section

**Section:** Document opening / Section 0-1

**Claim:** The plan has no dedicated Executive Summary section (problem/solution/key-decisions framing) before diving into revision history and decision tables — a reader arriving cold has no single-paragraph orientation to what SKE is and why it exists.

**Evidence Quote:**
> ## 0. Revision history
>
> **v2 -> v2.1** (verification pass, 10 corrections)

**Verdict:** CONFIRMED

---

#### TECHNICAL-02: Skill-reviewer scope excludes 44th org-authored skill

**Section:** Wave 2 SKE-05 (skill-reviewer v2)

**Claim:** SKE-05's verification scope is explicitly '43 devkit skills' ('43 artifacts - expected day-one truth: 3 measured, 40 UNMEASURED'), silently excluding the 44th org-authored skill (the solomon-repo skill counted in D5's 44-skill population), so the reviewer gate can never report full org-authored coverage even if TECHNICAL-01 were otherwise resolved.

**Evidence Quote:**
> Run against all 43 devkit skills; commit artifacts to `devkit/reviews/`.
> Verify: 43 artifacts - expected day-one truth: **3 measured, 40 UNMEASURED awaiting evals**

**Verdict:** CONFIRMED

---

#### INFRAGATES-02: Sentinel service existence unconfirmed

**Section:** SKE-09 / SKE-12

**Claim:** A 'Sentinel' service/check is referenced twice as an infrastructure dependency (worktree stale-cleanup check and precision/recall alerting) without any citation confirming it exists or is reachable, unlike other services in this plan (Samson, Jacob) which are independently verifiable against the workspace tool roster.

**Evidence Quote:**
> worktree per agent, coordination via Mem0/Linear never shared TASKS.md, merge in DAG order, Samson stale-worktree cleanup, Sentinel check, **File-ownership list discipline**

**Verdict:** CONFIRMED

---

#### INFRAGATES-03: No rollback procedures for high-risk changes

**Section:** SKE-R4 / SKE-06b

**Claim:** No rollback procedure is defined for the two highest-risk destructive changes in the plan — deleting the XML parser regexes (SKE-R4) and shipping a new session-format spec version (SKE-06b) — despite the v1.9.1 checklist explicitly requiring rollback procedures for infrastructure/format changes.

**Evidence Quote:**
> Delete the three XML regexes + synthetic fixtures; **`CODE_BLOCK_PATTERN` untouched**.

**Verdict:** CONFIRMED

---

## Downgraded to Plausible

(none)

---

## Suggestions

#### STRUCTURAL-02: Plan structure scope note vs. generic checklist

**Severity:** SUGGESTION

**Section:** Overall structure vs checklist

**Claim:** The plan has no data_model, api_design, or user_flows sections and never states that these are inapplicable to a skills/config-infrastructure plan; a one-line scope note would preempt reviewers checking for them against the generic PLAN checklist.

**Evidence Quote:**
> ## 3. Sessions

---

#### INFRAGATES-04: Telemetry directory creation not verified

**Severity:** SUGGESTION

**Section:** SKE-03

**Claim:** The telemetry hook writes to `~/.claude/telemetry/skill-loads.jsonl` but the plan never states that this directory is created/verified to exist before first append, leaving an open failure mode inconsistent with the stated 'unconditional exit 0' contract.

**Evidence Quote:**
> appends one JSONL line `{ts, session_id, skill, path}` to **`~/.claude/telemetry/skill-loads.jsonl`** under the four-rule contract - local append only, unconditional exit 0, single-digit-ms, no locks

---

## Counts

**confirmed_crit=2, confirmed_warn=4, plausible=0, suggestions=2**
