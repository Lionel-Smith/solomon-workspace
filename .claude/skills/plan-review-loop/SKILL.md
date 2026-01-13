---
name: plan-review-loop
description: Iterative review and refinement loop for architecture plans and implementation prompts. Use when Claude needs to systematically improve project documentation through multiple review cycles. Triggers on phrases like "review my plan", "refine this architecture", "improve my prompts", "quality check my implementation plan", or when finalizing planning documents before execution.
---

# Plan Review Loop

Systematic iterative refinement of architecture plans (`_PLAN.md`) and implementation prompts (`_PROMPTS.md`) through structured review cycles.

## Loop Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  INPUT: Draft plan/prompts document                         │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 1: STRUCTURAL REVIEW                                 │
│  • Completeness check against template                      │
│  • Section organization                                     │
│  • Cross-reference consistency                              │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 2: TECHNICAL REVIEW                                  │
│  • Architecture validity                                    │
│  • API contract correctness                                 │
│  • Data model consistency                                   │
│  • Dependency graph validation                              │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 3: IMPLEMENTATION REVIEW (for _PROMPTS.md)           │
│  • Session granularity (30-90 min)                          │
│  • Dependency ordering                                      │
│  • Verification checklist completeness                      │
│  • Code snippet correctness                                 │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────┐
│  APPLY FIXES → Generate diff/patch                          │
└─────────────────────────────────────┬───────────────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │   Quality Gate Check    │
                         │   Iteration < N AND     │
                         │   Issues Found?         │
                         └────────────┬────────────┘
                              │              │
                         YES ─┘              └─ NO
                              │                  │
                              ▼                  ▼
                         LOOP BACK          OUTPUT FINAL
```

## Review Criteria

### Plan Document (`_PLAN.md`) Checklist

```yaml
structural:
  - [ ] Executive summary present (problem, solution, key decisions)
  - [ ] Data model with all tables, columns, constraints
  - [ ] API design with request/response examples
  - [ ] User flows documented
  - [ ] Implementation roadmap with phases
  - [ ] Open questions resolved or tracked

technical:
  - [ ] Database relationships valid (FK references exist)
  - [ ] API endpoints match data model capabilities
  - [ ] Authentication/authorization considered
  - [ ] Error handling patterns defined
  - [ ] No orphan references (all mentioned items defined)
  
bahamas_specific: # For HFS projects
  - [ ] Data sources use verified Bahamian references
  - [ ] Phone format: (242) XXX-XXXX
  - [ ] No placeholder data in examples
  - [ ] Coordinates within island bounds
```

### Prompts Document (`_PROMPTS.md`) Checklist

```yaml
structural:
  - [ ] All sessions have metadata (ID, phase, execution, time, deps)
  - [ ] Dependencies form valid DAG (no cycles)
  - [ ] Session sizes appropriate (⚡<30m, 🔨30-60m, 🏗️>60m)
  - [ ] Parallel execution map accurate
  - [ ] All sessions have verification checklist
  - [ ] Git commit templates present

technical:
  - [ ] Code snippets syntactically correct
  - [ ] File paths consistent across sessions
  - [ ] Import statements valid
  - [ ] Function signatures match between layers
  - [ ] Test patterns use correct assertions

implementation:
  - [ ] Frontend sessions reference component inventory
  - [ ] Backend sessions follow three-layer pattern
  - [ ] Database sessions include migration files
  - [ ] No duplicate code across sessions
  - [ ] Recovery instructions for complex sessions
```

## Loop Execution Protocol

### Invocation

```
Claude, use plan-review-loop on [document path]
Options:
  --max-iterations N     # Default: 3
  --focus [area]         # structural|technical|implementation|all
  --output-diff          # Show changes as diff
  --bahamas-mode         # Enable Bahamian data validation
```

### Per-Iteration Output Format

**CRITICAL: Each iteration MUST output a new file version**

```markdown
## Review Iteration {N} of {MAX}

### Issues Found: {count}

#### Critical (Must Fix)
1. **[CRIT-001]** {description}
   - Location: {section/line}
   - Impact: {what breaks}
   - Fix: {specific correction}

#### Warnings (Should Fix)  
1. **[WARN-001]** {description}
   - Location: {section/line}
   - Recommendation: {suggestion}

#### Suggestions (Nice to Have)
1. **[SUGG-001]** {description}

### Applied Fixes
- [CRIT-001] ✅ Fixed: {brief description}
- [WARN-002] ✅ Fixed: {brief description}

### Quality Score: {0-100}
- Structural: {score}/100
- Technical: {score}/100  
- Implementation: {score}/100

### Loop Decision: {CONTINUE|COMPLETE}

---
**OUTPUT FILE: {PROJECT}_v{N}.md**
```

## File Output Requirements

**Each iteration MUST create a new versioned file:**

```
Iteration 1 → PROJECT_RESEARCH_v1.md
Iteration 2 → PROJECT_RESEARCH_v2.md
Iteration 3 → PROJECT_RESEARCH_v3.md
...
Final       → PROJECT_RESEARCH_FINAL.md
```

This allows:
- Tracking changes between iterations
- Rollback if needed
- Audit trail of improvements

## Terminal Conditions

Loop terminates when ANY of:
1. `max_iterations` reached
2. Zero CRITICAL issues found
3. Quality score ≥ 90
4. User requests early exit

## Integration with HFS Workflow

Insert between Phase 2 and Phase 2.5:

```
Phase 1: Architecture → PROJECT_PLAN.md
Phase 2: Implementation → PROJECT_PROMPTS.md
        ↓
┌─────────────────────────────────────┐
│  plan-review-loop                    │
│  • Review PLAN.md (1-N iterations)   │
│  • Review PROMPTS.md (1-N iterations)│
│  • Output: Refined documents         │
│  • Each iteration = new file version │
└─────────────────────────────────────┘
        ↓
Phase 2.5: Pre-Execution Review (now faster)
Phase 3: Session Execution (fewer surprises)
```

## Common Issue Patterns

### Plan Documents

| Issue | Detection | Auto-Fix |
|-------|-----------|----------|
| Missing FK constraint | Table references non-existent table | Add FK to referenced table |
| Orphan endpoint | API references undefined model | Flag for manual review |
| Inconsistent naming | Snake_case mixed with camelCase | Standardize to snake_case |
| Missing timestamps | Table lacks created_at/updated_at | Add audit columns |

### Prompt Documents

| Issue | Detection | Auto-Fix |
|-------|-----------|----------|
| Circular dependency | Session A→B→C→A | Flag for manual reorder |
| Oversized session | Est. time > 90 min | Split into sub-sessions |
| Missing verification | No checklist items | Generate from task list |
| Syntax error | Invalid Python/SQL/JS | Apply linter suggestions |

## Quick Reference

```bash
# Review architecture plan (3 iterations)
Claude, use plan-review-loop on docs/plans/CLINIC_CONNECT_PLAN.md --max-iterations 3

# Review research document (5 iterations)  
Claude, use plan-review-loop on HFS_DEEP_APP_RESEARCH.md --max-iterations 5

# Full review with Bahamian validation
Claude, use plan-review-loop on PROJECT_PLAN.md --bahamas-mode --max-iterations 3

# Review with diff output
Claude, review-loop PROJECT_PLAN.md --output-diff --max-iterations 2
```
