# Solomon Skills MCP Server - Architecture Plan FINAL

## 1. Executive Summary

### Problem Statement
When Claude Code starts, it has no awareness of HFS development skills. Developers must manually reference skill files or copy-paste content, breaking workflow continuity and increasing context overhead.

### Solution Overview
An MCP server (`solomon-skills`) that:
1. Loads all HFS skills from `~/.hfs/skills/` at startup
2. Exposes a compact index as an always-visible MCP resource
3. Provides on-demand full skill content via MCP tools
4. Enables Claude to discover and apply skills contextually

### Key Design Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Skill surfacing | Hybrid (index as resource, content as tool) | All resources, All tools | Balances discoverability vs context bloat |
| Skill location | Single global dir (`~/.hfs/skills`) | Project-local + global | Simplicity; HFS skills are universal |
| Skill format | YAML frontmatter + Markdown body | Pure YAML, Pure Markdown | Preserves existing format, structured metadata |
| Index format | Markdown list | JSON array | Human-readable in Claude context |
| Search capability | Keyword matching on name/description | Full-text search | Sufficient for ~15 skills |

---

## 2. Data Model

### Skill Structure (Read-Only)

```
~/.hfs/skills/
├── python-backend-scaffold/
│   └── SKILL.md          # YAML frontmatter + markdown body
├── session-orchestrator/
│   └── SKILL.md
└── ... (15 skills total)
```

### SKILL.md Format (Existing)

```yaml
---
name: python-backend-scaffold
description: Scaffold production-ready Python backends with three-layer architecture...
version: "1.0"  # Optional - for future compatibility
category: backend  # Optional - for filtering
---

# Python Backend Scaffold

[Full markdown content...]
```

### SkillData Type Definition

```python
from dataclasses import dataclass
from pathlib import Path

@dataclass(frozen=True)
class SkillData:
    """Immutable representation of a parsed HFS skill metadata."""
    name: str           # Skill identifier (from frontmatter or dir name)
    description: str    # One-line summary
    path: Path          # Absolute path to SKILL.md
    version: str | None = None    # Optional version
    category: str | None = None   # Optional category
    
    # Note: Content is NOT stored here - loaded on-demand via skill_loader
```

### Layer Responsibilities

| Layer | Responsibility | Does NOT |
|-------|----------------|----------|
| models.py | Data structures (SkillData) | File I/O, business logic |
| skill_loader.py | Parse files, discover skills | Business rules |
| skill_service.py | Index formatting, search logic | Direct file access |
| skills_server.py | MCP protocol handling | Business logic |

---

## 3. MCP Interface Design

### Resources (Always Visible)

| URI | Name | MIME Type | Content |
|-----|------|-----------|---------|
| `skills://index` | HFS Skills Index | text/markdown | Formatted list of all skills |

**Resource Content Format:**

```markdown
# HFS Development Skills

- **backend-e2e-testing**: Comprehensive backend E2E testing with pytest-asyncio
- **debugging-workflow**: Systematic debugging workflow for complex production issues
- **deep-app-research**: Comprehensive application research with competitor analysis
...
```

### Tools (On-Demand)

#### load_skill

| Property | Value |
|----------|-------|
| Name | load_skill |
| Description | Load full skill content into context |
| Input | `{ "name": string }` |
| Output | Full SKILL.md content or error message |
| Error | `"Skill not found: {name}. Available: [list]"` |

#### load_skills

| Property | Value |
|----------|-------|
| Name | load_skills |
| Description | Load multiple skills at once |
| Input | `{ "names": string[] }` |
| Output | Concatenated content with skill separators |
| Error | Per-skill errors inline: `"# ═══ {name} ═══\n\nSkill not found."` |

#### search_skills

| Property | Value |
|----------|-------|
| Name | search_skills |
| Description | Search skills by keyword in name or description |
| Input | `{ "query": string }` |
| Output | Matching skills with relevance scores |
| Error | `"No skills found matching: {query}"` |

### Search Relevance Algorithm

```python
def calculate_relevance(skill: SkillData, query: str) -> int:
    """
    Calculate search relevance score for a skill.
    
    Scoring:
    - Exact name match: +10
    - Query in name: +5
    - Query in description: +2
    - Case-insensitive matching throughout
    
    Returns: 0 if no match, otherwise sum of scores
    """
    query_lower = query.lower()
    score = 0
    
    # Exact name match (highest priority)
    if skill.name.lower() == query_lower:
        score += 10
    # Partial name match
    elif query_lower in skill.name.lower():
        score += 5
    
    # Description match
    if query_lower in skill.description.lower():
        score += 2
    
    return score
```

