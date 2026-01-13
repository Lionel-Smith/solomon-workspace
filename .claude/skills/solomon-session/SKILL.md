---
name: solomon-session
description: Load a session from PROMPTS.md with full context enrichment. Use when starting a new development session, loading implementation prompts, or resuming work on a specific session ID (e.g., SOL-01, CMD-02). Automatically loads skills, fetches Context7 docs, retrieves Mem0 memories, and generates SESSION.md.
---

# Solomon Session

Load a session from PROMPTS.md with full context enrichment.

## Usage

```
/solomon-session <session-id>
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| session-id | Yes | Session identifier (e.g., SOL-01, CMD-02, BE-04) |

## Execution Flow

### Step 1: Locate Session

1. Find the project's PROMPTS.md file:
   - `solomon-docs/prompts/*_PROMPTS*.md`
   - `docs/prompts/*_PROMPTS*.md`

2. Search for session by ID:
   ```
   <session id="{session-id}"
   ```

3. Parse session XML to extract:
   - metadata (phase, track, dependencies)
   - skills list
   - context7_libraries list
   - tasks and verification checks

### Step 2: Verify Dependencies

1. Call `solomon-projects.get_progress(project_name)`
2. For each dependency, verify status is Complete
3. If any dependency incomplete, **STOP** with error

### Step 3: Load Skills

For each skill in `<skills>`:
1. Call `solomon-skills.load_skill(name={skill-name})`
2. Extract constraints and forbidden patterns

### Step 4: Fetch Library Docs

For each library in `<context7_libraries>`:
1. Call `context7.resolve-library-id(libraryName={lib})`
2. Call `context7.query-docs(libraryId={resolved-id})`

### Step 5: Retrieve Memories

1. Search Mem0 for relevant memories
2. Include top 5 relevant memories

### Step 6: Generate SESSION.md

Write enriched session to `docs/sessions/SESSION.md`

### Step 7: Display Summary

```
Session {session-id} loaded

{title}
   Phase: {phase} | Track: {track}

Skills: {count} loaded
Library Docs: {count} fetched
Memories: {count} relevant

Tasks: {count}
   1. {task-1}
   2. {task-2}

Run /run-session to begin execution
```

## Constraints

- **CRITICAL**: Never load session with unmet dependencies
- **CRITICAL**: Only call Context7 for declared libraries
- **HIGH**: Write SESSION.md to workspace, not repo

## Examples

```bash
/solomon-session SOL-04
/solomon-session CMD-02
```
