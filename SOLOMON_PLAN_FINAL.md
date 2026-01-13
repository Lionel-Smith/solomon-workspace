# SOLOMON Project Plan

**Project:** Solomon — MCP-Native HFS Workflow Companion  
**Version:** 1.0  
**Date:** January 8, 2026  
**Author:** Lionel @ High Functioning Solutions Ltd.  
**Skill Used:** project-plan-creator

---

## Executive Summary

### Problem Statement

The HFS Agentic Workflow v1.7 provides a proven methodology for AI-assisted development, but execution suffers from three core friction points:

1. **Context Amnesia** — Each claude.ai session starts fresh with no memory of prior decisions
2. **Manual Handoff** — SESSION.md must be manually copy-pasted between planning and execution
3. **Stale Library Knowledge** — LLMs hallucinate APIs from outdated training data

### Solution Overview

Solomon is a **Claude Code Plugin** that integrates directly into the execution environment, providing:

- **Persistent Memory** via Mem0 OpenMemory MCP
- **Current Library Documentation** via Context7 MCP
- **HFS Skill Loading** via custom solomon-skills MCP server
- **Project/Progress Tracking** via custom solomon-projects MCP server
- **Session Visibility** via Claude HUD integration

### Key Design Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Architecture | Claude Code Plugin | Standalone CLI, Web UI | Native integration, no context switching |
| Memory System | Mem0 OpenMemory MCP | Custom pgvector, File-based | Production-ready, 26% accuracy boost |
| Library Docs | Context7 MCP | Custom scraping, Training data | 37K stars, community-maintained |
| Session Visibility | Claude HUD | Custom statusline, None | Already built, todo tracking |
| MCP Framework | FastMCP 2.0 (Python) | TypeScript SDK | Familiar, async, matches HFS patterns |
| Skill Storage | File-based markdown | Database, API | Simple, version-controlled, editable |
| Project Tracking | JSON + Markdown | SQLite, PostgreSQL | Lightweight, portable, readable |

---

## Code Architecture

### Component Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         SOLOMON PLUGIN                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    SLASH COMMANDS                               │ │
│  │  /solomon • /session • /status • /complete • /research • /plan │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                │                                     │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                      SUBAGENTS                                  │ │
│  │  researcher • planner • reviewer • executor                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                │                                     │
│          ┌─────────────────────┴─────────────────────┐              │
│          ▼                                           ▼               │
│  ┌───────────────────┐                    ┌───────────────────┐     │
│  │  CUSTOM MCP       │                    │  LEVERAGED MCP    │     │
│  │                   │                    │                   │     │
│  │  solomon-skills   │                    │  mem0             │     │
│  │  solomon-projects │                    │  context7         │     │
│  │                   │                    │  filesystem       │     │
│  │                   │                    │  git              │     │
│  └───────────────────┘                    └───────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Module Structure

```
solomon/
├── .claude-plugin/
│   └── plugin.json              # Plugin manifest
├── commands/
│   ├── solomon.md               # Main entry point
│   ├── session.md               # /solomon session <id>
│   ├── status.md                # /solomon status
│   ├── complete.md              # /solomon complete <id>
│   ├── research.md              # /solomon research <topic>
│   └── plan.md                  # /solomon plan <project>
├── agents/
│   ├── researcher.md            # Deep research subagent
│   ├── planner.md               # Architecture planning subagent
│   └── reviewer.md              # Plan review subagent
├── mcp/
│   ├── skills_server.py         # solomon-skills MCP server
│   └── projects_server.py       # solomon-projects MCP server
├── config/
│   ├── mcp_servers.json         # MCP server configurations
│   └── hud_config.json          # Claude HUD integration
└── CLAUDE.md                    # Plugin instructions
```

### Dependency Graph

```
                    ┌─────────────┐
                    │   plugin    │
                    │   .json     │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │  commands/  │ │  agents/    │ │    mcp/     │
    └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
           │               │               │
           └───────────────┴───────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │ CLAUDE.md   │
                    │ (loaded     │
                    │  at start)  │
                    └─────────────┘
```

---

## Data Model

### Project Configuration

Solomon tracks projects via JSON configuration:

```
~/.solomon/
├── config.json                  # Global settings
└── projects/
    ├── bdocs/
    │   ├── project.json         # Project metadata
    │   ├── memories.json        # Local memory cache
    │   └── sessions/            # Session state
    │       ├── BE-01.json
    │       └── BE-02.json
    └── smart-tender/
        └── project.json
```

