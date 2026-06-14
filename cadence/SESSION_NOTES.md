# HFS Cadence Layer — Session Notes Scratchpad

Per-session task capture and learnings queue.

Format per session:
- `### {SESSION_ID} — Tasks` — checklist of in-session todos
- `### {SESSION_ID} — Learnings (queue for /learn capture)` — observations to later capture as cadence_learnings

---

### SETUP-00 — Tasks

- [x] Verify working trees
- [x] Create + push cadence-layer-v1.1 branch in hfs-aiops
- [x] Create + push cadence-layer-v1.1 branch in solomon-workspace
- [x] Initialize PROGRESS.md + SESSION_NOTES.md
- [x] Verify environment vars (10/10 set, count gate passes)

### SETUP-00 — Learnings (queue for /learn capture)

- _Pre-commit binary missing on this machine; resolved with `brew install pre-commit` (now at /opt/homebrew/bin/pre-commit). The hfs-aiops hook's hardcoded INSTALL_PYTHON path references `/Users/lionelj/...` (stale username) but falls through to `command -v pre-commit` correctly._  → memorialize as a cross-machine onboarding gotcha
- _Working-tree dirtiness from prior parallel sessions blocks SETUP-00's git operations cleanly; recommend adding a `<precondition>` block to SETUP-00 in the prompts file requiring clean trees, OR a pre-flight stash step._  → consider adding to plan-review-loop checklist
- _The "Solomon family share keys" model (one Anthropic API key, one Slack bot token, one Mem0 key reused across services) reduced env provisioning from 10 fresh creates to 4 harvests + 1 generate + 5 truly net-new._  → memorialize as cross-project pattern for any new feature touching the Samson stack
- _The 5 remaining placeholders (ANTHROPIC_ADMIN_KEY, SLACK_SIGNING_SECRET, TWILIO_×3) have **staggered blocker timing** — none block Phase 0 or most of Phase 1; first hard block is Wave 6 (INT-01) for Twilio + Slack signing; ANTHROPIC_ADMIN_KEY blocks Wave 9 (BE-08). Means external provisioning can run in parallel with prompt authoring._  → useful for future Cadence-style feature timelines

---
