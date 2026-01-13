---
name: hfs-vscode-orchestrator
description: Orchestrate HFS development in VSCode with Claude CLI integration. Manages poly-repo workspace with shared session documents, automatic progress tracking, and reusable Claude commands. Triggers on "setup hfs workspace", "configure vscode for hfs", "run session with claude cli", "create poly-repo structure".
version: 1.0
author: High Functioning Solutions Ltd.
date: January 5, 2026
---

# HFS VSCode Workspace Orchestrator

Complete development environment for HFS projects using VSCode + Claude CLI with poly-repo architecture.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        HFS POLY-REPO WORKSPACE                               │
│                                                                              │
│  Example: BDOCS-PIS/ (Prison Information System)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Root Level                                                           │   │
│  │  ├── CLAUDE.md                  Project context for Claude CLI        │   │
│  │  ├── README.md                  Workspace documentation               │   │
│  │  └── {project}.code-workspace   VSCode multi-root workspace           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  .claude/                       Claude CLI Configuration              │   │
│  │  ├── commands/                  Reusable slash commands               │   │
│  │  │   ├── run-session.md         Execute SESSION.md tasks              │   │
│  │  │   ├── load-session.md        Load from PROMPTS → SESSION.md       │   │
│  │  │   └── complete-session.md    Commit + update PROGRESS.md          │   │
│  │  └── skills/                                                          │   │
│  │      └── HFS_ALL_SKILLS.md      Combined coding patterns              │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  {project}-docs/                Documentation Repository              │   │
│  │  ├── .git/ ────────────────────► github.com/hfs/{project}-docs       │   │
│  │  ├── plans/                     Architecture plans                    │   │
│  │  │   ├── {PROJECT}_MASTER_PLAN.md                                    │   │
│  │  │   └── {PROJECT}_PHASE_N_COMPLETE.md                               │   │
│  │  ├── progress/                                                        │   │
│  │  │   └── {PROJECT}_PROGRESS.md  ← Updated after EVERY session        │   │
│  │  ├── sessions/                                                        │   │
│  │  │   ├── SESSION.md             ← Claude reads this to execute       │   │
│  │  │   └── SESSION_HISTORY.md     Archive of completed sessions        │   │
│  │  ├── reference/                                                       │   │
│  │  │   └── {PROJECT}_QUICK_REFERENCE.md                                │   │
│  │  └── prompts/                                                         │   │
│  │      └── {PROJECT}_PROMPTS.md   Source of all session prompts        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  {project}-api/                 Backend Repository                    │   │
│  │  ├── .git/ ────────────────────► github.com/hfs/{project}-api        │   │
│  │  ├── src/modules/               3-layer feature modules               │   │
│  │  │   └── {feature}/                                                   │   │
│  │  │       ├── controller.py      Routes, auto-discovered              │   │
│  │  │       ├── service.py         Business logic                        │   │
│  │  │       ├── repository.py      Database queries                      │   │
│  │  │       ├── dtos.py            Pydantic schemas                      │   │
│  │  │       └── models.py          SQLAlchemy models                     │   │
│  │  ├── src/models/                Shared models                         │   │
│  │  ├── scripts/seeds/             Seed data modules                     │   │
│  │  ├── tests/                     pytest tests                          │   │
│  │  ├── migrations/                Alembic migrations                    │   │
│  │  ├── Pipfile                    Python dependencies                   │   │
│  │  └── docker-compose.yml                                               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  {project}-web/                 Frontend Repository                   │   │
│  │  ├── .git/ ────────────────────► github.com/hfs/{project}-web        │   │
│  │  ├── src/                                                             │   │
│  │  │   ├── api/                   API client functions                  │   │
│  │  │   ├── components/            Feature + shared UI                   │   │
│  │  │   │   └── ui/                Reusable primitives                   │   │
│  │  │   ├── hooks/                 Custom hooks                          │   │
│  │  │   ├── pages/                 Route pages                           │   │
│  │  │   └── types/                 TypeScript interfaces                 │   │
│  │  ├── package.json                                                     │   │
│  │  └── vite.config.ts                                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  {project}-worker/ (optional)   Background Jobs Repository            │   │
│  │  ├── .git/ ────────────────────► github.com/hfs/{project}-worker     │   │
│  │  └── tasks/                     Celery/RQ definitions                 │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Session Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CLAUDE CLI SESSION LIFECYCLE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  STEP 1: LOAD SESSION                                                  ║  │
│  ║                                                                        ║  │
│  ║  Terminal: claude /load-session BE-04                                  ║  │
│  ║                                                                        ║  │
│  ║  Claude Actions:                                                       ║  │
│  ║  ┌────────────────────────────────────────────────────────────────┐   ║  │
│  ║  │ 1. Read {project}-docs/prompts/{PROJECT}_PROMPTS.md           │   ║  │
│  ║  │ 2. Find session block for BE-04                                │   ║  │
│  ║  │ 3. Extract: required_skills, working_directory, dependencies   │   ║  │
│  ║  │ 4. Verify dependencies are ✅ in PROGRESS.md                   │   ║  │
│  ║  │ 5. Write session to {project}-docs/sessions/SESSION.md        │   ║  │
│  ║  │ 6. Update PROGRESS.md: BE-04 → 🔄 Active, Started: now        │   ║  │
│  ║  └────────────────────────────────────────────────────────────────┘   ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                       │                                      │
│                                       ▼                                      │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  STEP 2: RUN SESSION                                                   ║  │
│  ║                                                                        ║  │
│  ║  Terminal: claude /run-session                                         ║  │
│  ║                                                                        ║  │
│  ║  Claude Actions:                                                       ║  │
│  ║  ┌────────────────────────────────────────────────────────────────┐   ║  │
│  ║  │ 1. Read workspace CLAUDE.md for project context                │   ║  │
│  ║  │ 2. Read .claude/commands/run-session.md for instructions       │   ║  │
│  ║  │ 3. Read {project}-docs/sessions/SESSION.md                    │   ║  │
│  ║  │ 4. Load each skill from required_skills field                  │   ║  │
│  ║  │ 5. cd to working_directory                                     │   ║  │
│  ║  │ 6. Execute all tasks from session prompt                       │   ║  │
│  ║  │ 7. Run verification checklist                                  │   ║  │
│  ║  │ 8. Report results (DO NOT commit or update PROGRESS.md)        │   ║  │
│  ║  └────────────────────────────────────────────────────────────────┘   ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                       │                                      │
│                                       ▼                                      │
│  ╔═══════════════════════════════════════════════════════════════════════╗  │
│  ║  STEP 3: COMPLETE SESSION                                              ║  │
│  ║                                                                        ║  │
│  ║  Terminal: claude /complete-session "feat(api): add validation"        ║  │
│  ║                                                                        ║  │
│  ║  Claude Actions:                                                       ║  │
│  ║  ┌────────────────────────────────────────────────────────────────┐   ║  │
│  ║  │ 1. Read SESSION.md for session_id, working_directory           │   ║  │
│  ║  │ 2. cd {working_directory} && git add -A                        │   ║  │
│  ║  │ 3. git commit -m "{message}\n\nSession: {session_id}"          │   ║  │
│  ║  │ 4. Capture commit hash                                         │   ║  │
│  ║  │ 5. Update PROGRESS.md:                                         │   ║  │
│  ║  │    - Status: ✅ Complete                                       │   ║  │
│  ║  │    - Completed: {timestamp}                                    │   ║  │
│  ║  │    - Commit: {hash}                                            │   ║  │
│  ║  │ 6. Append SESSION.md → SESSION_HISTORY.md                      │   ║  │
│  ║  │ 7. Clear SESSION.md (ready for next)                           │   ║  │
│  ║  │ 8. Commit docs changes                                         │   ║  │
│  ║  └────────────────────────────────────────────────────────────────┘   ║  │
│  ╚═══════════════════════════════════════════════════════════════════════╝  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Claude CLI Command Files