#### project.json Schema

```json
{
  "id": "bdocs",
  "name": "BDOCS",
  "schema_version": "1.0",
  "created": "2026-01-08T10:00:00Z",
  "updated": "2026-01-08T14:30:00Z",
  "memory_namespace": "hfs:bdocs",
  "paths": {
    "workspace": "/path/to/bdocs-workspace",
    "api": "bdocs-api",
    "web": "bdocs-web",
    "docs": "bdocs-docs"
  },
  "files": {
    "plan": "BDOCS_PLAN.md",
    "prompts": "BDOCS_PROMPTS.md",
    "progress": "BDOCS_PROGRESS.md"
  },
  "context7_libraries": [
    { "id": "/pallets/quart", "topic": "routing" },
    { "id": "/sqlalchemy/sqlalchemy", "topic": "asyncio" }
  ],
  "default_skills": [
    "python-backend-scaffold",
    "backend-e2e-testing"
  ],
  "phase": "execution",
  "api_locked": true
}
```

### Graceful Degradation

When external services are unavailable, Solomon degrades gracefully:

| Service | Fallback Behavior |
|---------|-------------------|
| **Mem0 unavailable** | Log warning, skip memory search/store, continue with available context |
| **Context7 unavailable** | Log warning, skip library docs, note "docs not fetched" in SESSION.md |
| **Skills dir missing** | Error on startup, prompt user to set SKILLS_DIR |
| **PROGRESS.md malformed** | Return parse error with line number, don't update |
| **PROMPTS.md not found** | Error with "run project-plan-creator first" suggestion |

Solomon should **never block** on external service failures — warn and continue.

#### session.json Schema

```json
{
  "id": "BE-04",
  "project": "bdocs",
  "status": "complete",
  "created_at": "2026-01-08T10:30:00Z",
  "started_at": "2026-01-08T10:31:00Z",
  "completed_at": "2026-01-08T11:15:00Z",
  "duration_minutes": 44,
  "commit_hash": "abc123def",
  "tasks": [
    { "id": 1, "title": "Create validation service", "status": "complete" },
    { "id": 2, "title": "Add unit tests", "status": "complete" }
  ],
  "memories_stored": [
    "BE-04: Added validation for NIB numbers (9 digits)",
    "BE-04: ValidationResult DTO pattern established"
  ],
  "context7_calls": [
    { "library": "/pydantic/pydantic", "topic": "validators", "tokens": 2500 }
  ],
  "errors": []
}
```

### Error Handling Patterns

