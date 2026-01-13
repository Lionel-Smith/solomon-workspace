---
name: solomon-status
description: Display project progress in a visual dashboard format. Use when checking session completion status, viewing blocked sessions, or getting an overview of project phases. Shows progress bars, session statuses, commit hashes, and identifies blockers.
---

# Solomon Status

Display project progress in a visual dashboard format.

## Usage

```
/solomon-status [project-name]
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| project-name | No | Project to show status for (default: current project) |

## Execution Flow

### Step 1: Identify Project

1. If project-name provided, use it
2. Otherwise, detect from current directory

### Step 2: Fetch Progress

1. Call `solomon-projects.get_progress(project_name={project})`
2. Parse returned `ProjectProgress` structure

### Step 3: Calculate Metrics

For each phase, calculate:
- Total sessions
- Completed sessions
- Active sessions
- Blocked sessions
- Completion percentage

### Step 4: Display Dashboard

```
SOLOMON Project Status
  Project: {project_name}
  Updated: {last_updated}

## Phase 1: Foundation
[████████████████████████████████████████] 100% (5/5)

  SOL-01  Skills MCP Server          45 min   9556160
  SOL-02  Projects MCP Server        45 min   02ca074
  SOL-03  Plugin Scaffold            20 min   341ed7d

## Phase 2: Core Commands
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 25% (1/4)

  CMD-01  Session Command            30 min   f1c3599
  CMD-02  Status Command             —        —

Overall: 50% complete (6/12 sessions)
Current: CMD-02 (Status Command)
Next available: CMD-03, CMD-04
```

### Status Icons

| Icon | Status |
|------|--------|
| ⬜ | Pending |
| 🔄 | Active |
| ✅ | Complete |
| ❌ | Blocked |

## Constraints

- **HIGH**: Show accurate progress percentages
- **HIGH**: Display blocked sessions with their blockers
- **MEDIUM**: Show commit hashes for completed sessions

## Examples

```bash
/solomon-status
/solomon-status solomon
```
