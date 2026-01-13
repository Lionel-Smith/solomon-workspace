---
name: session-orchestrator
description: Manage multi-session development workflows with SESSION.md task files, PROGRESS.md tracking, auto-commits, model configuration, and subagent delegation. Use when executing implementation plans, managing long-running development tasks across sessions, tracking progress across repositories/modules, or coordinating parallel workstreams. Supports both Claude Code CLI and claude.ai for review.
---

# Session Orchestrator

Coordinate multi-session development workflows with persistent context, progress tracking, and automatic commits.

## Core Concepts

| Component | Purpose | Location |
|-----------|---------|----------|
| **SESSION.md** | Active task — prompt, context, model config | `docs/sessions/SESSION.md` |
| **PROGRESS.md** | Chronological log by repository | `docs/progress/{PROJECT}_PROGRESS.md` |
| **Implementation Plan** | Source of all prompts (separate skill) | `docs/{PROJECT}_PROMPTS.md` |

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION PLAN                       │
│  (Contains all prompts, dependencies, parallel execution)    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      SESSION.md                              │
│  Load current prompt → Execute → Verify → Commit             │
└─────────────────────────────┬───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
         Claude CLI      Subagents       claude.ai
         (code work)     (parallel)      (review)
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     PROGRESS.md                              │
│  Log completion → Update status → Record commit hash         │
└─────────────────────────────────────────────────────────────┘
```

## Session Lifecycle

### 1. Start Session

```bash
# Load prompt from implementation plan into SESSION.md
python scripts/init_session.py BE-04 --plan docs/PIPELINE_PROMPTS.md
```

This creates/overwrites `docs/sessions/SESSION.md` with:
- Session metadata (ID, phase, dependencies)
- System configuration (model, ultrathink, temperature)
- Skills registry
- Subagent definitions (if applicable)
- Full prompt content
- Verification checklist

### 2. Execute Session

**In Claude Code CLI:**
```bash
# Open SESSION.md and execute
claude "Read docs/sessions/SESSION.md and execute the prompt"
```

**For Review in claude.ai:**
- Paste SESSION.md content
- Get architectural review or analysis
- Copy summary back to CLI context if needed

### 3. Complete Session

```bash
# Mark complete, commit, update progress
python scripts/complete_session.py BE-04 --message "feat(nib): implement matcher engine"
```

This:
1. Runs verification checklist commands
2. Commits all changes with standardized message
3. Updates PROGRESS.md with completion time and commit hash
4. Clears SESSION.md (ready for next session)

## Execution Modes

| Icon | Mode | When to Use |
|------|------|-------------|
| 🖥️ CLI | Claude Code terminal | All code implementation |
| 📝 VSCode | Claude in IDE | Quick edits, debugging |
| 🌐 claude.ai | Web interface | Architecture review, analysis, planning |
| ⚡ Quick | < 30 min | Simple tasks |
| 🔨 Medium | 30-60 min | Standard implementation |
| 🏗️ Heavy | > 60 min | Complex features (use checkpoints) |
| 🧠 Ultrathink | Extended thinking | Architecture, algorithms, debugging |
| 🤖 Subagents | Parallel execution | Independent workstreams |

## Model Selection

| Task Type | Model | Ultrathink |
|-----------|-------|------------|
| Simple CRUD, docs | Haiku | No |
| Standard implementation | Sonnet | No |
| Complex logic, algorithms | Sonnet | Yes |
| Architecture decisions | Sonnet | Yes |
| Cross-module analysis | Sonnet | Yes |
| Debugging complex issues | Sonnet | Yes |

**Ultrathink triggers:** See [references/model-selection.md](references/model-selection.md)

## Subagent Delegation

Use subagents when:
- Work can be parallelized (no shared state)
- Tasks are independent (different files/modules)
- Context separation improves focus

```yaml
sub_agents:
  - name: DatabaseArchitect
    role: Design schema and migrations
    model: claude-sonnet-4-20250514
    responsibilities:
      - Define table structures
      - Create indexes
      - Plan migration sequence
    
  - name: APIBuilder
    role: Implement endpoints
    model: claude-sonnet-4-20250514
    responsibilities:
      - Create controller routes
      - Implement service layer
      - Add validation
```

**Subagent patterns:** See [references/subagents.md](references/subagents.md)

## Progress Tracking

PROGRESS.md is organized by repository with chronological logs:

```markdown
# Project Progress

## Repository: payroll-converter-backend

### Week 1
| Session | Status | Started | Completed | Commit |
|---------|--------|---------|-----------|--------|
| BE-01 | ✅ Done | 2026-01-02 09:00 | 2026-01-02 10:30 | a1b2c3d |
| BE-02 | ✅ Done | 2026-01-02 09:15 | 2026-01-02 10:00 | e4f5g6h |
| BE-03 | 🔄 Active | 2026-01-02 11:00 | — | — |

### Notes
- BE-01: Added pg_trgm extension for fuzzy matching
- BE-02: Migrated 5 parsers, deprecated old location

## Repository: payroll-converter-frontend

### Week 3
| Session | Status | Started | Completed | Commit |
|---------|--------|---------|-----------|--------|
| FE-01 | ⬜ Pending | — | — | — |
```

## Commit Patterns

All commits follow:
```
<type>(<scope>): <description>

<body>

Part of: <Project> Phase <N>
Session: <SESSION-ID>
```

**Checkpoint commits** (for heavy sessions):
```
WIP: [SESSION-ID] checkpoint - <description>

Completed:
- Task 1: [done]
- Task 2: [done]

Remaining:
- Task 3: [pending]
```

## Quick Reference

### Initialize Project Tracking

```bash
mkdir -p docs/sessions docs/progress
python scripts/init_progress.py "Pipeline Unification" --repos backend frontend
```

### Session Commands

```bash
# Start session
python scripts/init_session.py <SESSION-ID> --plan <PLAN.md>

# Checkpoint (heavy sessions)
python scripts/checkpoint_session.py <SESSION-ID> --message "completed task 2"

# Complete session
python scripts/complete_session.py <SESSION-ID> --message "feat: description"

# View current session
cat docs/sessions/SESSION.md

# View progress
cat docs/progress/*_PROGRESS.md
```

### Rollback

```bash
# Rollback last commit
git revert HEAD

# Rollback to checkpoint
git revert HEAD~2..HEAD

# Rollback migration
alembic downgrade -1
```

## Templates

- **SESSION.md format:** See [references/session-format.md](references/session-format.md)
- **PROGRESS.md format:** See [references/progress-format.md](references/progress-format.md)
- **Commit patterns:** See [references/commit-patterns.md](references/commit-patterns.md)
