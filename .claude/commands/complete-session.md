# /complete-session "{commit_message}"

Complete the session: verify, commit, update progress, archive.

## Usage
```
/complete-session "feat(api): add inmate validation service"
/complete-session "fix(web): handle error states correctly"
```

## Instructions

1. **Read SESSION.md**
   ```
   docs/sessions/SESSION.md
   ```
   Get: session_id, working_directory, title, verification checks

2. **Run final verification**
   ```bash
   cd {working_directory}
   
   # Backend
   [ -f Pipfile ] && pipenv run pytest -v --tb=short
   [ -f Pipfile ] && pipenv run ruff check .
   
   # Frontend
   [ -f package.json ] && npm run type-check
   [ -f package.json ] && npm run lint
   
   # Forbidden pattern check
   grep -rn 'return \[\]' src/ && echo "⚠️ Found forbidden pattern!"
   ```
   
   If ANY check fails:
   - Show the failure
   - Ask user to confirm proceeding or fix first
   - DO NOT commit if critical checks fail

3. **Commit changes**
   ```bash
   cd {working_directory}
   git add -A
   git status  # Show what's being committed
   git commit -m "{commit_message}

   Session: {session_id}"
   ```
   
   Capture commit hash:
   ```bash
   git rev-parse --short HEAD
   ```

4. **Update PROGRESS.md**
   ```
   docs/progress/{PROJECT}_PROGRESS.md
   ```
   
   Find session row, update:
   ```
   | {session_id} | ✅ Complete | {timestamp} | {commit_hash} |
   ```

5. **Archive SESSION.md**
   Clear or archive the completed session:
   ```markdown
   # Session Complete
   
   **Last Session:** {session_id}
   **Completed:** {timestamp}
   **Commit:** {commit_hash}
   
   Run `/load-session {NEXT_ID}` to continue.
   ```

6. **Report completion**
   ```
   ✅ Session {session_id} completed
   
   Commit: {commit_hash}
   Message: {commit_message}
   
   Files committed:
   - path/to/file1.py
   - path/to/file2.py
   
   Progress updated: {session_id} → ✅
   
   Next session: {NEXT_SESSION_ID} (check PROGRESS.md)
   ```

## Commit Message Format

Use conventional commits:
```
type(scope): description

Types:
- feat: New feature
- fix: Bug fix
- refactor: Code restructure
- test: Adding tests
- docs: Documentation
- chore: Maintenance

Examples:
- feat(api): add inmate validation service
- fix(web): handle API error states
- refactor(api): extract repository pattern
- test(api): add integration tests for inmates
```

## Rules

- ALWAYS run verification before committing
- ALWAYS update PROGRESS.md after commit
- Commit message MUST include session ID in body
- DO NOT skip verification even if "it looks fine"
