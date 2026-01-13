---
name: development-workflow
description: Complete development workflow orchestrating architecture planning, implementation prompts, session execution, and code scaffolding. Use this skill when starting any new project, feature, or refactoring initiative. It coordinates project-plan-creator, implementation-plan-generator, session-orchestrator, and python-backend-scaffold skills into a unified development process.
---

# Development Workflow

End-to-end development workflow from requirements to deployed code.

## Overview

This skill orchestrates four specialized skills into a complete development pipeline:

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER REQUEST                             │
│  "Build a payment integration" / "Refactor the NIB module"       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: ARCHITECTURE                                           │
│  Skill: project-plan-creator                                     │
│  Output: {PROJECT}_PLAN.md                                       │
│  ─────────────────────────────────────────────────────────────  │
│  • Executive summary & design decisions                          │
│  • Data model & API specification                                │
│  • User flows & migration strategy                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: IMPLEMENTATION PLANNING                                │
│  Skill: implementation-plan-generator                            │
│  Output: {PROJECT}_IMPLEMENTATION_PROMPTS.md                     │
│  ─────────────────────────────────────────────────────────────  │
│  • Session-by-session prompts                                    │
│  • Dependencies & parallel execution map                         │
│  • Model config, subagents, verification checklists              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: EXECUTION                                              │
│  Skill: session-orchestrator                                     │
│  Files: SESSION.md, PROGRESS.md                                  │
│  ─────────────────────────────────────────────────────────────  │
│  • Load session → Execute → Verify → Commit                      │
│  • Progress tracking by repository                               │
│  • Checkpoints for heavy sessions                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: SCAFFOLDING (as needed)                                │
│  Skill: python-backend-scaffold                                  │
│  Output: New modules with 3-layer architecture                   │
│  ─────────────────────────────────────────────────────────────  │
│  • Flask/Quart project structure                                 │
│  • Controller → Service → Repository pattern                     │
│  • Database, auth, Celery configurations                         │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### Starting a New Project

```
User: "I need to build a restaurant ordering system called Smart-Tender"

Claude:
1. Read project-plan-creator/SKILL.md
2. Gather requirements (tech stack, features, constraints)
3. Create SMART_TENDER_PLAN.md
4. Read implementation-plan-generator/SKILL.md
5. Create SMART_TENDER_IMPLEMENTATION_PROMPTS.md
6. Initialize progress tracking
7. Begin session execution
```

### Starting a Refactoring Initiative

```
User: "Refactor the NIB module to consolidate the converter"

Claude:
1. Read project-plan-creator/SKILL.md + references/refactoring-plan.md
2. Analyze current state, identify duplication
3. Create NIB_PIPELINE_UNIFICATION_PLAN.md
4. Read implementation-plan-generator/SKILL.md
5. Create NIB_PIPELINE_IMPLEMENTATION_PROMPTS.md
6. Initialize progress tracking
7. Begin session execution with migration strategy
```

### Adding a Major Feature

```
User: "Add payment processing with PowerTranz"

Claude:
1. Read project-plan-creator/SKILL.md + references/feature-plan.md
2. Define user stories, data model, API design
3. Create PAYMENT_INTEGRATION_PLAN.md
4. Read implementation-plan-generator/SKILL.md
5. Create PAYMENT_IMPLEMENTATION_PROMPTS.md
6. Initialize progress tracking
7. Begin session execution
```

## Workflow Phases

### Phase 1: Architecture (project-plan-creator)

**Trigger phrases:**
- "Plan a new project for..."
- "Design the architecture for..."
- "Create a refactoring plan for..."
- "How should we structure..."

**Process:**
1. Gather requirements through conversation
2. Read appropriate reference (feature-plan.md, refactoring-plan.md, integration-plan.md)
3. Create architecture document using template
4. Review with user, iterate if needed
5. Finalize {PROJECT}_PLAN.md

**Output:** Architecture document with:
- Executive summary
- Design decisions
- Data model
- API specification
- Implementation roadmap

### Phase 2: Implementation Planning (implementation-plan-generator)

**Trigger phrases:**
- "Break this into sessions..."
- "Create implementation prompts for..."
- "Generate the execution plan..."
- "How do we implement this plan?"

