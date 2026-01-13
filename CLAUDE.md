# Solomon Workspace

**Project:** Solomon — MCP-Native HFS Workflow Companion
**Architecture:** Claude Code Plugin
**Workflow:** HFS Agentic Workflow v1.8

## Repository Overview

```
solomon-workspace/
├── .claude/
│   ├── commands/         # HFS session commands
│   │   ├── load-session.md
│   │   ├── run-session.md
│   │   └── complete-session.md
│   └── skills/           # HFS skills (14 total)
│
├── solomon/              # Main plugin repository (git)
│   ├── solomon_mcp/      # Custom MCP servers
│   ├── agents/           # Subagents (researcher, planner, reviewer)
│   ├── commands/         # Slash commands
│   └── config/           # Plugin configuration
│
└── solomon-docs/         # Documentation & tracking (git)
    ├── plans/            # Architecture plans
    ├── progress/         # Execution tracking (SOLOMON_PROGRESS.md)
    ├── sessions/         # Active session (SESSION.md)
    ├── prompts/          # Implementation prompts
    └── reference/        # Research and reference docs
```

## Current Status

- **Phase:** Phase 1 - Foundation
- **Active Session:** SOL-04 (MCP Integration)
- **Completed:** SOL-01, SOL-02, SOL-03
- **Working Directory:** solomon/

## HFS Session Commands

```bash
# Load a session from PROMPTS into SESSION.md
/load-session SOL-04

# Execute the active session
/run-session

# Complete session: verify, commit, update progress
/complete-session "feat(config): add MCP server configuration"
```

## Session Lifecycle

```
/load-session SOL-XX     # Load prompt → SESSION.md, mark 🔄 Active
        ↓
/run-session             # Execute tasks, run verification
        ↓
/complete-session "msg"  # Commit → Update PROGRESS.md → Archive session
```

## Integration Points

- **Mem0:** Persistent memory across sessions
- **Context7:** Up-to-date library documentation
- **Claude HUD:** Real-time session visibility
- **GitHub MCP:** Version control integration

## Feature Registry (Planned)

Multi-feature management system extending Solomon beyond single-plan execution.

**Core Principles:**
- **Execution Isolation** — Each feature has its own prefix, sessions, and progress
- **Knowledge Sharing** — Project-level decisions flow to all features via Mem0
- **Inheritance** — Features can inherit patterns from completed features
- **Library Caching** — Context7 docs cached at project level

**Feature Commands:**
```bash
# List all features with status
/solomon feature list

# Add a new feature
/solomon feature add "feature-name" --prefix ABC --plan docs/plans/PLAN.md

# Switch active feature
/solomon feature switch feature-name

# Import feature from bundle
/solomon feature import bundle.zip
```

**Feature Status Flow:**
```
PLANNING → PROMPTS_READY → IN_PROGRESS → COMPLETED
                                ↓
                            BLOCKED
```

**Session Prefixes:**
| Feature | Prefix | Sessions |
|---------|--------|----------|
| initial-build | SOL | SOL-01, SOL-02, ... |
| feature-registry | FTR | FTR-01, FTR-02, ... |

**Implementation:** 9 sessions (FTR-01 → FTR-09) across 3 phases
- Phase 1: Foundation (models, repository)
- Phase 2: Commands (list, add, switch, import)
- Phase 3: Integration (scoping, phased prompts, shared context)

**Plan Reference:** `solomon-docs/plans/FEATURE_REGISTRY_PLAN_FINAL.md`

## Skills Available

All 14 HFS skills loaded in `.claude/skills/`:
- development-workflow, session-orchestrator, hfs-vscode-orchestrator
- deep-app-research, project-plan-creator, implementation-plan-generator
- plan-review-loop, hfs-project-bootstrap
- python-backend-scaffold, fullstack-integration, debugging-workflow
- backend-e2e-testing, playwright-e2e-testing
- hfs-skill-creator
