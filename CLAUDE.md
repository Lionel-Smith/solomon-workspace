# Solomon Workspace

**Project:** Solomon — MCP-Native HFS Workflow Companion
**Architecture:** Claude Code Plugin
**Workflow:** HFS Agentic Workflow v2.0

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
├── solomon-docs/         # Documentation & tracking (git)
│   ├── plans/            # Architecture plans
│   ├── progress/         # Execution tracking (SOLOMON_PROGRESS.md)
│   ├── sessions/         # Active session (SESSION.md)
│   ├── prompts/          # Implementation prompts
│   └── reference/        # Research and reference docs
│
├── hfs-aiops/            # MCP-native AI operations server (git)
│   ├── clawdbot/         # Main package
│   │   ├── models/       # Pydantic/dataclass models
│   │   ├── services/     # Business logic services
│   │   ├── tools/        # MCP tool definitions
│   │   └── utils/        # Shared utilities
│   ├── scripts/          # Setup scripts (CrowdSec, Restic, etc.)
│   ├── cron/             # Cron job definitions
│   ├── tests/            # pytest test suite
│   └── docs/             # Progress tracking & session files
│
└── hfs-development-kit/  # HFS workflow specs & skills (git)
    ├── workflow/          # Session & workflow format specs
    ├── skills/            # Canonical HFS skill definitions
    ├── starter-kit/       # Project bootstrap templates
    ├── scripts/           # Utility scripts
    ├── docs/              # Progress & session tracking
    └── retrospectives/    # Project retrospectives
```

## Current Status

- **Version:** 1.4.0 (HFS v2.0 Alignment)
- **Workflow:** HFS Agentic Workflow v2.0
- **Working Directory:** solomon/

## Default Posture (karpathy-guidelines)

Default to the four [`karpathy-guidelines`](https://github.com/forrestchang/andrej-karpathy-skills) principles for **feature work and bug fixes**:

1. **Think Before Coding** — surface assumptions, ask when unclear, present multiple interpretations rather than picking silently
2. **Simplicity First** — minimum code that solves the stated problem, no speculative features or single-use abstractions
3. **Surgical Changes** — touch only what's required, match existing style, don't drive-by-refactor adjacent code
4. **Goal-Driven Execution** — transform tasks into verifiable success criteria with `→ verify: <check>` per step

**Scope boundary**: these defaults are *opted out of* during dedicated improvement sprints (refactor passes, skill-refresh sprints like SKR-1/SKR-2, polish/harden/optimize-style work) where adjacent improvements are the explicit ask. The HFS skills `polish`, `harden`, `optimize`, `arrange`, etc. are improvement-mode tools — the karpathy "don't touch adjacent code" rule does not apply when one of those skills is active.

**Why this works**: the principles overlap heavily with our persistent feedback memories (`feedback_discovery_and_research_first.md`, `feedback_integration_temptation.md`) but consolidate them into a single citable named posture.

## Droplet Integration (2026-01-31)

- **Droplet:** solomon-HFS (ID: 548434579)
- **IP:** 198.199.121.241
- **SSH:** `ssh solomon` (root, ~/.ssh/id_ed25519)
- **Service:** `systemctl restart clawdbot`
- **CLI:** `/opt/clawdbot-cli.sh` (v2026.1.24-1)
- **Config:** `/home/clawdbot/.clawdbot/clawdbot.json`
- **Workspace:** `/home/clawdbot/clawd/`

### Active Integrations
| Integration | Status | Details |
|-------------|--------|---------|
| Slack | Connected | Socket mode, open group policy |
| Linear | Ready | Team HIG, GraphQL API via curl |
| Gmail | Ready | info@highfunctioningsolutions.com via gog CLI |
| Heartbeat | Active | 24h interval, sonnet model |
| Mem0 | Connected | Persistent memory via REST API, $MEM0_API_KEY in sandbox env |
| Context7 | Connected | Library docs via REST API, no auth required |

### Custom Skills (in workspace)
| Skill | Source | Purpose |
|-------|--------|---------|
| linear | clawdbot-workspace | Linear ticket management with actual team/project IDs |
| email-triage | clawdbot-workspace | Gmail triage with urgency categories, NEVER auto-send |
| idb-funding | clawdbot-workspace | IDB deadline tracking (Sept 30, 2026) |
| reporting | clawdbot-workspace | Daily standup, weekly summary, project health |
| meetings | clawdbot-workspace | Meeting notes and action item capture |
| mem0-memory | clawdbot-workspace | Persistent memory store/search via Mem0 REST API |
| context7-docs | clawdbot-workspace | Library documentation lookup via Context7 REST API |

### Workspace Files
| File | Purpose |
|------|---------|
| SOUL.md | Solomon identity — HFS AI Chief of Staff |
| IDENTITY.md | Name, emoji, theme |
| USER.md | Lionel + Dashae profiles |
| MEMORY.md | Persistent context (company, projects, decisions) |
| HEARTBEAT.md | Proactive check-in tasks |
| TOOLS.md | Local config (gog, Linear, SSH) |

## HFS v2.0 Features

Solomon v1.3.0 supports HFS v1.9.1 features:

### Hybrid Skill Parser
Skills can use YAML frontmatter (v1.9.1) or XML-only (v1.7):

```markdown
---
name: my-skill
model: sonnet
allowed_tools:
  - Bash(git *)
  - Read
