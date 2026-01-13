# SOLOMON Implementation Prompts

**Project:** Solomon — MCP-Native HFS Workflow Companion  
**Version:** 1.0  
**Generated:** January 10, 2026  
**Source:** SOLOMON_PLAN.md  
**Skill Used:** implementation-plan-generator

---

## Document Overview

### Purpose

This document contains session-by-session implementation prompts for building Solomon, a Claude Code plugin that orchestrates the HFS Agentic Workflow v1.7 with persistent memory, library documentation, and project tracking.

### Execution Tracks

| Track | Sessions | Repository | Description |
|-------|----------|------------|-------------|
| **SOL** | SOL-01 → SOL-05 | solomon | Foundation: MCP servers, plugin scaffold |
| **CMD** | CMD-01 → CMD-04 | solomon | Core Commands: slash commands |
| **ENH** | ENH-01 → ENH-03 | solomon | Enhancement: advanced features |

### Parallel Execution Map

```
Phase 1: Foundation
═══════════════════════════════════════════════════════════════════════
                                                                        
SOL-01 ──────┐                                                          
(skills)     ├──► SOL-03 ──► SOL-04 ──► SOL-05 ──┐                     
SOL-02 ──────┘    (plugin)   (mcp)     (hud)     │                     
(projects)                                        │                     
                                                  │                     
Phase 2: Core Commands                            │                     
═══════════════════════════════════════════════════════════════════════
                                                  │                     
                                                  └──► CMD-01 ──┬──► CMD-02
                                                      (session) │   (status)
                                                                │           
                                                                ├──► CMD-03
                                                                │   (complete)
                                                                │           
                                                                └──► CMD-04
                                                                    (research)
Phase 3: Enhancement                                                    
═══════════════════════════════════════════════════════════════════════
                                                                        
CMD-04 ──► ENH-01 ──► ENH-02                                           
           (plan)     (review)                                          
                                                                        
CMD-03 ──► ENH-03                                                       
           (hooks)                                                      
```

### Session Summary

| ID | Title | Size | Duration | Dependencies |
|----|-------|------|----------|--------------|
| SOL-01 | Skills MCP Server | 🔨 Medium | 45 min | None |
| SOL-02 | Projects MCP Server | 🔨 Medium | 45 min | None |
| SOL-03 | Plugin Scaffold | ⚡ Quick | 20 min | SOL-01, SOL-02 |
| SOL-04 | MCP Integration | ⚡ Quick | 20 min | SOL-03 |
| SOL-05 | HUD Integration | ⚡ Quick | 15 min | SOL-04 |
| CMD-01 | Session Command | 🔨 Medium | 45 min | SOL-05 |
| CMD-02 | Status Command | ⚡ Quick | 25 min | CMD-01 |
| CMD-03 | Complete Command | 🔨 Medium | 40 min | CMD-01 |
| CMD-04 | Research Command | 🏗️ Heavy | 60 min | CMD-01 |
| ENH-01 | Plan Command | 🏗️ Heavy | 60 min | CMD-04 |
| ENH-02 | Review Loop | 🔨 Medium | 45 min | ENH-01 |
| ENH-03 | Hooks | 🔨 Medium | 40 min | CMD-03 |

**Total: ~8 hours implementation time**

---

## Progress Tracking Template

```markdown
## SOLOMON Progress

### Phase 1: Foundation
| Session | Status | Duration | Commit | Notes |
|---------|--------|----------|--------|-------|
| SOL-01 | ⬜ | — | — | |
| SOL-02 | ⬜ | — | — | |
| SOL-03 | ⬜ | — | — | |
| SOL-04 | ⬜ | — | — | |
| SOL-05 | ⬜ | — | — | |

### Phase 2: Core Commands
| Session | Status | Duration | Commit | Notes |
|---------|--------|----------|--------|-------|
| CMD-01 | ⬜ | — | — | |
| CMD-02 | ⬜ | — | — | |
| CMD-03 | ⬜ | — | — | |
| CMD-04 | ⬜ | — | — | |

### Phase 3: Enhancement
| Session | Status | Duration | Commit | Notes |
|---------|--------|----------|--------|-------|
| ENH-01 | ⬜ | — | — | |
| ENH-02 | ⬜ | — | — | |
| ENH-03 | ⬜ | — | — | |

Status: ⬜ Pending | 🔄 Active | ✅ Complete | ❌ Blocked
```

---

## Pre-Implementation Setup

