---
name: solomon-complete
description: Mark a session as complete, update progress, and store memories. Use after finishing a session's tasks, committing changes, and wanting to record completion in PROGRESS.md. Extracts key decisions and stores them to Mem0 for future sessions.
---

# Solomon Complete

Mark a session as complete, update progress, and store memories.

## Usage

```
/solomon-complete [session-id] <commit-hash>
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| session-id | No | Session to complete (default: from SESSION.md) |
| commit-hash | Yes | Git commit hash for the session |

## Execution Flow

### Step 1: Identify Session

1. If session-id provided, use it
2. Otherwise, read from `docs/sessions/SESSION.md`
3. Extract session ID from header

### Step 2: Verify Completion

1. Check all verification items from session
2. Run any verification commands
3. If any verification fails, warn but continue

### Step 3: Update Progress

1. Call `solomon-projects.mark_complete(project, session_id, commit)`
2. This updates PROGRESS.md with:
   - Completion timestamp
   - Commit hash
   - Duration (if tracked)

### Step 4: Extract Memories

Extract key decisions from session:
- Architecture decisions
- Pattern selections
- Problem solutions
- Configuration choices

Store to Mem0 scoped to project.

### Step 5: Suggest Next Sessions

1. Parse PROGRESS.md for pending sessions
2. Check which have all dependencies met
3. Display available next sessions

## Output

```
Session {session-id} completed

Commit: {commit-hash}
Duration: {duration}
Memories: {count} extracted

Available next sessions:
  {next-1}: {title}
  {next-2}: {title}

Run /solomon-session {next-1} to continue
```

## Constraints

- **CRITICAL**: Verify commit hash exists before marking complete
- **HIGH**: Store meaningful memories, not trivial ones
- **MEDIUM**: Calculate accurate duration

## Examples

```bash
/solomon-complete SOL-04 abc123d
/solomon-complete abc123d  # Uses current session from SESSION.md
```