All MCP tools return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "SKILL_NOT_FOUND",
    "message": "Skill 'invalid-skill' not found in SKILLS_DIR",
    "details": {
      "searched_path": "/home/user/.hfs/skills",
      "available_skills": ["python-backend-scaffold", "backend-e2e-testing"]
    }
  }
}
```

| Error Code | MCP Server | Trigger |
|------------|------------|---------|
| `SKILL_NOT_FOUND` | solomon-skills | Requested skill doesn't exist |
| `PATTERN_NOT_FOUND` | solomon-skills | Pattern name not in skill |
| `PROJECT_NOT_FOUND` | solomon-projects | Project not initialized |
| `SESSION_NOT_FOUND` | solomon-projects | Session ID not in PROMPTS.md |
| `DEPENDENCY_UNMET` | solomon-projects | Required sessions not complete |
| `PROGRESS_PARSE_ERROR` | solomon-projects | PROGRESS.md malformed |
| `MEM0_UNAVAILABLE` | external | Mem0 API unreachable |
| `CONTEXT7_UNAVAILABLE` | external | Context7 API unreachable |

### Memory Categories

Solomon stores memories with category tags for retrieval:

| Category | Description | Example |
|----------|-------------|---------|
| `decision` | Architectural decisions | "Chose Quart over Flask for async" |
| `pattern` | Established patterns | "Repository returns DTOs not models" |
| `error` | Error solutions | "Circular import fixed with lazy loading" |
| `completion` | Session completions | "BE-04 complete: validation service" |
| `research` | Research findings | "Context7 has /pallets/quart docs" |

---

## API Design (MCP Tools)

### solomon-skills MCP Server

#### Tool: list_skills

**Purpose**: List available HFS skills with descriptions

**Parameters**:
```json
{
  "category": {
    "type": "string",
    "required": false,
    "description": "Filter by category (backend, frontend, testing, workflow)"
  }
}
```

**Response**:
```json
{
  "skills": [
    {
      "name": "python-backend-scaffold",
      "description": "Three-layer architecture for Quart/Flask backends",
      "category": "backend",
      "context7_libraries": ["/pallets/quart", "/sqlalchemy/sqlalchemy"]
    },
    {
      "name": "backend-e2e-testing",
      "description": "Comprehensive pytest-asyncio testing patterns",
      "category": "testing"
    }
  ]
}
```

#### Tool: load_skill

**Purpose**: Load full skill content for context injection

**Parameters**:
```json
{
  "skill_name": {
    "type": "string",
    "required": true,
    "description": "Skill name (e.g., 'python-backend-scaffold')"
  }
}
```

**Response**:
```json
{
  "name": "python-backend-scaffold",
  "content": "# Python Backend Scaffold\n\n...[full markdown]...",
  "constraints": [
    { "priority": "critical", "text": "Follow three-layer architecture" }
  ],
  "forbidden": [
    { "pattern": "catch { return [] }", "reason": "hides errors" }
  ]
}
```

#### Tool: get_pattern

**Purpose**: Extract specific code pattern from skill

**Parameters**:
```json
{
  "skill": {
    "type": "string",
    "required": true
  },
  "pattern": {
    "type": "string",
    "required": true,
    "description": "Pattern name (e.g., 'controller', 'repository', 'service')"
  }
}
```

**Response**:
```json
{
  "pattern": "repository",
  "language": "python",
  "code": "class InmateRepository:\n    def __init__(self, session: AsyncSession):\n        self._session = session\n    \n    async def get_by_id(self, id: int) -> Optional[Inmate]:\n        ...",
  "description": "Repository pattern with async session injection"
}
```

### solomon-projects MCP Server

#### Tool: create_project

**Purpose**: Initialize new Solomon-tracked project

**Parameters**:
```json
{
  "name": { "type": "string", "required": true },
  "workspace_path": { "type": "string", "required": true },
  "repos": {
    "type": "object",
    "properties": {
      "api": { "type": "string" },
      "web": { "type": "string" },
      "docs": { "type": "string" }
    }
  }
}
```

**Response**:
```json
{
  "success": true,
  "project_id": "smart-tender",
  "config_path": "~/.solomon/projects/smart-tender/project.json"
}
```

#### Tool: get_progress

**Purpose**: Parse and return PROGRESS.md status

**Parameters**:
```json
{
  "project": { "type": "string", "required": true }
}
```

**Response**:
```json
{
  "project": "bdocs",
  "phase": "execution",
  "api_locked": true,
  "backend": {
    "total": 8,
    "complete": 5,
    "active": 1,
    "pending": 2,
    "sessions": [
      { "id": "BE-01", "title": "Scaffold", "status": "complete", "commit": "a1b2c3d" },
      { "id": "BE-06", "title": "Reports", "status": "active", "commit": null }
    ]
  },
  "frontend": {
    "total": 6,
    "complete": 0,
    "pending": 6,
    "blocked_by": "api_lock"
  }
}
```

#### Tool: load_session

**Purpose**: Extract session from PROMPTS.md with full context

**Parameters**:
```json
{
  "project": { "type": "string", "required": true },
  "session_id": { "type": "string", "required": true }
}
```

**Response**:
```json
{
  "session_xml": "<session id=\"BE-06\">...</session>",
  "human_context": "This session builds on BE-05 which established the report service...",
  "skills_to_load": ["python-backend-scaffold"],
  "libraries_to_fetch": [
    { "id": "/pallets/quart", "topic": "streaming" }
  ],
  "dependencies_met": true,
  "integration_gate": {
    "enabled": false
  }
}
```

#### Tool: mark_complete

**Purpose**: Mark session complete and update PROGRESS.md

**Parameters**:
```json
{
  "project": { "type": "string", "required": true },
  "session_id": { "type": "string", "required": true },
  "commit_hash": { "type": "string", "required": true },
  "summary": { "type": "string", "required": false }
}
```

**Response**:
```json
{
  "success": true,
  "session_id": "BE-06",
  "status": "complete",
  "progress_updated": true,
  "memory_stored": "BE-06 complete: PDF report generation with streaming"
}
```

---

## User Flows

### Flow 1: Load and Execute Session

```
User: /solomon session BE-06