```bash
# Create repository
mkdir solomon && cd solomon
git init

# Create directory structure
mkdir -p .claude-plugin commands agents mcp/utils config tests hooks

# Create virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install fastmcp pydantic aiofiles

# Initial commit
git add .
git commit -m "chore: initial project structure"
```

---

## Phase 1: Foundation

### Session SOL-01: Skills MCP Server

<session id="SOL-01" project="SOLOMON">

<metadata>
  <session_id>SOL-01</session_id>
  <title>Skills MCP Server</title>
  <phase>1 - Foundation</phase>
  <track>SOL</track>
  <size>🔨 Medium</size>
  <duration>45 minutes</duration>
  <execution>🖥️ CLI</execution>
  <dependencies>None</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>standard</thinking_mode>
  <temperature>0.2</temperature>
</system_config>

<skills>
  <skill>python-backend-scaffold</skill>
</skills>

<libraries context7="true">
  <lib id="/jlowin/fastmcp">FastMCP 2.0 framework</lib>
  <lib id="/pydantic/pydantic">Data validation</lib>
</libraries>

<context>
This is the first session of the Solomon project. We're building an MCP server that exposes HFS skills as callable tools.

The server will:
1. Read skill markdown files from a configurable directory
2. Parse skill metadata (name, description, constraints, forbidden patterns)
3. Expose three tools: list_skills, load_skill, get_pattern
</context>

<tasks>
  <task id="1">Create mcp/skills_server.py with FastMCP 2.0</task>
  <task id="2">Implement list_skills tool - returns skill names and descriptions</task>
  <task id="3">Implement load_skill tool - returns full skill content with parsed constraints</task>
  <task id="4">Implement get_pattern tool - extracts code patterns from skills</task>
  <task id="5">Add mcp/utils/skill_parser.py for markdown parsing</task>
  <task id="6">Create tests/test_skills_server.py with pytest</task>
</tasks>

<constraints>
  <constraint priority="critical">Use FastMCP 2.0 decorators (@mcp.tool)</constraint>
  <constraint priority="critical">Return Pydantic models from tools</constraint>
  <constraint priority="high">Handle missing skills gracefully with clear errors</constraint>
  <constraint priority="high">Skills directory configurable via SKILLS_DIR env var</constraint>
</constraints>

<forbidden>
  <pattern>Hardcoded paths to skill files</pattern>
  <pattern>Synchronous file I/O (use aiofiles)</pattern>
  <pattern>Catching exceptions and returning empty results</pattern>
</forbidden>

<file_templates>
```python
# mcp/models/skill_models.py
from pydantic import BaseModel, Field

class SkillInfo(BaseModel):
    """Returned by list_skills tool."""
    name: str
    description: str
    path: str

class SkillConstraint(BaseModel):
    """Individual constraint from a skill."""
    text: str
    priority: str = Field(pattern="^(critical|high|medium|low)$")

class SkillContent(BaseModel):
    """Returned by load_skill tool."""
    name: str
    description: str
    content: str
    constraints: list[SkillConstraint] = []
    forbidden: list[str] = []
    
class PatternResult(BaseModel):
    """Returned by get_pattern tool."""
    skill_name: str
    pattern_name: str
    code: str
    language: str = "python"

class SkillError(BaseModel):
    """Error response for all tools."""
    success: bool = False
    error_code: str
    message: str
    details: dict = {}
```

```python
# tests/test_skills_server.py
import pytest
from mcp.models.skill_models import SkillInfo, SkillContent, PatternResult

@pytest.fixture
def skills_dir(tmp_path):
    """Create temporary skills directory with test skill."""
    skill_file = tmp_path / "test-skill.md"
    skill_file.write_text("""---
name: test-skill
description: A test skill for unit tests
---
# Test Skill
<constraints>
  <constraint priority="critical">Test constraint</constraint>
</constraints>
""")
    return tmp_path

@pytest.mark.asyncio
async def test_list_skills(skills_dir):
    # Test implementation here
    pass

@pytest.mark.asyncio  
async def test_load_skill_not_found():
    # Should return SkillError with SKILL_NOT_FOUND
    pass
```
</file_templates>

<verification>
  <check>python -m pytest tests/test_skills_server.py -v</check>
  <check>python -m mcp.skills_server (starts without error)</check>
  <check>Tool responses match Pydantic schema</check>
</verification>

<git_commit>
feat(mcp): add solomon-skills MCP server

- Implement list_skills, load_skill, get_pattern tools
- Add skill markdown parser with constraint extraction
- Configure via SKILLS_DIR environment variable

