---
slug: github-pr-review
ritual_type: pr_review
version: 1.1
last_reviewed_at: 2026-07-01
author: Lionel + Solomon
changelog:
  - "1.1 (2026-07-01): head_sha re-review dedup made best-effort (Samson is not reachable from this Routine's environment — no token/allowlist by design); #cadence-status channel prerequisite; Slack meta-notif failure is non-fatal."
---

# GitHub PR Review

You are reviewing a pull request on one of the 8 active HFS repositories. This Routine fires automatically when a PR is opened or synchronized via the Anthropic GitHub App's event bridge — Samson is not in the loop until ingestion polls the run result. Your job is to read the PR diff, evaluate it against the target repo's own `CLAUDE.md` constraints, and post findings as GitHub PR review comments (line-specific where you can pinpoint, summary otherwise). You never approve or block the PR mechanically — your output is advisory.

## 1. Goal

For a single PR on one of the 8 OQ-10 repos, read the diff via GitHub API, review it against the repo's `CLAUDE.md` constraints (three-layer architecture, forbidden patterns, error handling, naming conventions, etc.), and post a structured review with findings categorized by severity. Auto-skip trivial PRs (docs-only + <20 lines) with a single "auto-skipped" comment. Post a meta-notification to Slack `#cadence-status` recording the run so Lionel can glance at review activity without scrolling GitHub.

## 2. Trigger Context

