# Solomon Skills MCP Server - Implementation Prompts

**Version:** 1.0
**Status:** FINAL
**Last Updated:** 2026-01-12
**Source Plan:** SOLOMON_SKILLS_MCP_PLAN_FINAL.md
**Review Iterations:** 3 (Complete)
**Quality Score:** 90/100

---

## Document Overview

### Purpose

Implementation prompts for building the `solomon-skills` MCP server that exposes HFS development skills to Claude Code.

### Execution Tracks

| Track | Sessions | Repository |
|-------|----------|------------|
| Backend (BE) | SOL-SKILLS-01 to SOL-SKILLS-03 | solomon-mcp |

### Parallel Execution Map

```
SOL-SKILLS-01 (Core) ───► SOL-SKILLS-02 (Tools) ───► SOL-SKILLS-03 (Integration)
    55 min                    50 min                     45 min
```

**Total Estimated Time:** ~2.5 hours

---

## Progress Tracking

### Session Status Template

| Session | Status | Started | Completed | Notes |
|---------|--------|---------|-----------|-------|
| SOL-SKILLS-01 | ⬜ Not Started | | | |
| SOL-SKILLS-02 | ⬜ Not Started | | | |
| SOL-SKILLS-03 | ⬜ Not Started | | | |

**Status Legend:** ⬜ Not Started | 🔄 In Progress | ✅ Complete | ❌ Blocked

---

## Pre-Implementation Setup

```bash
# Create project directory
cd ~/dev/solomon-workspace/solomon
mkdir -p solomon_mcp/utils tests

# Initialize Python project
cd ~/dev/solomon-workspace/solomon
python -m venv .venv
source .venv/bin/activate
pip install fastmcp pyyaml pytest pytest-asyncio

# Create initial files with content
cat > solomon_mcp/__init__.py << 'EOF'
"""Solomon MCP servers for HFS workflow."""

__version__ = "0.1.0"
EOF

cat > solomon_mcp/utils/__init__.py << 'EOF'
"""Utility modules for Solomon MCP servers."""

from .frontmatter import parse_frontmatter

__all__ = ["parse_frontmatter"]
EOF

touch solomon_mcp/skills_server.py
touch solomon_mcp/utils/frontmatter.py

# Initial commit
git add .
git commit -m "chore: initialize solomon-skills MCP server structure"
```

---

## Phase 1: Foundation

### Session SOL-SKILLS-01: Core Server

