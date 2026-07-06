# Routine Gap Remediation — 2026-07-01

Audit of all 8 Routines against the official Routines docs (`code.claude.com/docs/en/routines`,
`.../claude-code-on-the-web`) + live failure evidence. Every observed failure traces to one of
four gap classes — none is a prompt-logic bug:

| # | Gap class | Root fact | Affected |
|---|-----------|-----------|----------|
| 1 | Phantom connectors | `whatsapp`, `firecrawl`, `mem0` are not claude.ai connectors — calls silently fail | news-sweep (fixed v1.1), energy-retro (fixed v2.0), standup, friday-retro |
| 2 | Proxy-blocked hosts | ALL outbound traffic (even `web_fetch`/`curl`) goes through the environment proxy; non-allowlisted hosts 403 `host_not_allowed` | standup, friday-retro, friday-eval (samson host); news-sweep (www.anthropic.com, hn.algolia.com) |
| 3 | Missing Slack channels | `#solomon-standup`, `#dev-retro`, `#cadence-status`, `#solomon-checkin` don't exist | standup, retro, eval, pr-review, md-audit, energy-retro |
| 4 | Unset env vars | No secrets store — env vars must be set on the Routine's cloud environment | standup, retro, eval (`SAMSON_INTERNAL_TOKEN`, `MEM0_API_KEY`) |

Prompt files in this repo are now fixed (see per-file changelogs). **The fixes do NOT take
effect until re-pasted into the Anthropic UI** — the running prompt is the one saved at
ROUTINE-10 (2026-05-26), not this repo. This is the drift the `prompt_sha` pattern detects.

## Operator checklist (Anthropic UI + Slack — in order)

### 1. Slack channels ✅ DONE (2026-07-05)
No bot to invite: the claude.ai Slack connector posts **as the workspace user**
(Lionel), so channel membership is automatic for channels he created. The
"invite the bot" step in the original audit was based on a wrong assumption.
- [x] `#solomon-standup` (public) — `C0BF28R7DNF`
- [x] `#dev-retros` (public) — `C0BFADVSDU1` — note the **plural**: the singular
      `#dev-retro` name is locked by an archived private channel (`C0BF57AKBRB`),
      so `#dev-retros` is canonical; the friday-retro/friday-eval prompts were
      updated to match.
- [x] `#cadence-status` (public) — `C0BFC83MAN8`
- [x] `#solomon-checkin` (private) — `C0BFADXB5PB` — connector confirmed it reads
      this private channel, proving the user-scoped connector model.

### 2. Cloud environments ⚙️ MOSTLY DONE (2026-07-05)
Location: the environments are NOT in Settings — they live in the **environment selector**
on the composer (the "smart tender"-style chip next to "Select repo…") → **Add cloud
environment…**. Each env has: Name, Network access (None/Trusted/Full/Custom), Environment
variables (.env format — UI itself warns "visible to anyone using this environment"), Setup script.
Both created 2026-07-05.

**`cadence-samson`** — for standup, friday-retro, friday-eval
- [x] Network access: **Custom** → Allowed domains `samson.highfunctioningsolutions.com` +
      `api.mem0.ai`, "Also include default list" checked ✅
- [ ] **Env vars — DEFERRED ON PURPOSE (not a to-do yet).** Leave BOTH blank until the Samson
      cadence API actually exists. Verified in code 2026-07-06: the endpoints these routines call
      (`/cadence/learnings/queued`, `/agents/activity`) have **zero route definitions** — the backend
      is NOT built (this is the BE-05/BE-10 dependency). Pasting tokens now authenticates to nothing.
      When it IS time to fill these (endpoints built + droplet recovered):
      - `SAMSON_INTERNAL_TOKEN` — **self-minted, NOT a SEC-01 leaked cred** (no rotation needed).
        Mint via `python3 -c "import secrets; print(secrets.token_urlsafe(48))"` OR reuse the prior
        value; it is SYMMETRIC — the SAME value must be set here AND on Samson's droplet config.
      - `MEM0_API_KEY` — the ONLY genuinely-leaked var here (SEC-01 family, unrotated). Rotate in the
        Mem0 dashboard first (new key → revoke old), then paste the fresh value.
      (Claude does not enter credentials into fields — Lionel pastes. See memory
      `finding_samson_cadence_api_not_built_2026-07`.)