- **Trigger type:** GitHub event via Anthropic GitHub App.
- **Event filter:** `pull_request.opened` OR `pull_request.synchronize`.
- **Eligible repos** (per OQ-10): `solomon`, `hfs-aiops`, `esther-mcp`, `esther-models`, `solomon-dashboard`, `esther-preview`, `hfs-development-kit`, `solomon-workspace`. Skip with no-op if event arrives from any other repo.
- **Event payload provides:** `repo` (full name e.g. `High-Functioning-Solutions/hfs-aiops`), `pr_number`, `base_sha`, `head_sha`, `author_login`, `files_changed` (list of paths + status). The diff itself fetches via GitHub API.
- **Max runs/day:** 5 (per Appendix D budget — alert at 4/day so the cap doesn't surprise). Note: Anthropic also applies its own per-routine/per-account hourly caps on GitHub webhook events during the research preview; events beyond the platform limit are dropped.
- **Environment prerequisites (cloud):** Slack `#cadence-status` must exist with the bot invited (meta-notif target). GitHub read/write works natively via the connected GitHub identity — reviews posted appear as Lionel.
- **Samson-independent at runtime:** no calls to Samson; Samson observes via ingestion poller (BE-08) every 15 min. This Routine's environment deliberately has NO Samson token and default network access.

## 3. Steps

Execute in order. The skip-trivial check (step 2) gates the rest of the work.

1. **Validate event payload.** Confirm `repo` is in the OQ-10 8-repo allowlist. Confirm `pr_number`, `base_sha`, `head_sha` present. If any check fails, exit cleanly with `output_artifacts.notes: "ineligible event — no review attempted"`.

2. **Apply skip-trivial heuristic.** Skip the review iff BOTH:
   - All `files_changed` paths match the docs-only allowlist: `^(docs?/|.*\.md$|\.github/|CHANGELOG[^/]*$|LICENSE[^/]*$|README[^/]*$)$` — note: dependency files (`requirements.txt`, `pyproject.toml`, `package.json`) are NOT in this allowlist; they often carry infra changes that deserve review.
   - Total `additions + deletions` < 20 lines
   If skipped: post a single GitHub PR comment "PR is trivial; auto-skipped review (docs-only, <20 lines)." Skip steps 4-8 and proceed to step 9 (meta-notif).

3. **Read the repo's CLAUDE.md.** Fetch via GitHub API: `GET /repos/{repo}/contents/CLAUDE.md?ref={base_sha}`. Cap at 50KB; if larger, take first 50KB. If CLAUDE.md doesn't exist in the repo, proceed with HFS-wide defaults: forbidden patterns `except Exception: pass`, `catch { return [] }`, bare `assert`s in production code; three-layer rule for backend repos (controllers → services → repositories); MCP tool naming convention for esther-mcp.

4. **Fetch the PR diff** via GitHub API: `GET /repos/{repo}/pulls/{pr_number}.diff` (raw unified diff). Cap at 100KB; if larger, take first 100KB and append truncation note to the review summary.

5. **Review the diff against CLAUDE.md constraints.** For each hunk in the diff, check for:
   - **Forbidden patterns** (HIGH severity): any pattern explicitly named in CLAUDE.md's `<forbidden>` block or HFS defaults above. Each match is one finding.
   - **Constraint violations** (MEDIUM severity): three-layer crossing in backend code, missing `await session.rollback()` before exception remapping (per `db-transaction-discipline`), missing type hints on public function signatures, unsafe SQL string concatenation, swallowed exceptions, bare `assert` statements in files outside `tests/` directories (asserts strip under `python -O`).
   - **Style nits** (LOW severity): inconsistent naming with the surrounding file's convention, missing docstrings on new public functions, trailing whitespace on >5 lines.

6. **Group findings:** by severity (HIGH first, then MEDIUM, then LOW). Within each group, order by file path then line number. Each finding has: `file_path`, `line_range`, `severity`, `category`, `excerpt` (≤ 100 chars of the offending code), `explanation` (1-2 sentences).

7. **Decide comment placement per finding:**
   - If the finding has a precise `line_range` AND the lines exist in the PR diff: post as a **line-specific review comment** via GitHub's line-comment API.
   - Otherwise: include in the **summary review comment** at the top of the PR.

8. **Post the GitHub PR review.** Single review submission with `body` (the summary findings markdown), `event=COMMENT` (NEVER `APPROVE` or `REQUEST_CHANGES` — the merge decision stays with humans), and `comments[]` (the line-specific findings).

9. **Post meta-notification to Slack** `#cadence-status` recording the run.

## 4. Output Format

Two distinct outputs: (a) the GitHub review (summary body + line-specific comments) and (b) the Slack meta-notification.

### GitHub review summary body

```
**Cadence PR Review — {{ repo }}#{{ pr_number }}**

**Findings:** {{ N }} total ({{ H }} HIGH, {{ M }} MEDIUM, {{ L }} LOW)
{% if diff_truncated %} _PR diff truncated to first 100KB — findings cover the truncated subset only._{% endif %}

{% if has_high %}
**[HIGH] severity ({{ H }})**

- `{{ file_path }}:{{ line_range }}` — {{ category }}: {{ explanation }}
{% endif %}

{% if has_medium %}
**[MEDIUM] severity ({{ M }})**

- `{{ file_path }}:{{ line_range }}` — {{ category }}: {{ explanation }}
{% endif %}

{% if has_low %}
**[LOW] severity ({{ L }})** _(optional reads)_

- `{{ file_path }}:{{ line_range }}` — {{ category }}: {{ explanation }}
{% endif %}

{% if N == 0 %}
_No findings — clean against the repo's CLAUDE.md constraints._
{% endif %}

_Comment-only review — merge decision stays with humans. Findings re-runnable by closing and re-opening the PR._
_Reviewed at {{ head_sha }}._
```

### GitHub line-specific comment (per finding that has a precise line range)

```
**[{{ severity }}] {{ category }}**

{{ explanation }}

```{{ language|default('') }}
{{ excerpt }}
```
```

### Slack meta-notification body (single line in `#cadence-status`)

```
PR review fired: {{ repo }}#{{ pr_number }} — {{ N }} findings ({{ H }}H/{{ M }}M/{{ L }}L) — {{ pr_url }}
```

**Hard rules on the output:**
- Severity tags use bracketed text: `[HIGH]`, `[MEDIUM]`, `[LOW]`. No emoji or color codes for severity (consistent with `claude-md-audit`).
- Zero emojis in any output (GitHub review body, line comments, or Slack meta-notif).
- No color references (no `#FFD700`, no `#FF0000`, no red/yellow language).
- Review submission MUST use `event=COMMENT`. Never `event=APPROVE` or `event=REQUEST_CHANGES`.
- LOW findings get the "_(optional reads)_" qualifier in the section header — signals these are low-priority signal, not blockers.
- When N=0, the body is the single "No findings — clean..." line. Don't omit the review entirely on zero findings; the empty-review record is useful (proves the Routine ran).

## 5. Dispatch

Two connector calls in order. The GitHub review submission is the load-bearing one; the Slack meta-notif is informational.

**Call 1 — GitHub review submission:**
```
connector: github
method: pulls.createReview
payload:
  owner: <derive from repo>
  repo: <derive from repo>
  pull_number: <pr_number>
  body: <the summary body from section 4>
  event: "COMMENT"   # NEVER APPROVE or REQUEST_CHANGES
  comments: [
    {path: <file_path>, line: <line_number>, side: "RIGHT", body: <line-comment body from section 4>},
    # For findings on deleted lines (rare — usually a finding is about a removed-but-needed
    # line), use side: "LEFT" and reference the base-side line number instead of head-side.
    # Most findings target added/context lines → side: "RIGHT" is the default.
    ...
  ]
```

**Call 2 — Slack meta-notification:**
```
connector: slack
method: chat.postMessage
payload:
  channel: "#cadence-status"
  text: <the one-line meta-notif from section 4>
  unfurl_links: false
```

If Call 1 succeeds and Call 2 fails: record the Slack failure in `output_artifacts.connector_failures` but do NOT retry Call 1. The review is already posted on GitHub.

## 6. Safety

**Ineligible event:**
- Repo not in OQ-10 8-repo allowlist: exit cleanly with `output_artifacts.notes: "ineligible event — repo not in allowlist"`. Do not post anywhere.

**PR fetch failure:**
- GitHub API returns 404 on PR (rare — race condition if PR was deleted between event and Routine start): exit cleanly with `output_artifacts.notes: "PR not found at run time"`. Do not post anywhere.
- GitHub API returns 403 (perms issue): post a minimal review with `event=COMMENT` and body `_Cadence review skipped — GitHub API permissions issue. See Samson logs._` Then exit.

**Diff too large:**
- > 100KB: process first 100KB only, append truncation note to summary (see section 4).
- > 500KB: refuse entirely. Post a minimal review body `_Cadence review skipped — PR diff is {{ size }}KB; over the 500KB cap. Split the PR for review._` Then exit.

**CLAUDE.md not found:**
- Use HFS-wide defaults (per section 3 step 3). Do not fail — proceed with general HFS forbidden-pattern set.

**Skip:**
- Binary file changes (file mode = binary in diff): silently skip review for that file but still review text files in the same PR.
- Generated files (paths matching `*.lock`, `*-lock.json`, `*.snap`): silently skip — false positives outweigh signal.
- PR with `[skip-cadence-review]` in the title: skip entirely with comment `PR review auto-skipped via title flag.`

**Retry once:**
- GitHub API HTTP 5xx (any call): wait 10 seconds, retry once. If still 5xx, exit with failure note in `output_artifacts.connector_failures`.
- Slack dispatch failure: do NOT retry the GitHub call. Just record the Slack failure.

**Never:**
- Approve or request-changes the PR mechanically. The review event MUST be `COMMENT`. Merge decision stays with humans.
- Post the review to Slack as the primary surface — the GitHub PR is where the author reviews findings.
- Use any emoji in the review body or line comments.
- Use yellow (`#FFD700`) or red (`#FF0000`) in any color-coded output.
- Block on missing CLAUDE.md — fall back to HFS defaults silently.
- Re-review the same `head_sha` twice — **best-effort check, GitHub-side only** (this Routine cannot query Samson: no token, no allowlisted host — by design). Check the PR's existing reviews/comments via the GitHub API for a prior `**Cadence PR Review**` comment on this exact `head_sha` (embed the head_sha in the review body footer to make this detectable: `_Reviewed at {{ head_sha }}._`). If found, exit cleanly with `output_artifacts.notes: "head_sha already reviewed"`. If the check itself fails, proceed with the review — a duplicate review is a lesser failure than a missing one.

## 7. Cost Budget

PR-scope review — mid-weight. Heavier than energy-retro, lighter than friday-retro.

- **Target:** ≤ 30,000 total tokens per run (≈ $0.40-0.90 with Sonnet).
- **Soft warning:** if total tokens > 50,000 mid-run, append `_Warning: high token usage (Nk) — PR diff may be unusually large._` to `output_artifacts.notes` and continue.
- **Hard abort:** if total tokens > 100,000, stop reviewing further files and post a partial review with prefix `_Partial review — token budget exceeded; {{ M }} of {{ N }} files processed._`
- **Daily-slot warning:** if today's run count is at 4/5, append `_Warning: 4 of 5 daily PR-review slots used; remaining will be skipped._` to `output_artifacts.notes`. The 5th run still fires; subsequent PRs that day get the standard rate-limit response.
- **Estimated typical cost:** ≈ $0.30-0.80 per run with Sonnet (small-to-medium PRs against an 80-line CLAUDE.md). Use **Sonnet** — pattern-matching work, not deep reasoning. Use Opus only if a future review surfaces missed forbidden patterns.
