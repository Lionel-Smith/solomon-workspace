# SKE-00 — Skills Ground-Truth Discovery

**Session:** SKE-00 | **Phase:** 0 — Discovery | **Date:** 2026-08-20
**Stance:** "never shipped" beats "in progress". Every claim in §2–§7 cites a path, sha, log line, or query result. Anything not directly observed is marked **INFERRED**.
**Artifacts:** `ske/skills_inventory.json`, `ske/skills_usage.json`, `ske/skills_usage_classified.json`, `ske/scripts/skills_inventory.py`, `ske/scripts/skills_usage.py`

---

## 1. Summary

1. **`~/.hfs/skills` does not exist**, yet it is the skills server's default `SKILLS_DIR` and appears in the SKE-00 brief as a root. The server survives only because `solomon/.mcp.json:7` overrides it.
2. **The "three-layer" skill model in `CLAUDE.md` is wrong.** `solomon-workspace/.claude/skills` is a *symlink* to `~/.claude/skills`, not a distinct layer. There are **4 real roots**: devkit (43), `~/.agents/skills` (39), plugins (11), `solomon/skills` (1).
3. **Zero content drift.** Across 95 skill records, 0 divergent hashes; `~/.claude/skills` is 74/76 symlinks. The estate is aliased, not forked.
4. **The Solomon parser is XML-shaped; the corpus is YAML+MD.** Only 4/43 devkit skills carry `<constraint priority=>` and **0/43** carry `<pattern>`, so `load_skill_metadata` returns empty constraints/forbidden for ~90% of skills.
5. **RET silently corrupts skills.** `_insert_into_section` appends orphan XML when `</forbidden>` is absent (38/43 skills) — writing through a symlink into the canonical devkit repo.
6. **`skills://index` serves 2 non-skills** — the format spec and the blank template — and one real skill (`hfs-client-engagement`) is served as `name: "SKILL"` because its frontmatter is invalid YAML.
7. **All 5 command→MCP call sites use dead tool names**, across 3 mutually inconsistent namespaces. None resolve to `mcp__plugin_solomon_solomon__load_skill`.
8. **67 of 93 skills are DORMANT** (0 observed invocations in a 57-day window); only 14 are ACTIVE. 2 skills named in `CLAUDE.md` are PHANTOM.
9. **`skill-reviewer` has never been run.** Zero `Final Score:` artifacts exist anywhere; it has 1 commit, is not installed to runtime, and 0/95 skills have an evals directory.
10. **The brief's assumed frontmatter schema is the one the devkit deliberately deleted** — `skill-reviewer/SKILL.md:95` names `author/date/phase/triggers/related_skills` as "the bug this rubric was rewritten to kill".

---

## 2. Roots & drift

### 2.1 Roots as they actually exist

| Label | Path | SKILL.md | Notes |
|---|---|---:|---|
| `devkit` | `hfs-development-kit/skills` | **43** | Canonical. HEAD `0dd7551` on `main`; clean except pre-existing `?? tests/__pycache__/` |
| `runtime` | `~/.claude/skills` | 76 (deref) | 84 entries: **74 symlinks**, 1 real dir, 8 legacy `.skill` files |
| `agents` | `~/.agents/skills` | **39** | The 4th layer from `project_workflow_integration_wfi`. Matt-Pocock set + `tdd`, `code-review`, `research` |
| `solomon-repo` | `solomon/skills` | 1 | `polyrepo-management` only |
| `plugin:*` | `~/.claude/plugins/cache/**/skills` | **11** | sentry 8, frontend-design 1, hookify 1, solomon 1 |
| `workspace` | `solomon-workspace/.claude/skills` | (alias) | **Symlink → `~/.claude/skills`.** Not a distinct layer |
| `hfs-legacy` | `~/.hfs/skills` | **ABSENT** | Does not exist. Still the server default (`skills_server.py:47`) |

**Unique records after realpath dedup: 95** (93 distinct names).
Composition: devkit 43, agents-sourced 40, plugins 11, solomon-repo 1.

### 2.2 Drift matrix

