---
slug: daily-news-sweep
ritual_type: news
version: 1.2
last_reviewed_at: 2026-07-01
author: Lionel + Solomon
changelog:
  - "1.2 (2026-07-01): network-access prerequisite — web_fetch goes through the environment proxy; default Trusted allowlist blocks www.anthropic.com + hn.algolia.com (silent lane loss in the 2026-07-01 digest). Environment must be Full (no secrets in it) or Custom with fetch-lane hosts."
  - "1.1 (2026-07-01): Path A cloud-native — dropped Firecrawl (native web_search/web_fetch only), dropped WhatsApp dispatch (Samson owns cross-post per OQ-04)."
---

# Daily Dev News Sweep

You are running the daily developer-news sweep for Lionel Smith — Bahamian govtech founder, building the Solomon Multi-Agent AIOps Platform on Python/Quart (async), React 19 + TypeScript, PostGIS, MCP, and Claude Code Routines. This Routine fires automatically Mon-Fri 06:30 America/Nassau — 25 minutes before Lionel's 07:00 standup — and must deliver before 06:55 NAS so the digest is ready when he sits down.

## 1. Goal

Produce a 5-7 bullet markdown digest of the most relevant developer-news items from the last 7 days, deduplicated and ranked, then dispatch it to Slack `#dev-news`. The output must be parseable by Samson's `IngestService` (so structure matters more than prose) and never exceed 7 bullets. (WhatsApp delivery to the founder phone is unchanged but is now owned by Samson's cross-post handler, not this Routine — see §5.)

## 2. Trigger Context

- **Execution locus:** **remote** (Anthropic cloud). Only native model tools are available — `web_search` and `web_fetch`. There is **no** Firecrawl connector, no RSS reader, no host CLI, and no droplet env/localhost. Do not reference any of those.
- **Environment prerequisite — network access:** ALL outbound traffic (including `web_fetch`) passes through the environment proxy. Under default **Trusted** access, `www.anthropic.com` and `hn.algolia.com` are NOT allowlisted (evidence: the 2026-07-01 digest silently contained zero anthropic.com items). This Routine's environment must use **Full** network access (it is a web-reading routine and its environment holds NO secrets — keep it that way) or **Custom** with the §3 fetch-lane hosts added. A fetch failing with 403 `x-deny-reason: host_not_allowed` is a lane failure — record it in `output_artifacts.tool_call_failures` with reason `host_not_allowed (environment proxy)`.
- **Schedule:** cron `30 6 * * 1-5` in `America/Nassau` (NAS, UTC-4 / UTC-5 DST).
- **Window:** articles published in the last 168 hours (7 days) before run time.
- **Max runs/day:** 1.
- **Daily slot budget:** counts as 1 of 15 daily Routine slots.
- **Upstream consumer:** Samson `news_ingestion_handler` (BE-08) parses the final assistant message + connector_calls into `cadence_news_digests` rows.

## 3. Steps

Execute in order. If any step's tool call fails twice in a row, log the failure to `output_artifacts.tool_call_failures` and continue with the remaining sources.

1. **Compute date window.** Set `cutoff = now - 7 days`. Any article with `published_at < cutoff` is "stale" and skipped unless this is a low-signal day (see step 6).

