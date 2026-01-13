# SOLOMON Research Document v2.0

**Generated Using:** deep-app-research skill  
**Date:** January 8, 2026  
**Version:** 2.0 (Consolidated)  
**Project:** Solomon — MCP-Native HFS Workflow Companion  
**Author:** Lionel @ High Functioning Solutions Ltd.

---

## Executive Summary

### Problem Statement

The HFS Agentic Workflow v1.7 provides a proven methodology for AI-assisted development, but suffers from three core friction points:

1. **Context Amnesia:** Each claude.ai session starts fresh — no memory of prior decisions, debugging sessions, or project context
2. **Manual Handoff:** SESSION.md must be manually copy-pasted between planning (claude.ai) and execution (Claude Code) environments
3. **Stale Library Knowledge:** LLMs hallucinate APIs from outdated training data when using fast-evolving frameworks (Quart, SQLAlchemy 2.x, React 19)

### Key Findings

| Finding | Impact | Source |
|---------|--------|--------|
| MCP adopted by OpenAI, Google, Microsoft (2025) | Industry standard, safe investment | Wikipedia, Anthropic blog |
| Claude Code supports plugins with slash commands, subagents, MCP servers, hooks | Solomon can be a native plugin | Anthropic docs |
| Mem0 achieves 26% higher accuracy, 91% lower latency vs full-context | Memory solved, don't rebuild | Mem0 benchmarks |
| Context7 MCP provides up-to-date library documentation on demand (37K+ stars) | Library docs solved, don't rebuild | Upstash/Context7 |
| Claude HUD provides real-time statusline with context/tool/todo tracking | Session visibility solved | jarrodwatts/claude-hud |
| FastMCP 2.0 is production-ready for Python MCP servers | Use for custom servers | PyPI, GitHub |
| Subagents preserve context by returning only results | Use for research, planning phases | Anthropic engineering blog |

### Recommended Approach

**Build Solomon as a Claude Code Plugin** that:
1. **Leverages existing MCP servers** — Context7 (library docs), Mem0 (memory), filesystem, git
2. **Builds custom MCP servers** — solomon-skills (HFS patterns), solomon-projects (tracking)
3. **Integrates with HFS v1.7** — XML sessions, constraint enforcement, skill loading
4. **Extends Claude Code** — slash commands, subagents, hooks

### Buy vs Build Analysis

| Capability | Build | Buy/Leverage | Rationale |
|------------|-------|--------------|-----------|
| Memory persistence | ❌ | ✅ Mem0 OpenMemory MCP | Production-ready, 26% accuracy boost |
| Library documentation | ❌ | ✅ Context7 MCP | 37K stars, community-maintained docs |
| Session visibility | ❌ | ✅ Claude HUD plugin | Real-time statusline, context/tool tracking |
| HFS skill loading | ✅ | ❌ | Custom: HFS-specific patterns |
| Project/progress tracking | ✅ | ❌ | Custom: HFS workflow integration |
| File operations | ❌ | ✅ @modelcontextprotocol/server-filesystem | Official MCP server |
| Git operations | ❌ | ✅ @modelcontextprotocol/server-git | Official MCP server |
| Web research | ❌ | ✅ Claude's built-in web search | Native capability |

---

## 1. Problem Context

### Current State: Manual Orchestration

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT HFS WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  claude.ai (Planning)              Claude Code (Execution)       │
│  ┌─────────────────┐              ┌─────────────────────┐       │
│  │ • Research      │   MANUAL     │ • /run-session      │       │
│  │ • Architecture  │ ──COPY───►   │ • File creation     │       │
│  │ • Prompts       │    PASTE     │ • Git commits       │       │
│  │ • SESSION.md    │              │ • Test execution    │       │
│  └─────────────────┘              └─────────────────────┘       │
│         │                                │                       │
│         │ No memory                      │ Stale library         │
│         │ between chats                  │ knowledge             │
│         ▼                                ▼                       │
│  "Where were we?"                 "Is this the current API?"     │
│  "What did we decide?"            "Why hallucinated method?"     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Pain Points (Validated by Research)

