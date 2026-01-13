# /load-session

Load a session from SOLOMON_PROMPTS.md into SESSION.md

## Usage

```
/load-session <session-id>
```

## Arguments

- `session-id`: The session identifier (e.g., SOL-01, CMD-02, ENH-01)

## Behavior

1. **Read PROMPTS file**: Open `solomon-docs/prompts/SOLOMON_PROMPTS.md`
2. **Find session**: Locate the `<session id="{session-id}">` block
3. **Check dependencies**: Verify all `<depends>` and `<requires>` sessions are ✅ in PROGRESS.md
4. **Extract content**: Pull metadata, skills, context, tasks, constraints, forbidden patterns
5. **Write SESSION.md**: Populate `solomon-docs/sessions/SESSION.md` with full prompt
6. **Update PROGRESS.md**: Mark session as 🔄 Active with start timestamp

## Example Output

```markdown
# SESSION: SOL-01

**Phase:** 1 - Foundation
**Size:** 🔨 Medium (45 min)
**Status:** 🔄 Active
**Started:** 2026-01-11 14:30

## Skills Required
- python-backend-scaffold

## Context
[session context here]

## Tasks
1. Create mcp/skills_server.py with FastMCP 2.0
2. Implement list_skills tool
...

## Constraints
- [CRITICAL] Use FastMCP 2.0 decorators
...

## Verification
- [ ] list_skills returns skill names
...
```

## Post-Load

After loading, execute with `/run-session`
