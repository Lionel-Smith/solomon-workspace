---
name: implementation-plan-generator
description: Generate comprehensive implementation prompt documents from architecture plans or project requirements. Creates structured session-by-session prompts with metadata, dependencies, parallel execution maps, model configuration, subagent definitions, and verification checklists. Use when breaking down a large project into executable AI-assisted development sessions, or when creating detailed implementation guides for Claude Code workflows.
---

# Implementation Plan Generator

Transform architecture documents or project requirements into structured, session-by-session implementation prompts that can be executed via the session-orchestrator skill.

## When to Use This Skill

- Breaking a large feature into AI-executable sessions
- Creating implementation guides from architecture docs
- Planning multi-week development sprints
- Documenting complex refactoring projects
- Creating repeatable implementation patterns

## Output Structure

```
{PROJECT}_IMPLEMENTATION_PROMPTS.md
├── Document Overview
│   ├── Purpose & metadata
│   ├── Execution tracks (Backend, Frontend, etc.)
│   └── Parallel execution map (visual dependency graph)
├── Progress Tracking Templates
│   ├── Session status template
│   └── Session task template
├── Pre-Implementation Setup
│   └── Branch creation, directory setup, initial commit
├── Phase N: [Phase Name]
│   ├── Session XX-NN: [Session Title]
│   │   ├── Metadata (session_id, phase, track, execution, dependencies)
│   │   ├── System Configuration (model, thinking_mode, temperature)
│   │   ├── Skills Registry
│   │   ├── Sub-Agents (if applicable)
│   │   ├── Ultrathink Protocol (if applicable)
│   │   ├── Prompt (full implementation instructions)
│   │   ├── Verification Checklist
│   │   └── Git Commit template
│   └── ... more sessions
├── Rollback Commands Reference
└── Appendices
    ├── Model Selection Guide
    ├── Ultrathink Usage
    ├── Skills Registry
    └── Commit Message Format
```

## Workflow

### Step 1: Gather Inputs