### .claude/commands/run-session.md

```markdown
# /run-session

Execute the active session from SESSION.md.

## Instructions

1. **Read Session File**
   ```bash
   cat {project}-docs/sessions/SESSION.md
   ```
   If it shows "No Active Session", tell user to run `/load-session {ID}` first.

2. **Parse Metadata**
   From the SESSION METADATA block, extract:
   - `session_id`: e.g., BE-04
   - `working_directory`: e.g., bdocs-api
   - `required_skills`: list of skills to load
   - `dependencies`: sessions that must be ✅

3. **Verify Dependencies**
   Check PROGRESS.md - all dependencies must show ✅ Complete.
   If not, warn user and list incomplete dependencies.

4. **Load Required Skills**
   For each skill in `required_skills`:
   ```
   Read .claude/skills/HFS_ALL_SKILLS.md, find section for {skill}
   ```

5. **Change Directory**
   ```bash
   cd {working_directory}
   ```

6. **Execute Tasks**
   Follow the PROMPT section exactly:
   - Create files in specified paths
   - Implement code per patterns in loaded skills
   - Run commands as instructed

7. **Run Verification Checklist**
   Execute each item in VERIFICATION CHECKLIST:
   ```bash
   # Backend
   pipenv run pytest -v
   pipenv run ruff check .
   
   # Frontend
   npm run type-check
   npm run lint
   ```

8. **Report Results**
   ```
   ✅ Session {session_id} tasks completed
   
   Files modified:
   - path/to/file1.py
   - path/to/file2.py
   
   Verification:
   ✓ Tests pass
   ✓ Lint clean
   
   Next: Run `/complete-session "{commit_message}"` to commit
   ```

## Rules
- DO NOT modify PROGRESS.md (use /complete-session)
- DO NOT commit changes (use /complete-session)
- Ask clarification if prompt is ambiguous
```