Solomon:
  1. solomon-projects.get_progress("bdocs")
     → Verify BE-06 dependencies met
  
  2. solomon-projects.load_session("bdocs", "BE-06")
     → Get session XML + context
  
  3. solomon-skills.load_skill("python-backend-scaffold")
     → Load HFS patterns
  
  4. context7.get-library-docs("/pallets/quart", "streaming")
     → Fetch current Quart streaming docs
  
  5. mem0.search_memory("BE-06 report generation")
     → Retrieve relevant prior decisions
  
  6. Generate SESSION.md combining:
     - Session XML structure
     - Human context from prior sessions
     - HFS skill patterns
     - Current library docs
     - Relevant memories

Output:
  ✅ Session BE-06 loaded
  📚 Skills: python-backend-scaffold
  📖 Context7: /pallets/quart (streaming)
  🧠 Memories: 3 relevant found
  
  SESSION.md written to bdocs-docs/sessions/
```

### Flow 2: Complete Session

```
User: /solomon complete BE-06 --commit abc123

Solomon:
  1. Verify all verification checks passed
  
  2. solomon-projects.mark_complete("bdocs", "BE-06", "abc123")
     → Update PROGRESS.md
  
  3. mem0.store_memory({
       category: "completion",
       content: "BE-06: PDF streaming reports implemented",
       project: "bdocs"
     })
  
  4. Suggest next session based on dependencies

Output:
  ✅ BE-06 marked complete (commit: abc123)
  📝 PROGRESS.md updated
  🧠 Memory stored
  
  Next available sessions:
  - BE-07: Email notifications (ready)
  - FE-01: Dashboard (blocked: waiting for API lock)
```

### Flow 3: Research with Memory

```
User: /solomon research "async file upload patterns for Quart"

Solomon (researcher subagent):
  1. mem0.search_memory("file upload Quart async")
     → Check prior research/decisions
  
  2. context7.resolve-library-id("quart")
     → Get Context7 ID
  
  3. context7.get-library-docs("/pallets/quart", "file-upload")
     → Fetch current docs
  
  4. web_search("Quart async file upload best practices 2025")
     → Community patterns
  
  5. solomon-skills.get_pattern("python-backend-scaffold", "controller")
     → HFS pattern for reference
  
  6. mem0.store_memory({
       category: "research",
       content: "File upload research: use aiofiles + streaming...",
       project: "bdocs"
     })

Output:
  ## Research: Async File Upload Patterns
  
  ### From Memory
  - Previous decision: Use streaming for files > 10MB
  
  ### From Context7 (Quart Docs)
  - `request.files` returns FileStorage objects
  - Use `await file.save()` for async writes
  
  ### From Web Search
  - Pattern: Stream to temp file, validate, move to storage
  - Library: aiofiles for async file operations
  
  ### HFS Pattern Alignment
  - Controller: Handles multipart parsing
  - Service: Validates and processes
  - Repository: Stores metadata
  
  🧠 Research saved to memory
```

### Flow 4: Check Status

```
User: /solomon status

Solomon:
  1. solomon-projects.get_progress("bdocs")
  
  2. Format with Rich display

Output:
  ┌─────────────────────────────────────────────┐
  │  BDOCS Progress                              │
  ├─────────────────────────────────────────────┤
  │                                              │
  │  Backend (bdocs-api)           [████████░░] │
  │  ✅ BE-01 Scaffold             a1b2c3d      │
  │  ✅ BE-02 Models               e4f5g6h      │
  │  ✅ BE-03 Repositories         i7j8k9l      │
  │  ✅ BE-04 Services             m0n1o2p      │
  │  ✅ BE-05 Controllers          q3r4s5t      │
  │  🔄 BE-06 Reports              —            │
  │  ⬜ BE-07 Notifications        —            │
  │  ⬜ BE-08 Auth                 —            │
  │                                              │
  │  API Contract                  🔒 LOCKED    │
  │                                              │
  │  Frontend (bdocs-web)          [░░░░░░░░░░] │
  │  ⬜ FE-01 Dashboard            blocked      │
  │  ⬜ FE-02 Forms                blocked      │
  │                                              │
  └─────────────────────────────────────────────┘
