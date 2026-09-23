# Solomon Workspace

**Project:** Solomon — MCP-Native HFS Workflow Companion · **Architecture:** Claude Code Plugin · **Workflow:** HFS Agentic Workflow v2.0

Poly-repo workspace with four git roots — this root, `solomon/` (plugin + MCP server), `solomon-docs/` (plans/prompts/progress/sessions), `hfs-development-kit/` (workflow specs + canonical skills) — plus `hfs-aiops/` (Samson ops server; holds the `cadence/` and `twins/` subtrees). Each repo's canonical context file is `AGENTS.md` with a one-line `@AGENTS.md` `CLAUDE.md` shim (AGENTS_MD_STANDARD v1.1).

## Current Status

- **Version:** 1.4.0 (HFS v2.0 Alignment) · **Workflow:** HFS Agentic Workflow v2.0
- The working repo for any session is whatever the loaded `solomon-docs/sessions/SESSION.md` names.

## Default Posture (karpathy-guidelines)

Default to the four [`karpathy-guidelines`](https://github.com/forrestchang/andrej-karpathy-skills) principles for **feature work and bug fixes**:

1. **Think Before Coding** — surface assumptions, ask when unclear, present interpretations rather than picking silently.
2. **Simplicity First** — minimum code that solves the stated problem; no speculative features or single-use abstractions.
3. **Surgical Changes** — touch only what's required, match existing style, don't drive-by-refactor adjacent code.
4. **Goal-Driven Execution** — turn tasks into verifiable success criteria with `→ verify: <check>` per step.

**Scope boundary:** these defaults are *opted out of* during dedicated improvement sprints (refactor / polish / harden / optimize, skill-refresh) where adjacent improvement is the explicit ask — the HFS `polish` / `harden` / `optimize` / `arrange` skills are improvement-mode tools. The persistent `feedback_*` memories encode the same posture piecemeal.

## Repository Map

```
solomon/              # plugin + custom MCP servers (solomon_mcp/), agents, commands
solomon-docs/         # plans/ prompts/ progress/ sessions/ reference/  (no source)
hfs-development-kit/  # workflow/ specs, skills/ (canonical), starter-kit/, scripts/
hfs-aiops/            # Samson ops server (cadence/, twins/ security-testing subtree)
```

## Skills

Discovered at runtime — do not hand-maintain a catalog here:
- **Org-authored (canonical):** `hfs-development-kit/skills/`; runtime `~/.claude/skills/` entries are symlinks into it — edit canonically and changes are live.
- **Vendored (read-only):** `~/.agents/skills/`, discovered via `search_skills`, loaded as `agents:<name>`.
- Find skills with `search_skills` / `list_skills`. Commands under `~/.claude/commands/` symlink into `solomon/commands/` and the devkit.

## HFS Session Lifecycle

```
/load-session <ID>     # PROMPTS → SESSION.md, mark Active
/run-session           # execute tasks + run verification
/complete-session "…"  # commit → update PROGRESS.md → archive session
```

- `SESSION.md` and `PROGRESS.md` are **session-managed** — `/session:run|complete` write them; never hand-edit mid-chain.
- Prompts + progress must round-trip the loop governor's parser (it fails closed on format drift).

## Wave Execution (v2.0) — MCP-tools-only

⚠️ There are **NO `/wave:*` slash commands** — only the Solomon MCP tools `wave_plan`, `wave_run`, `wave_status`. The executor is **state-tracking-only**: it computes and tracks waves but does **not** run sessions (`sequential` / `parallel` raise `NotImplementedError`). A loop driver runs sessions via `/session:auto`, which delegates pick/stop to the `loop_next` governor.

## Loop Engineering

"Design the loop, don't be the loop." The loop drives itself through sessions, governed by enforced code: the `loop_next` MCP tool (the single advance chokepoint — deny-empty refusal, cost budget, stuck-detection, lowest-wave-then-id pick), `/session:auto --goal`, `/session:plan-gap`, iterate-to-green gates, `loop-guard.sh` (PreToolUse deny hook), and `reassert-session-context.sh` (compaction survival). Detail: `solomon-docs/reference/ADR_LOOP_ENGINEERING.md`.

## Integration Points

Mem0 (persistent memory) · Context7 (library docs) · GitHub MCP · Firecrawl (Phase 0 research) · Droplet **solomon-HFS** — `ssh solomon`, `systemctl restart clawdbot` (full config in `TOOLS.md` and the persistent memory index).

## Pointers (progressive disclosure — detail lives here, not inline)

- HFS v2.0 feature detail (hybrid skill parser, hook-script generation, subagent definitions, verification commands): `hfs-development-kit/workflow/`
- Feature Registry (multi-feature management, planned): `solomon-docs/plans/FEATURE_REGISTRY_PLAN_FINAL.md`
- Droplet integrations, custom clawdbot skills, workspace SOUL / USER / MEMORY files: `TOOLS.md` and the persistent memory index
- Context-file standard: `hfs-development-kit/workflow/AGENTS_MD_STANDARD.md`