Session: SOL-01
</git_commit>

</session>

---

### Session SOL-02: Projects MCP Server

<session id="SOL-02" project="SOLOMON">

<metadata>
  <session_id>SOL-02</session_id>
  <title>Projects MCP Server</title>
  <phase>1 - Foundation</phase>
  <track>SOL</track>
  <size>🔨 Medium</size>
  <duration>45 minutes</duration>
  <execution>🖥️ CLI</execution>
  <dependencies>None (parallel with SOL-01)</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>standard</thinking_mode>
  <temperature>0.2</temperature>
</system_config>

<skills>
  <skill>python-backend-scaffold</skill>
</skills>

<libraries context7="true">
  <lib id="/jlowin/fastmcp">FastMCP 2.0 framework</lib>
  <lib id="/pydantic/pydantic">Data validation</lib>
</libraries>

<context>
This session builds the solomon-projects MCP server that tracks project state and parses HFS workflow files.

The server manages:
1. Project configuration in ~/.solomon/projects/
2. PROGRESS.md parsing and updates
3. Session loading from PROMPTS.md files
</context>

<tasks>
  <task id="1">Create mcp/projects_server.py with FastMCP 2.0</task>
  <task id="2">Implement create_project tool - initializes project config</task>
  <task id="3">Implement get_progress tool - parses PROGRESS.md status</task>
  <task id="4">Implement load_session tool - extracts session XML from PROMPTS.md</task>
  <task id="5">Implement mark_complete tool - updates PROGRESS.md</task>
  <task id="6">Add mcp/utils/progress_parser.py for PROGRESS.md parsing</task>
  <task id="7">Add mcp/utils/session_parser.py for PROMPTS.md parsing</task>
  <task id="8">Create tests/test_projects_server.py</task>
</tasks>

<constraints>
  <constraint priority="critical">Store project config in ~/.solomon/projects/{name}/</constraint>
  <constraint priority="critical">Parse XML sessions using regex, not full XML parser</constraint>
  <constraint priority="high">PROGRESS.md updates preserve existing formatting</constraint>
  <constraint priority="high">Session dependencies validated before loading</constraint>
</constraints>

<forbidden>
  <pattern>Writing to PROGRESS.md without backup</pattern>
  <pattern>Modifying PROMPTS.md (read-only)</pattern>
  <pattern>Hardcoded project paths</pattern>
</forbidden>

<file_templates>
```python
# mcp/utils/dependency_validator.py
"""Validate session dependencies before loading."""

from dataclasses import dataclass

@dataclass
class DependencyResult:
    can_load: bool
    session_id: str
    unmet_deps: list[str]
    message: str

def validate_dependencies(
    session_id: str,
    session_deps: list[str],
    progress: dict[str, str]  # {session_id: status}
) -> DependencyResult:
    """
    Check if all dependencies are complete.
    
    Algorithm:
    1. Parse <dependencies> from session XML
    2. For each dependency, check PROGRESS.md status
    3. If any dependency status != "complete", block loading
    4. Return detailed result with unmet dependencies
    
    Example:
        session_deps = ["SOL-01", "SOL-02"]
        progress = {"SOL-01": "complete", "SOL-02": "pending"}
        result = validate_dependencies("SOL-03", session_deps, progress)
        # result.can_load = False
        # result.unmet_deps = ["SOL-02"]
    """
    unmet = [dep for dep in session_deps if progress.get(dep) != "complete"]
    
    if unmet:
        return DependencyResult(
            can_load=False,
            session_id=session_id,
            unmet_deps=unmet,
            message=f"Cannot load {session_id}: dependencies not complete: {', '.join(unmet)}"
        )
    
    return DependencyResult(
        can_load=True,
        session_id=session_id,
        unmet_deps=[],
        message=f"All dependencies met for {session_id}"
    )
```

```python
# mcp/models/project_models.py
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class SessionStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    COMPLETE = "complete"
    BLOCKED = "blocked"

class ProgressEntry(BaseModel):
    session_id: str
    status: SessionStatus
    commit: str | None = None
    notes: str | None = None

class ProjectProgress(BaseModel):
    project_id: str
    phases: dict[str, list[ProgressEntry]]
    api_locked: bool = False
    last_updated: datetime
```
</file_templates>

<verification>
  <check>python -m pytest tests/test_projects_server.py -v</check>
  <check>python -m mcp.projects_server (starts without error)</check>
  <check>Creates ~/.solomon/projects/ on first run</check>