Full per-root sha256 for every skill name: `ske/skills_inventory.json` → `drift[]` (each entry carries `sha_by_root`, `distinct_realpaths`, `newest_mtime`, `devkit_sha_match`).

| Check | Result |
|---|---|
| Names present in >1 **distinct copy** | **1** — `polyrepo-management` (devkit, `solomon/skills`, plugin cache) |
| Divergent content (different sha across roots) | **0** |
| `polyrepo-management` three copies identical? | **Yes** — all three sha256 match |
| Skills in devkit **not** installed to runtime | **7** — `hfs-project-bootstrap`, `polyrepo-management`, `skill-reviewer`, `solomon`, `solomon-complete`, `solomon-feature`, `solomon-status` |
| Skills in runtime **not** in devkit | 40 (the `~/.agents/skills` set + `claude-design-prompts`) |

Zero divergence is a direct consequence of the symlink topology — `~/.claude/skills` mostly *points at* devkit rather than copying it.

### 2.3 Drift that hashes don't catch

- **Committed symlink targets name a different user.** `git cat-file -p 682b982` → `.claude/skills` is committed as `/Users/lionelj/.claude/skills`; the working tree has `/Users/lionel/.claude/skills`. Same for `.claude/commands` (blob `badd09b`). Both show as ` M` in `git status` and would resolve to nothing on a fresh clone.
- **`settings.local.json` still carries `lionelj` paths** in 6 permission entries (lines 34, 295, 342–352), including `SKILLS_DIR=/Users/lionelj/.hfs/skills` — a path that is wrong on *both* axes (user and the non-existent `.hfs`).
- **Plugin skills mutate under you.** `plugin:sentry/sentry-instrument` changed 131 → 196 lines *during this session*; sentry has two cached versions (1.2.0, 1.3.0) with different skill sets, only 1.3.0 registered.

---

## 3. Shape metrics

Produced by `ske/scripts/skills_inventory.py` (stdlib + optional PyYAML; byte-identical across reruns on both backends).

### 3.1 Totals (95 unique skills)

| Metric | Value |
|---|---:|
| Total lines / bytes | 17,064 / ~708 KB |
| Total est. tokens (bytes/4) | **177,627** |
| Avg / median / max lines | 179.6 / 134 / 484 |
| Avg / median description chars | 283.6 / 254 |
| Sum of full descriptions (tokens) | 6,739 |
| **`skills://index` as actually served** | **4,432 chars ≈ 1,108 tokens** |
| Monolithic (no sub-files) | **58 / 95** |
| With `references/` | 23 · with `scripts/` 4 · with `assets/` 3 |
| **With evals** | **0** |
| Frontmatter absent | 1 (`claude-design-prompts`) |
| **Frontmatter invalid YAML** | **1** (`hfs-client-engagement`) |
| Declared name ≠ dir name | 2 |

### 3.2 By root

| Root | n | monolithic | `references/` | `scripts/` | avg desc | avg lines |
|---|---:|---:|---:|---:|---:|---:|
| devkit | 43 | 25 | 17 | 2 | **388** | 276 |
| runtime (`~/.agents`-sourced) | 40 | 28 | 0 | 2 | 165 | 72 |
| plugin:sentry | 8 | 2 | 6 | 0 | 331 | 189 |
| plugin:* (others) | 3 | 2 | 0 | 0 | 234 | 202 |
| solomon-repo | 1 | 1 | 0 | 0 | 307 | 177 |

The devkit skills are roughly **4× longer and 2.4× more verbosely described** than the `~/.agents` set.

### 3.3 Frontmatter conformance

Scored against **the devkit's own template** (`skills/SKILL_TEMPLATE_v1.9.md:1-21` = `name, version, description, allowed-tools, model, hooks`), not the brief's assumed schema (see §8.4):

| Template key | Missing in |
|---|---|
| `hooks` | **43 / 43** |
| `allowed-tools` | 37 / 43 |
| `version` | 36 / 43 |
| `model` | 36 / 43 |
| `name`, `description` | 0 / 43 |

Every devkit skill carries exactly `name` + `description` and nothing else. The v1.9 template's other four keys have **zero adoption**.

