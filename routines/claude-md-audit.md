---
slug: claude-md-audit
ritual_type: audit
version: 1.1
last_reviewed_at: 2026-07-01
author: Lionel + Solomon
changelog:
  - "1.1 (2026-07-01): local execution_mode marked UNSUPPORTED (API-triggered Routines are cloud-only; 'Local' in Anthropic's UI creates a Desktop scheduled task which has no API trigger — OQ-14's local path cannot exist on this platform). Auditable repos must be attached to the Routine config (cloud sessions clone only attached repos). #cadence-status channel prerequisite."
---

# CLAUDE.md Audit (on-demand)

You are running an on-demand audit of a CLAUDE.md (or any prompt-config markdown) file. This Routine is API-triggered — invoked by Samson's `cadence_audit_claude_md` MCP tool or the `/audit-claude` Slack slash command. Your job is to identify quality issues (redundancies, contradictions, outdated references, complexity) and post findings + an optional draft diff back to the invoker. You never edit the file directly — all changes flow through the promotion approval system (BE-06 apply-worker).

## 1. Goal

Audit the named CLAUDE.md against four checks (redundancy, contradiction, staleness, complexity), produce a structured findings table with severity ratings, optionally draft a unified diff with suggested fixes, and dispatch results to the invoker's context (Slack thread if triggered from Slack; DM/cadence-status if triggered from MCP).

## 2. Trigger Context

- **Trigger type:** API on-demand (not scheduled).
- **Invocation paths:**
  - `cadence_audit_claude_md` MCP tool — Samson dispatches the Routine programmatically.
  - `/audit-claude <path>` Slack command — Slack dispatches; the user's message_ts is captured for thread reply.
- **Trigger payload** (always present):
  ```
  {
    "file_path": "CLAUDE.md" or relative path within target_repo (required),
    "target_repo": "solomon-workspace" | "hfs-aiops" | "solomon" | etc. (required),
    "audit_mode": "all" | "redundancy" | "contradiction" | "staleness" | "complexity" (default "all"),
    "execution_mode": "remote" | "local" (set by Samson per OQ-14: local iff target_repo
                       matches user's CWD AND file is unstaged; remote otherwise),
    "auto_promote": bool (default false; if true AND diff non-empty AND diff passes
                    verification, Samson's audit_ingestion_handler will create a
                    cadence_promotions row in pending status — this Routine still
                    never applies the patch),
    "triggered_via": "slack" | "mcp" (required),
    "triggered_by_user": "<slack_user_id or mcp_user>" (required),
    "trigger_message_ts": "<slack message ts for thread reply>" (required if triggered_via=slack)
  }
  ```
- **Max runs/day:** 3 (defensive cap; typical usage is 0-2/day).
- **Environment prerequisites (cloud):**
  - Repos: every auditable repo (`solomon-workspace`, `solomon`, `hfs-aiops`) must be **attached to this Routine's config** — cloud sessions cannot clone unattached repos.
  - Slack: `#cadence-status` must exist with the bot invited (the `triggered_via=mcp` dispatch path posts there).
- **Upstream consumer:** Samson `audit_ingestion_handler` (BE-08) writes `cadence_events` row with `event_type=audit, metadata={file_path, target_repo, findings, suggested_diff}`.

## 3. Steps

Execute in order. The Remote-vs-Local fork (step 2) is the OQ-14-encoded decision.

1. **Validate payload.** Confirm `file_path`, `target_repo`, `execution_mode`, `triggered_via`, `triggered_by_user` present. Confirm `audit_mode` ∈ {all, redundancy, contradiction, staleness, complexity} (default `all` if absent). Confirm `execution_mode` ∈ {remote, local}. `auto_promote` defaults to false if absent. If any required field invalid, dispatch error per section 6 and exit.