</verification>

<git_commit>
feat(mcp): add solomon-projects MCP server

- Implement create_project, get_progress, load_session, mark_complete tools
- Add PROGRESS.md and PROMPTS.md parsers
- Store project config in ~/.solomon/projects/

Session: SOL-02
</git_commit>

</session>

---

### Session SOL-03: Plugin Scaffold

<session id="SOL-03" project="SOLOMON">

<metadata>
  <session_id>SOL-03</session_id>
  <title>Plugin Scaffold</title>
  <phase>1 - Foundation</phase>
  <track>SOL</track>
  <size>⚡ Quick</size>
  <duration>20 minutes</duration>
  <execution>🖥️ CLI</execution>
  <dependencies>SOL-01, SOL-02</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>standard</thinking_mode>
  <temperature>0.2</temperature>
</system_config>

<context>
With MCP servers built, we now create the Claude Code plugin structure that ties everything together.

Reference: https://docs.anthropic.com/claude-code/plugins
</context>

<tasks>
  <task id="1">Create .claude-plugin/plugin.json manifest</task>
  <task id="2">Create commands/solomon.md - main entry point</task>
  <task id="3">Create CLAUDE.md with plugin instructions</task>
  <task id="4">Create agents/researcher.md subagent definition</task>
  <task id="5">Create agents/planner.md subagent definition</task>
  <task id="6">Create agents/reviewer.md subagent definition</task>
</tasks>

<constraints>
  <constraint priority="critical">plugin.json follows Claude Code schema exactly</constraint>
  <constraint priority="high">CLAUDE.md includes all MCP server descriptions</constraint>
  <constraint priority="high">Subagents have clear scope boundaries</constraint>
</constraints>

<forbidden>
  <pattern>Commands that duplicate Claude Code built-ins</pattern>
  <pattern>Subagents without explicit return format</pattern>
</forbidden>

<file_templates>
```json
// .claude-plugin/plugin.json
{
  "name": "solomon",
  "version": "1.0.0",
  "description": "HFS Agentic Workflow Companion",
  "commands": ["commands/*.md"],
  "agents": ["agents/*.md"]
}
```

```markdown
<!-- agents/researcher.md -->
---
name: researcher
description: Deep research with memory and web search
model: sonnet
---

You are a research specialist. Your job is to:
1. Search Mem0 for prior research on the topic
2. Use Context7 for library documentation
3. Use web_search for current information
4. Synthesize findings into actionable insights

Always store valuable findings to Mem0 before returning.
Return format: Markdown with ## sections.
```
</file_templates>

<verification>
  <check>plugin.json validates against Claude Code schema</check>
  <check>All command files exist and have frontmatter</check>
  <check>All agent files have name, description, model</check>
</verification>

<git_commit>
feat(plugin): add Claude Code plugin scaffold

- Create plugin.json manifest
- Add solomon.md main command
- Add researcher, planner, reviewer subagents
- Add CLAUDE.md with plugin instructions

Session: SOL-03
</git_commit>

</session>

---

### Session SOL-04: MCP Integration

<session id="SOL-04" project="SOLOMON">

<metadata>
  <session_id>SOL-04</session_id>
  <title>MCP Integration</title>
  <phase>1 - Foundation</phase>
  <track>SOL</track>
  <size>⚡ Quick</size>
  <duration>20 minutes</duration>
  <execution>🖥️ CLI</execution>
  <dependencies>SOL-03</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>standard</thinking_mode>
  <temperature>0.2</temperature>
</system_config>

<context>
Configure the MCP servers (custom + external) for the Solomon plugin.

External servers to integrate:
- Mem0 OpenMemory: npm install @mem0/mcp-server
- Context7: npm install @upstash/context7-mcp
</context>

<tasks>
  <task id="1">Create config/mcp_servers.json with all server configs</task>
  <task id="2">Update CLAUDE.md with MCP tool descriptions</task>
  <task id="3">Create setup script for external MCP installation</task>
  <task id="4">Add environment variable documentation</task>
  <task id="5">Test MCP server connectivity</task>
</tasks>

<constraints>
  <constraint priority="critical">API keys via environment variables only</constraint>
  <constraint priority="high">Document all required env vars in README</constraint>
</constraints>