Devkit description-length distribution: `<200` 3 · `200–400` 23 · `400–600` 12 · `600+` 5. Longest: `hfs-preprod-deploy` 872 chars.

### 3.4 Capability mentions

`mentions_tdd` 5 · `mentions_code_review` 11 · `mentions_completion_criteria` 8 · `mentions_worktree` **2** (of 95).

---

## 4. Discoverability coverage

### 4.1 Slash commands

20 command files under `~/.claude/commands`. `solomon-workspace/.claude/commands` is a symlink to the same place, so there is one command layer, not two.

**Skills referenced by ≥1 command: 13 / 93.**

| Command | Skills referenced |
|---|---|
| `client/intake.md` | domain-modeling, firecrawl-research, grilling, handoff, hfs-client-engagement, hfs-portfolio-review, implementation-plan-generator, project-plan-creator, research, solomon |
| `solomon.md` | plan-review-loop, project-plan-creator, research, solomon |
| `review.md` | plan-review-loop, research, solomon |
| `plan.md` | implementation-plan-generator, project-plan-creator, solomon |
| `session/plan-gap.md` | implement, implementation-plan-generator, solomon |
| `session/auto.md` | auto-mode-operations |
| `research.md`, `spec.md`, `complete.md`, `preflight.md`, `status.md`, `session.md`, `session/load.md` | 1–2 each |
| `complete-session.md`, `load-session.md`, `run-session.md`, `project/init.md`, `session/complete.md`, `session/next.md`, `session/run.md` | **none** |

### 4.2 MCP tool-name drift — all call sites dead

The live gateway exposes `mcp__plugin_solomon_solomon__{list_skills,load_skill,load_skill_metadata,load_skills,search_skills,get_pattern}`. Commands reference **three other namespaces, none of which exist**:

| Namespace used | Call sites |
|---|---|
| `solomon-skills.load_skill` | `plan.md:100`, `session.md` |
| `mcp__solomon_skills__list_skills` | `preflight.md` |
| `mcp__solomon__load_skill` | `review.md`, `session/load.md` |

**0 / 5 command→MCP references resolve.** This extends `finding_skill_layer_inversion_and_mcp_name_drift` from "pre-plugin names" to "three mutually inconsistent pre-plugin names".

### 4.3 MCP tools with no slash wrapper

`load_skill_metadata`, `load_skills`, `search_skills`, `get_pattern` have no `.claude/commands/**` wrapper — violating the "Slash Command Pairing" rule that `mcp-server-building` itself declares (CLAUDE.md, MCP & meta section).

---

## 5. Usage

### 5.1 Window — 57 days, not 90

Transcript corpus: **877 `.jsonl` files, 394 MB**, `~/.claude/projects/**`.
Observed timestamp range: **2026-06-24T15:53Z → 2026-08-20T13:09Z ≈ 57 days.** File mtimes only reach back to 2026-07-11.
**A 90-day figure is not obtainable** — retention is the binding constraint, not usage. Counts below are 57-day.

Sources used: (a) session transcripts ✅ · (b) OTEL/Prometheus — **not attempted, no reachable endpoint configured in this workspace** · (c) **Mem0 — UNREACHABLE**: `search_memories` returned `QUOTA_EXCEEDED` (1000/1000 used, resets 2026-09-01); results unavailable, **not** empty · (d) git log ✅.

Counts cross-validated against raw `grep`: 17 `"name":"Skill"` occurrences, per-skill distribution identical to the scanner's. This session's own transcript contaminates the corpus slightly (my script source echoes `<command-name>` strings); the Python scanner's structured parse is unaffected, raw grep is not.

### 5.2 Classification

Combined = Skill-tool invocations + slash invocations + `SKILL.md` reads + resolved `load_skill(name)` calls.

**ACTIVE (≥3) — 14**