### Error Response Pattern

All tools return `TextContent` with human-readable messages:
- Success: Requested content
- Not Found: Helpful message with suggestions
- No tools raise exceptions to MCP layer

---

## 4. User Flows

### Flow 1: Claude Code Startup

```
1. User runs `claude` in terminal
2. Claude Code reads ~/.claude.json
3. Finds solomon-skills MCP server config
4. Spawns: python -m solomon_mcp.skills_server
5. Server reads ~/.hfs/skills/**/SKILL.md
6. Server exposes skills://index resource
7. Claude sees skills index in context automatically
```

### Flow 2: Skill Discovery

```
1. User asks: "How should I structure my backend?"
2. Claude sees skills index (always visible)
3. Claude identifies relevant skill: python-backend-scaffold
4. Claude calls: load_skill(name="python-backend-scaffold")
5. Full skill content loaded into context
6. Claude applies skill patterns in response
```

### Flow 3: Multi-Skill Session

```
1. User starts: "I'm beginning a new feature implementation"
2. Claude calls: load_skills(names=["project-plan-creator", "implementation-plan-generator"])
3. Both skills loaded simultaneously
4. Claude orchestrates workflow using both
```

### Flow 4: Skill Search

```
1. User asks: "What skills help with testing?"
2. Claude calls: search_skills(query="testing")
3. Returns:
   - backend-e2e-testing (relevance: 5) - "testing" in name
   - playwright-e2e-testing (relevance: 5) - "testing" in name
4. Claude offers to load relevant skills
```

---

## 5. Implementation Roadmap

### Phase 1: Core Implementation

| Session | Scope | Output | Dependencies |
|---------|-------|--------|--------------|
| BE-01 | Project scaffold | pyproject.toml, package structure | mcp>=1.0, pyyaml, python-dotenv |
| BE-02 | Skill parsing | skill_loader.py, models.py | BE-01 |
| BE-03 | MCP resources | skills://index working | BE-02 |
| BE-04 | MCP tools | All 3 tools working | BE-03 |

### Phase 2: Integration

| Session | Scope | Output |
|---------|-------|--------|
| INT-01 | Claude Code configuration | ~/.claude.json setup |
| INT-02 | End-to-end testing | Manual verification |

### Dependency Graph

```
BE-01 ─── BE-02 ─── BE-03 ─── BE-04
                              │
                              ▼
                          INT-01 ─── INT-02
```

---

## 6. Open Questions

| Question | Resolution | Rationale |
|----------|------------|-----------|
| Should skills be cached? | No - reload on each list_resources | Skills rarely change; simplicity > performance |
| Handle malformed SKILL.md? | Log warning, skip skill | Graceful degradation |
| Max skills to load at once? | No limit (tools only) | User controls what to load |
| Watch for file changes? | No - not needed for MVP | Complexity not justified |

---

## 7. Backend Patterns

### Project Structure

```
solomon-workspace/
├── pyproject.toml
├── README.md
├── src/
│   └── solomon_mcp/
│       ├── __init__.py           # Package marker
│       ├── __main__.py           # Entry point
│       ├── skills_server.py      # MCP server (controller)
│       ├── skill_service.py      # Business logic (service)
│       ├── skill_loader.py       # File operations (repository)
│       ├── models.py             # SkillData dataclass
│       └── config.py             # Configuration loading
└── tests/
    ├── __init__.py
    ├── conftest.py               # Pytest fixtures
    ├── test_skill_loader.py      # Loader unit tests
    ├── test_skill_service.py     # Service unit tests
    └── test_skills_server.py     # Integration tests
```

### Error Handling Pattern

```python
# skill_loader.py - Repository layer
def load_skill_file(path: Path) -> SkillData | None:
    """
    Load skill file, return None if invalid.
    Never raises - logs warnings and returns None for graceful degradation.
    """
    try:
        content = path.read_text()
        return parse_skill(content, path)
    except FileNotFoundError:
        logger.warning(f"Skill file not found: {path}")
        return None
    except yaml.YAMLError as e:
        logger.warning(f"Invalid frontmatter in {path}: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error loading {path}: {e}")
        return None
```

