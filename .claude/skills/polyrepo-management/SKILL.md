---
name: polyrepo-management
description: Manage multiple external repositories with shared context and cross-workspace features. Use when setting up microservices development, needing cross-project context or inheritance, or working with poly-repo architecture. Provides workspace commands, 5-level context hierarchy, and universal memory patterns.
---

# Polyrepo Management

Orchestrate poly-repo development workflows with Solomon's workspace system.

## Core Concepts

| Component | Purpose | Location |
|-----------|---------|----------|
| **Workspace** | External repository registration | `~/.solomon/workspaces.json` |
| **State** | Active workspace/feature tracking | `~/.solomon/state.json` |
| **Repos** | Cloned repositories | `~/.solomon/repos/{slug}/` |
| **Context** | 5-level memory hierarchy | Mem0 with workspace scoping |

## Workspace Commands

| Command | Description |
|---------|-------------|
| `workspace add` | Register external repository (REGISTERED status) |
| `workspace clone` | Clone to `repos/` directory (CLONED status) |
| `workspace sync` | Pull changes with `git pull --rebase --autostash` |
| `workspace status` | Show branch, uncommitted, unpushed, behind counts |
| `workspace switch` | Set active workspace context |
| `workspace delete` | Remove workspace (archives linked features) |
| `workspace list` | Display all workspaces with status |
| `workspace current` | Show active workspace and feature |

## Workflow

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTER WORKSPACE                        │
│  solomon workspace add "my-api" https://github.com/org/api  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      CLONE REPOSITORY                        │
│  solomon workspace clone my-api → repos/my-api/             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    CREATE FEATURE                            │
│  solomon feature add "auth" --workspace my-api              │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   LOAD 5-LEVEL CONTEXT                       │
│  Universal → Project → Inherited → Feature → Session        │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXECUTE IN WORKSPACE                       │
│  Code changes happen in repos/my-api/ directory             │
└─────────────────────────────────────────────────────────────┘
```

## 5-Level Context Hierarchy

When using workspaces, Solomon queries Mem0 at 5 levels:

| Level | Scope | Example |
|-------|-------|---------|
| **Universal** | ALL workspaces | "Always validate at API boundaries" |
| **Project** | Current workspace | "my-api uses PostgreSQL with pgvector" |
| **Inherited** | Parent features | "AUTH feature uses JWT tokens" |
| **Feature** | Current feature | "Payments requires idempotency keys" |
| **Session** | Prior sessions | "PAY-01 established error handling pattern" |

## Cross-Workspace Inheritance

Features can inherit from other workspaces:

```bash
# Same workspace inheritance
inherit_from = ["AUTH", "CACHE"]

# Cross-workspace inheritance (workspace:FEATURE format)
inherit_from = ["my-api:CACHE", "auth-service:SSO"]
```

**Format:** `"workspace-slug:FEATURE-PREFIX"`

## Constraints

| Priority | Constraint |
|----------|------------|
| Critical | Workspace must be CLONED before creating features in it |
| Critical | Cross-workspace inherit_from uses "workspace:FEATURE" format |
| Critical | repository_path must be relative, not absolute |
| High | Use git pull --rebase --autostash for sync operations |
| High | Archive linked features before deleting workspace |
| High | Deduplicate memories across workspace queries |

## Forbidden Patterns

| Pattern | Reason |
|---------|--------|
| Hardcoding absolute paths to repos | Breaks isolation |
| Tests that require actual git clone | Requires network |
| Deleting workspace without archiving features | Data loss |
| Cross-workspace reference without colon | Invalid format |
| Modifying real ~/.solomon in tests | State corruption |

## Example: Microservices Setup

```bash
# 1. Register all services
solomon workspace add "user-service" https://github.com/org/users.git
solomon workspace add "payment-service" https://github.com/org/payments.git
solomon workspace add "api-gateway" https://github.com/org/gateway.git

# 2. Clone active development repos
solomon workspace clone user-service
solomon workspace clone api-gateway

# 3. Create cross-service feature
solomon feature add "auth-flow" \
  --prefix AUF \
  --workspace api-gateway \
  --inherit-from "user-service:AUTH"

# 4. Switch between workspaces
solomon workspace switch user-service

# 5. Check all workspace status
solomon workspace list
```

## Example: Sync Workflow

```bash
# Check what's available
solomon workspace status user-service
# Shows: "Behind remote: 3 commits"

# Pull with rebase
solomon workspace sync user-service
# Shows: "Synced 3 commits"

# If conflicts occur:
cd ~/.solomon/repos/user-service
git status  # View conflicts
# ... resolve manually ...
git add .
git rebase --continue
```

## Example: Universal Learning

```python
from solomon_mcp.context import SharedContextService

service = SharedContextService.get_instance()

# Store pattern accessible from any workspace
await service.store_universal_learning(
    content="Always validate input at API boundaries",
    tags=["security", "validation", "api"]
)
```

## Verification Checklist

- [ ] Workspace status is CLONED before feature creation
- [ ] Cross-workspace refs use "workspace:FEATURE" format
- [ ] repository_path does not start with /
- [ ] get_5_level_context returns all 5 keys
- [ ] No duplicate memories in inherited results
- [ ] Empty results when Mem0 unavailable, not errors