<file_templates>
```json
// config/mcp_servers.json
{
  "mcpServers": {
    "solomon-skills": {
      "command": "python",
      "args": ["-m", "mcp.skills_server"],
      "env": {
        "SKILLS_DIR": "${HFS_SKILLS_DIR:-~/.hfs/skills}"
      }
    },
    "solomon-projects": {
      "command": "python",
      "args": ["-m", "mcp.projects_server"],
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
</file_templates>

<verification>
  <check>Each MCP server starts without error</check>
  <check>Mem0 connects with valid API key</check>
  <check>Context7 resolves library IDs</check>
</verification>

<git_commit>
feat(config): integrate external MCP servers

- Add Mem0 OpenMemory configuration
- Add Context7 library documentation
- Create MCP server config file
- Document required environment variables

Session: SOL-04
</git_commit>

</session>

---

### Session SOL-05: HUD Integration

<session id="SOL-05" project="SOLOMON">

<metadata>
  <session_id>SOL-05</session_id>
  <title>HUD Integration</title>
  <phase>1 - Foundation</phase>
  <track>SOL</track>
  <size>⚡ Quick</size>
  <duration>15 minutes</duration>
  <execution>🖥️ CLI</execution>
  <dependencies>SOL-04</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>standard</thinking_mode>
  <temperature>0.3</temperature>
</system_config>

<context>
Integrate Claude HUD for real-time session visibility. HUD displays context usage, tool calls, agent status, and todo progress.

Reference: https://github.com/jarrodwatts/claude-hud
</context>

<tasks>
  <task id="1">Document Claude HUD installation in README</task>
  <task id="2">Create config/hud_config.json with display preferences</task>
  <task id="3">Update CLAUDE.md with HUD usage instructions</task>
  <task id="4">Document todo format for task tracking</task>
</tasks>

<verification>
  <check>HUD displays after /claude-hud:setup</check>
  <check>Context percentage visible</check>
  <check>MCP tool calls tracked</check>
</verification>

<git_commit>
docs(hud): add Claude HUD integration

- Document installation steps
- Add HUD config preferences
- Define todo format for task tracking

Session: SOL-05
</git_commit>

</session>

---

## Phase 2: Core Commands

### Session CMD-01: Session Command

<session id="CMD-01" project="SOLOMON">

<metadata>
  <session_id>CMD-01</session_id>
  <title>Session Command</title>
  <phase>2 - Core Commands</phase>
  <track>CMD</track>
  <size>🔨 Medium</size>
  <duration>45 minutes</duration>
  <execution>🖥️ CLI</execution>
  <dependencies>SOL-05</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>standard</thinking_mode>
  <temperature>0.2</temperature>
</system_config>

<skills>
  <skill>python-backend-scaffold</skill>
</skills>

<context>
The session command is Solomon's core feature. It loads a session from PROMPTS.md with full context enrichment:
1. Parse session XML
2. Load declared skills
3. Fetch Context7 library docs
4. Retrieve Mem0 memories
5. Generate SESSION.md
</context>

<tasks>
  <task id="1">Create commands/session.md slash command</task>
  <task id="2">Implement session loading flow with MCP calls</task>
  <task id="3">Generate SESSION.md combining all context</task>
  <task id="4">Display summary with loaded skills, libs, memories</task>
  <task id="5">Handle missing dependencies with clear error</task>
</tasks>

<constraints>
  <constraint priority="critical">Verify dependencies before loading</constraint>
  <constraint priority="critical">Context7 calls only for declared libraries</constraint>
  <constraint priority="high">Memory search scoped to project</constraint>
  <constraint priority="high">SESSION.md written to workspace, not repo</constraint>
</constraints>

<forbidden>
  <pattern>Loading session with unmet dependencies</pattern>
  <pattern>Context7 calls without library declaration</pattern>
  <pattern>Mem0 calls without project scope</pattern>
</forbidden>

<file_templates>
```markdown
<!-- SESSION.md output template -->
# Session: {session_id} - {title}

**Project:** {project_name}  
**Generated:** {timestamp}  
**Dependencies:** {deps_status}

---

## Session Prompt

{original_xml_content}

---

## Loaded Skills

### {skill_name}
{skill_content_trimmed}

---

## Library Documentation (Context7)

### {library_id}
**Topic:** {topic}  
**Tokens:** {token_count}

{context7_docs}

---

## Relevant Memories (Mem0)

| Memory | Source | Relevance |
|--------|--------|-----------|
| {memory_text} | {session_id} | {score}% |

---

## Execution Checklist

- [ ] Read constraints and forbidden patterns
- [ ] Review skill patterns before implementing
- [ ] Check Context7 docs for API usage
- [ ] Store key decisions to memory on completion