### .claude/commands/load-session.md

```markdown
# /load-session {SESSION_ID}

Load a session from PROMPTS.md into SESSION.md.

## Usage
```
/load-session BE-04
/load-session FE-02
```

## Instructions

1. **Identify Project**
   Find the prompts file in `{project}-docs/prompts/`

2. **Extract Session**
   Search for session block with matching ID:
   ```
   session_id: {SESSION_ID}
   ```
   Copy from SESSION METADATA through VERIFICATION CHECKLIST.

3. **Check Dependencies**
   Read `dependencies` field. For each:
   - Check PROGRESS.md for ✅ status
   - Warn if any incomplete

4. **Write SESSION.md**
   Create `{project}-docs/sessions/SESSION.md`:
   ```markdown
   # Active Session
   
   **Loaded:** {timestamp}
   **Project:** {project_name}
   
   ---
   
   {EXTRACTED SESSION CONTENT}
   ```

5. **Update PROGRESS.md**
   Find session row, update:
   ```
   | {SESSION_ID} | 🔄 Active | {timestamp} | — | — | — |
   ```

6. **Confirm**
   ```
   ✅ Loaded session {SESSION_ID}
   
   Title: {title}
   Working Dir: {working_directory}
   Time Estimate: {estimated_time}
   Skills: {required_skills}
   
   Run `/run-session` to execute.
   ```
```

### .claude/commands/complete-session.md

```markdown
# /complete-session "{commit_message}"

Complete session: commit changes, update progress, archive.

## Usage
```
/complete-session "feat(api): add inmate validation"
/complete-session "fix(web): correct date format"
```

## Instructions

1. **Read SESSION.md**
   Get: session_id, working_directory, title

2. **Run Quick Verification**
   ```bash
   cd {working_directory}
   
   # Backend
   [ -f Pipfile ] && pipenv run pytest -v --tb=short
   [ -f Pipfile ] && pipenv run ruff check .
   
   # Frontend  
   [ -f package.json ] && npm run type-check
   ```
   Ask user to confirm if any fail.

3. **Commit Working Directory**
   ```bash
   cd {working_directory}
   git add -A
   git commit -m "{commit_message}

   Session: {session_id}"
   ```
   
   Capture hash:
   ```bash
   git rev-parse --short HEAD
   ```

4. **Update PROGRESS.md**
   Find row for {session_id}, update:
   ```
   | {session_id} | ✅ Complete | {start} | {now} | {hash} | — |
   ```

5. **Archive Session**
   Append to SESSION_HISTORY.md:
   ```markdown
   ---
   ## {session_id} - Completed {timestamp}
   
   {SESSION.md content}
   
   **Commit:** {hash}
   ---
   ```

6. **Clear SESSION.md**
   ```markdown
   # No Active Session
   
   Last completed: {session_id} at {timestamp}
   
   ## Next Steps
   Run `/load-session {NEXT_ID}` to continue.
   
   ## Pending Sessions
   {list from PROGRESS.md with ⬜ status}
   ```

7. **Commit Docs**
   ```bash
   cd {project}-docs
   git add -A
   git commit -m "docs: complete session {session_id}"
   ```

8. **Report**
   ```
   ✅ Session {session_id} completed!
   
   Commit: {hash} ({working_directory})
   Duration: {calculated}
   
   Next pending:
   - {next_session_1}
   - {next_session_2}
   ```
```

## File Formats

### SESSION.md

```markdown
# Active Session

**Session ID:** BE-04
**Loaded:** 2026-01-06 00:14
**Project:** BDOCS Prison Information System

---

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SESSION METADATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
session_id: BE-04
phase: 1
track: Backend
title: "Implement Inmate Validation Service"
execution: 🔨 Medium
estimated_time: 45 min
working_directory: bdocs-api
dependencies: [BE-01, BE-02, BE-03]
required_skills:
  - python-backend-scaffold
  - backend-e2e-testing
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SYSTEM CONFIGURATION  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
model: claude-sonnet-4-20250514
ultrathink: false
temperature: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROMPT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## Context
You are implementing the inmate validation service for BDOCS.

## Tasks

### Task 1: Create Validation Service
Create `src/modules/inmates/validation_service.py`:
[code example]

### Task 2: Add Unit Tests
Create `tests/unit/test_inmate_validation.py`:
[test requirements]

### Task 3: Integrate with Controller
Update controller to use validation.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
VERIFICATION CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ ] validation_service.py created
[ ] Tests pass: pipenv run pytest tests/unit/test_inmate_validation.py -v
[ ] Ruff clean: pipenv run ruff check src/modules/inmates/
[ ] Manual: Invalid data returns 400
```

