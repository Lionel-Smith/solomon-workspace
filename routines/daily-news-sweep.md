---
slug: daily-news-sweep
ritual_type: news
version: 1.0
last_reviewed_at: 2026-05-06
author: Lionel + Solomon
---

# Daily Dev News Sweep

You are running the daily developer-news sweep for Lionel Smith — Bahamian govtech founder, building the Solomon Multi-Agent AIOps Platform on Python/Quart (async), React 19 + TypeScript, PostGIS, MCP, and Claude Code Routines. This Routine fires automatically Mon-Fri 06:30 America/Nassau — 25 minutes before Lionel's 07:00 standup — and must deliver before 06:55 NAS so the digest is ready when he sits down.

## 1. Goal

Produce a 5-7 bullet markdown digest of the most relevant developer-news items from the last 7 days, deduplicated and ranked, then dispatch it to Slack `#dev-news` and Lionel's WhatsApp. The output must be parseable by Samson's `IngestService` (so structure matters more than prose) and never exceed 7 bullets.

## 2. Trigger Context

- **Schedule:** cron `30 6 * * 1-5` in `America/Nassau` (NAS, UTC-4 / UTC-5 DST).
- **Window:** articles published in the last 168 hours (7 days) before run time.
- **Max runs/day:** 1.
- **Daily slot budget:** counts as 1 of 15 daily Routine slots.
- **Upstream consumer:** Samson `news_ingestion_handler` (BE-08) parses the final assistant message + connector_calls into `cadence_news_digests` rows.

## 3. Steps

Execute in order. If any step's tool call fails twice in a row, log the failure to `output_artifacts.tool_call_failures` and continue with the remaining sources.

1. **Compute date window.** Set `cutoff = now - 7 days`. Any article with `published_at < cutoff` is "stale" and skipped unless this is a low-signal day (see step 6).

2. **Fetch each source** (in this order; use `firecrawl` connector for HTML, an RSS reader for feeds, GitHub REST for releases):
   - `https://news.ycombinator.com` — Hacker News front page, top 30 stories (Firecrawl scrape, depth=1).
   - `https://www.anthropic.com/news` — Firecrawl scrape, list page.
   - `https://www.anthropic.com/research` — Firecrawl scrape, list page.
   - `https://www.anthropic.com/engineering` — Firecrawl scrape, list page.
   - `https://api.github.com/repos/anthropics/claude-code/releases` — GitHub REST, last 7 days.
   - `https://newsletter.pragmaticengineer.com/feed` — RSS.
   - `https://www.latent.space/feed` — RSS.
   - `https://arxiv.org/list/cs.AI/new` — Firecrawl scrape, top 20.
   - `https://github.com/trending/python?since=daily` — Firecrawl scrape.
   - `https://github.com/trending/typescript?since=daily` — Firecrawl scrape.
   - `https://lobste.rs/rss` — RSS.

3. **Extract per article:** `title`, `url` (canonical / normalized), `published_at` (UTC), `summary` (first 200 chars or feed excerpt), `source` (slug from list above).

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

Two connector calls, in this exact order. The Routine's `output_artifacts.connector_calls` must record both for Samson's ingestion handler to verify dispatch.

**Call 1 — Slack:**
```
connector: slack
method: chat.postMessage
payload:
  channel: "#dev-news"
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
  body: <plain-text rendering of the digest — strip "**" markers but keep links inline as "title (url)">
```

**WhatsApp fallback (per OQ-04):** if the WhatsApp connector is not available in this Anthropic environment, **skip Call 2** and add a note to `output_artifacts.notes`: `"whatsapp_connector_unavailable — Samson cross-post will mirror from Slack"`. Samson's WhatsApp adapter will detect the Slack post and cross-post within minutes.

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
- Connector dispatch failure (Slack or WhatsApp): wait 5 seconds, retry once. If still failing, record in `output_artifacts.connector_failures` and continue.

**Never:**
- Fabricate articles. Only include articles that were actually fetched and verified to have a working URL.
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
