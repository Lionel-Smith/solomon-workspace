---
name: hfs-repo-maintenance
description: Maintain and extend the HFS Development Kit repository. Documents coding philosophy, skill authoring patterns, and repository contribution guidelines. Use when adding new skills, updating workflows, refining agentic coding patterns, or encoding lessons learned from projects.
---

# HFS Repo Maintenance

Meta-skill for evolving the HFS agentic workflow system.

## Triggers

- When adding a new skill to the HFS Development Kit
- When updating workflow documentation
- When refining agentic coding patterns
- When user says "update the HFS repo" or "add a skill"
- When documenting lessons learned from projects
- When encoding a new anti-pattern or constraint

## Agentic Coding Philosophy

### 1. Prove It Works
Nothing is "done" until verified working end-to-end. UI rendering is not proof. API returning 200 with real data is proof. Tests passing against real backends is proof.

### 2. Trust But Verify
Claude can do a lot autonomously, but always verify before declaring done. Run the tests. Check the network tab. Stop the backend and confirm error states render.

### 3. Fail Fast, Fail Visibly
Errors must surface immediately, never be swallowed or masked. An empty array hiding a 404 is worse than a crash. A false positive UI is worse than an error screen.

### 4. Ask on Architecture
Claude should be autonomous on implementation details but ask on design and structure choices. If it affects how systems connect, ask first.

### 5. Educational Communication
Explain what you're doing and why. Learning happens in the doing.

## Constraints

### Repository Structure (Critical)
- All skills must follow SKILL_FORMAT_v1.7.md structure
- Version numbers in filenames must match content version
- CHANGELOG.md must be updated for any user-facing change

### Architecture (Critical)
- Follow three-layer architecture: Controller → Service → Repository
- All new code must have tests
- No mock fallbacks in catch blocks
- Dependencies = completion + integration verification, not just sequence

### Integration (Critical/High)
- Frontend sessions BLOCKED until API Contract Lock verified
- Pre-flight integration checks before ANY frontend session
- E2E tests must run against real backend, not mocked APIs
- "Renders correctly" is NOT sufficient verification - API must return 200

### Documentation (High)
- Skills must include at least one workflow with steps
- Forbidden patterns must include reasoning (the WHY)
- Examples should demonstrate real-world usage
- Retrospective lessons must be encoded into skills/forbidden patterns

### Git (High/Medium)
- Commits must be atomic - one logical change per commit
- Commit messages should reference the skill or component changed

### Async Patterns (High)
- Use async patterns for Quart (selectinload, joinedload)
- Convert to DTOs while database session is open

## Forbidden Patterns

### Error Handling (BDOCS Lessons)
| Pattern | Reason |
|---------|--------|
| `catch { return [] }` | hides errors, creates false positive UI |
| `catch { return MOCK_DATA }` | hides errors, impossible to debug |
| `response?.data ?? []` | hides null responses, silent failure |
| `catch { /* empty */ }` | swallows ALL errors including real bugs |

### Mock/Stub Patterns (BDOCS Anti-patterns)
| Pattern | Reason |
|---------|--------|
| `// Return mock data if endpoint doesn't exist yet` | 'temporary' mocks become permanent |
| E2E tests that mock APIs instead of calling real backend | creates false positive tests |
| `// TODO: Replace with actual API call` | never gets removed, creates tech debt |
| TODO comments without tracking mechanism | intent documented but never executed |

### Architecture Violations
| Pattern | Reason |
|---------|--------|
| Database queries in controller | wrong layer - bypasses service logic |
| HTTP response codes in service layer | wrong layer - couples service to HTTP |
| Business logic in repository | wrong layer - business logic should be in service |
| Nested app/app/ directories | NIB lesson - confusing project structure |

### Async Issues
| Pattern | Reason |
|---------|--------|
| Accessing SQLAlchemy relationships outside async session | lazy loading fails outside session |
| Using sync SQLAlchemy in async Quart code | blocks event loop |

### Repository Maintenance
| Pattern | Reason |
|---------|--------|
| Updating workflow content without bumping version | version drift |
| Creating skills without adding to README inventory | orphaned files |
| Removing skill fields without deprecation period | breaks compatibility |
| Skills without clear trigger conditions | unclear purpose |
| Verification checks that can't be automated | untestable |

### Dependency/Integration Violations
| Pattern | Reason |
|---------|--------|
| Starting frontend sessions before API Contract Lock | BDOCS root cause - leads to mock fallbacks |
| Dependencies as execution order only | sequence ≠ integration verification |
| Verification checklist without API connectivity checks | doesn't verify integration |

## Agentic Patterns

### API Contract Lock
Frontend work is BLOCKED until backend APIs are proven working. "Proven" means: health endpoint returns 200, data endpoint returns real records, CORS is configured. No exceptions.

**When:** Before starting ANY frontend session in a fullstack project

```bash
curl -sf http://localhost:5000/health || exit 1
curl -sf http://localhost:5000/api/v1/inmates | jq '.total' | grep -q '[0-9]' || exit 1
```

### Integration Gate
Pre-flight checks before frontend sessions. If any check fails, DO NOT PROCEED. Start the backend first.

**When:** Before every FE-XX session

```xml
<integration_gate enabled="true">
  <check name="health">curl -sf http://localhost:5000/health</check>
  <check name="data">curl -sf http://localhost:5000/api/v1/{entity} | jq '.total'</check>
  <action_on_fail>DO NOT PROCEED. Start backend first.</action_on_fail>
</integration_gate>
```

### Throw Don't Swallow
Errors must surface, not hide. A visible error is infinitely better than a silent failure that looks like success.