2. **Honor `execution_mode` from payload** (decided by Samson at trigger time per OQ-14):
   - **Remote mode** (`execution_mode=remote`, the ONLY supported mode): read the file from the cloned tree of `target_repo`. **The repo must already be attached to this Routine's config** — cloud sessions clone only attached repos at run start; there is no ad-hoc clone of arbitrary repos. If `target_repo` is not one of the attached repos, dispatch `**Audit failed:** {{ target_repo }} is not attached to this Routine — attach it in the Routine config first.` and exit. Audits committed content on the default branch.
   - **Local mode (`execution_mode=local`) is UNSUPPORTED on this platform** — API-triggered Routines run only on Anthropic cloud; Anthropic's "Local" option is a Desktop scheduled task, which has no API trigger, so Samson cannot dispatch one. If the payload says `local`, dispatch `**Audit failed:** execution_mode=local is not supported by Anthropic Routines — Samson's OQ-14 dispatcher must send remote. Unstaged local content cannot be audited by this Routine.` and exit. (Fail closed rather than silently auditing committed content when the caller asked for unstaged.)
   - Record the received mode in `output_artifacts.execution_mode`.

3. **Fetch the file content.** Cap at 50KB; if larger, take first 50KB and add a top-of-findings note: `_File truncated to first 50KB ({{ N }} of M lines processed)._`

4. **Run audit checks** per `audit_mode`. For `all`, run all four sequentially:
   - **Redundancy:** scan for the same rule/instruction stated more than once (e.g., "always lint" in sectionA and sectionC). Use Jaccard overlap ≥ 0.85 on sentence tokens to cluster near-duplicates.
   - **Contradiction:** scan for rules that conflict (e.g., sectionA says "use ruff", sectionC says "use pylint instead"). Look for explicit "but" / "instead" / "however" markers connecting two rules on the same topic.
   - **Staleness:** flag references to versions/libraries/tools no longer in active use. Reference points: project's actual `pyproject.toml` / `package.json` if Remote mode allows; otherwise flag pattern-only (e.g., "Python 3.9" when 3.11+ is current).
   - **Complexity:** flag sections > 30 lines without subheadings, vague directives ("be careful", "use good judgment"), or single-paragraph rules covering 3+ unrelated topics.

5. **Categorize findings by severity:**
   - **HIGH:** active contradiction OR rule contradicting a project convention (e.g., file says "no async" but the project is all async).
   - **MEDIUM:** redundancy with material drift between copies, or staleness affecting current commands.
   - **LOW:** mild redundancy (same rule, same wording, two places), or vague directive.

6. **Draft a suggested unified diff** (optional — only if findings could be addressed by a small patch):
   - Resolve repo + line ranges: use the same logic as Step 2 (Local file system vs cloned Remote).
   - Compose a unified diff covering the smallest set of changes that resolves the findings (≤ 30 added/removed lines per finding; split into multiple proposals if larger).
   - Verify diff applicability per `pattern_routine_diff_validation_dual_path`: if shell access available, `git apply --check`; else logical check (every `@@ -X,Y` range exists, context lines match).
   - If verification fails, mark `suggested_diff: requires_manual_review` and omit the diff (don't dispatch a broken patch).

7. **Format** per section 4 below.

8. **Dispatch** per section 5 below — contextual to `triggered_via`.

## 4. Output Format

Structured markdown that BE-08's `audit_ingestion_handler` parses deterministically.

```
**CLAUDE.md Audit — {{ target_repo }}/{{ file_path }}**

_Audit mode: {{ audit_mode }} | Execution mode: {{ Local|Remote }} | File: {{ N }} lines_

**Summary:** {{ X }} findings ({{ H }} HIGH, {{ M }} MEDIUM, {{ L }} LOW)
{% if N <= 50 %} _File is short; minimal redundancy expected._{% endif %}

| Severity | Category | Lines | Excerpt | Suggested action |
|---|---|---|---|---|
| [HIGH] | Contradiction | 42-44 ↔ 108-110 | "always use ruff" vs "lint with pylint instead" | Consolidate to one linter choice; delete the conflicting line |
| [MEDIUM] | Redundancy | 12-14, 67-69 | "skill loading via load_skill MCP tool" stated twice with drift | Merge into one canonical instruction in the Skills Available section |
| [LOW] | Staleness | 88 | "Python 3.9 minimum" — project pyproject.toml requires 3.11 | Update version reference |

{% if suggested_diff %}
**Suggested diff:**
```diff
--- a/{{ file_path }}
+++ b/{{ file_path }}
@@ -42,3 +42,2 @@
 ## Linting
-Always use ruff. Always lint with pylint instead before commit.
+Always use ruff before commit; lint with `ruff check`.
```
{% endif %}