**Process:**
1. Read the architecture document
2. Decompose into sessions (30-90 min each)
3. Map dependencies and parallel execution
4. Write detailed prompts with code snippets
5. Add metadata (model, ultrathink, subagents)
6. Create {PROJECT}_IMPLEMENTATION_PROMPTS.md

**Output:** Implementation prompts with:
- Session metadata
- System configuration
- Full prompts with tasks
- Verification checklists
- Git commit templates

### Phase 3: Execution (session-orchestrator)

**Trigger phrases:**
- "Start session BE-01..."
- "Execute the implementation..."
- "Continue with the next session..."
- "What's the current progress?"

**Process:**
1. Initialize progress tracking (once per project)
2. Load session into SESSION.md
3. Execute in Claude Code CLI
4. Checkpoint if heavy session
5. Complete session (commit, update progress)
6. Repeat for remaining sessions

**Commands:**
```bash
# Initialize (once)
python scripts/init_progress.py "Project Name" --plan PROMPTS.md

# Per session
python scripts/init_session.py XX-NN --plan PROMPTS.md
# Execute in Claude CLI
python scripts/complete_session.py XX-NN -m "feat: description"
```

### Phase 4: Scaffolding (python-backend-scaffold)

**Trigger phrases:**
- "Create a new module for..."
- "Scaffold the payment service..."
- "Set up a new Flask/Quart project..."
- "Add a new API module..."

**Process:**
1. Determine framework (Flask sync / Quart async)
2. Determine database (PostgreSQL / Oracle)
3. Generate project or module structure
4. Apply three-layer architecture pattern

**Commands:**
```bash
# New project
python scripts/init_project.py my-api --framework quart --database postgresql --celery

# New module
python scripts/init_module.py payment --async
```

## Decision Tree

```
User Request
    │
    ├─► "Build/Create/Design new..." ─────► PHASE 1 (Architecture)
    │                                              │
    │                                              ▼
    │                                        PHASE 2 (Prompts)
    │                                              │
    │                                              ▼
    │                                        PHASE 3 (Execute)
    │
    ├─► "Refactor/Consolidate/Migrate..." ─► PHASE 1 (Refactoring Plan)
    │                                              │
    │                                              ▼
    │                                        PHASE 2 (Prompts)
    │                                              │
    │                                              ▼
    │                                        PHASE 3 (Execute)
    │
    ├─► "Generate prompts from this plan..." ─► PHASE 2 (Prompts)
    │                                              │
    │                                              ▼
    │                                        PHASE 3 (Execute)
    │
    ├─► "Start/Continue session..." ──────────► PHASE 3 (Execute)
    │
    ├─► "Scaffold a new module..." ───────────► PHASE 4 (Scaffold)
    │
    └─► "What's the status/progress?" ────────► Check PROGRESS.md
```

## Skill Coordination

### Reading Order

When starting a workflow, read skills in this order:

```python
SKILL_READING_ORDER = {
    "new_project": [
        "project-plan-creator/SKILL.md",
        "project-plan-creator/references/feature-plan.md",
        # After plan created:
        "implementation-plan-generator/SKILL.md",
        # After prompts created:
        "session-orchestrator/SKILL.md",
    ],
    "refactoring": [
        "project-plan-creator/SKILL.md",
        "project-plan-creator/references/refactoring-plan.md",
        # After plan created:
        "implementation-plan-generator/SKILL.md",
        # After prompts created:
        "session-orchestrator/SKILL.md",
    ],
    "integration": [
        "project-plan-creator/SKILL.md",
        "project-plan-creator/references/integration-plan.md",
        # After plan created:
        "implementation-plan-generator/SKILL.md",
        # After prompts created:
        "session-orchestrator/SKILL.md",
    ],
    "scaffold_only": [
        "python-backend-scaffold/SKILL.md",
    ],
    "execute_only": [
        "session-orchestrator/SKILL.md",
    ],
}
```

### Output File Naming