**`cadence-web`** — for daily-news-sweep only
- [x] Network access: **Full** ✅
- [x] NO env vars / secrets — created empty, correct ✅

Leave energy-retro, claude-md-audit, github-pr-review on the **Default** (Trusted) environment —
their only traffic is connector traffic (routed through Anthropic, bypasses the allowlist) and
api.github.com (already allowlisted).

### 3. Per-routine UI edits (claude.ai/code/routines)
- [ ] **daily-news-sweep** (`trig_01A9w6...`): re-paste prompt v1.2; set environment `cadence-web`;
      remove whatsapp+firecrawl connectors (keep slack)
- [ ] **daily-solomon-standup** (`trig_01RC8m...`): re-paste prompt v1.1; set environment
      `cadence-samson`; remove whatsapp+mem0 connectors; **keep PAUSED** until step 5 passes
- [ ] **friday-retro** (`trig_01TxzY...`): re-paste prompt v1.1; set environment `cadence-samson`;
      remove mem0 connector
- [ ] **friday-eval** (`trig_01NcDt...`): re-paste prompt v1.1; set environment `cadence-samson`
- [ ] **friday-energy-retro** (`trig_011tUw...`): re-paste prompt v2.0; connector slack (was whatsapp)
- [ ] **claude-md-audit** (`trig_01YGe9...`): re-paste prompt v1.1; attach repos
      solomon-workspace, solomon, hfs-aiops
- [ ] **github-pr-review** (`trig_01JGRq...`): re-paste prompt v1.1
- [ ] **github-ci-triage**: stays deferred — `workflow_run` still unsupported (docs confirm
      only pull_request + release as of 2026-07-01). Fallback (a) API-trigger + GH Action
      wrapper is viable when wanted.

### 4. Commit + push this repo
Routines that read repo content (friday-eval's dataset, friday-retro's diff targets) clone from
GitHub — uncommitted work is invisible to them. Push after committing these fixes.

### 5. Verification (before unpausing standup)
⛔ **KNOWN-BLOCKED as of 2026-07-06 — do not attempt yet.** Three stacked blockers, deepest-first:
(a) the Samson cadence endpoints are **NOT built** — verified in code: `/cadence/learnings/queued`
and `/agents/activity` have zero route definitions (BE-05/BE-10 is real backend work, not a config
fix); (b) the droplet is unreachable (`samson.*` NXDOMAIN + SSH refused, see
`incident_samson_dns_ssh_2026-07-03`); (c) the `cadence-samson` env vars are intentionally unset.
The curl below will 404 (endpoint) or fail to resolve (DNS) until (a)+(b) are fixed. Standup stays
PAUSED. This is the genuine remaining dependency — everything upstream of it is done.
- [ ] From any cloud session on `cadence-samson`:
      `curl -H "Authorization: Bearer $SAMSON_INTERNAL_TOKEN" https://samson.highfunctioningsolutions.com/agents/activity?since=24h`
      → expect 200 JSON (NOT 403 `host_not_allowed`, NOT 401, NOT 404). A 404 = endpoint not built (a);
      DNS failure = droplet/record not up (b).
- [ ] "Run now" on daily-news-sweep → confirm anthropic.com items appear in the digest
      (proves the Full-network environment took effect)
- [ ] "Run now" on friday-energy-retro → confirm the 🌴 prompt lands in #solomon-checkin
- [ ] Green run-status ≠ success: open each run transcript and read what actually happened
      (per docs, connector failures and blocked hosts surface only in the transcript)

## Facts this audit pinned down (for future reference)
- Connectors = claude.ai MCP integrations; traffic routes through Anthropic (bypasses the
  environment allowlist). Local CLI MCP servers do NOT appear as connectors; add at
  claude.ai/customize/connectors or via committed `.mcp.json` in an attached repo.
- Environment proxy governs everything else, including `web_fetch` and `curl`.
- "Local" routine = Desktop scheduled task on the Mac (not the droplet); no API trigger.
- Cloud sessions: 4 vCPU / 16GB / 30GB; setup-script cache ~7 days; min schedule interval 1h.
- Env vars have no dedicated secrets store — visible to environment editors.
- Cloud sessions clone ONLY attached repos, from GitHub, default branch.