| n | last used | skill |
|---:|---|---|
| 42 | 2026-07-23 | plan-review-loop |
| 19 | 2026-08-15 | firecrawl-research |
| 15 | 2026-08-15 | development-workflow |
| 11 | 2026-07-22 | hfs-client-engagement |
| 9 | 2026-08-03 | hfs-config-sync |
| 8 | 2026-08-02 | deep-app-research |
| 6 | 2026-08-02 | research |
| 4 | 2026-07-19 | hfs-vscode-orchestrator |
| 3 | 2026-07-24 | backend-e2e-testing |
| 3 | 2026-07-26 | claude-design-prompts |
| 3 | 2026-07-24 | db-transaction-discipline |
| 3 | 2026-08-15 | debugging-workflow |
| 3 | 2026-07-23 | grill-with-docs |
| 3 | 2026-07-23 | grilling |

**RARE (1–2) — 12:** domain-modeling, frontend-session-gates, frontend-wired-verification, hfs-frontend-visual-verification, hfs-portfolio-review, project-plan-creator, session-orchestrator, compaction-resilience, contract-first-api, hfs-project-bootstrap, implementation-plan-generator, python-backend-scaffold.

**DORMANT (0) — 67**, including every `~/.agents` skill (tdd, code-review, diagnosing-bugs, codebase-design, prototype, qa, triage, wizard, …), all 8 sentry skills, and devkit's auto-mode-operations, hfs-preprod-deploy, hfs-droplet-ops, hfs-skill-creator, mcp-server-building, otel-observability, playwright-e2e-testing, postgis-geospatial, temporal-workflows, skill-reviewer, solomon-*.

**PHANTOM — 2:** `droplet-deployment` and `claude-config-sync` are listed in `CLAUDE.md` → "Skills Available" but exist in **no root** (verified across devkit, runtime, agents). 33/41 registry names resolve; the remaining 6 non-matches are prose fragments, not skill names.

### 5.3 Invocation-path split

The Skill tool is barely the mechanism. Over 57 days: **17** `Skill` tool calls total, **17** MCP `load_skill` calls, **~80** direct `SKILL.md` file reads. Skills are predominantly consumed by *reading the file*, not by the skill-loading machinery.

### 5.4 Devkit commit activity

27 commits touched `skills/` since 2026-05-22. Most-churned: `hfs-client-engagement` (8), `hfs-repo-maintenance` (7), `session-orchestrator` (6), `development-workflow` (6). Untouched since January 2026: `hfs-accessibility-testing`, `hfs-component-library`, `hfs-server-debugging` (1 commit each, 2026-01-24) — all three also DORMANT.

---

## 6. Server & RET ground truth

### 6.1 `skills_server.py` (541 lines)

| Question | Answer |
|---|---|
| Skills dir | `skills_server.py:47` defaults to **`~/.hfs/skills` — does not exist**. Overridden by `solomon/.mcp.json:7` → devkit. Live `health()` confirms: `skills_dir` = devkit path |
| Index build | `list_skills_impl()` globs `*.md` where name `startswith("SKILL_")`, **then** walks subdirs for `SKILL.md`. Re-parses every file on **every** call |
| **Caching** | **None.** `grep -n "cache\|lru" skill_parser.py` → 0 hits. `skills://index`, `list_skills`, and `search_skills` each re-read all 45 files |
| `load_skill` returns | Full file content **plus** regex-extracted `constraints`, `forbidden`, `patterns` |
| `load_skill_metadata` | Tier-2: constraints + forbidden, **no body** — advertised at `skills_server.py:439` as "~500 vs ~2-5K tokens" |
| `triggers:` frontmatter | **Never read.** `_parse_triggers` (`skill_parser.py:261`) scrapes a `## Triggers` *markdown section*. 0/43 skills have `triggers:` frontmatter; **1/43** has a `## Triggers` section |
| `skills://index` cost | **4,432 chars ≈ 1,108 tokens** for 45 entries (descriptions truncated to 80 chars by `_truncate_description`) |
| Full Tier-3 corpus | 444,823 bytes ≈ **111,206 tokens** if every devkit skill were loaded |

**Bug — index serves non-skills.** `health()` and `list_skills` both report **45**, but only 43 `SKILL.md` exist. The `startswith("SKILL_")` glob sweeps in `SKILL_FORMAT_v1.7.md` and `SKILL_TEMPLATE_v1.9.md`. The live index contains:

```
- **FORMAT_v1.7**: Skill loaded from SKILL_FORMAT_v1.7.md
- **skill-name-here**: Brief description of what this skill does and when to use it.
```

The blank template is offered to the model as a usable skill.

**Bug — one real skill is unfindable.** `hfs-client-engagement` is served as `name: "SKILL"`, `description: "Skill loaded from SKILL.md"`. Cause: its frontmatter is invalid YAML — the plain scalar contains `consumers: IAMS/NSA`, and an unquoted `": "` inside a plain scalar raises `mapping values are not allowed here`. Verified with the exact `FRONTMATTER_PATTERN` regex from `skill_parser.py`: **1 of 43** devkit skills fails. Consequence: `search_skills("client")` / `("engagement")` / `("intake")` can never match the workspace's most active client-facing skill.

**Format mismatch — the parser reads a format the corpus doesn't use.** `skill_parser.py:36-46` regexes for `<constraint priority=>` and `<pattern>`:

| Pattern the parser extracts | Devkit skills containing it |
|---|---:|
| `<constraint priority=...>` | **4 / 43** |
| `<pattern>...</pattern>` | **0 / 43** |
| `<forbidden>` block | 5 / 43 |

So `load_skill_metadata` — the whole point of which is cheap constraints — returns **empty for ~90% of the catalogue**, and `load_skill`'s `forbidden` list is empty for 38/43.

### 6.2 RET encoding — confirmed latent mismatch, and worse

The brief asked whether the Jan-2026 XML assumption still holds. **It does not, and the failure mode is silent corruption rather than a no-op.**

- **Target path** (`retrospectives/service.py:393-394`): `f".claude/skills/{pattern.source_skill}/SKILL.md"`, else `.claude/skills/custom/SKILL.md`. **Relative** — resolves against process cwd, not a configured root. In this workspace `.claude/skills` is a symlink to `~/.claude/skills`, whose entries are symlinks into the devkit repo, so a write lands in **canonical devkit source**.
- **Content emitted** (`service.py:351-358`) is XML: `<pattern reason="...">...</pattern>` for `SKILL_FORBIDDEN`, `<constraint priority="high">...</constraint>` for `SKILL_CONSTRAINT`.
- **Insertion** (`_insert_into_section`): looks for closing tag `</forbidden>` / `</constraints>`. If absent — **38/43 skills** — it does *not* fail:
  ```python
  logger.warning(f"Section <{section}> not found in file")
  return content + f"\n<!-- Added by retrospective -->\n{new_content}\n"
  ```
  An orphan XML fragment is appended to the bottom of a YAML+MD file.
- **It really writes.** `apply_encoding` (`service.py:490`) does `shutil.copy2` backup then `target_path.write_text(new_content)` at line 573.
- **The tests validate the wrong corpus.** `tests/test_skills_server.py:26-31, 63-64, 586-590` build synthetic fixtures containing `<constraints>`, `<constraint priority="critical">`, `<forbidden>`. Those tests pass against XML that the real skills no longer contain — green suite, empty production output.
- `known_patterns.py` hardcodes `source_skill` values (`fullstack-integration`, `python-backend-scaffold`, `session-orchestrator`). All three exist, so path resolution would succeed and the corrupting append would proceed.

---

## 7. `skill-reviewer` & `hfs-skill-creator` reality check

| Question | Finding |
|---|---|
| Artifacts with `Final Score:` | **0** anywhere in the workspace (`grep -rn "Final Score" --include='*.md'` → empty), despite `skill-reviewer/SKILL.md:160` defining `**Final Score:** {X}/100` as its output |
| `SKILL_FINAL.md` / validation reports | **0** |
| Skills with a recorded score | **0 / 95** |
| Skills with evals | **0 / 95** (`with_evals: 0`; no `evals/`, `eval/`, or `tests/` dir under any skill in any root) |
| `skill-reviewer` git history | **1 commit**, 2026-05-31. Created, never revised |
| `skill-reviewer` installed? | **No** — present in devkit, absent from `~/.claude/skills`, absent from the session's available-skills list |
| `skill-reviewer` shape | 291 lines, monolithic (`ls -R` → `SKILL.md` only) |
| `hfs-skill-creator` | 5 commits, last 2026-05-31; installed; **DORMANT** (0 invocations in 57 days); 406 lines, monolithic |
| Only mention of `skill-reviewer` in the workspace | `CLAUDE.md` registry line |