```

---

## Open Questions & Decisions

| Question | Resolution | Rationale |
|----------|------------|-----------|
| Where to store project config? | `~/.solomon/projects/` | User-level, persists across workspaces |
| How to handle Mem0 API key? | Environment variable `MEM0_API_KEY` | Standard practice, not in config |
| Should skills be bundled or referenced? | Referenced from HFS skills directory | Single source of truth, version-controlled |
| How to handle Context7 rate limits? | Cache responses in session.json | Avoid redundant calls |
| Plugin marketplace distribution? | Start with manual install, then marketplace | Iterate before publishing |
| How to sync PROGRESS.md changes? | Read-only from Solomon, write via git | Avoid merge conflicts |

## Future Enhancements (Post-MVP)

### Model Abstraction Layer

**Goal:** Enable swapping Claude for open-source models (Llama 4, Qwen 3) when they reach parity for agentic tasks.

**Implementation:**
```python
# solomon/config.py
MODEL_PROVIDER = os.getenv("SOLOMON_PROVIDER", "anthropic")  # or "ollama", "together"
MODEL_NAME = os.getenv("SOLOMON_MODEL", "claude-sonnet-4-5-20250929")

# Use aisuite for provider abstraction
import aisuite as ai
client = ai.Client()
response = client.chat.completions.create(
    model=f"{MODEL_PROVIDER}:{MODEL_NAME}",
    messages=[...]
)
```

**Trigger:** Revisit when open-source models match Claude Sonnet 4.5 on SWE-bench and agentic benchmarks.

**Not in MVP scope** — adds complexity without immediate value since Claude Agent SDK is tightly coupled to Claude models.

---

## Implementation Roadmap

### Phase 1: Foundation (5 sessions, ~4 hours)

| Session | Title | Deliverable | Size |
|---------|-------|-------------|------|
| SOL-01 | Skills Server | solomon-skills MCP with list/load/get_pattern | 🔨 Medium |
| SOL-02 | Projects Server | solomon-projects MCP with progress/session | 🔨 Medium |
| SOL-03 | Plugin Scaffold | .claude-plugin structure, CLAUDE.md | ⚡ Quick |
| SOL-04 | MCP Integration | Mem0 + Context7 configuration | ⚡ Quick |
| SOL-05 | HUD Setup | Claude HUD installation + todo mapping | ⚡ Quick |

### Phase 2: Core Commands (4 sessions, ~4 hours)

| Session | Title | Deliverable | Size |
|---------|-------|-------------|------|
| CMD-01 | Session Command | /solomon session with full flow | 🔨 Medium |
| CMD-02 | Status Command | /solomon status with Rich display | ⚡ Quick |
| CMD-03 | Complete Command | /solomon complete with memory | 🔨 Medium |
| CMD-04 | Research Command | /solomon research with subagent | 🏗️ Heavy |

### Phase 3: Enhancement (3 sessions, ~3 hours)

| Session | Title | Deliverable | Size |
|---------|-------|-------------|------|
| ENH-01 | Plan Command | /solomon plan with subagent | 🏗️ Heavy |
| ENH-02 | Review Loop | /solomon review iterations | 🔨 Medium |
| ENH-03 | Hooks | Auto-memory, auto-progress hooks | 🔨 Medium |

### Dependency Graph

```
SOL-01 ──┐
         ├──► SOL-03 ──► SOL-04 ──► SOL-05 ──► CMD-01
SOL-02 ──┘                                      │
                                                ├──► CMD-02
                                                ├──► CMD-03 ──► ENH-03
                                                └──► CMD-04 ──► ENH-01 ──► ENH-02
```

### Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| MCP spec changes | Medium | High | Pin SDK versions |
| Mem0 service issues | Low | High | Fallback to local JSON |
| Context7 rate limits | Low | Medium | Response caching |
| Plugin format evolution | Medium | Medium | Minimal plugin logic |
| Scope creep | High | High | Strict session definitions |

---

## Directory Structure

### Target Structure

```
solomon/
├── .claude-plugin/
│   └── plugin.json
├── commands/
│   ├── solomon.md
│   ├── session.md
│   ├── status.md
│   ├── complete.md
│   ├── research.md
│   └── plan.md
├── agents/
│   ├── researcher.md
│   ├── planner.md
│   └── reviewer.md
├── mcp/
│   ├── __init__.py
│   ├── skills_server.py
│   ├── projects_server.py
│   └── utils/
│       ├── markdown_parser.py
│       └── progress_parser.py
├── config/
│   ├── mcp_servers.json
│   └── default_project.json
├── tests/
│   ├── test_skills_server.py
│   └── test_projects_server.py
├── CLAUDE.md
├── README.md
└── pyproject.toml
```

### Files Summary

| Category | Files | Purpose |
|----------|-------|---------|
| Plugin | 1 | plugin.json manifest |
| Commands | 6 | Slash command definitions |
| Agents | 3 | Subagent configurations |
| MCP Servers | 2 | Custom tool servers |
| Config | 2 | Server and project configs |
| Tests | 2 | MCP server tests |
| Docs | 2 | CLAUDE.md, README.md |

### Phase 4: Future Enhancements (Backlog)

| Enhancement | Description | Trigger |
|-------------|-------------|---------|
| Model Abstraction | aisuite integration for provider-agnostic LLM calls | Open-source model parity |
| Local Model Support | Ollama/llama.cpp backend option | Self-hosted requirement |
| Multi-Model Routing | Different models for different tasks (research vs execution) | Cost optimization |
| Fine-tuning Pipeline | LoRA training on HFS patterns | Pattern consistency |

```python
# Future: config.py with aisuite abstraction
MODEL_PROVIDER = os.getenv("SOLOMON_PROVIDER", "anthropic")
MODEL_NAME = os.getenv("SOLOMON_MODEL", "claude-sonnet-4-5-20250929")

