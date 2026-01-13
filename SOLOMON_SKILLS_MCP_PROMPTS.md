# Solomon Skills MCP Server - Implementation Prompts

## Document Overview

| Property | Value |
|----------|-------|
| Project | solomon-skills MCP server |
| Source | SOLOMON_SKILLS_MCP_PLAN.md |
| Sessions | 6 (4 BE + 2 INT) |
| Estimated Time | 4-5 hours |
| Repository | solomon-workspace |

### Execution Tracks

| Track | Prefix | Repository | Sessions |
|-------|--------|------------|----------|
| Backend | BE- | solomon-workspace | BE-01 through BE-04 |
| Integration | INT- | N/A (config) | INT-01 through INT-02 |

### Parallel Execution Map

```
BE-01 ─── BE-02 ─── BE-03 ─── BE-04
(scaffold)  (parser)  (resource) (tools)
                                  │
                                  ▼
                              INT-01 ─── INT-02
                              (config)   (verify)
```

---

## Progress Tracking Templates

### Session Status

```markdown
## Session Progress

| Session | Status | Started | Completed | Notes |
|---------|--------|---------|-----------|-------|
| BE-01 | ⬜ | - | - | - |
| BE-02 | ⬜ | - | - | - |
| BE-03 | ⬜ | - | - | - |
| BE-04 | ⬜ | - | - | - |
| INT-01 | ⬜ | - | - | - |
| INT-02 | ⬜ | - | - | - |

Status: ⬜ Pending | 🔄 In Progress | ✅ Complete | ❌ Blocked
```

---

## Pre-Implementation Setup

```bash
# Create workspace structure
cd /Users/lionelj/dev/solomon-workspace
mkdir -p src/solomon_mcp tests docs

# Initialize Python project
uv init --name solomon-mcp
uv add mcp pyyaml

# Create initial branch
git checkout -b feature/solomon-skills-mcp
```

---

## Phase 1: Core Implementation


### Session BE-01: Project Scaffold

```xml
<session id="BE-01" project="solomon-skills-mcp">
  <metadata>
    <phase>1</phase>
    <track>backend</track>
    <working_directory>solomon-workspace</working_directory>
    <estimated_time>30 minutes</estimated_time>
    <size>quick</size>
  </metadata>

  <dependencies>
    <requires status="complete">Pre-Implementation Setup</requires>
  </dependencies>

  <constraints>
    <constraint priority="critical">Use uv for dependency management</constraint>
    <constraint priority="critical">Three-layer architecture: server → service → loader</constraint>
    <constraint priority="high">Type hints on all functions</constraint>
  </constraints>

  <forbidden>
    <pattern reason="use uv">pip install</pattern>
    <pattern reason="flat structure">single file with all logic</pattern>
  </forbidden>

  <tasks>
    <task id="1" file="pyproject.toml" action="CREATE">
      <title>Create pyproject.toml with dependencies</title>
      <dependencies>mcp, pyyaml, python-dotenv</dependencies>
    </task>
    <task id="2" file="src/solomon_mcp/__init__.py" action="CREATE">
      <title>Create package init</title>
    </task>
    <task id="3" file="src/solomon_mcp/models.py" action="CREATE">
      <title>Create SkillData dataclass</title>
    </task>
    <task id="4" file="src/solomon_mcp/config.py" action="CREATE">
      <title>Create configuration loader</title>
    </task>
  </tasks>

  <verification>
    <check name="structure" command="ls src/solomon_mcp/">4 files</check>
    <check name="import" command="python -c 'from solomon_mcp.models import SkillData'">No errors</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>scaffold</scope>
    <description>initialize solomon-skills MCP server project structure</description>
  </commit>
</session>
```

---

### Session BE-02: Skill Parser

