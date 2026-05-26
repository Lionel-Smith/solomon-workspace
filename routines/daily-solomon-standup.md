---
slug: daily-solomon-standup
ritual_type: standup
version: 1.0
last_reviewed_at: 2026-05-06
author: Lionel + Solomon
---

# Daily Solomon Agent Standup

You are running the daily Solomon multi-agent standup for Lionel Smith — Bahamian govtech founder. This Routine fires automatically Mon-Fri 07:00 America/Nassau (25 minutes after the news sweep at 06:30) and reports on the 7 Solomon agents' last 24 hours of activity. The audience is Lionel; the output also feeds Samson's `IngestService` (BE-08) for structured persistence.

## 1. Goal

Produce a per-agent activity digest covering the last 24 hours for all 7 Solomon agents — **never omit an agent**, even if zero activity — and surface up to 3 proposed learnings derived from anti-pattern frequencies. Dispatch to Slack `#solomon-standup` and Lionel's WhatsApp. The digest must follow the exact 3-section template (Healthy / Blockers / Proposed learnings) so BE-08's `standup_ingestion_handler` can parse it deterministically.

## 2. Trigger Context

- **Schedule:** cron `0 7 * * 1-5` in `America/Nassau`.
- **Window:** last 24 hours before run time.
- **Max runs/day:** 1.
- **Daily slot budget:** counts as 1 of 15 daily Routine slots.
- **Upstream consumer:** Samson `standup_ingestion_handler` (BE-08) parses the final assistant message + connector_calls into `cadence_events` rows with `event_type=standup`.

## 3. Steps

Execute in order. Authentication is required for step 2; if it fails see Safety §6.

1. **Compute window.** Set `since = now - 24 hours` in UTC.

2. **Fetch agent activity** via Samson's read-only API:
   ```
   GET https://samson.highfunctioningsolutions.com/agents/activity?since=24h
   Authorization: Bearer <SAMSON_INTERNAL_TOKEN>
   Accept: application/json
   ```
   Expected response shape:
   ```json
   {
     "agents": [
       {
         "name": "solomon",
         "completed_actions": 12,
         "escalations": 0,
         "errors": 0,
         "last_seen_ts": "2026-05-25T11:42:00Z"
       },
       ...
     ],
     "anti_patterns": [
       {"agent": "bishop", "pattern": "except Exception: pass", "ts": "..."},
       ...
     ]
   }
   ```

3. **Build the 7-agent roster** — every digest MUST include all 7 agents exactly once: `solomon`, `samson`, `esther`, `bishop`, `jacob`, `twins-cane`, `twins-abel`. If the API response omits any of them, **synthesize a stub entry** with `completed_actions=0, errors=0, last_seen_ts=null` and tag the agent as a Blocker in step 5 with reason `"no record in agent activity API"`. Never drop an agent from the digest.

4. **Compute relative timestamps in NAS local time.** For each agent's `last_seen_ts`:
   - Convert UTC to America/Nassau.
   - Format as relative string: `<60m → "{N}m ago"`, `<24h → "{N}h ago"`, `<7d → "{N}d ago"`, else `"{YYYY-MM-DD}"`.
   - If `last_seen_ts` is null/missing, render as `"never (24h+)"`.

5. **Classify each agent** as Healthy or Blocker:
   - **Healthy:** `errors == 0` AND `last_seen_ts` is within the last 24 hours.
   - **Blocker:** `errors > 0` OR `last_seen_ts` is older than 24 hours OR `last_seen_ts` is null/missing. Generate a one-line reason for each blocker (e.g., "bishop has 3 errors in last 24h" or "twins-abel last seen 36h ago").

6. **Derive proposed learnings from anti-patterns** (0-3 per standup):
   - Take the `anti_patterns` array from step 2.
   - **Query Mem0** via the `mem0` connector for any `cadence:learn` entries from the last 7 days — these are recently-captured learnings that should NOT be re-proposed. Invoke the connector's search-by-tag (or semantic-search-with-tag-filter) capability with:
     - tag/filter: `cadence:learn`
     - time window: last 7 days
     - limit: 50
     The exact field names depend on the connector's schema (use whichever it exposes for tag filter + recency). If the connector returns an error or doesn't support tag filtering, skip the dedup step (see Safety §6) and continue with cluster-only proposed learnings.
   - For each captured-learning text and each anti-pattern description, compute lowercase-word-**Jaccard overlap** with stopwords `the / a / an / of / and / or / to / for / in / on / with`. If overlap ≥ **0.85**, treat the anti-pattern as "already captured" and exclude it from proposed learnings.
   - Of the remaining anti-patterns, **cluster** them using the same Jaccard rule (overlap ≥ 0.85 on the `pattern` field text → same cluster). For each cluster, count frequency and pick the most recent occurrence as the representative.
   - **Select up to 3** clusters with the highest frequency. If fewer than 3 unique clusters exist, surface fewer (minimum 0 — silence is allowed).
   - **Expand each selected cluster's `pattern` field into a human-readable learning sentence** (≤120 chars) for the digest. Example: pattern `"except Exception: pass"` (3 occurrences across agents bishop, jacob) → learning text `"Bare 'except Exception: pass' caught 3 times this week — prefer specific exceptions and explicit re-raise/log."` Keep agent names + count to give Lionel context.

7. **Compose** the digest per §4 below.

8. **Dispatch** per §5 below — Slack call first, then WhatsApp.

## 4. Output Format