| Pain Point | Evidence | Solution |
|------------|----------|----------|
| Context loss between sessions | "Goldfish memory" — AI forgets key facts | Mem0 MCP Server |
| Stale library documentation | LLMs hallucinate APIs from training data | Context7 MCP Server |
| No progress awareness | Planning tool doesn't know execution status | solomon-projects MCP |
| Manual handoff friction | Copy-paste SESSION.md between tools | Plugin slash commands |
| No workflow awareness | Generic AI doesn't know HFS patterns | solomon-skills MCP |

### Desired State: Solomon as Bridge

```
┌─────────────────────────────────────────────────────────────────┐
│                    SOLOMON WORKFLOW                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│                     CLAUDE CODE + SOLOMON PLUGIN                 │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │  /solomon research "async Quart patterns"               │    │
│  │     → Mem0: Prior decisions                              │    │
│  │     → Context7: Current Quart docs                       │    │
│  │     → Web: Community patterns                            │    │
│  │                                                          │    │
│  │  /solomon session BE-04                                  │    │
│  │     → solomon-skills: python-backend-scaffold            │    │
│  │     → solomon-projects: Load from PROMPTS.md             │    │
│  │     → Context7: /pallets/quart, /sqlalchemy/sqlalchemy   │    │
│  │                                                          │    │
│  │  /solomon complete BE-04 --commit abc123                 │    │
│  │     → Mem0: Store completion context                     │    │
│  │     → solomon-projects: Update PROGRESS.md               │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Market Research

### Direct Competitors

| Product | Memory | Multi-LLM | Workflow | Library Docs | HFS Integration |
|---------|--------|-----------|----------|--------------|-----------------|
| ChatGPT | Limited | No | No | No | No |
| Claude.ai | Projects | No | No | No | Manual |
| Cursor | Codebase | Yes | No | No | No |
| Continue.dev | Codebase | Yes | No | No | No |
| Jan.ai | Conversations | Yes | No | No | No |
| **Solomon** | **Mem0** | **Via LLM** | **HFS v1.7** | **Context7** | **Native** |

### Emerging MCP Solutions

| Server | Purpose | Use in Solomon |
|--------|---------|----------------|
| Memory-keeper | File-based context persistence | Alternative to Mem0 |
| Task Orchestrator | Task tracking with memory | Pattern reference |
| Roo Code Memory Bank | Markdown file memory | Pattern reference |
| Context7 | Up-to-date library documentation | **Direct integration** |
| OpenMemory (Mem0) | Semantic memory with extraction | **Direct integration** |

### Gap Analysis

**What exists:**
- MCP servers for memory (Mem0 OpenMemory)
- MCP servers for library docs (Context7)
- Official MCP servers (filesystem, git, fetch)
- Task tracking patterns (Task Orchestrator)

**What's missing (Solomon builds this):**
- HFS workflow awareness (phases, skills, constraints)
- HFS skill loading as MCP tools
- SESSION.md generation with human context
- PROGRESS.md reading and next-step suggestions
- Integration between planning and execution

---

## 3. Technical Architecture

### MCP Server Stack

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLAUDE CODE                                 │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    SOLOMON PLUGIN                            │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │/solomon  │  │/session  │  │/research │  │/status   │   │   │
│  │  │/plan     │  │/load     │  │/complete │  │/review   │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐   │   │
│  │  │                  SUBAGENTS                           │   │   │
│  │  │  researcher │ planner │ reviewer │ executor         │   │   │
│  │  └─────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                  │                                  │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    CLAUDE HUD (Statusline)                   │   │
│  │  [Opus] 45% | 6 MCPs | ✓ context7 ×2 | ⏳ BE-04 (2/5)      │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                  │                                  │
│          ┌───────────────────────┼───────────────────────┐         │
│          ▼                       ▼                       ▼          │
│  ┌───────────────┐    ┌───────────────┐    ┌───────────────┐       │
│  │ CUSTOM BUILD  │    │  LEVERAGE     │    │  LEVERAGE     │       │
│  ├───────────────┤    ├───────────────┤    ├───────────────┤       │
│  │solomon-skills │    │    Mem0       │    │   Context7    │       │
│  │ • list_skills │    │ OpenMemory    │    │               │       │
│  │ • load_skill  │    │ • store       │    │ • resolve_lib │       │
│  │ • get_pattern │    │ • search      │    │ • get_docs    │       │
│  ├───────────────┤    │ • context     │    │               │       │
│  │solomon-project│    └───────────────┘    └───────────────┘       │
│  │ • get_progress│                                                  │
│  │ • load_session│    ┌───────────────┐    ┌───────────────┐       │
│  │ • mark_done   │    │  filesystem   │    │     git       │       │
│  └───────────────┘    │   (official)  │    │   (official)  │       │
│                       └───────────────┘    └───────────────┘       │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### Context7 Integration Points

Context7 provides **library knowledge**; HFS skills provide **workflow patterns**:

| Need | Source | Example |
|------|--------|---------|
| Current Quart routing syntax | Context7 | `use library /pallets/quart` |
| HFS controller pattern | solomon-skills | `python-backend-scaffold` |
| SQLAlchemy 2.x async session | Context7 | `use library /sqlalchemy/sqlalchemy topic:asyncio` |
| HFS repository pattern | solomon-skills | `python-backend-scaffold` |
| React 19 hooks | Context7 | `use library /facebook/react` |
| HFS frontend structure | solomon-skills | `fullstack-integration` |

### Claude HUD Integration

**Claude HUD** (github.com/jarrodwatts/claude-hud) provides real-time visibility into Claude Code session execution via native statusline API.

#### What Claude HUD Shows

```
[Opus 4.5] ████░░░░░░ 19% | 2 CLAUDE.md | 8 rules | 6 MCPs | 6 hooks | ⏱️ 1m
✓ mcp_context7 ×2 | ✓ mcp_mem0 ×1 | ✓ Read ×3 | ✓ Write ×1
✓ researcher: Deep research on async patterns (5s)
✓ BE-04: Validation service (3/5 tasks)
```

| Line | Information | HFS Relevance |
|------|-------------|---------------|
| Session Info | Context %, model, MCPs, duration | Know when context is filling up |
| Tool Activity | Running/completed MCP tools | See Context7, Mem0, skills calls |
| Agent Status | Subagent progress | Track researcher, planner agents |
| Todo Progress | Task completion | **Maps to HFS session tasks** |

#### Why Claude HUD for Solomon

1. **Visibility into MCP calls** — See when Context7 fetches docs, Mem0 retrieves memories
2. **Context health** — Know when approaching context limits (trigger subagents)
3. **Task tracking** — Native todo tracking maps to `<tasks>` in HFS sessions
4. **Agent monitoring** — See subagent progress (researcher, planner, reviewer)

#### Installation

```bash
# Inside Claude Code
/plugin marketplace add jarrodwatts/claude-hud
/plugin install claude-hud
/claude-hud:setup
```

#### Integration Pattern

Solomon sessions can leverage Claude HUD's todo tracking by structuring tasks as todos:

```xml
<tasks>
  <!-- These become trackable in Claude HUD -->
  <task id="1">Create validation service</task>
  <task id="2">Add unit tests</task>
  <task id="3">Integration tests</task>