Both meta-skills exist as documents and have produced no observable output. The claude.ai characterisation "rubric-only" is accurate in effect but incomplete in cause — see §8.3.

---

## 8. Corrections to the claude.ai audit

| # | Audit claim | Ground truth |
|---|---|---|
| 8.1 | "38 installed skills" | **93 distinct names / 95 records** across 4 roots. `~/.claude/skills` alone has 84 entries (76 resolving to `SKILL.md`). The audit saw roughly the devkit slice only |
| 8.2 | "No tdd / tracer / code-review skills" | **`tdd`, `code-review`, and `diagnosing-bugs` all exist** at `~/.agents/skills/`, symlinked into `~/.claude/skills`. The audit's snapshot did not mount `~/.agents`. `tracer` genuinely does not exist (0 hits) — that one stands |
| 8.3 | "`skill-reviewer` is rubric-only" | Directionally right, mechanically wrong. It defines a full workflow *and* an output format (`Final Score: {X}/100`, `Score Breakdown` table). The real finding is **it has never been run** — 0 artifacts, 1 commit, and it is **not installed to the runtime root at all**, so it cannot be invoked by name |
| 8.4 | Implied HFS v2.0 schema: `name, description, version, author, date, phase, triggers, related_skills` | **This schema is repudiated by the devkit itself.** `skill-reviewer/SKILL.md:95`: *"Do NOT deduct for a clean `name`+`description`-only frontmatter — penalizing absent legacy fields (author/date/phase/triggers/related_skills) is the bug this rubric was rewritten to kill."* The live template (`SKILL_TEMPLATE_v1.9.md:1-21`) specifies `name, version, description, allowed-tools, model, hooks`. Scoring against the brief's list would resurrect a bug the repo already fixed |
| 8.5 | "37/38 monolithic" | **58/95 monolithic (61%)**, not 97%. Devkit is 25/43 monolithic; 17/43 ship a `references/` dir. The audit's slice missed the progressive-disclosure work already done |
| 8.6 | "avg description 285 chars" | **283.6 across 95** — essentially confirmed. But the estate-wide average hides the split: devkit **388**, `~/.agents` **165** |
| 8.7 | (not covered) | The audit could not see: the symlink topology, `~/.agents` as a root, live-server behaviour (45-vs-43, the `hfs-client-engagement` YAML failure), MCP name drift, or any usage data |

---

## 9. Recommended changes to SKE_PLAN_v1

> **Gap:** `SKE_PLAN_v1` **does not exist on disk** — `find`/`grep` for `SKE*`/`SKE_PLAN` across the workspace returns only the `ske/` directory this session created. Recommendations below are written against the plan *as described in the SKE-00 brief* (SKE-01 = skills eval harness; SKE-10 = baseline re-comparison). Reconcile before acting.

### 9.1 Insert before SKE-01 — three defects block any eval harness

An eval harness measures skill *quality*. These three make the measurement meaningless because the pipeline is broken upstream:

1. **`SKE-00a` — fix `hfs-client-engagement` frontmatter.** One-line quote fix. Until then the skill is invisible to `search_skills` and mis-indexed. Cheapest high-value fix in the estate.
2. **`SKE-00b` — stop serving non-skills.** Exclude `SKILL_FORMAT_*` / `SKILL_TEMPLATE_*` from `list_skills_impl`'s glob, or move them out of `skills/`. Any eval that iterates the index currently scores a blank template.
3. **`SKE-00c` — decide the parser's contract.** Either (a) drop XML extraction and parse constraints from markdown, or (b) declare `constraints`/`forbidden` unsupported. Today `load_skill_metadata` is advertised as the cheap path and returns empty for ~90% of skills — an eval harness would score that as "skill has no constraints" rather than "server can't read them".