```xml
<session id="SOL-SKILLS-01" project="SOLOMON-SKILLS">
  <metadata>
    <working_directory>solomon-mcp</working_directory>
    <estimated_time>55 minutes</estimated_time>
    <size>medium</size>
  </metadata>

  <dependencies>
    <requires status="complete">Pre-Implementation Setup</requires>
  </dependencies>

  <skills>
    <skill>python-backend-scaffold</skill>
  </skills>

  <system_config>
    <model>claude-sonnet-4-20250514</model>
    <thinking_mode>standard</thinking_mode>
    <temperature>0.2</temperature>
  </system_config>

  <context>
    <reference>SOLOMON_SKILLS_MCP_PLAN_FINAL.md</reference>
    <reference>~/.hfs/skills/python-backend-scaffold/SKILL.md (sample format)</reference>
  </context>

  <constraints>
    <constraint priority="critical">Use pathlib.Path for all filesystem operations</constraint>
    <constraint priority="critical">Parse frontmatter safely - malformed YAML must not crash</constraint>
    <constraint priority="critical">Validate SKILLS_DIR on startup - fail fast if invalid</constraint>
    <constraint priority="high">Use structured JSON logging</constraint>
    <constraint priority="high">Type hints on all functions</constraint>
  </constraints>

  <forbidden>
    <pattern reason="hides errors">except: pass</pattern>
    <pattern reason="hides errors">except Exception: pass</pattern>
    <pattern reason="use pathlib">os.path.</pattern>
    <pattern reason="use logging">print(</pattern>
  </forbidden>

  <tasks>
    <task id="1" file="solomon_mcp/utils/frontmatter.py" action="CREATE">
      <title>Create frontmatter parser</title>
      <description>
        Parse YAML frontmatter from SKILL.md files.
        Handle missing or malformed frontmatter gracefully.
      </description>
      <code_snippet language="python">
"""YAML frontmatter parser for SKILL.md files."""

import re
from typing import Any

import yaml

__all__ = ["parse_frontmatter"]


def parse_frontmatter(content: str) -> tuple[dict[str, Any], str]:
    """
    Extract YAML frontmatter and body from markdown content.
    
    Args:
        content: Full file content with optional frontmatter
        
    Returns:
        Tuple of (frontmatter dict, body string)
        Returns ({}, content) if no frontmatter found
    """
    pattern = r"^---\s*\n(.*?)\n---\s*\n(.*)$"
    match = re.match(pattern, content, re.DOTALL)
    if match:
        try:
            frontmatter = yaml.safe_load(match.group(1)) or {}
            body = match.group(2)
            return frontmatter, body
        except yaml.YAMLError:
            # Malformed YAML - return empty frontmatter
            return {}, content
    return {}, content
      </code_snippet>
    </task>

    <task id="2" file="solomon_mcp/skills_server.py" action="CREATE">
      <title>Create complete skills server module</title>
      <description>
        Single file containing all server logic: logging, models, loading, 
        MCP server, resource, and entry point. Tools will be added in SOL-SKILLS-02.
      </description>
      <code_snippet language="python">
"""Solomon Skills MCP Server - HFS development skills loader."""

from __future__ import annotations

import json
import logging
import os
import signal
import sys
import time
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from fastmcp import FastMCP

from .utils.frontmatter import parse_frontmatter

# ═══════════════════════════════════════════════════════════
# Public API
# ═══════════════════════════════════════════════════════════

__all__ = [
    "SkillMetadata",
    "SkillsIndex",
    "SkillsServerError",
    "SkillsDirectoryError",
    "validate_skills_directory",
    "load_skill_metadata",
    "load_all_skills",
    "format_skills_index",
    "calculate_relevance",
    "mcp",
    "main",
]

# ═══════════════════════════════════════════════════════════
# Logging Setup
# ═══════════════════════════════════════════════════════════

class JSONFormatter(logging.Formatter):
    """JSON log formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
        }
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_entry)


def setup_logging() -> logging.Logger:
    """Configure structured logging."""
    log_level = os.environ.get("LOG_LEVEL", "INFO")
    log_format = os.environ.get("LOG_FORMAT", "json")
    
    logger = logging.getLogger("solomon-skills")
    logger.setLevel(getattr(logging, log_level))
    
    handler = logging.StreamHandler()
    if log_format == "json":
        handler.setFormatter(JSONFormatter())
    else:
        handler.setFormatter(logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
        ))
    
    logger.addHandler(handler)
    return logger


logger = setup_logging()

# ═══════════════════════════════════════════════════════════
# Data Models
# ═══════════════════════════════════════════════════════════

@dataclass
class SkillMetadata:
    """Metadata extracted from skill frontmatter."""
    name: str
    description: str
    path: Path
    category: str | None = None
    triggers: list[str] | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "name": self.name,
            "description": self.description,
            "path": str(self.path),
        }


SkillsIndex = dict[str, SkillMetadata]

# ═══════════════════════════════════════════════════════════
# Exceptions
# ═══════════════════════════════════════════════════════════

class SkillsServerError(Exception):
    """Base error for solomon-skills server."""
    pass


class SkillsDirectoryError(SkillsServerError):
    """Raised when skills directory is invalid."""
    def __init__(self, path: Path, reason: str) -> None:
        self.path = path
        super().__init__(f"Invalid skills directory '{path}': {reason}")

# ═══════════════════════════════════════════════════════════
# Skills Loading
# ═══════════════════════════════════════════════════════════

def validate_skills_directory(path: Path) -> None:
    """Validate skills directory on startup."""
    if not path.exists():
        raise SkillsDirectoryError(path, "directory does not exist")
    if not path.is_dir():
        raise SkillsDirectoryError(path, "path is not a directory")
    if not os.access(path, os.R_OK):
        raise SkillsDirectoryError(path, "directory is not readable")


def load_skill_metadata(skill_dir: Path) -> SkillMetadata | None:
    """Load skill metadata from SKILL.md frontmatter."""
    skill_file = skill_dir / "SKILL.md"
    if not skill_file.exists():
        return None
    
    content = skill_file.read_text()
    frontmatter, _ = parse_frontmatter(content)
    
    return SkillMetadata(
        name=frontmatter.get("name", skill_dir.name),
        description=frontmatter.get("description", ""),
        path=skill_file,
        category=frontmatter.get("category"),
        triggers=frontmatter.get("triggers"),
    )


def load_all_skills(skills_dir: Path) -> SkillsIndex:
    """Load metadata for all skills in directory."""
    validate_skills_directory(skills_dir)
    
    skills: SkillsIndex = {}
    for item in sorted(skills_dir.iterdir()):
        if item.is_dir():
            metadata = load_skill_metadata(item)
            if metadata:
                skills[metadata.name] = metadata
                logger.info(f"Loaded skill: {metadata.name}")
            else:
                logger.warning(f"Skipping directory without SKILL.md: {item.name}")
    
    logger.info(f"Loaded {len(skills)} skills from {skills_dir}")
    return skills

# ═══════════════════════════════════════════════════════════
# Global State
# ═══════════════════════════════════════════════════════════

skills_index: SkillsIndex = {}
SKILLS_DIR: Path = Path()
SERVER_START_TIME: float = 0.0

# ═══════════════════════════════════════════════════════════
# MCP Server
# ═══════════════════════════════════════════════════════════

def format_skills_index(skills: SkillsIndex) -> str:
    """Format skills index as markdown."""
    lines = [
        "# HFS Development Skills",
        "",
        f"{len(skills)} skills available. Use `load_skill(name)` to load full content.",
        "",
        "## Available Skills",
        "",
    ]
    for name in sorted(skills.keys()):
        skill = skills[name]
        lines.append(f"- **{name}**: {skill.description}")
    return "\n".join(lines)


mcp = FastMCP("solomon-skills")


@mcp.resource("skills://index")
def skills_resource() -> str:
    """Return skills index as markdown."""
    return format_skills_index(skills_index)

# ═══════════════════════════════════════════════════════════
# Search Algorithm (used by search_skills tool)
# ═══════════════════════════════════════════════════════════

def calculate_relevance(query: str, skill: SkillMetadata) -> int:
    """
    Calculate search relevance score.
    
    Scoring:
    - Exact name match: 3 points
    - Name contains query: 2 points
    - Description contains query: 1 point
    """
    query_lower = query.lower()
    score = 0
    
    if query_lower == skill.name.lower():
        score += 3
    elif query_lower in skill.name.lower():
        score += 2
    
    if query_lower in skill.description.lower():
        score += 1
    
    return score

# ═══════════════════════════════════════════════════════════
# MCP Tools (added in SOL-SKILLS-02)
# ═══════════════════════════════════════════════════════════

# Tools will be added here by SOL-SKILLS-02

# ═══════════════════════════════════════════════════════════
# Entry Point
# ═══════════════════════════════════════════════════════════

def handle_shutdown(signum: int, frame: Any) -> None:
    """Handle graceful shutdown."""
    logger.info("Shutting down solomon-skills server...")
    sys.exit(0)


def main() -> None:
    """Main entry point."""
    global skills_index, SKILLS_DIR, SERVER_START_TIME
    
    signal.signal(signal.SIGTERM, handle_shutdown)
    signal.signal(signal.SIGINT, handle_shutdown)
    
    SERVER_START_TIME = time.time()
    SKILLS_DIR = Path(os.environ.get("SKILLS_DIR", Path.home() / ".hfs" / "skills"))
    
    logger.info(f"Starting solomon-skills server with SKILLS_DIR={SKILLS_DIR}")
    skills_index = load_all_skills(SKILLS_DIR)
    
    mcp.run()


if __name__ == "__main__":
    main()
      </code_snippet>
    </task>
  </tasks>

  <verification>
    <check name="syntax" command="python -m py_compile solomon_mcp/skills_server.py">Compiles</check>
    <check name="imports" command="python -c 'from solomon_mcp.skills_server import mcp'">Imports work</check>
    <check name="no_print" command="grep -rn 'print(' solomon_mcp/ | grep -v '# noqa' || echo 'Clean'">No print statements</check>
    <check name="no_os_path" command="grep -rn 'os.path' solomon_mcp/ || echo 'Clean'">No os.path usage</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>solomon-skills</scope>
    <description>add core MCP server with skills index resource</description>
  </commit>
</session>
```