**When:** Any catch block, any error handling

```javascript
// WRONG - hides the error
catch { return []; }

// RIGHT - surfaces the error
catch (error) {
  throw new Error(`Failed to fetch: ${error.message}`);
}
```

### Verify Real Data
"Renders correctly" is not verification. Verification means:
1. Open Network tab in DevTools
2. Confirm API returns HTTP 200
3. Confirm response contains expected data shape
4. Stop backend, confirm error state renders

**When:** Completing any frontend session

### Retrospective to Constraint
When a project reveals a failure mode, don't just fix it - encode it. Add a forbidden pattern with reasoning. Update affected skills. Future projects benefit automatically.

**When:** After any project retrospective identifies an anti-pattern

### Dependencies Mean Integration
When a session depends on another, it means "that session's OUTPUT is WORKING", not just "that session has been attempted". A frontend session depending on BE-04 means BE-04's endpoints return real data.

**When:** Defining session dependencies

## Workflow

### Step 1: Identify Change Type
Determine if this is:
- New skill creation
- Skill update/enhancement
- Workflow version bump
- Documentation improvement
- Retrospective capture / lesson encoding

**Output:** Change type classification

### Step 2: Review Existing Patterns
Before creating/modifying, review:
- SKILL_FORMAT_v1.7.md for structure
- Similar existing skills for conventions
- CHANGELOG.md for recent evolution
- retrospectives/ for lessons learned
- HFS_AGENTIC_WORKFLOW_v1.7_FINAL.md for philosophy

**Output:** Context for consistent contribution

### Step 3: Implement Change
Make the change following constraints:
- Use XML structure for skills
- Include all required sections
- Add verification checks
- Include reasoning for forbidden patterns
- Update README.md inventory if new skill

**Output:** Updated/new skill file

### Step 4: Update CHANGELOG
Add entry to CHANGELOG.md:
- Version bump if significant
- Date of change
- Description of what changed
- Link to relevant files

**Output:** Updated CHANGELOG.md

### Step 5: Commit with Context
Commit message format:
- `feat(skill-name): description`
- `fix(workflow): description`
- `docs: description`

**Output:** Atomic commit

### Step 6: Handle Failures
If validation fails or changes cause issues:
- git stash or git checkout to revert
- Document what went wrong in issue or notes
- Create GitHub issue for tracking if systemic
- Do NOT commit broken state

**Output:** Clean rollback or documented issue

## Error Handling

| Condition | Action |
|-----------|--------|
| validation_fails | Fix issues, re-run validation before proceeding |
| git_conflict | Resolve conflict, preserve both changes if possible |
| skill_breaks_existing | Rollback, investigate compatibility, add deprecation if needed |
| unclear_requirements | Ask user for clarification before proceeding |
| xml_parse_error | Check for unescaped < > & characters, use CDATA for code |
| skill_too_large | Split into main skill + references/ files |

## Templates

### New Skill Skeleton
```xml
<?xml version="1.0" encoding="UTF-8"?>
<skill name="{skill-name}" version="1.0">

  <metadata>
    <author>High Functioning Solutions Ltd.</author>
    <created>{date}</created>
    <updated>{date}</updated>
    <category>{category}</category>
  </metadata>

  <description>
    <summary>{One-line description}</summary>
    <details>{Detailed description}</details>
  </description>

  <triggers>
    <trigger>When {condition}</trigger>
  </triggers>

  <constraints>
    <constraint priority="critical">{Must do}</constraint>
  </constraints>

  <forbidden>
    <pattern reason="{why}">{Anti-pattern}</pattern>
  </forbidden>

  <workflow>
    <step order="1">
      <name>{Step}</name>
      <description>{What to do}</description>
      <output>{Output}</output>
    </step>
  </workflow>

  <verification>
    <check name="{name}" command="{cmd}">{How to verify}</check>
  </verification>

</skill>
```

### Retrospective Entry
```markdown
# Retrospective: {Project Name}

**Date**: {YYYY-MM-DD}
**Project**: {project}
**Skills Used**: {skill-1}, {skill-2}

## What Worked Well
- {positive outcome}

## What Didn't Work
- {problem area}

## Anti-Patterns Observed
| Pattern | Impact | Where Found |
|---------|--------|-------------|
| {pattern} | {impact} | {file/location} |

## Root Cause Analysis (5 Whys)
1. Why? {first level}
2. Why? {second level}
3. Why? {third level}
4. Why? {fourth level}
5. Why? **{root cause}**

## Lessons to Encode
| Lesson | Skill to Update | Change Type |
|--------|-----------------|-------------|
| {lesson} | {skill} | constraint / forbidden / pattern |

## Action Items
- [ ] Add forbidden pattern: {pattern} reason: {why}
- [ ] Update {skill} with constraint: {constraint}
- [ ] Add verification check: {check}
```

## Verification

```bash
# All skill files have constraints section
grep -l '<constraints>' skills/*/SKILL.md | wc -l

# Count forbidden patterns with reasons (should match total patterns)
grep -c 'pattern reason=' skills/*/SKILL.md

# README.md lists all skills in skills/ directory
ls -d skills/*/ | xargs -I{} basename {} | while read s; do grep -q $s README.md || echo 'Missing: '$s; done

# CHANGELOG.md has entry for current month
head -20 CHANGELOG.md | grep -c $(date +%Y-%m)

# All skill directories contain SKILL.md
find skills -type d -mindepth 1 -maxdepth 1 | xargs -I{} sh -c 'test -f {}/SKILL.md || echo Missing: {}'

# All skills have version in XML declaration
grep -c 'version=' skills/*/SKILL.md
```