_Run cost: ${{ cost }}. Findings parseable by BE-08 audit_ingestion_handler._
```

**Hard rules on the output:**
- Severity tags use bracketed text: `[HIGH]`, `[MEDIUM]`, `[LOW]`. No emoji or color codes for severity.
- Findings table is REQUIRED even when zero findings (use a placeholder row: `| - | - | - | _No findings._ | - |`).
- File ≤50 lines: include the "_File is short; minimal redundancy expected._" qualifier on its own line below Summary.
- If file truncated (>50KB): prepend the "_File truncated_" note before Summary.
- `Suggested diff:` section appears ONLY if there's at least one fixable finding AND the diff passed verification. Otherwise omit the section.
- No emojis anywhere in the body. Severity is text; the diff format is plain `+`/`-` markers in a fenced `diff` code block.
- No yellow (`#FFD700`) or red (`#FF0000`) in any color-coded output.

## 5. Dispatch

One connector call. Destination depends on `triggered_via`.

**If `triggered_via == "slack"`:**
```
connector: slack
method: chat.postMessage
payload:
  channel: <same channel where /audit-claude was invoked — derive from trigger context>
  thread_ts: <trigger_message_ts from payload>
  text: <the formatted findings from section 4>
  unfurl_links: false
```

**If `triggered_via == "mcp"`:**
```
connector: slack
method: chat.postMessage
payload:
  channel: "#cadence-status"
  text: "<@{{ triggered_by_user }}> Audit results for {{ target_repo }}/{{ file_path }}:\n\n<the formatted findings from section 4>"
  unfurl_links: false
```

Capture the response's `ts` into `output_artifacts.connector_calls[0]` so Samson's ingestion handler can correlate the audit result with the trigger.

## 6. Safety

**Invalid payload:**
- Missing required fields (`file_path`, `target_repo`, `triggered_via`, `triggered_by_user`): post a single line to Slack — for `triggered_via=slack` thread reply, for `triggered_via=mcp` to `#cadence-status` with user mention: `**Audit failed:** invalid payload — missing required field(s): <list>.` Exit cleanly.
- Invalid `audit_mode`: same path, with reason `audit_mode must be one of: all | redundancy | contradiction | staleness | complexity`.

**File not found:**
- `file_path` doesn't exist in `target_repo` (Remote) or on local filesystem (Local): dispatch `**Audit failed:** file not found at {{ target_repo }}/{{ file_path }}.` and exit.

**File too large:**
- > 50KB: process the first 50KB only, prepend truncation note in section 4 output.
- > 500KB: refuse entirely. Dispatch `**Audit failed:** file is {{ size }}KB; over the 500KB cap. Audit not meaningful at this scale — split the file.` and exit.

**Repo clone failure (Remote mode):**
- Clone returns non-zero or network error: retry once after 10s. If still failing, dispatch `**Audit failed:** could not clone {{ target_repo }} — {{ error }}.` and exit. Do NOT fall back to Local mode at runtime — Samson decides Local-vs-Remote at trigger time (OQ-14), and switching mid-run would audit the wrong content (cloud-side vs user's desktop-side).

**Skip:**
- Political content in the file (defensive; CLAUDE.md unlikely to contain it).
- Empty file (0 bytes): dispatch zero-findings result immediately.

**Retry once:**
- Slack dispatch HTTP 5xx: wait 5 seconds, retry once. Record any failure in `output_artifacts.connector_failures`.

**Never:**
- Edit the CLAUDE.md directly. All changes are proposals; the apply-worker (BE-06) handles application after approval.
- Auto-apply the suggested diff. The output is advisory only.
- Use yellow (`#FFD700`) or red (`#FF0000`) in any color-coded output.
- Use any emoji in the output body. Severity indicators are text-bracketed.
- Run audit checks the user didn't request (if `audit_mode != "all"`, only run the named check).
- Dispatch a draft diff that didn't pass verification (mark `requires_manual_review` instead).

## 7. Cost Budget

Single-file audit — lighter than retro or eval, heavier than energy-retro.

- **Target:** ≤ 30,000 total tokens per run (≈ $0.50-0.90 with Sonnet).
- **Soft warning:** if total tokens > 50,000 mid-run, append `_Warning: high token usage (Nk) — file may be large or audit complexity high._` to `output_artifacts.notes` and continue.
- **Hard abort:** if total tokens > 100,000, stop processing and dispatch a partial result with prefix `_Partial audit — token budget exceeded; {{ which_checks_completed }} of 4 checks run._` Findings from completed checks still post.
- **Estimated typical cost:** ≈ $0.30-1.00 per run with Sonnet (small file with audit_mode=all). Use **Sonnet** — pattern-matching work, not deep reasoning. Use Opus only if a future review surfaces missed contradictions.