### PROGRESS.md

```markdown
# BDOCS Progress Tracker

**Project:** BDOCS Prison Information System
**Started:** January 3, 2026
**Last Updated:** January 6, 2026

---

## Summary

| Track | Total | ✅ Done | 🔄 Active | ⬜ Pending |
|-------|-------|---------|-----------|------------|
| Backend | 12 | 3 | 1 | 8 |
| Frontend | 8 | 0 | 0 | 8 |
| Database | 4 | 2 | 0 | 2 |

---

## Phase 1: Core Infrastructure

### Backend (bdocs-api)

| Session | Title | Status | Started | Completed | Commit | Notes |
|---------|-------|--------|---------|-----------|--------|-------|
| BE-01 | Project Scaffold | ✅ Complete | Jan 3 09:00 | Jan 3 10:30 | a1b2c3d | — |
| BE-02 | Database Models | ✅ Complete | Jan 3 11:00 | Jan 3 13:00 | e4f5g6h | — |
| BE-03 | Auth Module | ✅ Complete | Jan 4 09:00 | Jan 4 11:30 | i7j8k9l | JWT |
| BE-04 | Inmate Validation | 🔄 Active | Jan 6 00:14 | — | — | — |
| BE-05 | Inmate CRUD | ⬜ Pending | — | — | — | → BE-04 |

### Frontend (bdocs-web)

| Session | Title | Status | Started | Completed | Commit | Notes |
|---------|-------|--------|---------|-----------|--------|-------|
| FE-01 | Project Setup | ⬜ Pending | — | — | — | — |
| FE-02 | Auth Pages | ⬜ Pending | — | — | — | → BE-03 |

---

## Dependency Graph

```
BE-01 ─► BE-02 ─► BE-03 ─► BE-04 ─► BE-05
                    │
                    └─► FE-02 ─► FE-03
```
```

## Workspace Initialization

### Quick Setup Command

```bash
# Create new HFS workspace
./init-hfs-workspace.sh myproject

# Structure created:
# myproject-workspace/
# ├── CLAUDE.md
# ├── .claude/commands/
# ├── myproject-docs/ (git repo)
# ├── myproject-api/  (git repo)
# └── myproject-web/  (git repo)
```

### Manual Setup Checklist

```
[ ] Create workspace folder: {project}-workspace/
[ ] Create CLAUDE.md with project overview
[ ] Create .claude/commands/ with run-session.md, load-session.md, complete-session.md
[ ] Copy HFS_ALL_SKILLS.md to .claude/skills/
[ ] Initialize {project}-docs/ with git
[ ] Create docs structure: plans/, progress/, sessions/, reference/, prompts/
[ ] Create empty SESSION.md
[ ] Create PROGRESS.md template
[ ] Initialize {project}-api/ with git
[ ] Initialize {project}-web/ with git
[ ] Create .code-workspace file
[ ] Add remote origins to each repo
```

## Integration with HFS Workflow v1.5

```
Phase 0    → Research
Phase 1    → Architecture Plan
Phase 2    → Implementation Prompts
Phase 2.5  → Pre-Execution Review
Phase 2.6  → Seed Data Planning
Phase 2.7  → Quality Gate (plan-review-loop)
Phase 2.8  → Bundle Creation
Phase 2.9  → Workspace Setup ← THIS SKILL
Phase 3    → Execution Loop (Claude CLI)
           ┌──────────────────────────────┐
           │  /load-session {ID}          │
           │  /run-session                │
           │  /complete-session "{msg}"   │
           │  Repeat until done           │
           └──────────────────────────────┘
```

## Quick Reference

| Command | Purpose |
|---------|---------|
| `claude /load-session BE-04` | Load session into SESSION.md |
| `claude /run-session` | Execute current SESSION.md |
| `claude /complete-session "msg"` | Commit, update PROGRESS.md |
| `cat *-docs/sessions/SESSION.md` | View current session |
| `cat *-docs/progress/*.md` | View progress |

| Prefix | Repo | Directory |
|--------|------|-----------|
| BE- | Backend | {project}-api |
| FE- | Frontend | {project}-web |
| DB- | Database | {project}-api |
| WK- | Worker | {project}-worker |

| Status | Meaning |
|--------|---------|
| ⬜ | Pending |
| 🔄 | Active |
| ✅ | Complete |
| ❌ | Failed |
| ⏸️ | Paused |

---

*HFS VSCode Workspace Orchestrator v1.0*
*High Functioning Solutions Ltd.*