```xml
<session id="BE-02" project="solomon-skills-mcp">
  <metadata>
    <phase>1</phase>
    <track>backend</track>
    <working_directory>solomon-workspace</working_directory>
    <estimated_time>45 minutes</estimated_time>
    <size>medium</size>
  </metadata>

  <dependencies>
    <requires status="complete">BE-01</requires>
  </dependencies>

  <constraints>
    <constraint priority="critical">Parse YAML frontmatter between --- delimiters</constraint>
    <constraint priority="critical">Handle missing frontmatter gracefully</constraint>
    <constraint priority="high">Return None for invalid files, don't raise</constraint>
  </constraints>

  <forbidden>
    <pattern reason="hides errors">except: pass</pattern>
    <pattern reason="graceful degradation">raise YAMLError</pattern>
  </forbidden>

  <tasks>
    <task id="1" file="src/solomon_mcp/skill_loader.py" action="CREATE">
      <title>Create skill loader (repository layer)</title>
      <functions>
        - parse_frontmatter(content: str) -> tuple[dict, str]
        - load_skill_file(path: Path) -> SkillData | None
        - discover_skills(skills_dir: Path) -> list[Path]
      </functions>
    </task>
    <task id="2" file="tests/test_skill_loader.py" action="CREATE">
      <title>Unit tests for parser</title>
      <test_cases>
        - Valid SKILL.md with frontmatter
        - SKILL.md without frontmatter (fallback to dir name)
        - Invalid YAML frontmatter (returns None)
        - Missing file (returns None)
      </test_cases>
    </task>
  </tasks>

  <verification>
    <check name="tests" command="uv run pytest tests/test_skill_loader.py -v">All pass</check>
    <check name="real_skill" command="uv run python -c 'from solomon_mcp.skill_loader import load_skill_file; from pathlib import Path; print(load_skill_file(Path.home() / \".hfs/skills/python-backend-scaffold/SKILL.md\"))'">SkillData printed</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>parser</scope>
    <description>add YAML frontmatter parser for SKILL.md files</description>
  </commit>
</session>
```

---

### Session BE-03: MCP Server with Resources

```xml
<session id="BE-03" project="solomon-skills-mcp">
  <metadata>
    <phase>1</phase>
    <track>backend</track>
    <working_directory>solomon-workspace</working_directory>
    <estimated_time>45 minutes</estimated_time>
    <size>medium</size>
  </metadata>

  <dependencies>
    <requires status="complete">BE-02</requires>
  </dependencies>

  <constraints>
    <constraint priority="critical">MCP resource URI: skills://index</constraint>
    <constraint priority="critical">Resource returns markdown-formatted skill list</constraint>
    <constraint priority="high">Service layer between server and loader</constraint>
  </constraints>

  <forbidden>
    <pattern reason="three-layer">server.py imports skill_loader directly</pattern>
    <pattern reason="use markdown">return json.dumps</pattern>
  </forbidden>

  <tasks>
    <task id="1" file="src/solomon_mcp/skill_service.py" action="CREATE">
      <title>Create skill service (business logic layer)</title>
      <functions>
        - get_all_skills() -> list[SkillData]
        - get_skills_index() -> str  # markdown formatted
        - get_skill_by_name(name: str) -> SkillData | None
      </functions>
    </task>
    <task id="2" file="src/solomon_mcp/skills_server.py" action="CREATE">
      <title>Create MCP server with list_resources and read_resource</title>
      <handlers>
        - @server.list_resources() -> list[Resource]
        - @server.read_resource(uri) -> str
      </handlers>
    </task>
    <task id="3" file="src/solomon_mcp/__main__.py" action="CREATE">
      <title>Create entry point for python -m solomon_mcp.skills_server</title>
    </task>
  </tasks>

  <verification>
    <check name="import" command="uv run python -c 'from solomon_mcp.skills_server import server'">No errors</check>
    <check name="index" command="uv run python -c 'from solomon_mcp.skill_service import get_skills_index; print(get_skills_index())'">Markdown list printed</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>mcp</scope>
    <description>add MCP server with skills://index resource</description>
  </commit>
</session>
```

---

### Session BE-04: MCP Tools Implementation

```xml
<session id="BE-04" project="solomon-skills-mcp">
  <metadata>
    <phase>1</phase>
    <track>backend</track>
    <working_directory>solomon-workspace</working_directory>
    <estimated_time>45 minutes</estimated_time>
    <size>medium</size>
  </metadata>

  <dependencies>
    <requires status="complete">BE-03</requires>
  </dependencies>

  <constraints>
    <constraint priority="critical">Three tools: load_skill, load_skills, search_skills</constraint>
    <constraint priority="critical">Tools return TextContent</constraint>
    <constraint priority="high">Search matches on name and description</constraint>
  </constraints>

  <forbidden>
    <pattern reason="return error message">raise ValueError("Skill not found")</pattern>
    <pattern reason="use TextContent">return {"error": ...}</pattern>
  </forbidden>

  <tasks>
    <task id="1" file="src/solomon_mcp/skill_service.py" action="MODIFY">
      <title>Add search and multi-load functions</title>
      <functions>
        - search_skills(query: str) -> list[tuple[SkillData, int]]  # with relevance
        - get_skills_by_names(names: list[str]) -> dict[str, str | None]
      </functions>
    </task>
    <task id="2" file="src/solomon_mcp/skills_server.py" action="MODIFY">
      <title>Add list_tools and call_tool handlers</title>
      <tools>
        - load_skill: {"name": str} -> full content
        - load_skills: {"names": list[str]} -> concatenated content
        - search_skills: {"query": str} -> matching skills with scores
      </tools>
    </task>
    <task id="3" file="tests/test_skills_server.py" action="CREATE">
      <title>Integration tests for MCP tools</title>
    </task>
  </tasks>

  <verification>
    <check name="tools" command="uv run python -c 'from solomon_mcp.skills_server import list_tools; import asyncio; print(asyncio.run(list_tools()))'">3 tools listed</check>
    <check name="tests" command="uv run pytest tests/ -v">All pass</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>mcp</scope>
    <description>add load_skill, load_skills, search_skills MCP tools</description>
  </commit>
</session>
```

