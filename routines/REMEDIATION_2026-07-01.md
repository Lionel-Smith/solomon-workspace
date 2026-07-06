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

### 2. Cloud environments (claude.ai/code → environment settings)
Create TWO dedicated environments (secrets-scoping: never give the web-reading routine any secret):

**`cadence-samson`** — for standup, friday-retro, friday-eval
- [ ] Env vars: `SAMSON_INTERNAL_TOKEN=<value>`, `MEM0_API_KEY=<value>`
      (⚠ visible to anyone who can edit the environment — single-user account, acceptable;
       coordinate values with the SEC-01 rotation)
- [ ] Network access: **Custom** → Allowed domains: `samson.highfunctioningsolutions.com`,
      `api.mem0.ai` + check "Also include default list"

**`cadence-web`** — for daily-news-sweep only
- [ ] Network access: **Full** (it reads the open web; verification gate needs arbitrary hosts)
- [ ] NO env vars / secrets in this environment — ever

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
- [ ] From any cloud session on `cadence-samson`:
      `curl -H "Authorization: Bearer $SAMSON_INTERNAL_TOKEN" https://samson.highfunctioningsolutions.com/agents/activity?since=24h`
      → expect 200 JSON (NOT 403 `host_not_allowed`, NOT 401). If the endpoint 404s, the
      Samson cadence API (BE-05/BE-10) isn't deployed — standup stays paused; that is the one
      genuine backend dependency left.
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
