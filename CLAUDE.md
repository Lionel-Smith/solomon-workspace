@AGENTS.md

## Compaction Instructions

When compacting this conversation, preserve the following context — autonomous session runs depend on it surviving summarization:

**HFS workflow state (always preserve):**
- Active feature name and prefix (e.g., `frontend-wired-verification` / `FWV`)
- Active session ID currently loaded in `solomon-docs/sessions/SESSION.md`
- Path to the active plan and prompts file (e.g., `solomon-docs/plans/FWV_VERIFICATION_PLAN.md`, `solomon-docs/prompts/FWV_VERIFICATION_PROMPTS.md`)
- Which repository is the current working directory for the active session (`solomon/`, `hfs-development-kit/`, `solomon-dashboard/`, or workspace root)
- Uncommitted files that belong to the active session (so they are not accidentally discarded)
- Session dependencies and wave position (e.g., "FWV-03 depends on FWV-01; Wave 1b")

**Per-session verification checks (always preserve):**
- `<verification>` check list from the loaded SESSION.md — these are the pass gate for `/session:complete`
- `<forbidden>` patterns from the loaded SESSION.md — violating these blocks commit
- `<constraint priority="critical">` entries — these cannot be relaxed during compaction

**User-stated boundaries (always preserve — Anthropic docs warn these otherwise vanish):**
- Any prohibition the user stated about destructive ops, force pushes, or branch targets
- Any "run only these specific sessions" scope the user set
- Any per-session manual-gate requirement (e.g., "FWV-06 needs manual review — parser-self-modification risk")

**User-granted authorizations (always preserve — compactors retain prohibitions far better than permissions):**
- Any action the user explicitly approved this conversation, with its exact scope (e.g., "approved: disable openclaw.service, cap journald, docker prune — droplet only")
- Whether each approved action has actually been *executed*, or is still pending
- Any action that is user-approved but **blocked by the auto-mode classifier** — the classifier evaluates each tool call independently and does not observe `AskUserQuestion` answers, so a dropped approval means re-asking the user a question they already answered

**Safe to summarize / drop:**
- Intermediate tool output, grep results, file listings
- Brainstorming / visual companion screens
- Completed sessions' full XML (keep ID + commit hash + verdict only)
- Research findings older than the current session's scope