Exact markdown shape. The four emojis `☀️`, `🟢`, `🚧`, `💡` are **part of the format** and required at the positions shown — these are the only emojis allowed; do NOT add any others elsewhere in the output.

The date header uses America/Nassau local time at run, formatted as `Weekday, Month D, YYYY` — e.g., `Tuesday, May 26, 2026`. Do NOT use UTC. Do NOT zero-pad the day.

```
**☀️ Solomon Standup — {{ Weekday, Month D, YYYY }}**

**🟢 Healthy (N agents)**
- **agent-name** — completed_actions actions, last_seen_relative

**🚧 Blockers (M)**
- agent-name: <reason>

**💡 Proposed learnings (auto-detected)**
- _<learning text, ≤120 chars>_ → reply `/learn <learning|truncate(60)>` to capture
```

**Hard rules on the output:**
- All 7 agents appear across Healthy + Blockers **exactly once** (no agent dropped, no agent listed in both sections).
- Healthy items: one bullet per agent, format `**{name}** — {N} actions, last seen {rel}`.
- Blocker items: one bullet per agent in blocker state, format `**{name}**: {reason}`.
- Proposed learnings: 0-3 items, each ≤120 chars summary, with the `→ reply /learn ...` call-to-action.
- If Healthy count == 0: write `**🟢 Healthy (0 agents)**` followed by the line `_All agents in blocker state — investigate ASAP._`
- If Blocker count == 0: write `**🚧 Blockers (0)**` followed by `_None — all agents healthy._`
- If proposed learnings count == 0: write `**💡 Proposed learnings (auto-detected)**` followed by `_None this standup._`
- No color references (no `#FFD700`, no `#FF0000`, no red/yellow language).
- No emojis outside the four section markers.

## 5. Dispatch

Two connector calls, in this exact order. Samson's ingestion handler verifies both fired.

**Call 1 — Slack:**
```
connector: slack
method: chat.postMessage
payload:
  channel: "#solomon-standup"
  text: <the full markdown digest from §4>
  unfurl_links: false
  unfurl_media: false
```

**Call 2 — WhatsApp:**
```
connector: whatsapp
method: send_message
payload:
  to: <Lionel's number from Routine secret WHATSAPP_TO>
  body: <plain-text rendering of the digest — strip "**" markers but keep the four section emojis since WhatsApp renders them>
```

**WhatsApp fallback (per OQ-04):** if the WhatsApp connector is not available in this Anthropic environment, **skip Call 2** and add a note to `output_artifacts.notes`: `"whatsapp_connector_unavailable — Samson cross-post will mirror from Slack"`. Samson's WhatsApp adapter will detect the Slack post and cross-post within minutes.

## 6. Safety

**Authentication failure (highest priority):**
- If step 2's GET returns HTTP 401 or 403: stop fetching. Post a single line to Slack `#solomon-standup` only: `**☀️ Solomon Standup — {{ date }}** — Standup unavailable: SAMSON_INTERNAL_TOKEN auth failed. Investigate before tomorrow's run.` Do NOT dispatch to WhatsApp. Exit the Routine cleanly so Samson's ingestion records the failure.
- If the token is missing entirely (no Authorization header possible): same path, with reason `"token not configured in Routine secret store"`.

**Skip:**
- Political content (this shouldn't appear in agent activity, but defensive — if it does, drop it from proposed learnings).
- Marketing content (same).

**Retry once:**
- Samson API HTTP 5xx: wait 10 seconds, retry once. If still 5xx, produce a **degraded standup**: include the agents you do have data for, mark missing ones as `last_seen="unknown (api degraded)"`, and add a note at the top: `_Agent telemetry partially unavailable — N of 7 agents reported._`
- Mem0 query failure (step 6): skip the captured-learning dedup. Still produce proposed learnings from anti-patterns, but add `output_artifacts.notes: "mem0_dedup_skipped — proposed learnings may include already-captured items"`.
- Connector dispatch (Slack or WhatsApp): wait 5 seconds, retry once. If still failing, record in `output_artifacts.connector_failures`.

**Never:**
- Fabricate agent metrics. If you don't have data, mark `unknown` — never guess.
- Omit any of the 7 agents from the digest. Zero-activity agents are listed under Blockers with reason `"no activity in last 24h"`.
- Propose a learning that overlaps ≥ 0.85 Jaccard with a captured `cadence:learn` from the last 7 days.
- Exceed 3 proposed learnings.
- Use yellow (`#FFD700`) or red (`#FF0000`) in any color-coded output.
- Skip the standup on weekends. Weekend output is allowed to be `_All quiet — weekend._` if every agent shows 0 activity, but the dispatch still fires so the cadence keeps its rhythm.

## 7. Cost Budget

- **Target:** ≤ 50,000 total tokens per run (input + output + cache reads/writes).
- **Soft warning:** if total tokens > 75,000 mid-run, append `_Warning: high token usage (Nk) — investigate prompt drift._` to `output_artifacts.notes` and continue, where `N = round(total_tokens / 1000)`.
- **Hard abort:** if total tokens > 150,000, stop processing and dispatch a truncated digest with the prefix `_Partial standup — token budget exceeded; M of 7 agents processed._` Both connector calls still fire.
- **Estimated cost:** ≈ $0.40-1.50 per run (Sonnet); ≈ $2.50-6 per run (Opus). Default to **Sonnet** — the work is structured API consumption + template fill, not deep reasoning.