</tasks>
```

Claude HUD displays: `⏳ BE-04: Create validation service (1/3 tasks)`

### HFS v1.7 XML Integration

Sessions can declare library dependencies alongside skills:

```xml
<session id="BE-04" project="BDOCS">
  <skills>
    <skill>python-backend-scaffold</skill>
    <skill>backend-e2e-testing</skill>
  </skills>
  
  <libraries context7="true">
    <lib id="/pallets/quart" topic="routing">async web framework</lib>
    <lib id="/sqlalchemy/sqlalchemy" topic="asyncio">ORM patterns</lib>
    <lib id="/pydantic/pydantic">DTOs and validation</lib>
  </libraries>
  
  <constraints>
    <constraint priority="critical">Follow three-layer architecture</constraint>
  </constraints>
  
  <!-- ... rest of session -->
</session>
```

---

## 4. MCP Servers Detail

### 4.1 solomon-skills (Custom Build)

**Purpose:** Expose HFS skills as callable MCP tools

**Tools:**
| Tool | Parameters | Returns |
|------|------------|---------|
| `list_skills` | `category?: string` | Array of skill names + descriptions |
| `load_skill` | `skill_name: string` | Full skill markdown content |
| `get_pattern` | `skill: string, pattern: string` | Specific code pattern from skill |
| `get_constraints` | `skill: string` | Extracted `<constraints>` from skill |
| `get_forbidden` | `skill: string` | Extracted `<forbidden>` from skill |

**Implementation:** Python + FastMCP 2.0

```python
from fastmcp import FastMCP