hooks:
  pre_tool_call:
    command: scripts/validate-patterns.sh
---

# My Skill

<constraints>
  <constraint severity="critical">...</constraint>
</constraints>
```

### Hook Script Generation
Generate validation scripts with HFS compliance:
- Exit code **2** for violations (NOT exit 1)
- `HFS_HOOK_MODE` support (warn/block)
- Portable multiline matching with `perl -0777`

### Subagent Definitions
5 core agents with proper model assignments:
- **researcher** (sonnet) - Deep research with memory
- **planner** (sonnet) - Implementation planning
- **reviewer** (sonnet) - Code and document review
- **type-syncer** (sonnet) - TypeScript/Python type sync
- **screenshot-taker** (haiku) - Visual verification

### Verification Commands
| Command | Description |
|---------|-------------|
| `/verify-hooks` | Run hook validation test suite |
| `/spec-verify` | Phase 1.5 - Validate spec alignment |
| `/infra-verify` | Phase 2.55 - Validate infrastructure |
| `/checkpoint` | Create session state snapshot |

### Wave Execution (v2.0)
| Command | Description |
|---------|-------------|
| `/wave:plan` | Compute execution waves from PROMPTS.md |
| `/wave:run [N]` | Execute wave N (or next incomplete) |
| `/wave:status` | Show wave completion dashboard |

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
- **Firecrawl:** Phase 0 research automation via CLI or MCP tools

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

## Compaction Instructions

When compacting this conversation, preserve the following context — autonomous session runs depend on it surviving summarization:

**HFS workflow state (always preserve):**
- Active feature name and prefix (e.g., `frontend-wired-verification` / `FWV`)
- Active session ID currently loaded in `solomon-docs/sessions/SESSION.md`
- Path to the active plan and prompts file (e.g., `solomon-docs/plans/FWV_VERIFICATION_PLAN.md`, `solomon-docs/prompts/FWV_VERIFICATION_PROMPTS.md`)
- Which repository is the current working directory for the active session (`solomon/`, `hfs-development-kit/`, `solomon-dashboard/`, or workspace root)
- Uncommitted files that belong to the active session (so they are not accidentally discarded)
- Session dependencies and wave position (e.g., "FWV-03 depends on FWV-01; Wave 1b")

**Per-session verification checks (always preserve):**
- `<verification>` check list from the loaded SESSION.md — these are the pass gate for `/session:complete`
- `<forbidden>` patterns from the loaded SESSION.md — violating these blocks commit
- `<constraint priority="critical">` entries — these cannot be relaxed during compaction

**User-stated boundaries (always preserve — Anthropic docs warn these otherwise vanish):**
- Any prohibition the user stated about destructive ops, force pushes, or branch targets
- Any "run only these specific sessions" scope the user set
- Any per-session manual-gate requirement (e.g., "FWV-06 needs manual review — parser-self-modification risk")

**Safe to summarize / drop:**
- Intermediate tool output, grep results, file listings
- Brainstorming / visual companion screens
- Completed sessions' full XML (keep ID + commit hash + verdict only)
- Research findings older than the current session's scope