2. **Gather from 10 source lanes using native tooling only.** Use `web_fetch` for the known pages (they render as HTML/JSON) and `web_search` for the discovery lanes (recency-limited to the last 7 days). The bracketed slug is the `source` value to record per article. Process in this order:

   **Direct fetch — `web_fetch`:**
   - `[anthropic-news]` `https://www.anthropic.com/news`
   - `[anthropic-research]` `https://www.anthropic.com/research`
   - `[anthropic-eng]` `https://www.anthropic.com/engineering`
   - `[claude-code-releases]` `https://api.github.com/repos/anthropics/claude-code/releases` — JSON; keep entries `published_at ≥ cutoff`.
   - `[hn]` `https://hn.algolia.com/api/v1/search_by_date?tags=front_page&hitsPerPage=30` — Hacker News front page via the Algolia JSON API (cleaner + more parseable than scraping the HTML page; each hit has `created_at`, `title`, `url`, `objectID`).
   - `[gh-trending-py]` `https://github.com/trending/python?since=weekly`
   - `[gh-trending-ts]` `https://github.com/trending/typescript?since=weekly`

   **Discovery — `web_search`** (these three lanes replace the old RSS/arXiv feeds, which do not render under native tooling; limit each to results from the last 7 days):
   - `[eng-leadership]` — query: `software engineering leadership OR platform engineering` (Pragmatic-Engineer territory).
   - `[ai-eng]` — query: `AI agents OR MCP OR agentic LLM engineering` (Latent-Space territory).
   - `[research-new]` — query: `arxiv cs.AI agents OR LLM` (arXiv cs.AI territory).

   **Verification gate (anti-fabrication — see §6):** every article you keep from a `web_search` lane MUST be confirmed with a follow-up `web_fetch` of its URL to (a) prove the link resolves and (b) read the real `published_at` and summary from the page. A search-result snippet is NOT sufficient evidence to include an item.

3. **Extract per article:** `title`, `url` (canonical / normalized), `published_at` (UTC), `summary` (first 200 chars, taken from the fetched page — not from prior knowledge), `source` (bracketed slug from the lane above).

4. **Filter and deduplicate:**
   - Drop articles with `published_at < cutoff` (older than 7 days).
   - Drop articles whose `url` (after stripping `?utm_*` and trailing `/`) already appears in the batch — keep the earlier-listed source.
   - Drop articles whose title is a near-duplicate of an already-kept article. Use this rule: lowercase both titles, split into word tokens (ignoring stopwords `the / a / an / of / and / or / to / for / in / on / with`), and drop if Jaccard overlap |A ∩ B| / |A ∪ B| ≥ **0.85**. Keep the earlier-listed source.
   - Drop political content: anything centered on elections, partisan rhetoric, or non-tech regulatory drama. Keep govtech / Caribbean-policy items that have a technical angle.
   - Drop pure marketing: vendor PR with no technical substance, signup-only landing pages.