mcp = FastMCP("solomon-skills")

@mcp.tool()
async def list_skills(category: str = None) -> list[dict]:
    """List available HFS skills."""
    skills = await load_skill_index()
    if category:
        skills = [s for s in skills if s["category"] == category]
    return skills

@mcp.tool()
async def load_skill(skill_name: str) -> str:
    """Load full skill content."""
    path = SKILLS_DIR / f"SKILL_{skill_name}.md"
    return path.read_text()

@mcp.tool()
async def get_pattern(skill: str, pattern: str) -> str:
    """Get specific pattern from skill (e.g., 'controller', 'repository')."""
    content = await load_skill(skill)
    return extract_pattern(content, pattern)
```

### 4.2 solomon-projects (Custom Build)

**Purpose:** Track HFS project state, manage SESSION.md lifecycle

**Tools:**
| Tool | Parameters | Returns |
|------|------------|---------|
| `create_project` | `name: string, path: string` | Project ID |
| `get_progress` | `project: string` | Parsed PROGRESS.md data |
| `load_session` | `project: string, session_id: string` | SESSION.md content |
| `mark_complete` | `project: string, session_id: string, commit: string` | Updated progress |
| `get_next_session` | `project: string` | Next pending session |
| `check_dependencies` | `project: string, session_id: string` | Dependency status |

**Implementation:** Python + FastMCP 2.0

```python
@mcp.tool()
async def load_session(project: str, session_id: str) -> str:
    """Load session from PROMPTS.md and generate SESSION.md."""
    # 1. Parse session XML from PROMPTS.md
    prompts = await read_prompts_file(project)
    session_xml = extract_session(prompts, session_id)
    
    # 2. Get relevant memories (via Mem0 MCP call)
    memories = await mcp_call("mem0", "search_memory", {
        "query": f"{session_id} {session_xml.title}",
        "limit": 5
    })
    
    # 3. Get library docs if declared (via Context7 MCP call)
    lib_docs = []
    for lib in session_xml.libraries:
        docs = await mcp_call("context7", "get-library-docs", {
            "context7CompatibleLibraryID": lib.id,
            "topic": lib.topic,
            "tokens": 3000
        })
        lib_docs.append(docs)
    
    # 4. Generate SESSION.md with human context
    return format_session_md(session_xml, memories, lib_docs)
```

### 4.3 Leveraged MCP Servers

#### Mem0 OpenMemory
```json
{
  "mcpServers": {
    "mem0": {
      "command": "npx",
      "args": ["-y", "@mem0/mcp-server"],
      "env": {
        "MEM0_API_KEY": "${MEM0_API_KEY}"
      }
    }
  }
}
```

**Tools used:**
- `store_memory` — After decisions, completions
- `search_memory` — Before session load, research
- `get_context` — Inject relevant memories

#### Context7
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    }
  }
}
```

**Tools used:**
- `resolve-library-id` — Convert "quart" → "/pallets/quart"
- `get-library-docs` — Fetch current docs for library

---

## 5. Plugin Architecture

### Slash Commands

| Command | Purpose | MCP Servers Used |
|---------|---------|------------------|
| `/solomon research <topic>` | Deep research with memory | Mem0, Context7, web_search |
| `/solomon plan <project>` | Create PROJECT_PLAN.md | Mem0, solomon-skills |
| `/solomon session <id>` | Load/generate SESSION.md | solomon-projects, Context7, Mem0 |
| `/solomon status` | Show progress dashboard | solomon-projects |
| `/solomon complete <id>` | Mark session done | solomon-projects, Mem0 |
| `/solomon review` | Run plan-review-loop | solomon-skills, Mem0 |

### Subagents

| Agent | Purpose | Model | Tools |
|-------|---------|-------|-------|
| researcher | Web + codebase research | Claude Sonnet | web_search, Mem0, Context7 |
| planner | Architecture planning | Claude Opus | solomon-skills, Mem0 |
| reviewer | Plan quality review | Claude Opus | solomon-skills |
| executor | Session execution | Claude Sonnet | filesystem, git |

### Hooks

