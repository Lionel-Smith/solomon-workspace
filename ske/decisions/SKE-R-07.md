# SKE-R-07 — MCP namespace repair + command promotion

**Date:** 2026-08-21 · **Session:** SKE-R-07 · **Status:** DECIDED

## Namespace ruling

The live namespace for every Solomon skills-server tool call in command files is:

```
mcp__plugin_solomon_solomon__<tool>
```

(plugin-source install of the `solomon` plugin's `solomon` MCP server — verified
live this session via `mark_complete`/`loop_next` calls resolving under it.)

## Dead namespaces and their call sites (as found)

| Dead namespace | Call site | Line |
|---|---|---|
| `solomon-skills.` | `plan.md` | 100 (`solomon-skills.load_skill(name="project-plan-creator")`) |
| `solomon-skills.` | `session.md` | 63 (`solomon-skills.load_skill(name={skill-name})`) |
| `mcp__solomon_skills__` | `preflight.md` | 49 (`mcp__solomon_skills__list_skills`) |
| `mcp__solomon__` | `review.md` | 46 (`mcp__solomon__load_skill(name="plan-review-loop")`) |
| `mcp__solomon__` | `session/load.md` | 13–16 (`load_session`, `load_skill`) |

All five rewritten to `mcp__plugin_solomon_solomon__*`.

## Discovery drift correction (supersedes SKE_DISCOVERY.md §on runtime-only commands)

Discovery (2026-08-20) recorded plan/session/preflight/review as existing "ONLY at
`~/.claude/commands/`". **False as of execution:** all four are symlinks →
`solomon-workspace/solomon/commands/*.md` (created 2026-05-21). The plugin repo is
their source of truth.

**Consequences:**
- The rewrite lands in `solomon/commands/` (normal repo edit) and is live at
  runtime instantly through the symlinks — no `~/.claude` write occurs.
- The planned task-4 user `cp` (devkit copy → `~/.claude/commands/`) is
  **re-scoped to a no-op**: executing it would replace the symlinks with stale
  regular files and sever the plugin-repo linkage.
- The `copies_identical` gate becomes machine-checkable: canonical devkit copy
  vs the symlink target must diff clean.
- D13's boundary (never write `~/.claude/commands/`) is honored — the runtime
  surface changed only through the repo the user already wired in.