```python
# skill_service.py - Service layer
def get_skill_content(name: str) -> str:
    """
    Get full skill content by name.
    Returns error message (not exception) if not found.
    """
    skill = _find_skill_by_name(name)
    if skill is None:
        available = ", ".join(s.name for s in get_all_skills())
        return f"Skill not found: {name}. Available: {available}"
    
    return skill_loader.read_skill_content(skill.path)
```

### Async Pattern Note

```python
# skills_server.py - MCP handlers are async by protocol
# File I/O is sync but fast for small files (<100KB each)
# No need for async file ops at this scale - would add complexity

@server.read_resource()
async def read_resource(uri: str) -> str:
    # Sync call is acceptable - files are small, local
    return skill_service.get_skills_index()
```

---

## 8. Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| SKILLS_DIR | ~/.hfs/skills | Skills directory path (tilde expanded at runtime) |
| LOG_LEVEL | INFO | Logging verbosity (DEBUG, INFO, WARNING, ERROR) |

### Path Expansion

```python
# config.py
import os
from pathlib import Path

def get_skills_dir() -> Path:
    """Get skills directory with tilde expansion."""
    raw_path = os.environ.get("SKILLS_DIR", "~/.hfs/skills")
    return Path(raw_path).expanduser().resolve()
```

### Claude Code Configuration (~/.claude.json)

```json
{
  "mcpServers": {
    "solomon-skills": {
      "command": "uv",
      "args": ["run", "--directory", "/Users/lionelj/dev/solomon-workspace", 
               "python", "-m", "solomon_mcp.skills_server"],
      "env": {
        "SKILLS_DIR": "/Users/lionelj/.hfs/skills"
      }
    }
  }
}
```

---

## 9. Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Startup time | < 500ms | Time from spawn to ready |
| Skills index visible | 100% | Always in Claude context |
| Skill load time | < 100ms | Time to return full content |
| Skill count | 15 | All HFS skills discoverable |

---

## 10. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Large skill bloats context | Medium | Index only; content on-demand |
| SKILL.md format changes | Low | Parser handles missing fields gracefully |
| MCP protocol changes | Low | Pin MCP library version |
| Skills directory missing | Low | Graceful empty index |

---

## 11. Future Enhancements (Post-MVP)

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| Category filtering | Medium | Low | Filter skills by category in search |
| Skill aliases | Low | Low | Map common misspellings to skill names |
| Index caching | Low | Medium | Cache skill index for repeated reads |
| File watching | Low | High | Detect skill file changes without restart |
| Skill validation | Medium | Medium | Validate skill structure on load |
| Usage analytics | Low | Medium | Track which skills are used most |

---

## Appendix A: Full Skill List

1. backend-e2e-testing
2. debugging-workflow
3. deep-app-research
4. development-workflow
5. fullstack-integration
6. hfs-project-bootstrap
7. hfs-repo-maintenance
8. hfs-skill-creator
9. hfs-vscode-orchestrator
10. implementation-plan-generator
11. plan-review-loop
12. playwright-e2e-testing
13. project-plan-creator
14. python-backend-scaffold
15. session-orchestrator

---

## Appendix B: Package Dependencies

```toml
# pyproject.toml
[project]
name = "solomon-skills-mcp"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "mcp>=1.0.0",      # MCP protocol - pin major version
    "pyyaml>=6.0",     # YAML parsing
    "python-dotenv>=1.0",  # Environment loading
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
]
```

---

## Appendix C: Manual Verification Commands

```bash
# Test skill discovery
uv run python -c "
from solomon_mcp.skill_loader import discover_skills
from solomon_mcp.config import get_skills_dir
skills = discover_skills(get_skills_dir())
print(f'Found {len(skills)} skills')
for s in skills:
    print(f'  - {s.name}')
"

# Test index generation
uv run python -c "
from solomon_mcp.skill_service import get_skills_index
print(get_skills_index())
"

# Test skill loading
uv run python -c "
from solomon_mcp.skill_service import get_skill_content
print(get_skill_content('python-backend-scaffold')[:200])
"

# Test search
uv run python -c "
from solomon_mcp.skill_service import search_skills
for skill, score in search_skills('testing'):
    print(f'{skill.name}: {score}')
"
```

---

## Review History

| Version | Date | Changes | Quality Score |
|---------|------|---------|---------------|
| v1 | 2025-01-12 | Initial draft with SkillData, error patterns | 72/100 |
| v2 | 2025-01-12 | Fixed layer separation, added dependencies | 82/100 |
| v3 | 2025-01-12 | Added tests structure, search algorithm | 89/100 |
| FINAL | 2025-01-12 | Added future enhancements, polish | 93/100 |