---

## Phase 2: Tools

### Session SOL-SKILLS-02: MCP Tools

```xml
<session id="SOL-SKILLS-02" project="SOLOMON-SKILLS">
  <metadata>
    <working_directory>solomon-mcp</working_directory>
    <estimated_time>50 minutes</estimated_time>
    <size>medium</size>
  </metadata>

  <dependencies>
    <requires status="complete">SOL-SKILLS-01</requires>
  </dependencies>

  <skills>
    <skill>python-backend-scaffold</skill>
  </skills>

  <system_config>
    <model>claude-sonnet-4-20250514</model>
    <thinking_mode>standard</thinking_mode>
    <temperature>0.2</temperature>
  </system_config>

  <constraints>
    <constraint priority="critical">Return user-friendly error messages, never raise to MCP layer</constraint>
    <constraint priority="critical">All tools must be decorated with @mcp.tool()</constraint>
    <constraint priority="high">Search relevance: exact name=3, partial name=2, description=1</constraint>
  </constraints>

  <forbidden>
    <pattern reason="hides errors">except: pass</pattern>
    <pattern reason="raise to MCP layer">raise SkillNotFoundError</pattern>
  </forbidden>

  <tasks>
    <task id="1" file="solomon_mcp/skills_server.py" action="REPLACE_PLACEHOLDER">
      <title>Add all MCP tools</title>
      <description>
        Replace the placeholder comment "# Tools will be added here by SOL-SKILLS-02"
        with the complete tools implementation below.
      </description>
      <find_marker># Tools will be added here by SOL-SKILLS-02</find_marker>
      <code_snippet language="python">
@mcp.tool()
def list_skills() -> list[dict[str, str]]:
    """List all available HFS development skills."""
    return [skill.to_dict() for skill in sorted(skills_index.values(), key=lambda s: s.name)]


@mcp.tool()
def load_skill(name: str) -> str:
    """
    Load full content of a specific skill into context.
    
    Args:
        name: Skill name (e.g., 'python-backend-scaffold')
    """
    if name not in skills_index:
        available = ", ".join(sorted(skills_index.keys()))
        return f"❌ Skill not found: {name}\n\nAvailable skills: {available}"
    
    skill = skills_index[name]
    return skill.path.read_text()


@mcp.tool()
def load_skills(names: list[str]) -> str:
    """
    Load multiple skills at once.
    
    Args:
        names: List of skill names to load
    """
    if not names:
        return "❌ No skill names provided"
    
    results = []
    for name in names:
        if name in skills_index:
            content = skills_index[name].path.read_text()
            results.append(f"# ═══ {name} ═══\n\n{content}")
        else:
            results.append(f"# ═══ {name} ═══\n\n❌ Skill not found")
    return "\n\n".join(results)


@mcp.tool()
def search_skills(query: str) -> list[dict[str, Any]]:
    """
    Search skills by keyword in name or description.
    
    Args:
        query: Search term (case-insensitive)
    """
    results = []
    for skill in skills_index.values():
        relevance = calculate_relevance(query, skill)
        if relevance > 0:
            results.append({
                "name": skill.name,
                "description": skill.description,
                "relevance": relevance,
            })
    
    # Sort by relevance descending, then name ascending
    results.sort(key=lambda x: (-x["relevance"], x["name"]))
    return results


@mcp.tool()
def health() -> dict[str, Any]:
    """Check server health and return diagnostics."""
    return {
        "status": "healthy",
        "skills_count": len(skills_index),
        "skills_dir": str(SKILLS_DIR),
        "uptime_seconds": round(time.time() - SERVER_START_TIME, 2),
    }
      </code_snippet>
    </task>
  </tasks>

  <verification>
    <check name="syntax" command="python -m py_compile solomon_mcp/skills_server.py">Compiles</check>
    <check name="tool_count" command="grep -c '@mcp.tool()' solomon_mcp/skills_server.py">5 tools defined</check>
    <check name="no_raise" command="grep -n 'raise Skill' solomon_mcp/skills_server.py || echo 'Clean'">No raises in tools</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>solomon-skills</scope>
    <description>add list, load, search, and health tools</description>
  </commit>
</session>
```