---

*Generated by Solomon v1.0*
```

```python
# commands/session_generator.py
from pathlib import Path
from datetime import datetime

SESSION_TEMPLATE = Path(__file__).parent / "templates" / "SESSION.md.j2"

async def generate_session_md(
    session_data: dict,
    skills: list[dict],
    context7_docs: list[dict],
    memories: list[dict],
    output_path: Path
) -> Path:
    """Generate SESSION.md with all enriched context."""
    # Use Jinja2 or simple string formatting
    pass
```
</file_templates>

<verification>
  <check>/solomon session BE-01 loads without error</check>
  <check>SESSION.md contains skill patterns</check>
  <check>Context7 docs included for declared libraries</check>
  <check>Memories retrieved and included</check>
</verification>

<git_commit>
feat(cmd): implement /solomon session command

- Load session from PROMPTS.md with dependency check
- Enrich with skills, Context7 docs, Mem0 memories
- Generate SESSION.md with full context

Session: CMD-01
</git_commit>

</session>

---

### Session CMD-02: Status Command

<session id="CMD-02" project="SOLOMON">

<metadata>
  <session_id>CMD-02</session_id>
  <title>Status Command</title>
  <phase>2 - Core Commands</phase>
  <track>CMD</track>
  <size>⚡ Quick</size>
  <duration>25 minutes</duration>
  <execution>🖥️ CLI</execution>
  <dependencies>CMD-01</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>standard</thinking_mode>
  <temperature>0.3</temperature>
</system_config>

<context>
The status command displays project progress in a visual dashboard format.
</context>

<tasks>
  <task id="1">Create commands/status.md slash command</task>
  <task id="2">Parse PROGRESS.md via solomon-projects.get_progress</task>
  <task id="3">Display progress bars for each track</task>
  <task id="4">Show blocked sessions with blockers</task>
  <task id="5">Indicate API lock status</task>
</tasks>

<verification>
  <check>/solomon status displays formatted output</check>
  <check>Progress percentages accurate</check>
  <check>Blocked sessions show blockers</check>
</verification>

<git_commit>
feat(cmd): implement /solomon status command

- Display project progress dashboard
- Show session completion with commits
- Indicate blocked sessions and API lock

Session: CMD-02
</git_commit>

</session>

---

### Session CMD-03: Complete Command

<session id="CMD-03" project="SOLOMON">

<metadata>
  <session_id>CMD-03</session_id>
  <title>Complete Command</title>
  <phase>2 - Core Commands</phase>
  <track>CMD</track>
  <size>🔨 Medium</size>
  <duration>40 minutes</duration>
  <execution>🖥️ CLI</execution>
  <dependencies>CMD-01</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>standard</thinking_mode>
  <temperature>0.2</temperature>
</system_config>

<context>
The complete command marks a session done, updates PROGRESS.md, and stores memories for future sessions.
</context>

<tasks>
  <task id="1">Create commands/complete.md slash command</task>
  <task id="2">Verify all tasks completed (via verification checks)</task>
  <task id="3">Call solomon-projects.mark_complete</task>
  <task id="4">Extract and store memories to Mem0</task>
  <task id="5">Suggest next available sessions</task>
</tasks>

<constraints>
  <constraint priority="critical">Require commit hash for completion</constraint>
  <constraint priority="high">Store memories with project + session scope</constraint>
  <constraint priority="high">Auto-detect key decisions for memory</constraint>
</constraints>

<verification>
  <check>/solomon complete BE-01 abc123 works</check>
  <check>PROGRESS.md updated with commit</check>
  <check>Memories searchable via Mem0</check>
</verification>

<git_commit>
feat(cmd): implement /solomon complete command

- Mark session complete with commit hash
- Update PROGRESS.md automatically
- Store key decisions to Mem0
- Suggest next available sessions

Session: CMD-03
</git_commit>

</session>

---

### Session CMD-04: Research Command

<session id="CMD-04" project="SOLOMON">

<metadata>
  <session_id>CMD-04</session_id>
  <title>Research Command</title>
  <phase>2 - Core Commands</phase>
  <track>CMD</track>
  <size>🏗️ Heavy</size>
  <duration>60 minutes</duration>
  <execution>🖥️ CLI 🤖 Subagents</execution>
  <dependencies>CMD-01</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>ultrathink</thinking_mode>
  <max_thinking_tokens>16000</max_thinking_tokens>
  <temperature>0.2</temperature>
</system_config>

<skills>
  <skill>deep-app-research</skill>
</skills>

<subagents>
  <agent>researcher</agent>
</subagents>

<context>
The research command delegates deep research to the researcher subagent, which:
1. Searches Mem0 for prior research
2. Fetches Context7 library docs
3. Uses web_search for current information
4. Synthesizes and stores findings
</context>

<tasks>
  <task id="1">Create commands/research.md slash command</task>
  <task id="2">Implement researcher subagent delegation</task>
  <task id="3">Memory search before web research</task>
  <task id="4">Context7 integration for library topics</task>
  <task id="5">Store research findings to Mem0</task>
  <task id="6">Format output with sources</task>
</tasks>

<constraints>
  <constraint priority="critical">Always check Mem0 before web search</constraint>
  <constraint priority="critical">Store valuable findings to Mem0</constraint>
  <constraint priority="high">Include source attribution</constraint>
  <constraint priority="high">Use Context7 for library-specific research</constraint>
</constraints>

<verification>
  <check>/solomon research "async patterns" returns results</check>
  <check>Memory searched first</check>
  <check>Findings stored to Mem0</check>
  <check>Sources attributed</check>
</verification>

<git_commit>
feat(cmd): implement /solomon research command

- Delegate to researcher subagent
- Search Mem0 before web research
- Integrate Context7 for library docs
- Store findings to Mem0

Session: CMD-04
</git_commit>

</session>

---

## Phase 3: Enhancement

### Session ENH-01: Plan Command

<session id="ENH-01" project="SOLOMON">

<metadata>
  <session_id>ENH-01</session_id>
  <title>Plan Command</title>
  <phase>3 - Enhancement</phase>
  <track>ENH</track>
  <size>🏗️ Heavy</size>
  <duration>60 minutes</duration>
  <execution>🖥️ CLI 🤖 Subagents</execution>
  <dependencies>CMD-04</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>ultrathink</thinking_mode>
  <max_thinking_tokens>32000</max_thinking_tokens>
  <temperature>0.2</temperature>
</system_config>

<skills>
  <skill>project-plan-creator</skill>
  <skill>implementation-plan-generator</skill>
</skills>

<subagents>
  <agent>planner</agent>
</subagents>

<context>
The plan command creates project plans following the HFS project-plan-creator skill. It delegates to the planner subagent for architecture work.
</context>

<tasks>
  <task id="1">Create commands/plan.md slash command</task>
  <task id="2">Implement planner subagent delegation</task>
  <task id="3">Load project-plan-creator skill patterns</task>
  <task id="4">Generate PROJECT_PLAN.md structure</task>
  <task id="5">Store plan decisions to Mem0</task>
</tasks>

<verification>
  <check>/solomon plan new-project creates plan</check>
  <check>Plan follows skill structure</check>
  <check>Decisions stored to Mem0</check>
</verification>

<git_commit>
feat(cmd): implement /solomon plan command

- Delegate to planner subagent
- Use project-plan-creator skill patterns
- Generate structured PROJECT_PLAN.md
- Store decisions to Mem0

Session: ENH-01
</git_commit>

</session>

---

### Session ENH-02: Review Loop

<session id="ENH-02" project="SOLOMON">

<metadata>
  <session_id>ENH-02</session_id>
  <title>Review Loop</title>
  <phase>3 - Enhancement</phase>
  <track>ENH</track>
  <size>🔨 Medium</size>
  <duration>45 minutes</duration>
  <execution>🖥️ CLI 🤖 Subagents</execution>
  <dependencies>ENH-01</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>standard</thinking_mode>
  <temperature>0.2</temperature>
</system_config>

<skills>
  <skill>plan-review-loop</skill>
</skills>

<subagents>
  <agent>reviewer</agent>
</subagents>

<context>
The review command implements the HFS plan-review-loop skill for iterative plan refinement.
</context>

<tasks>
  <task id="1">Create commands/review.md slash command</task>
  <task id="2">Implement reviewer subagent delegation</task>
  <task id="3">Load plan-review-loop checklist</task>
  <task id="4">Generate review feedback</task>
  <task id="5">Track review iterations</task>
</tasks>

<verification>
  <check>/solomon review PLAN.md generates feedback</check>
  <check>Checklist items evaluated</check>
  <check>Iteration count tracked</check>
</verification>

<git_commit>
feat(cmd): implement /solomon review command

- Delegate to reviewer subagent
- Use plan-review-loop checklist
- Track review iterations
- Generate actionable feedback

Session: ENH-02
</git_commit>

</session>

---

### Session ENH-03: Hooks

<session id="ENH-03" project="SOLOMON">

<metadata>
  <session_id>ENH-03</session_id>
  <title>Hooks</title>
  <phase>3 - Enhancement</phase>
  <track>ENH</track>
  <size>🔨 Medium</size>
  <duration>40 minutes</duration>
  <execution>🖥️ CLI</execution>
  <dependencies>CMD-03</dependencies>
</metadata>

<system_config>
  <model>claude-sonnet-4-20250514</model>
  <thinking_mode>standard</thinking_mode>
  <temperature>0.2</temperature>
</system_config>

<context>
Implement Claude Code hooks for automatic memory extraction and progress updates.

Reference: https://docs.anthropic.com/en/docs/claude-code/hooks
</context>

<tasks>
  <task id="1">Create hooks/extract_memories.py - post-session memory extraction</task>
  <task id="2">Create hooks/update_progress.sh - pre-commit progress update</task>
  <task id="3">Update plugin.json with hook definitions</task>
  <task id="4">Document hook behavior in CLAUDE.md</task>
</tasks>

<file_templates>
```python
# hooks/extract_memories.py
"""
Post-session hook to extract and store memories.
Triggered after /solomon complete or session end.
"""