### 9.2 Add a RET-safety session (P0, ahead of eval work)

`RET`'s append-on-missing-section behaviour writes orphan XML into canonical devkit files through a symlink. Recommend: fail closed when the section is absent, and resolve `_find_skill_path` against a configured root rather than cwd. This is a correctness/safety issue independent of SKE and should not wait behind an eval harness.

### 9.3 Re-scope the usage-driven sessions

- **Drop any session premised on 90-day telemetry.** Retention is 57 days and the corpus holds only ~80 skill reads + 34 loader calls total. There is not enough signal to rank 93 skills by usage; any "top N by usage" ranking would be noise.
- **Instead, add `SKE-0x` — instrument skill loads.** The estate has no usage telemetry by design; `otel-observability` exists as a skill but nothing emits skill-level metrics. Without this, SKE-10's "baseline comparison" can only compare *shape*, not *adoption*.

### 9.4 Reorder — fix discoverability before authoring

67/93 skills are DORMANT and only 13/93 are reachable from a slash command, while **0/5** command→MCP call sites resolve. Skill *quality* is not the binding constraint on adoption; skill *reachability* is. Recommend promoting the command/MCP-name repair ahead of any authoring or refinement sessions.

### 9.5 Adjust the conformance rubric

Score against `name` + `description` (+ optional `allowed-tools`/`model`), per `skill-reviewer/SKILL.md:95`. Do **not** score `author/date/phase/triggers/related_skills`. Note `hooks` has 0/43 adoption — treat it as aspirational template content, not a gap.

### 9.6 Keep

`ske/scripts/skills_inventory.py` and `skills_usage.py` are both idempotent and re-runnable; SKE-10 can diff `skills_inventory.json` directly.

**Baseline pinning.** Run the inventory with a PyYAML-capable interpreter (`solomon/.venv/bin/python3`). Every field *except* `frontmatter_yaml_valid` / `frontmatter_yaml_error` is interpreter-independent — verified by flattening both artifacts: 344 differing leaf paths, all of them those two fields plus `yaml_backend` and the derived `frontmatter_yaml_invalid` count. Shape metrics, sha256s, drift, and coverage are byte-identical across interpreters. The script sets `baseline_comparable: false` and warns on stderr when PyYAML is absent.

Canonical baseline for this run: `skills_inventory.json` sha256 `3726824f277dd063…` (pyyaml backend, 658,933 bytes).

---

## 10. Evidence index

**§2 — Roots & drift**
- `~/.hfs/skills` absent — `ls -la ~/.hfs` → `No such file or directory`
- Devkit HEAD — `git rev-parse HEAD` → `0dd7551322a36f357847b21af4e2a571175a63be`, branch `main`, `git status --short` → `?? tests/__pycache__/`
- Workspace `.claude/skills` is a symlink — `ls -la solomon-workspace/.claude/` → `skills -> /Users/lionel/.claude/skills`
- Committed symlink target — `git cat-file -p 682b982a543406387c68bf5d042def1cb6a6f297` → `/Users/lionelj/.claude/skills`; commands blob `badd09bfb2fcdf9ad38a9475752fa9ee119948a5`
- Root counts, per-root sha256, drift flags — `ske/skills_inventory.json` → `roots[]`, `drift[]`, `coverage[]`
- `lionelj` paths in settings — `.claude/settings.local.json:34,295,342,343,344,347,352`
- Sentry dual cache — `~/.claude/plugins/cache/claude-plugins-official/sentry/{1.2.0,1.3.0}/skills`; `installed_plugins.json` registers 1.3.0 only

**§3 — Shape metrics**
- All figures — `ske/skills_inventory.json` → `summary`, `skills[]`; regenerate via `python3 scripts/skills_inventory.py`
- Template schema — `hfs-development-kit/skills/SKILL_TEMPLATE_v1.9.md:1-21`
- Idempotency — two consecutive runs byte-identical on both PyYAML and builtin backends; sole delta between runs traced to `plugin:sentry/sentry-instrument` 131→196 lines (file changed on disk)