| Hook | Trigger | Action |
|------|---------|--------|
| `pre_commit` | Before git commit | Update PROGRESS.md |
| `session_end` | After /complete | Extract and store memories |
| `session_start` | After /session | Inject relevant memories + Context7 docs |

---

## 6. Workflow Integration

### Session Execution Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    /solomon session BE-04                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. LOAD SESSION                                                 │
│     ├─► solomon-projects: Parse BE-04 from PROMPTS.md           │
│     ├─► solomon-projects: Check dependencies (BE-01,02,03 ✅)    │
│     └─► Extract <skills> and <libraries> declarations           │
│                                                                  │
│  2. LOAD SKILLS                                                  │
│     ├─► solomon-skills: load_skill("python-backend-scaffold")   │
│     └─► Extract patterns, constraints, forbidden                 │
│                                                                  │
│  3. LOAD LIBRARY DOCS (NEW)                                      │
│     ├─► Context7: get-library-docs("/pallets/quart", "routing") │
│     ├─► Context7: get-library-docs("/sqlalchemy/sqlalchemy")    │
│     └─► Inject current API patterns into context                 │
│                                                                  │
│  4. LOAD MEMORIES                                                │
│     ├─► Mem0: search_memory("BE-04 validation patterns")        │
│     └─► Inject prior decisions, error solutions                  │
│                                                                  │
│  5. GENERATE SESSION.MD                                          │
│     ├─► Combine: XML session + skills + libs + memories          │
│     └─► Write to workspace SESSION.md                            │
│                                                                  │
│  6. EXECUTE                                                      │
│     ├─► Run tasks with full context                              │
│     ├─► Current library APIs (Context7)                          │
│     ├─► HFS patterns (skills)                                    │
│     └─► Prior decisions (Mem0)                                   │
│                                                                  │
│  7. COMPLETE                                                     │
│     ├─► Mem0: store_memory("BE-04 complete: validation added")  │
│     ├─► solomon-projects: mark_complete(BE-04, commit)          │
│     └─► Update PROGRESS.md                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### CLAUDE.md Integration

Add to workspace `CLAUDE.md`:

```markdown
## MCP Servers

This workspace uses Solomon MCP servers for HFS workflow:

### Memory (Mem0)
- Automatically stores decisions and completions
- Retrieved before each session
- Search with: `use memory for [topic]`

### Library Documentation (Context7)
For sessions using external libraries, fetch current docs:
- Quart: `use library /pallets/quart`
- SQLAlchemy: `use library /sqlalchemy/sqlalchemy topic:asyncio`
- Pydantic: `use library /pydantic/pydantic`
- React: `use library /facebook/react`

### HFS Skills (solomon-skills)
Load HFS patterns with: `use skill [name]`
- python-backend-scaffold
- backend-e2e-testing
- fullstack-integration

### When to Use Each
| Need | Source |
|------|--------|
| Current framework API | Context7 |
| HFS architectural pattern | solomon-skills |
| Prior project decisions | Mem0 |
| Project/session status | solomon-projects |
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (5 sessions, ~4 hours)

| Session | Title | Deliverable | Dependencies |
|---------|-------|-------------|--------------|
| SOL-01 | Skills Server | solomon-skills MCP server | None |
| SOL-02 | Projects Server | solomon-projects MCP server | None |
| SOL-03 | Plugin Scaffold | .claude/commands structure | SOL-01, SOL-02 |
| SOL-04 | MCP Config | Integration with Mem0 + Context7 | SOL-03 |
| SOL-05 | HUD Integration | Claude HUD + todo mapping | SOL-04 |

### Phase 2: Core Commands (4 sessions, ~4 hours)

| Session | Title | Deliverable | Dependencies |
|---------|-------|-------------|--------------|
| CMD-01 | Session Command | /solomon session with full flow | SOL-04 |
| CMD-02 | Status Command | /solomon status dashboard | SOL-04 |
| CMD-03 | Complete Command | /solomon complete with memory | CMD-01 |
| CMD-04 | Research Command | /solomon research with subagent | SOL-04 |

### Phase 3: Enhancement (3 sessions, ~3 hours)

| Session | Title | Deliverable | Dependencies |
|---------|-------|-------------|--------------|
| ENH-01 | Plan Command | /solomon plan with subagent | CMD-04 |
| ENH-02 | Review Loop | /solomon review iterations | ENH-01 |
| ENH-03 | Hooks | Auto-memory, auto-progress hooks | CMD-03 |

### Total: 12 sessions (~11 hours)

---

## 8. Technical Decisions

### 8.1 Memory System

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Mem0 OpenMemory | Production-ready, 26% accuracy boost | External dependency | **Selected** |
| Custom pgvector | Full control | Build from scratch | Future option |
| File-based | Simple | No semantic search | Not suitable |

### 8.2 Library Documentation

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Context7 | 37K stars, community docs | External dependency | **Selected** |
| Custom scraping | Full control | Maintenance burden | Not suitable |
| Training data only | No dependencies | Stale, hallucinations | Not suitable |

### 8.3 MCP Server Language

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Python + FastMCP | Familiar, async | Another runtime | **Selected** |
| TypeScript | Native SDK | Learning curve | Alternative |

### 8.4 Integration Pattern

| Option | Pros | Cons | Decision |
|--------|------|------|----------|
| Claude Code Plugin | Full integration | Plugin format | **Primary** |
| Standalone CLI | Independent | Separate tool | Secondary |

---

## 9. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| MCP spec changes | Medium | High | Pin SDK versions, follow changelogs |
| Mem0 service issues | Low | High | Fallback: local SQLite + embeddings |
| Context7 rate limits | Low | Medium | Cache responses, use API key |
| Plugin format evolution | Medium | Medium | Keep plugin logic minimal |
| Context window limits | Medium | Medium | Use subagents aggressively |

---

## 10. Success Criteria

### MVP Complete When:
- [ ] `/solomon session BE-XX` loads session with Context7 docs + Mem0 memories
- [ ] `/solomon complete` stores memory and updates PROGRESS.md
- [ ] `/solomon status` shows project progress
- [ ] Context7 auto-included for declared `<libraries>`
- [ ] HFS skills loaded for declared `<skills>`
- [ ] Claude HUD shows session task progress via todo tracking

### Full Release When:
- [ ] All 11 sessions complete
- [ ] /solomon research works with subagent
- [ ] /solomon plan generates PROJECT_PLAN.md
- [ ] /solomon review runs plan-review-loop
- [ ] Hooks auto-extract memories

---

## Appendices

### A: MCP Server Configuration

```json
{
  "mcpServers": {
    "solomon-skills": {
      "command": "python",
      "args": ["/path/to/solomon/mcp/skills_server.py"],
      "env": {
        "SKILLS_DIR": "/path/to/hfs/skills"
      }
    },
    "solomon-projects": {
      "command": "python",
      "args": ["/path/to/solomon/mcp/projects_server.py"],
      "env": {
        "PROJECTS_DIR": "${HOME}/.solomon/projects"
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

### B: Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| MCP Framework | FastMCP 2.0 | Python MCP servers |
| Memory | Mem0 OpenMemory | Persistent semantic memory |
| Library Docs | Context7 | Up-to-date framework docs |
| Session Visibility | Claude HUD | Real-time statusline |
| File Ops | @modelcontextprotocol/server-filesystem | File operations |
| Git Ops | @modelcontextprotocol/server-git | Version control |

### C: HFS Workflow Mapping

| HFS Phase | Solomon Support |
|-----------|-----------------|
| Phase 0: Research | /solomon research + Context7 |
| Phase 1: Architecture | /solomon plan + solomon-skills |
| Phase 2: Implementation | /solomon session |
| Phase 2.5: Review | /solomon review |
| Phase 2.75: API Lock | /solomon status |
| Phase 3: Execution | /solomon session + /complete |

### D: References

1. MCP Specification - https://modelcontextprotocol.io/specification/2025-11-25
2. Claude Code MCP Docs - https://code.claude.com/docs/en/mcp
3. FastMCP 2.0 - https://github.com/jlowin/fastmcp
4. Mem0 OpenMemory - https://mem0.ai/blog/introducing-openmemory-mcp
5. Context7 MCP - https://github.com/upstash/context7
6. Claude HUD - https://github.com/jarrodwatts/claude-hud
7. HFS Agentic Workflow v1.7 - Internal document

---

*SOLOMON_RESEARCH_v2.md*  
*Consolidated: January 8, 2026*  
*High Functioning Solutions Ltd.*