```
docs/
├── plans/
│   ├── {PROJECT}_PLAN.md                    # Architecture (Phase 1)
│   └── {PROJECT}_IMPLEMENTATION_PROMPTS.md  # Prompts (Phase 2)
├── sessions/
│   └── SESSION.md                           # Current session (Phase 3)
└── progress/
    └── {PROJECT}_PROGRESS.md                # Tracking (Phase 3)
```

### Handoff Points

| From | To | Handoff |
|------|-----|---------|
| Phase 1 | Phase 2 | "Architecture complete. Ready to generate implementation prompts?" |
| Phase 2 | Phase 3 | "Prompts generated. Ready to initialize progress and start execution?" |
| Phase 3 | Phase 4 | "Session requires new module. Scaffolding with python-backend-scaffold..." |

## Example: Complete Workflow

### User Request
```
"I need to add a roster management feature to the NIB C10 Converter. 
Employees should be stored persistently so we don't have to re-enter 
NI numbers each month."
```

### Phase 1: Architecture

**Claude reads:** `project-plan-creator/SKILL.md`, `references/feature-plan.md`

**Claude creates:** `docs/plans/ROSTER_MANAGEMENT_PLAN.md`

```markdown
# Roster Management Plan

## Executive Summary
Add persistent employee roster to bridge payroll imports with NIB submissions...

## Data Model
### New Entity: RosterEmployee
| Column | Type | Description |
|--------|------|-------------|
| id | SERIAL | Primary key |
| business_id | INTEGER | FK to businesses |
| ni_number | VARCHAR(9) | NIB number |
...

## API Design
### POST /api/v1/roster/employees
...
```

### Phase 2: Implementation Planning

**Claude reads:** `implementation-plan-generator/SKILL.md`

**Claude creates:** `docs/plans/ROSTER_IMPLEMENTATION_PROMPTS.md`

```markdown
# Roster Management - Implementation Prompts

## Session RO-01: Database Setup
### Metadata
session_id: RO-01
execution: 🖥️ CLI | 🏗️ Heavy | 🧠 Ultrathink
...

### Prompt
Create the employee_roster table with pg_trgm support for fuzzy matching...
```

### Phase 3: Execution

**Claude reads:** `session-orchestrator/SKILL.md`

**User runs:**
```bash
python scripts/init_progress.py "Roster Management" --plan docs/plans/ROSTER_PROMPTS.md
python scripts/init_session.py RO-01 --plan docs/plans/ROSTER_PROMPTS.md
```

**Claude executes session in CLI, then:**
```bash
python scripts/complete_session.py RO-01 -m "feat(roster): add employee roster tables"
```

### Phase 4: Scaffolding (if needed)

**Claude reads:** `python-backend-scaffold/SKILL.md`

```bash
python scripts/init_module.py roster --async
```

## Progress Tracking

### Check Status
```bash
cat docs/progress/*_PROGRESS.md
```

### View Current Session
```bash
cat docs/sessions/SESSION.md
```

### Resume After Break
```
User: "Where did we leave off?"

Claude:
1. Read PROGRESS.md to see completed sessions
2. Identify next pending session
3. Load SESSION.md if mid-session
4. Continue execution
```

## Best Practices

### 1. Always Start with Architecture
Don't jump straight to coding. The architecture phase catches design issues early.

### 2. Review Before Generating Prompts
Get user approval on the architecture document before creating implementation prompts.

### 3. Commit After Every Session
Each session should result in one atomic, revertable commit.

### 4. Use Checkpoints for Heavy Sessions
If a session takes >60 minutes, create checkpoint commits.

### 5. Track Decisions in PROGRESS.md
Document any deviations from the plan in the progress file.

### 6. Scaffold When Patterns Repeat
If you're creating similar structure multiple times, use python-backend-scaffold.

## Troubleshooting

### "I don't know which skill to use"
→ Read this SKILL.md and follow the decision tree

### "The architecture document is too vague"
→ Ask clarifying questions, reference feature-plan.md or refactoring-plan.md

### "Sessions are too large"
→ Split into smaller sessions (target 30-90 minutes)

### "Lost track of progress"
→ Check PROGRESS.md, it has chronological status of all sessions

### "Need to change the plan mid-execution"
→ Update PROMPTS.md, note change in PROGRESS.md, continue from current session