import aisuite as ai
client = ai.Client()
response = client.chat.completions.create(
    model=f"{MODEL_PROVIDER}:{MODEL_NAME}",  # "ollama:llama3.3:70b" later
    messages=[...]
)
```

---

## Appendices

### A: MCP Server Configuration

```json
{
  "mcpServers": {
    "solomon-skills": {
      "command": "python",
      "args": ["-m", "solomon.mcp.skills_server"],
      "env": {
        "SKILLS_DIR": "${HFS_SKILLS_DIR:-~/.hfs/skills}"
      }
    },
    "solomon-projects": {
      "command": "python",
      "args": ["-m", "solomon.mcp.projects_server"],
      "env": {
        "SOLOMON_DIR": "${SOLOMON_DIR:-~/.solomon}"
      }
    },
    "mem0": {
      "command": "npx",
      "args": ["-y", "@mem0/mcp-server"],
      "env": {
        "MEM0_API_KEY": "${MEM0_API_KEY}"
      }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

### B: Plugin Manifest

```json
{
  "name": "solomon",
  "version": "1.0.0",
  "description": "HFS Agentic Workflow Companion",
  "author": "High Functioning Solutions Ltd.",
  
  "commands": [
    "commands/solomon.md",
    "commands/session.md",
    "commands/status.md",
    "commands/complete.md",
    "commands/research.md",
    "commands/plan.md"
  ],
  
  "agents": [
    "agents/researcher.md",
    "agents/planner.md",
    "agents/reviewer.md"
  ],
  
  "mcpServers": [
    "solomon-skills",
    "solomon-projects"
  ],
  
  "hooks": {
    "pre_commit": "hooks/update_progress.sh",
    "session_end": "hooks/extract_memories.py"
  }
}
```

### C: CLAUDE.md Template

```markdown
# Solomon - HFS Workflow Companion

You are operating with the Solomon plugin for HFS Agentic Workflow v1.7.

## Available Commands

- `/solomon session <id>` - Load session with full context
- `/solomon status` - Show project progress
- `/solomon complete <id>` - Mark session done
- `/solomon research <topic>` - Deep research with memory
- `/solomon plan <project>` - Create project plan

## MCP Servers Available

### Memory (Mem0)
- Automatically stores decisions and completions
- Search with queries before each session

### Library Docs (Context7)
- Use for current framework documentation
- Libraries: /pallets/quart, /sqlalchemy/sqlalchemy, /pydantic/pydantic

### HFS Skills (solomon-skills)
- Load HFS patterns: python-backend-scaffold, backend-e2e-testing
- Extract specific patterns: controller, service, repository

### Project Tracking (solomon-projects)
- Read PROGRESS.md status
- Load sessions from PROMPTS.md
- Mark sessions complete

## Workflow

1. Start session: `/solomon session BE-XX`
2. Execute tasks with loaded context
3. Complete: `/solomon complete BE-XX --commit <hash>`

## Constraints (Always Apply)

- Follow three-layer architecture: Controller → Service → Repository
- No mock fallbacks in catch blocks
- Convert to DTOs while session is open
- Use async patterns (selectinload, joinedload)
```

### D: Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Session load time | < 5 seconds | Timer in /solomon session |
| Memory relevance | > 80% useful | User feedback |
| Context7 hit rate | > 90% | Cache statistics |
| Sessions per day | 5+ | Usage tracking |
| Context overflow | < 5% sessions | Claude HUD monitoring |

---

*SOLOMON_PLAN.md v1.0*  
*Generated using project-plan-creator skill*  
*High Functioning Solutions Ltd.*