---

## Phase 3: Integration

### Session SOL-SKILLS-03: Integration & Testing

```xml
<session id="SOL-SKILLS-03" project="SOLOMON-SKILLS">
  <metadata>
    <working_directory>solomon-mcp</working_directory>
    <estimated_time>45 minutes</estimated_time>
    <size>medium</size>
  </metadata>

  <dependencies>
    <requires status="complete">SOL-SKILLS-02</requires>
  </dependencies>

  <skills>
    <skill>backend-e2e-testing</skill>
  </skills>

  <system_config>
    <model>claude-sonnet-4-20250514</model>
    <thinking_mode>standard</thinking_mode>
    <temperature>0.2</temperature>
  </system_config>

  <constraints>
    <constraint priority="critical">Tests must use temp directory fixtures, not real ~/.hfs/skills</constraint>
    <constraint priority="high">All tests must be async-compatible</constraint>
  </constraints>

  <forbidden>
    <pattern reason="don't test against real data">Path.home()</pattern>
    <pattern reason="use fixtures">/Users/lionelj/.hfs/skills</pattern>
  </forbidden>

  <tasks>
    <task id="1" file="tests/conftest.py" action="CREATE">
      <title>Create test fixtures</title>
      <code_snippet language="python">
"""Test fixtures for solomon-skills MCP server."""

import pytest
from pathlib import Path
from tempfile import TemporaryDirectory
from typing import Generator


@pytest.fixture
def temp_skills_dir() -> Generator[Path, None, None]:
    """Create temporary skills directory with sample skills."""
    with TemporaryDirectory() as tmpdir:
        skills_path = Path(tmpdir)
        
        # Create test-skill
        skill_dir = skills_path / "test-skill"
        skill_dir.mkdir()
        (skill_dir / "SKILL.md").write_text("""---
name: test-skill
description: A test skill for unit tests
---

# Test Skill

This is test content.
""")
        
        # Create another-skill
        skill_dir2 = skills_path / "another-skill"
        skill_dir2.mkdir()
        (skill_dir2 / "SKILL.md").write_text("""---
name: another-skill
description: Another skill for testing search
---

# Another Skill

More test content.
""")
        
        # Create backend-testing skill (for search tests)
        skill_dir3 = skills_path / "backend-testing"
        skill_dir3.mkdir()
        (skill_dir3 / "SKILL.md").write_text("""---
name: backend-testing
description: Backend testing patterns
---

# Backend Testing

Testing patterns.
""")
        
        yield skills_path


@pytest.fixture
def empty_skills_dir() -> Generator[Path, None, None]:
    """Create empty skills directory."""
    with TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def file_not_dir(tmp_path: Path) -> Path:
    """Create a file where a directory is expected."""
    file_path = tmp_path / "not_a_directory"
    file_path.write_text("I am a file")
    return file_path
      </code_snippet>
    </task>

    <task id="2" file="tests/test_frontmatter.py" action="CREATE">
      <title>Create frontmatter parser tests</title>
      <code_snippet language="python">
"""Tests for frontmatter parser."""

from solomon_mcp.utils.frontmatter import parse_frontmatter


def test_parse_frontmatter_valid():
    content = """---
name: test
description: A test skill
---

# Content here
"""
    frontmatter, body = parse_frontmatter(content)
    assert frontmatter["name"] == "test"
    assert frontmatter["description"] == "A test skill"
    assert "# Content here" in body


def test_parse_frontmatter_missing():
    content = "# Just markdown\n\nNo frontmatter here."
    frontmatter, body = parse_frontmatter(content)
    assert frontmatter == {}
    assert body == content


def test_parse_frontmatter_malformed_yaml():
    content = """---
name: test
invalid: [unclosed
---

# Content
"""
    frontmatter, body = parse_frontmatter(content)
    assert frontmatter == {}
    # Falls back to full content


def test_parse_frontmatter_empty_yaml():
    content = """---
---

# Content
"""
    frontmatter, body = parse_frontmatter(content)
    assert frontmatter == {}
    assert "# Content" in body
      </code_snippet>
    </task>

    <task id="3" file="tests/test_skills_loader.py" action="CREATE">
      <title>Create skills loader tests</title>
      <code_snippet language="python">
"""Tests for skills loader."""

import pytest
from pathlib import Path

from solomon_mcp.skills_server import (
    load_all_skills,
    load_skill_metadata,
    validate_skills_directory,
    SkillsDirectoryError,
)


def test_load_skills_directory(temp_skills_dir: Path):
    skills = load_all_skills(temp_skills_dir)
    assert len(skills) == 3
    assert "test-skill" in skills
    assert "another-skill" in skills
    assert "backend-testing" in skills


def test_load_skill_metadata(temp_skills_dir: Path):
    skill_dir = temp_skills_dir / "test-skill"
    metadata = load_skill_metadata(skill_dir)
    assert metadata is not None
    assert metadata.name == "test-skill"
    assert metadata.description == "A test skill for unit tests"


def test_validate_skills_dir_missing():
    with pytest.raises(SkillsDirectoryError) as exc:
        validate_skills_directory(Path("/nonexistent/path"))
    assert "does not exist" in str(exc.value)


def test_validate_skills_dir_not_directory(file_not_dir: Path):
    with pytest.raises(SkillsDirectoryError) as exc:
        validate_skills_directory(file_not_dir)
    assert "not a directory" in str(exc.value)


def test_empty_skills_dir(empty_skills_dir: Path):
    skills = load_all_skills(empty_skills_dir)
    assert len(skills) == 0


def test_skill_without_skill_md(temp_skills_dir: Path):
    # Create directory without SKILL.md
    (temp_skills_dir / "empty-dir").mkdir()
    skills = load_all_skills(temp_skills_dir)
    assert "empty-dir" not in skills
      </code_snippet>
    </task>

    <task id="4" file="tests/test_search.py" action="CREATE">
      <title>Create search relevance tests</title>
      <code_snippet language="python">
"""Tests for search functionality."""

import pytest
from pathlib import Path

from solomon_mcp.skills_server import (
    calculate_relevance,
    SkillMetadata,
)


@pytest.fixture
def sample_skill() -> SkillMetadata:
    return SkillMetadata(
        name="python-backend-scaffold",
        description="Scaffold production-ready Python backends",
        path=Path("/fake/path"),
    )


def test_search_exact_name_match(sample_skill: SkillMetadata):
    score = calculate_relevance("python-backend-scaffold", sample_skill)
    assert score == 3  # Exact match


def test_search_partial_name_match(sample_skill: SkillMetadata):
    score = calculate_relevance("python", sample_skill)
    assert score == 3  # Partial name (2) + description (1)


def test_search_description_only(sample_skill: SkillMetadata):
    score = calculate_relevance("production", sample_skill)
    assert score == 1  # Description only


def test_search_no_match(sample_skill: SkillMetadata):
    score = calculate_relevance("javascript", sample_skill)
    assert score == 0


def test_search_case_insensitive(sample_skill: SkillMetadata):
    score = calculate_relevance("PYTHON", sample_skill)
    assert score == 3  # Should match case-insensitively
      </code_snippet>
    </task>

    <task id="5" file="tests/test_index_format.py" action="CREATE">
      <title>Create index formatting tests</title>
      <code_snippet language="python">
"""Tests for skills index formatting."""

from pathlib import Path

from solomon_mcp.skills_server import (
    format_skills_index,
    SkillMetadata,
    SkillsIndex,
)


def test_format_skills_index_empty():
    skills: SkillsIndex = {}
    result = format_skills_index(skills)
    assert "# HFS Development Skills" in result
    assert "0 skills available" in result


def test_format_skills_index_with_skills():
    skills: SkillsIndex = {
        "alpha-skill": SkillMetadata(
            name="alpha-skill",
            description="First skill",
            path=Path("/fake/alpha"),
        ),
        "beta-skill": SkillMetadata(
            name="beta-skill",
            description="Second skill",
            path=Path("/fake/beta"),
        ),
    }
    result = format_skills_index(skills)
    
    assert "# HFS Development Skills" in result
    assert "2 skills available" in result
    assert "- **alpha-skill**: First skill" in result
    assert "- **beta-skill**: Second skill" in result
    # Verify alphabetical order (alpha before beta)
    assert result.index("alpha-skill") < result.index("beta-skill")
      </code_snippet>
    </task>

    <task id="6" file="tests/test_tools.py" action="CREATE">
      <title>Create tool integration tests</title>
      <code_snippet language="python">
"""Integration tests for MCP tools."""

import pytest
from pathlib import Path

import solomon_mcp.skills_server as server


@pytest.fixture(autouse=True)
def setup_skills_index(temp_skills_dir: Path):
    """Set up skills index for all tool tests."""
    server.skills_index = server.load_all_skills(temp_skills_dir)
    server.SKILLS_DIR = temp_skills_dir
    server.SERVER_START_TIME = 0.0
    yield
    server.skills_index = {}


def test_list_skills():
    result = server.list_skills()
    assert len(result) == 3
    names = [s["name"] for s in result]
    assert "test-skill" in names


def test_load_skill_exists():
    result = server.load_skill("test-skill")
    assert "# Test Skill" in result
    assert "test content" in result


def test_load_skill_not_found():
    result = server.load_skill("nonexistent")
    assert "❌ Skill not found" in result
    assert "Available skills" in result


def test_load_skills_batch():
    result = server.load_skills(["test-skill", "another-skill"])
    assert "# ═══ test-skill ═══" in result
    assert "# ═══ another-skill ═══" in result


def test_load_skills_batch_partial_not_found():
    result = server.load_skills(["test-skill", "nonexistent"])
    assert "# ═══ test-skill ═══" in result
    assert "# ═══ nonexistent ═══" in result
    assert "❌ Skill not found" in result


def test_load_skills_empty_list():
    result = server.load_skills([])
    assert "❌ No skill names provided" in result


def test_search_skills_found():
    result = server.search_skills("test")
    assert len(result) >= 1
    assert any(s["name"] == "test-skill" for s in result)


def test_search_skills_not_found():
    result = server.search_skills("nonexistent")
    assert len(result) == 0


def test_search_skills_sorted_by_relevance():
    result = server.search_skills("backend")
    # "backend-testing" should score higher (name match) than others
    assert result[0]["name"] == "backend-testing"


def test_health():
    result = server.health()
    assert result["status"] == "healthy"
    assert result["skills_count"] == 3
      </code_snippet>
    </task>

    <task id="7" file="pyproject.toml" action="CREATE">
      <title>Create pyproject.toml</title>
      <code_snippet language="toml">
[project]
name = "solomon-mcp"
version = "0.1.0"
description = "Solomon MCP servers for HFS workflow"
requires-python = ">=3.11"
dependencies = [
    "fastmcp>=2.0.0",
    "pyyaml>=6.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-asyncio>=0.23",
]

[project.scripts]
solomon-skills = "solomon_mcp.skills_server:main"

[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
      </code_snippet>
    </task>

    <task id="8" file="README.md" action="CREATE">
      <title>Create README with usage instructions</title>
      <code_snippet language="markdown">
# Solomon Skills MCP Server

MCP server that exposes HFS development skills to Claude Code.

## Installation

```bash
pip install -e .
```

## Configuration

Add to `~/.claude.json`:

```json
{
  "mcpServers": {
    "solomon-skills": {
      "command": "python",
      "args": ["-m", "solomon_mcp.skills_server"],
      "env": {
        "SKILLS_DIR": "/path/to/.hfs/skills"
      }
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SKILLS_DIR` | `~/.hfs/skills` | Skills directory |
| `LOG_LEVEL` | `INFO` | Logging level |
| `LOG_FORMAT` | `json` | Log format (json/text) |

## Available Tools

- `list_skills()` - List all available skills
- `load_skill(name)` - Load full skill content
- `load_skills(names)` - Load multiple skills
- `search_skills(query)` - Search by keyword
- `health()` - Server diagnostics

## Development

```bash
pip install -e ".[dev]"
pytest
```
      </code_snippet>
    </task>
  </tasks>

  <verification>
    <check name="tests_pass" command="pytest tests/ -v">All tests pass</check>
    <check name="test_count" command="pytest tests/ --collect-only -q | tail -1">21+ tests collected</check>
    <check name="readme_exists" command="test -f README.md && echo 'OK'">README exists</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>solomon-skills</scope>
    <description>add tests, pyproject.toml, and documentation</description>
  </commit>
</session>
```

---

## Rollback Commands Reference

```bash
# Rollback SOL-SKILLS-03
git reset --hard HEAD~1

# Rollback to before any solomon-skills work
git log --oneline | grep "initialize solomon-skills" | cut -d' ' -f1 | xargs git reset --hard
```

---

## Appendix: Commit Message Format

```
<type>(<scope>): <description>

Types: feat, fix, docs, chore, refactor, test
Scope: solomon-skills, solomon-projects, etc.

Examples:
feat(solomon-skills): add core MCP server with skills index resource
feat(solomon-skills): add list, load, search, and health tools
feat(solomon-skills): add tests, pyproject.toml, and documentation
```

---

*SOLOMON_SKILLS_MCP_PROMPTS_FINAL.md*
*Generated: January 12, 2026*
*Review Iterations: 3 (Complete)*
*Quality Score: 90/100*