**§4 — Discoverability**
- Command inventory — `find ~/.claude/commands -name '*.md'` → 20 files
- Command→skill map — regenerated in-session; 13/93 referenced
- Dead MCP namespaces — `plan.md:100` (`solomon-skills.load_skill`), `preflight.md` (`mcp__solomon_skills__list_skills`), `review.md` + `session/load.md` (`mcp__solomon__load_skill`)
- Live tool names — `ToolSearch` / gateway tool list → `mcp__plugin_solomon_solomon__*`

**§5 — Usage**
- Corpus — `find ~/.claude/projects -name '*.jsonl' | wc -l` → 877; `du -sh` → 394M
- Window — `ske/skills_usage.json` → `window_first_timestamp` `2026-06-24T15:53:48.649Z`, `window_last_timestamp` `2026-08-20T13:09:06.650Z`
- Counts — `ske/skills_usage.json`; classification `ske/skills_usage_classified.json`
- Cross-validation — `grep -rho '"name":"Skill"' ~/.claude/projects` → 17; `grep -rho '"skill":"[a-z0-9:_-]*"'` distribution matches scanner exactly
- Mem0 unreachable — `search_memories` → `QUOTA_EXCEEDED`, `quota_used: 1000`, `quota_reset: 2026-09-01T00:00:00+00:00`
- Git churn — `git log --since=2026-05-22 --oneline -- skills/ | wc -l` → 27
- PHANTOMs — `find` for `droplet-deployment`, `claude-config-sync` across all three roots → 0 each

**§6 — Server & RET**
- Default skills dir — `solomon_mcp/skills_server.py:47`
- Override — `solomon/.mcp.json:7`
- Live health — `mcp__plugin_solomon_solomon__health` → `{"status":"healthy","skills_count":45,"skills_dir":"…/hfs-development-kit/skills"}`
- Index content + cost — `ReadMcpResourceTool skills://index`; measured 4,432 chars ≈ 1,108 tokens via `format_skills_index` on the live server module
- No caching — `grep -n "cache\|lru\|_cache" solomon_mcp/utils/skill_parser.py` → 0 hits
- XML regexes — `solomon_mcp/utils/skill_parser.py:36-46`
- Corpus XML counts — `grep -rl '<constraint priority=' … | wc -l` → 4; `'<pattern>'` → 0; `'<forbidden>'` → 5; `'^## Triggers'` → 1; `'^triggers:'` → 0
- Triggers parsing — `solomon_mcp/utils/skill_parser.py:261-275`
- YAML failure — reproduced with `skill_parser.FRONTMATTER_PATTERN` + `yaml.safe_load` → 1/43 fails: `hfs-client-engagement: mapping values are not allowed here`; offending substring `consumers: IAMS/NSA` at `hfs-client-engagement/SKILL.md:3`
- RET target path — `solomon_mcp/retrospectives/service.py:393-394`
- RET XML content — `service.py:351-358`
- RET append-on-missing — `service.py` `_insert_into_section`, `logger.warning(f"Section <{section}> not found in file")` branch
- RET writes — `service.py:490` (`apply_encoding`), `:573` (`write_text`)
- RET tests assume XML — `tests/test_skills_server.py:26-31, 63-64, 586-590`
- Hardcoded source skills — `solomon_mcp/retrospectives/known_patterns.py:80-189`

**§7 — Reviewer / creator**
- No score artifacts — `grep -rn "Final Score" solomon-workspace --include='*.md'` → empty
- Declared output format — `hfs-development-kit/skills/skill-reviewer/SKILL.md:160,165-175`
- Rubric repudiates legacy fields — `skill-reviewer/SKILL.md:95`
- Git history — `git log --oneline -- skills/skill-reviewer` → 1 commit, 2026-05-31
- Not installed — absent from `ls ~/.claude/skills`
- Monolithic — `ls -R skills/skill-reviewer/` → `SKILL.md` only
- Zero evals — `find … -type d \( -name evals -o -name eval -o -name tests \)` under skill roots → empty; `summary.with_evals` → 0
