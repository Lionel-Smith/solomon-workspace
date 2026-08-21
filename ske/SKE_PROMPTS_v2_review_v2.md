# SKE_PROMPTS_v2 Review (v2)

**Reviewer Panel:** plan-review-panel  
**Review Date:** 2026-08-20  
**Document:** SKE_PROMPTS_v2.md (prompts)  
**Mode:** full

---

## Confirmed Findings

### INFRAGATES-01 (CRITICAL)
**Section:** SKE-03 verification (hook_exit0_on_failure)

The failure-simulation verification check cannot exercise the failure path it claims to test: the session's own constraint fixes the telemetry write path (non-configurable), so the TELEMETRY_DIR env override used in the check has no effect on the script, and even if it did, /proc does not exist on Darwin (the stated host platform), so the intended failure condition is not reliably testable as specified.

**Evidence:**
> The hook obeys all four rules: local append only, unconditional exit 0, single-digit-ms no locks, path ~/.claude/telemetry/skill-loads.jsonl. It NEVER networks. ... `<check name="hook_exit0_on_failure" gate_class="machine" command="TELEMETRY_DIR=/proc/none bash hfs-development-kit/claude-config/hooks/skill-telemetry.sh <<< '{}' ; echo $?">0</check>`

**Verdict:** CONFIRMED

---

### INFRAGATES-02 (WARNING)
**Section:** SKE-R-01 constraints/verification

SKE-R-01 states a backup-relocation constraint (explicitly invoking the SEC-01 leaked-creds incident) but provides no corresponding verification gate to machine-check it, unlike the parallel SKE-R-06 session which pairs its analogous backup constraint with an explicit backup_exists check.

**Evidence:**
> Backup path moves outside the skills tree (SEC-01 rhyme: committed .bak files were that incident).

**Verdict:** CONFIRMED

---

## Suggestions

### STRUCTURAL-01
**Section:** SKE-R-07 tasks

SKE-R-07's own `<task id>` attributes run 1-4, but two task titles label themselves 'plan task-0' and 'plan task-6' (the plan document's numbering), which a reader skimming only this file could momentarily misread as this session having 7 tasks or a gap at ids 2/3/5.

**Evidence:**
```
<task id="1" action="CREATE">
  <title>Promotion (plan task-0, D13): copy plan.md, session.md, preflight.md, review.md from ~/.claude/commands/ into hfs-development-kit/claude-config/commands/ verbatim (promotion commit, no content edits)</title>
```

---

## Counts
- **Confirmed (CRIT):** 1
- **Confirmed (WARN):** 1
- **Plausible:** 0
- **Suggestions:** 1
- **Total Findings:** 3