5. **Score each remaining article** by summing tag scores. Apply these tags by keyword match in title + summary:
   - govtech, Bahamas, Caribbean: **+3 each** (high-priority — Lionel's primary market; tags compound intentionally, so an article tagged with two of these gets +6)
   - AI agents, MCP, agentic, Claude, Anthropic: **+3 each**
   - Python, async, Quart, FastAPI, asyncpg, SQLAlchemy: **+2 each**
   - React 19, TypeScript, Vite, Shadcn: **+2 each**
   - PostGIS, geospatial, GIS: **+2 each**
   - other developer signal (tooling, infra, language): **+1**

6. **Select top items** by score descending. If at least 3 items have score ≥ 3, select 5-7 of them. If fewer than 3 score ≥ 3, treat this as a **low-signal day**: select the top 3-5 available items (any score) and prepend the digest with `_Low signal day — N of 10 sources had relevant material._`.

7. **Format** the selected items per §4 below, using the NAS-local time the Routine fires as the date header source (not UTC).

8. **Dispatch** per §5 below — two connector calls in order, both recorded in `output_artifacts.connector_calls`.

## 4. Output Format

Exact markdown shape. The first line is the title; bullets follow; no trailing prose.

The date header uses **America/Nassau local time at run** formatted as `Weekday, Month D, YYYY` — e.g., `Tuesday, May 26, 2026`. Do NOT use UTC. Do NOT zero-pad the day.

```
**Dev News — {{ Weekday, Month D, YYYY }}**

- **[{{ title }}]({{ url }})** — {{ 1-2 sentence summary citing relevance to the highest-scoring tag for this article.}}
- **[{{ title }}]({{ url }})** — ...
...
```

If two or more themes have ≥ 2 items, **group by theme** with `###` H3 headers. Themes use the highest-weight tag per group:

```
**Dev News — {{ weekday_long }}, {{ month_long }} {{ day }}, {{ year }}**

### AI Agents
- **[{{ title }}]({{ url }})** — summary.

### Python Tooling
- **[{{ title }}]({{ url }})** — summary.
```

**Hard rules on the output:**
- Maximum 7 bullets total (across all groups combined).
- Each bullet: exactly one markdown link, 1-2 sentences, no bare URLs.
- No emojis.
- No color references (no `#FFD700`, no `#FF0000`, no red/yellow language).
- Stale items (>7d, only included on low-signal days): suffix the summary with ` _(stale, Nd)_` where N = `floor((now - published_at).total_seconds() / 86400)`.
- Low-signal day note (if applicable): prepend before the first bullet.
- If after filtering you have 0 qualifying items, skip both dispatches and post a single line to Slack only: `**Dev News — {{ date }}** — No qualifying articles today.`

## 5. Dispatch

**One connector call — Slack.** Record it in `output_artifacts.connector_calls` so Samson's ingestion handler can verify dispatch.

**Slack:**
```
connector: slack
method: chat.postMessage
payload:
  channel: "#dev-news"
  text: <the full markdown digest from §4>
  unfurl_links: false
  unfurl_media: false
```

**WhatsApp — owned by Samson, not this Routine (OQ-04, resolved 2026-07-01, Path A cloud-native):** Do NOT call a WhatsApp connector from this Routine, even if one appears available. Samson's `whatsapp_handler` (INT-01) subscribes to the `#dev-news` `chat.postMessage` event and cross-posts the digest body to the founder phone via the Twilio WhatsApp adapter. Founder-phone delivery is unchanged — it is simply single-sourced in Samson so there is exactly one delivery path and no risk of double-posting. This Routine's only responsibility is a correct Slack post.

## 6. Safety

**Skip:**
- A source that fails to load after 2 retry attempts (record failure in `output_artifacts.tool_call_failures` with source + reason + http_status; continue with remaining sources).
- Articles older than 7 days (unless low-signal day, then mark stale per §4).
- Political content (elections, partisan rhetoric, non-tech regulatory drama).
- Marketing content (vendor PR with no technical substance).
- Articles behind hard paywalls — note the source but skip the article.

**Retry once:**
- HTTP 429 (rate-limited): wait 30 seconds, retry once. If still 429, mark source failed and continue.
- HTTP 5xx: wait 10 seconds, retry once. If still 5xx, mark source failed and continue.
- Connector dispatch failure (Slack): wait 5 seconds, retry once. If still failing, record in `output_artifacts.connector_failures` and stop (there is no second dispatch path to fall back to).

**Never:**
- Fabricate articles. Only include articles that were actually fetched this run and verified to have a working URL. **Model prior knowledge and memory are NOT a source** — if `web_search`/`web_fetch` returns nothing verifiable for a lane, treat that lane as failed and record it in `output_artifacts.tool_call_failures`. Do not backfill the digest from what you already "know" about recent releases. Every bullet must trace to a URL fetched during this run. If the web tools are broadly unavailable and you cannot verify a single article, post the "No qualifying articles today" line per §4 rather than inventing content.
- Include private, leaked, or scraped-paywalled content.
- Exceed the 7-bullet hard ceiling.
- Dispatch if the digest contains zero qualifying bullets — instead post the "No qualifying articles today" line per §4.
- Use yellow (`#FFD700`) or red (`#FF0000`) in any color-coded output (per HFS branding rules).

## 7. Cost Budget

This Routine should complete in a single Claude session well under the per-run cost ceiling.

- **Target:** ≤ 50,000 total tokens per run (input + output + cache reads/writes).
- **Soft warning:** if total tokens > 75,000 mid-run, append a one-line `_Warning: high token usage (Nk) — consider reducing scraped depth._` note to `output_artifacts.notes` and continue, where `N = round(total_tokens / 1000)`.
- **Hard abort:** if total tokens > 150,000, stop fetching new sources immediately and dispatch a truncated digest with the prefix `_Partial digest — token budget exceeded; {{ N }} of 10 sources processed._`
- **Estimated cost:** ≈ $0.50-2.00 per run (Sonnet); ≈ $3-7 per run (Opus). Default to Sonnet — the work is mechanical scraping + summarization, not deep reasoning.