---

## Phase 2: Integration

### Session INT-01: Claude Code Configuration

```xml
<session id="INT-01" project="solomon-skills-mcp">
  <metadata>
    <phase>2</phase>
    <track>integration</track>
    <working_directory>N/A</working_directory>
    <estimated_time>15 minutes</estimated_time>
    <size>quick</size>
  </metadata>

  <dependencies>
    <requires status="complete">BE-04</requires>
  </dependencies>

  <constraints>
    <constraint priority="critical">Add to ~/.claude.json mcpServers</constraint>
    <constraint priority="high">Use absolute path to SKILLS_DIR</constraint>
  </constraints>

  <tasks>
    <task id="1" file="~/.claude.json" action="MODIFY">
      <title>Add solomon-skills MCP server configuration</title>
      <config>
{
  "mcpServers": {
    "solomon-skills": {
      "command": "uv",
      "args": ["run", "--directory", "/Users/lionelj/dev/solomon-workspace", "python", "-m", "solomon_mcp.skills_server"],
      "env": {
        "SKILLS_DIR": "/Users/lionelj/.hfs/skills"
      }
    }
  }
}
      </config>
    </task>
    <task id="2" file="docs/INSTALLATION.md" action="CREATE">
      <title>Document installation steps</title>
    </task>
  </tasks>

  <verification>
    <check name="json_valid" command="cat ~/.claude.json | jq .">Valid JSON</check>
  </verification>

  <commit>
    <type>docs</type>
    <scope>config</scope>
    <description>add Claude Code MCP server configuration</description>
  </commit>
</session>
```

---

### Session INT-02: End-to-End Verification

```xml
<session id="INT-02" project="solomon-skills-mcp">
  <metadata>
    <phase>2</phase>
    <track>integration</track>
    <working_directory>any project</working_directory>
    <estimated_time>15 minutes</estimated_time>
    <size>quick</size>
  </metadata>

  <dependencies>
    <requires status="complete">INT-01</requires>
  </dependencies>

  <verification_steps>
    <step id="1">
      <action>Start Claude Code in any directory</action>
      <expected>Claude Code starts without errors</expected>
    </step>
    <step id="2">
      <action>Check Claude's context for skills index</action>
      <expected>HFS Development Skills list visible</expected>
    </step>
    <step id="3">
      <action>Ask Claude to load python-backend-scaffold skill</action>
      <expected>Full skill content loaded</expected>
    </step>
    <step id="4">
      <action>Ask Claude to search for "testing" skills</action>
      <expected>backend-e2e-testing and playwright-e2e-testing returned</expected>
    </step>
  </verification_steps>

  <success_criteria>
    <criterion>Skills index visible on startup</criterion>
    <criterion>All 15 skills discoverable</criterion>
    <criterion>load_skill tool works</criterion>
    <criterion>search_skills tool works</criterion>
  </success_criteria>
</session>
```

---

## Rollback Commands Reference

```bash
# Revert to pre-implementation state
git checkout main
git branch -D feature/solomon-skills-mcp

# Remove MCP config
# Edit ~/.claude.json and remove "solomon-skills" entry

# Clean workspace
rm -rf /Users/lionelj/dev/solomon-workspace/src/solomon_mcp
```

---

## Appendix A: Model Selection Guide

| Session | Model | Thinking | Rationale |
|---------|-------|----------|-----------|
| BE-01 | sonnet-4 | standard | Scaffold only |
| BE-02 | sonnet-4 | standard | Parser logic |
| BE-03 | sonnet-4 | standard | MCP integration |
| BE-04 | sonnet-4 | standard | Tool handlers |
| INT-01 | sonnet-4 | standard | Config only |
| INT-02 | sonnet-4 | standard | Verification |

---

## Appendix B: Commit Message Format

```
<type>(<scope>): <description>

Types: feat, fix, docs, test, refactor
Scope: scaffold, parser, mcp, config
```