import json
import sys
from pathlib import Path

def extract_memories(session_transcript: str) -> list[str]:
    """Extract key decisions and patterns from session."""
    memories = []
    
    # Pattern: "Decision: ..."
    # Pattern: "Established: ..."
    # Pattern: "Solved: ..."
    
    return memories

if __name__ == "__main__":
    transcript = sys.stdin.read()
    memories = extract_memories(transcript)
    print(json.dumps({"memories": memories}))
```
</file_templates>

<verification>
  <check>extract_memories.py parses transcripts</check>
  <check>update_progress.sh detects session commits</check>
  <check>Hooks registered in plugin.json</check>
</verification>

<git_commit>
feat(hooks): add automatic memory and progress hooks

- Extract memories from session transcripts
- Update progress on session commits
- Register hooks in plugin manifest

Session: ENH-03
</git_commit>

</session>

---

## Rollback Commands Reference

```bash
# Rollback last session
git reset --hard HEAD~1

# Rollback to specific session
git log --oneline | grep "Session:"
git reset --hard <commit>

# Rollback MCP changes
rm -rf ~/.solomon/projects/<project>/sessions/<session>.json

# Restore from backup
cp ~/.solomon/backups/PROGRESS.md.bak PROGRESS.md
```

---

## Appendices

### A: Model Selection Guide

| Session Type | Model | Thinking | Temperature |
|--------------|-------|----------|-------------|
| Architecture | claude-sonnet-4-20250514 | ultrathink | 0.1 |
| Implementation | claude-sonnet-4-20250514 | standard | 0.2 |
| Documentation | claude-sonnet-4-20250514 | standard | 0.3 |
| Quick fixes | claude-sonnet-4-20250514 | standard | 0.2 |

### B: Skills Registry

| Skill | Sessions |
|-------|----------|
| python-backend-scaffold | SOL-01, SOL-02, CMD-01 |
| deep-app-research | CMD-04 |
| project-plan-creator | ENH-01 |
| implementation-plan-generator | ENH-01 |
| plan-review-loop | ENH-02 |

### C: MCP Tools Quick Reference

| Server | Tool | Purpose |
|--------|------|---------|
| solomon-skills | list_skills | List available HFS skills |
| solomon-skills | load_skill | Load full skill content |
| solomon-skills | get_pattern | Extract code pattern |
| solomon-projects | create_project | Initialize project |
| solomon-projects | get_progress | Parse PROGRESS.md |
| solomon-projects | load_session | Extract session from PROMPTS.md |
| solomon-projects | mark_complete | Update completion status |
| mem0 | store_memory | Store decision/pattern |
| mem0 | search_memory | Retrieve relevant memories |
| context7 | resolve-library-id | Get library ID |
| context7 | get-library-docs | Fetch library documentation |

### D: Commit Message Format

```
<type>(<scope>): <description>

<body>

Session: <SESSION-ID>
```

Types: feat, fix, docs, refactor, test, chore

---

*SOLOMON_PROMPTS.md v1.0*  
*Generated using implementation-plan-generator skill*  
*High Functioning Solutions Ltd.*