Required:
- Architecture document or project plan
- Scope definition (what's in/out)
- Repository structure

Optional:
- Existing codebase to reference
- Tech stack constraints
- Team preferences (model, commit style)

### Step 2: Decompose into Sessions

**Decomposition principles:**

| Principle | Guideline |
|-----------|-----------|
| **Single responsibility** | Each session has one clear objective |
| **Testable output** | Session produces verifiable artifacts |
| **Time-boxed** | Target 30-90 minutes per session |
| **Dependency clarity** | Clear inputs and outputs |

**Session sizing:**

| Size | Duration | Complexity | Example |
|------|----------|------------|---------|
| ⚡ Quick | < 30 min | Single file, straightforward | Add endpoint, fix bug |
| 🔨 Medium | 30-60 min | Multiple files, moderate logic | CRUD module |
| 🏗️ Heavy | 60-90 min | Complex logic, multiple concerns | Algorithm, architecture |

### Step 3: Map Dependencies (v1.8 Tracks)

Create execution tracks with INT-XX integration sessions:

```
Track A (Backend):    BE-01 ─── BE-02 ─── BE-03 ─── BE-04 ─── BE-05
                                                       │
                                                       ▼
Track B (Integration):                            INT-01 ─── INT-02
                                                    │ (Type Generation)
                                                    ▼
Track C (Frontend):                              FE-01 ─── FE-02 ─── FE-03
                                                           (requires INT-01 ✅)
```

**Session Prefixes (v1.8):**

| Prefix | Repository | Purpose |
|--------|------------|---------|
| BE- | {project}-api | Backend logic, APIs |
| INT- | Cross-repo | Type sync, integration |
| FE- | {project}-web | Frontend UI |
| DB- | {project}-api | Database migrations |
| E2E- | {project}-web | End-to-end tests |

**Critical Dependencies:**
- INT-01 (Type Generation) requires BE-04 (APIs complete) ✅
- All FE-XX sessions require INT-01 ✅
- FE sessions require `<integration_gate enabled="true">`

See [references/dependency-mapping.md](references/dependency-mapping.md)

### Step 4: Write Session Prompts

Each session needs:

1. **Metadata block** — ID, phase, track, execution mode
2. **System configuration** — Model, thinking mode, temperature
3. **Context** — What came before, reference files
4. **Tasks** — Numbered, specific, with code snippets
5. **Verification** — How to confirm success
6. **Git commit** — Pre-written commit message

See [references/prompt-patterns.md](references/prompt-patterns.md)

### Step 5: Add Orchestration Metadata

- Ultrathink protocols for complex sessions
- Subagent definitions for parallelizable work
- Skills registry for each session
- MCP server requirements

See [references/session-metadata.md](references/session-metadata.md)

### Step 6: Generate Document

Use the template in [assets/IMPLEMENTATION_PLAN_TEMPLATE.md](assets/IMPLEMENTATION_PLAN_TEMPLATE.md)

## Session Metadata Reference

### Execution Modes

| Icon | Mode | When to Use |
|------|------|-------------|
| 🖥️ CLI | Claude Code terminal | All code implementation |
| 📝 VSCode | Claude in IDE | Quick edits, debugging |
| ⚡ Quick | < 30 min | Simple tasks |
| 🔨 Medium | 30-60 min | Standard implementation |
| 🏗️ Heavy | > 60 min | Complex features |
| 🧠 Ultrathink | Extended thinking | Architecture, algorithms |
| 🤖 Subagents | Parallel execution | Independent workstreams |
| 🔧 MCP | MCP servers | File ops, git, databases |

### Model Configuration

```yaml
# Heavy/architectural work
model: claude-sonnet-4-20250514
thinking_mode: ultrathink
max_thinking_tokens: 32000
temperature: 0.1

# Standard implementation
model: claude-sonnet-4-20250514
thinking_mode: standard
temperature: 0.2

# Documentation/simple tasks
model: claude-haiku-4-20250314
thinking_mode: standard
temperature: 0.3
```

## Quick Start

Generate a plan from an architecture document:

```markdown
## Input Required

1. **Project name**: Pipeline Unification
2. **Architecture doc**: NIB_PIPELINE_UNIFICATION_PLAN.md
3. **Tracks**: 
   - Track A: Backend (BE-01 through BE-10)
   - Track B: Frontend (FE-01 through FE-06)
4. **Timeframe**: 4 weeks
5. **Repositories**: payroll-converter-backend, payroll-converter-frontend

## Output

Generate NIB_PIPELINE_IMPLEMENTATION_PROMPTS.md with:
- 16 sessions across 4 phases
- Parallel execution map
- Full prompts with code snippets
- Verification checklists
- Git commit templates
```

## v1.8 Session Templates

### INT-01: Type Generation Session

```xml
<session id="INT-01" project="{PROJECT}">
  <metadata>
    <working_directory>{project}-web</working_directory>
    <estimated_time>30 minutes</estimated_time>
    <size>quick</size>
  </metadata>

  <dependencies>
    <requires status="complete">BE-04</requires>
  </dependencies>

  <integration_gate enabled="true">
    <check name="health">curl -sf http://localhost:5000/health</check>
    <check name="openapi">curl -sf http://localhost:5000/openapi.json</check>
  </integration_gate>

  <tasks>
    <task id="1" file="src/types/common.ts" action="CREATE">
      <title>Create common types from backend DTOs</title>
      <code_snippet language="typescript">
// MIRRORS: backend/app/common/response.py
export interface ApiError {
  error: true;
  code: string;
  message: string;
}

export interface PaginatedResult&lt;T&gt; {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}
      </code_snippet>
    </task>
  </tasks>

  <commit>
    <type>feat</type>
    <scope>types</scope>
    <description>add TypeScript types from backend DTOs</description>
  </commit>
</session>
```

### FE-XX: Page Session Template (Full v1.8)

```xml
<session id="FE-{N}" project="{PROJECT}">
  <metadata>
    <working_directory>{project}-web</working_directory>
    <estimated_time>60 minutes</estimated_time>
    <size>medium</size>
  </metadata>

  <dependencies>
    <requires status="complete">INT-01</requires>
    <requires status="complete">FE-{N-1}</requires>
  </dependencies>

  <integration_gate enabled="true">
    <check name="health">curl -sf http://localhost:5000/health</check>
    <check name="data">curl -sf http://localhost:5000/api/v1/{entity} | jq '.total'</check>
    <check name="cors">curl -sI http://localhost:5000/api/v1/{entity} -H "Origin: http://localhost:5173" | grep -qi access-control</check>
    <action_on_fail>DO NOT PROCEED. Start backend first.</action_on_fail>
  </integration_gate>

  <screen_reference>
    <screen_id>SCR-{N}</screen_id>
    <wireframe_section>{PROJECT}_PLAN.md#section-10.2</wireframe_section>
  </screen_reference>

  <component_checklist>
    <component import="@/components/ui/button">Button</component>
    <component import="@/components/ui/card">Card</component>
    <component import="@/components/ui/table">Table</component>
    <component import="@/components/ui/skeleton">Skeleton</component>
  </component_checklist>

  <state_requirements>
    <state name="loading" trigger="isLoading === true">
      <render>Skeleton rows matching table structure</render>
    </state>
    <state name="error" trigger="isError === true">
      <render>ErrorState with retry button</render>
    </state>
    <state name="empty" trigger="data?.items?.length === 0">
      <render>EmptyState with action</render>
    </state>
    <state name="success" trigger="data?.items?.length > 0">
      <render>Table with data rows</render>
    </state>
  </state_requirements>

  <responsive_requirements>
    <breakpoint name="desktop" min="1024px">Full table</breakpoint>
    <breakpoint name="tablet" min="640px" max="1023px">Reduced columns</breakpoint>
    <breakpoint name="mobile" max="639px">Card list view</breakpoint>
  </responsive_requirements>

  <constraints>
    <constraint priority="critical">Use Shadcn components from component_checklist</constraint>
    <constraint priority="critical">Handle ALL states in state_requirements</constraint>
    <constraint priority="critical">Backend must be running</constraint>
    <constraint priority="high">Use React Query for data fetching</constraint>
  </constraints>

  <forbidden>
    <pattern reason="template exists">const Button = </pattern>
    <pattern reason="template exists">const Card = </pattern>
    <pattern reason="hides errors">catch { return [] }</pattern>
    <pattern reason="no mock data">return MOCK_DATA</pattern>
  </forbidden>

  <tasks>
    <task id="1" file="src/hooks/use-{entities}.ts" action="CREATE">
      <title>Create React Query hook</title>
    </task>
    <task id="2" file="src/features/{feature}/pages/{Page}Page.tsx" action="CREATE">
      <title>Create page with all states</title>
    </task>
  </tasks>

  <visual_verification>
    <screenshot id="1" name="FE-{N}-loading" state="loading" viewport="desktop">
      <description>Loading skeleton visible</description>
    </screenshot>
    <screenshot id="2" name="FE-{N}-data" state="success" viewport="desktop">
      <description>Real data from API</description>
    </screenshot>
    <screenshot id="3" name="FE-{N}-error" state="error" viewport="desktop">
      <description>Error state with retry</description>
    </screenshot>
    <screenshot id="4" name="FE-{N}-mobile" state="success" viewport="mobile">
      <description>Mobile responsive view (375px)</description>
    </screenshot>
  </visual_verification>

  <verification>
    <check name="build" command="npm run build">Compiles</check>
    <check name="lint" command="npm run lint">Passes</check>
    <check name="no_mock" command="grep -rn 'MOCK_DATA' src/ || echo 'Clean'">No mock data</check>
    <check name="screenshots" command="ls docs/screenshots/FE-{N}-*.png | wc -l">4 screenshots captured</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>frontend</scope>
    <description>add {page} page with visual verification</description>
  </commit>
</session>
```

## References

- **Session structure:** See [references/session-structure.md](references/session-structure.md)
- **Dependency mapping:** See [references/dependency-mapping.md](references/dependency-mapping.md)
- **Prompt patterns:** See [references/prompt-patterns.md](references/prompt-patterns.md)
- **Session metadata:** See [references/session-metadata.md](references/session-metadata.md)

## Templates

- **Full plan template:** [assets/IMPLEMENTATION_PLAN_TEMPLATE.md](assets/IMPLEMENTATION_PLAN_TEMPLATE.md)
- **Session template:** [assets/SESSION_PROMPT_TEMPLATE.md](assets/SESSION_PROMPT_TEMPLATE.md)
