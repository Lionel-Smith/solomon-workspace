# /run-session

Execute the current SESSION.md prompt

## Usage

```
/run-session
```

## Behavior

1. **Read SESSION.md**: Load `solomon-docs/sessions/SESSION.md`
2. **Verify loaded**: Check that session is 🔄 Active (not empty)
3. **Load required skills**: Fetch skills from solomon-skills MCP or local files
4. **Fetch library docs**: If Context7 libraries specified, fetch documentation
5. **Search memory**: Query Mem0 for relevant project decisions
6. **Execute tasks**: Work through task list sequentially
7. **Run verification**: Execute all verification checks
8. **Report status**: Show completion summary

## Pre-Execution Checks

- SESSION.md must contain active session content
- Working directory must match session's `<working_directory>`
- Required dependencies must be ✅ Complete in PROGRESS.md

## Context Loading

The session automatically loads:
- **Skills**: HFS coding patterns (controller, service, repository)
- **Memory**: Prior decisions, established patterns, solved issues
- **Library docs**: Current API documentation via Context7

## Task Execution Pattern

```
For each task:
  1. Read task description and requirements
  2. Apply constraints and forbidden patterns
  3. Implement following skill patterns
  4. Self-verify against task requirements
```

## On Completion

When all tasks are complete and verified:

```
✅ Session SOL-01 Complete

Tasks: 6/6 ✓
Verification: 4/4 ✓

Next: /complete-session "feat(mcp): implement skills server"
```

## Error Recovery

If task fails:
1. Note the failure in SESSION.md
2. Attempt resolution
3. If blocked, mark as ❌ and suggest next steps
