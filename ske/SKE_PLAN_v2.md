# SKE_PLAN_v2 - Solomon Skills Evolution

**Feature prefix:** SKE | **Supersedes:** SKE_PLAN_v1 (claude.ai only, never on disk) | **Grounded in:** `ske/SKE_DISCOVERY.md` (commit ea2e43c, 43 evidence citations) | **Status:** iteration 3 (v2.3) - panel review v1 fixes applied (2 CRIT, 4 WARN, 2 SUGG - `ske/SKE_PLAN_v2_review_v1.md`); awaiting delta re-run
**Location on disk (SKE-00d):** `solomon-workspace/ske/SKE_PLAN_v2.md`, `ske/SKE_PROGRESS.md`

## Executive summary

Solomon's skills estate is 94 skills across two ownership classes: 44 org-authored (43 canonical devkit + 1 runtime-local) and 50 vendored (mattpocock + plugin installs, lockfile-managed). Discovery (SKE-00) found the binding constraint is not skill quality but **plumbing**: the metadata parser reads a format the corpus abandoned (empty for 40/43), the retrospective encoder can corrupt canonical files, all 5 command->MCP call sites use dead namespaces, and only 13 skills are reachable from any command - half the org-authored estate is dormant. SKE fixes safety first (Wave 0), then reachability (Wave 1), then builds measurement (Wave 2) before enriching or authoring anything (Wave 3), and stakes the whole feature on one falsifiable claim: **>=11 of the 22 dormant org-authored skills record a load within 60 days of Wave 1, with eval'd precision/recall held >=0.9** - failure fires a pruning trigger, not another enrichment round. 24 sessions, ~20-24h, peak parallelism 4.

*Checklist scope note: this is an infrastructure/tooling plan - the data_model, api_design, and user_flows checklist families are not applicable; the closest analogues are the parser contract (D2), server surface (D3), and session DAG (section 3).*

---

## 0. Revision history

**v2 -> v2.1** (verification pass, 10 corrections): index gate could not go green; `CODE_BLOCK_PATTERN` preserved (serves 38/43); metadata-empty corrected to 40/43; CLAUDE.md gate 39/39; R7 promotion task; RET-corruption sweep pre-discharged (0 hits); 23 sessions; 75/76 symlinks; `coverage` field named as a task; R5 off the critical path.

**v2.2 -> v2.3** (panel review v1, full mode, 8 findings all CONFIRMED or SUGG, 0 refuted): CRIT T-01 - the 44th org-authored skill (`claude-design-prompts`, the runtime-local real dir; the solomon-repo entry is a sha-identical duplicate of devkit's `polyrepo-management`) is in neither `SKILLS_ROOTS` root, making 44/44 unsatisfiable -> population arithmetic stated in D5, disposition task added to SKE-02, gate restated as "44/44 accounted". CRIT I-01 - **Bishop does not exist** (0 hits estate-wide) -> dropped; the vendored `code-review` skill already runs two-axis parallel-subagent review. WARN I-02 - **Sentinel does not exist** -> replaced with Samson's ingestion poller + `cadence_state`. WARN S-01 -> executive summary added. WARN T-02 -> SKE-05 scope follows the disposition. WARN I-03 -> rollback lines on R4 + SKE-06b. SUGG S-02 -> checklist scope note. SUGG I-04 -> `mkdir -p` in the hook.

**v2.1 -> v2.2** (grilling, 12 decisions - the ledger):

| Q | Decision | Lands in |
|---|---|---|
| 1 | Gates apply to **44 org-authored** skills only; vendored (39 mattpocock + 11 plugin) reachable via `search_skills` alone | D5, SKE-01, SKE-02, ADR-0002 |
| 2 | Skills index = org-authored + one pointer line (~1,120 tok); search traverses both roots | D3, SKE-R3, SKE-R4 gate |
| 3 | Wrapper skills carry a report-only **Upstream pin** (lockfile hash); adjust as upstream moves | D8, SKE-01 (`upstream_drift`), SKE-07 |
| 4 | Bare names resolve only while unique; collision -> `AMBIGUOUS_SKILL`; wrappers use **qualified references** | D3, SKE-R3, SKE-01 (`name_collisions`) |
| 5 | Eval-less reviewer results are **`x/80 UNMEASURED`** - a different scale, never a hidden cap | SKE-05 |
| 6 | Evals mount the **production surface**; **Eval baseline = cases + index hash + upstream pins**, asserted at run start | SKE-04, SKE-11 gate |
| 7 | PROMPTS carry **true dependency edges only** - an edge is a data-flow claim, not a reading order | DAG |
| 8 | **Corpus-as-spec** section format; the R1<->R4 contract is a **round-trip test**, not matching prose | D2, SKE-R1, SKE-R4 |
| 9 | An approved RET encoding is a **single-file `ret:` commit** carrying `entry_id`; refuse on dirty target; `mark_encoded` only after commit | D14, SKE-R1 |
| 10 | **v1.11 is taken** (shipped Apr 2026). Format bump = **v1.12**, owned by one pre-wave session (SKE-06b); Wave 3 uses native worktree isolation from session one + file-ownership lists | D11, SKE-06b, Wave 3 |
| 11 | Telemetry hook obeys the **four-rule Telemetry contract**; path `~/.claude/telemetry/`, never the phantom `~/.hfs/` | D15, SKE-03 |
| 12 | **Success claim** adopted: >=11 of 22 dormant org-authored skills load within 60 days of Wave 1, precision/recall guard >=0.9 | D16, section 7, SKE-14 |

---

## 1. What changed from v1

| v1 assumption | Ground truth (discovery ref) | Effect on plan |
|---|---|---|
| 38 skills | 93 names / 95 records across 4 real roots: devkit 43, `~/.agents` 39, plugins 11, solomon-repo 1 (2.1) | **44 org-authored** are the gated population; `~/.agents` + plugins are a **Vendored root** - reachable, never gated (Q1, ADR-0002) |
| No tdd / code-review | Both exist in `~/.agents`, DORMANT (8.2) | Port sessions become **enrich + reach** sessions via Wrapper skills |
| Frontmatter schema: author/date/phase/triggers/related_skills | Repudiated by devkit; live template = name, version, description, allowed-tools, model, hooks; actual adoption = name+description only (3.3, 8.4) | Conformance = name + description (+ optional allowed-tools, model, `upstream`). Nothing else scored |
| 37/38 monolithic | 58/95; devkit already 17/43 with `references/` (8.5) | Disclosure refactor narrows to the worst devkit offenders |
| Quality is the bottleneck | Reachability is: 13/93 slash-reachable, 0/5 command->MCP call sites resolve, 67/93 DORMANT - **22 of 44 org-authored** (4, 5.2) | Repair and reach waves precede all authoring; thesis staked on the Success claim (section 7) |
| Server and RET work | **Constraint/forbidden** extraction is XML-shaped vs a YAML+MD corpus (metadata empty for 40/43); RET appends orphan XML into canonical devkit via symlink (6) | P0 safety wave. **Pattern extraction is markdown-based and works (38/43) - preserve it.** The corpus's own section format (15x `## Constraints` with priority subheads, 11x `## Forbidden Patterns` tables) becomes the spec (Q8) |
| 90-day usage ranking | 57-day retention, 114 events, Mem0 search quota exhausted until 2026-09-01 (5.1) | Usage classification provisional; instrument first |
| 3 skill layers | 1 command layer, `~/.claude/skills` is 75/76 symlinks, zero drift (2.1-2.3) | Single-source model; fix user-path drift (`lionelj` vs `lionel`) |

---

## 2. Decisions

| # | Decision | Rationale / evidence |
|---|---|---|
| D1 | **Fail-closed RET is P0 and ships before anything else.** | RET appends orphan XML into canonical devkit (6.2). No corruption has occurred yet (0 grep hits) - R1 is preventive |
| D2 | **Parser contract: corpus-as-spec.** Constraints parsed from `## Constraints` with `### Critical` / `### High Priority` / `### Medium Priority` subhead bullets (subhead carries priority); forbidden from `## Forbidden Patterns` `\| Pattern \| Reason \|` table rows. The format is specified **once**, in SKILL_FORMAT (relocated by R3); R1 and R4 cite it. **Delete `CONSTRAINT_PATTERN`, `FORBIDDEN_PATTERN`, `TEMPLATE_PATTERN` only; `CODE_BLOCK_PATTERN` retained unchanged** (drives `get_pattern` for 38/43). | Corpus survey: 15 files use `## Constraints`, 11 use `## Forbidden Patterns` tables, **0** use bare `## Forbidden`; 7 carry priority subheads. Plan-invented bullets would parse 0/43 day one and make RET create duplicate sections beside existing tables (Q8) |
| D3 | **Roots: `SKILLS_ROOTS` = [devkit, `~/.agents/skills` read-only]. `~/.hfs/skills` default removed.** The always-on **Skills index lists org-authored entries + one pointer line** naming `search_skills` and the top vendored skills; search/load traverse both roots. **Bare names resolve only while unique across roots; a collision returns `AMBIGUOUS_SKILL` listing both qualified names (`devkit:x`, `agents:x`); resolution is never by root order.** | Q2 (index ~1,120 tok vs ~2,019), Q4 (silent shadowing is the estate's recurring failure class); zero collisions today, tripwire in SKE-01 |
| D4 | **MCP namespace = `mcp__plugin_solomon_solomon__*`.** Canonical edits automatable after R7 task 0; runtime sync is Lionel's (denial history). | 4.2, C5 |
| D5 | **Reachability gate: 44/44 org-authored ACCOUNTED before any new skill is authored.** The population arithmetic, explicitly: 43 canonical devkit + `claude-design-prompts` (the estate's one Runtime-local real dir - 79 lines, no frontmatter, ACTIVE at 3 loads). The solomon-repo entry is a sha-identical duplicate of devkit's `polyrepo-management`, already inside the 43, not a 44th skill. `claude-design-prompts` sits in **neither** `SKILLS_ROOTS` root, so it cannot be server-reachable pre-disposition (panel CRIT T-01): SKE-02 dispositions it per the Runtime-local rule - Portability test -> **promote into devkit** (gate = 44 reachable via the server) or **declare Personal with reason** (gate = 43 reachable + 1 documented exclusion). Vendored skills are reachable via `search_skills` only and never gated. Enforced by the `coverage` field added in SKE-01. | Q1/ADR-0002; panel review v1 CRIT T-01/WARN T-02 |
| D6 | **Conformance rubric = name + description (+ optional allowed-tools, model, `upstream`).** `hooks` ignored. | 3.3, 9.5, Q3 |
| D7 | **Usage-driven decisions deferred until instrumented.** No skill deleted or demoted on 57-day data. SKE-03 telemetry is the instrument; the Success claim (section 7) is the first consumer. | 5.1, 9.3 |
| D8 | **Port, don't install; enrich, don't duplicate.** Wrapper skills load their vendored originals **by qualified reference** (`agents:tdd`) and carry an **Upstream pin** - the lockfile hash validated against, report-only, bumped deliberately on re-install. New authoring only for tracer-tickets, worktree-isolation, blast-radius, interrogate. | 8.2, Q3 (pins: tdd 57e1bee8, code-review 9df6fdac, diagnosing-bugs 0ecacff0; zero drift as of 2026-08-20), Q4 |
| D9 | **Every enriched or new skill ships `evals/evals.json`. skill-reviewer must be installed and run at least once before it is trusted as a gate.** | 7: never run, not installed, 0 evals |
| D10 | **Section-sign (U+00A7) forbidden estate-wide.** Swept in SKE-R5 (Wave 4 - cosmetic, off the critical path). | memory rule, C10 |
| D11 | **Format bump is v1.12, not v1.11.** `SESSION_FORMAT_v1.11_XML.md` shipped April 2026 (FE-verification gates) and its own header records a pending v1.12 split. **SKE-06b alone creates v1.12** with all additions at once: `<task size_tokens blocked_by>`, `<execution isolation>`, the section-sign forbidden pattern, and the effort-enum normalization. SKE-08, SKE-09, and R5 **consume** v1.12; none edits the spec. | Q10: three sessions claiming to edit a shipped spec version, two of them concurrently |
| D12 | **Mem0 + compaction retained.** No `/clear`-first adoption. | v1 D3 retained |
| D13 | **Runtime-only command files are promoted to canonical before they are edited.** Promote-then-symlink; then the edit is an ordinary repo edit plus one user-run `cp`. | C5; proven end-to-end by LHV-03 on 2026-08-20 |
| D14 | **An approved RET encoding is an Encoding commit**: `apply_encoding` writes the one file and git-commits it as `ret(<skill>): <entry title> [entry_id]`; `mark_encoded` fires only after the commit succeeds; the write is refused if the target path is dirty. | Q9: bare `write_text` loses provenance and opens DB/file divergence (mark-encoded-then-checkout silently un-encodes); SKE-12's eval-case-delta rule becomes checkable per `ret:` commit |
| D15 | **In-session telemetry obeys the Telemetry contract**: local append only; unconditional exit 0; single-digit-ms, no locks; path under `~/.claude/telemetry/`. A lost datapoint is acceptable; a stalled session is not. The hook never networks - server-side OTEL covers the `mcp` path in-process. | Q11: loop-guard false-positived twice on 2026-08-20 alone; the 2026-07-03 incident took the collector host offline; original fallback path sat under the phantom `~/.hfs/` |
| D16 | **SKE stakes a Success claim** (section 7). Both outcomes carry named consequences; failure fires the dormant-pruning trigger rather than more enrichment. | Q12: every other gate is internal; the feature obeys the discipline D9 imposes on skills |

---

## 3. Sessions

Sizes: 🩹 <=15m, ⚡ <=30m, 🔨 30-90m, 🏗️ 90m+. All produce evidence (path/sha/test) in completion. Waves group scheduling; `<requires>` edges in PROMPTS are **true data-flow edges only** (Q7) - within a wave, unblocked sessions may run in any order and a stall costs only its own session.

### Wave 0 - Scaffolding + P0 safety (~2h)

**SKE-00d · Plan + progress scaffolding** 🩹
This file + `ske/SKE_PROGRESS.md` (DAG table, all sessions PENDING except SKE-00 DONE ea2e43c). Register `solomon-workspace` in `~/.solomon/projects/` so `mark_complete` works (discovery: only `LJP Invoicing` and `payroll-converter` registered - no HFS session can complete via MCP today). Record the Success claim in PROGRESS with its evaluation date formula (Wave 1 completion + 60 days). Verify: `/session:complete` dry-run resolves project.

**SKE-R1 · RET fail-closed + Encoding commits** 🔨 *P0*
`_insert_into_section`: raise `SkillSectionMissingError` when the target section is absent per the Skill-section format; never append blind. `_find_skill_path` resolves against configured `SKILLS_DIR`, never cwd. Emission per D2 corpus-as-spec: `SKILL_FORBIDDEN` -> a `| pattern | reason |` row appended to the existing `## Forbidden Patterns` table (create the table-form section only when genuinely absent); `SKILL_CONSTRAINT` -> a bullet under the matching `### {priority}` subhead of `## Constraints`. Per D14: `apply_encoding` lands the change as an Encoding commit (`ret(<skill>): <title> [entry_id]`), refuses on a dirty target path, and calls `mark_encoded` only after the commit succeeds. Backup path moves out of the skills tree (SEC-01 rhyme: committed `.bak` files were that incident).
Tests: fixtures copied from 3 real devkit skills (one with a `## Forbidden Patterns` table, one without, one XML-legacy); assert no write on missing section; assert no XML ever emitted; assert refusal on dirty target; **round-trip test shared with R4** - whatever R1 emits, R4's parser must read back with priority intact (Q8: this test is the contract; the sessions may land in either order against the shared fixture).
Verify: three `known_patterns.py` entries dry-run against devkit -> zero mutations; corruption-sweep grep re-run at session start (0 hits as of 2026-08-20).

**SKE-R2 · hfs-client-engagement frontmatter + validity guard** 🩹
Quote the `consumers: IAMS/NSA` scalar. Add `frontmatter_yaml_valid` assertion to `skills_inventory.py` exit code. Verify: `search_skills("client")` returns the skill; inventory exit 0.

**SKE-R3 · Skills server: roots, index, resolution** ⚡
`list_skills_impl` glob restricted to `*/SKILL.md`; `SKILL_FORMAT_*` / `SKILL_TEMPLATE_*` relocated to `skills/_meta/` (SKILL_FORMAT becomes the D2 spec's home). `SKILLS_DIR` default removed; startup fails loudly if unset. `SKILLS_ROOTS` = [devkit, `~/.agents/skills` read-only]. Per D3: `skills://index` renders **org-authored entries only + one pointer line** ("N vendored skills (incl. tdd, code-review, diagnosing-bugs, codebase-design) - call `search_skills(query)`"); `search_skills` / `load_skill` traverse both roots; bare-name collision returns `AMBIGUOUS_SKILL` with both qualified names; qualified references (`devkit:x` / `agents:x`) resolve directly.
Verify: `health()` reports 82 traversable (43+39); index lists **43** org-authored + pointer (the 44th, `claude-design-prompts`, joins the index only if SKE-02 promotes it), contains no `skill-name-here`; a synthetic collision fixture returns `AMBIGUOUS_SKILL`.

**SKE-R4 · Parser: corpus-as-spec contract** 🔨
Per D2. `load_skill_metadata` parses constraints from `## Constraints` priority subheads and forbidden from `## Forbidden Patterns` table rows; `triggers` from frontmatter *or* `## Triggers`, documented optional. Delete the three XML regexes + synthetic fixtures; **`CODE_BLOCK_PATTERN` untouched**. Tests: iterate the real corpus - non-empty metadata for every skill with a matching section (day-one yield: 15 constraints + 11 forbidden vs 3/43 today, baseline recorded); `get_pattern` non-empty count **>= 38** (regression floor); the shared R1 round-trip test. `lru_cache` keyed (path, mtime) for index/list/search.
Verify: index entry count = **canonical count** (43 pre-disposition; deliberately != `health()` total per ADR-0002); **served tokens <= 1,200** (the Q2 index is ~43-44 entries + pointer ≈ 1,120); metadata non-empty rate reported. **Rollback (panel I-03): the regex deletion lands as a single commit - `git revert` restores XML extraction wholesale; exposure is bounded because only 3 corpus files ever parsed through the deleted regexes.**

**SKE-R6 · Path drift** 🩹
Re-commit `.claude/skills` and `.claude/commands` symlinks as relative or `$HOME`-based; purge 6 `lionelj` entries and the phantom `SKILLS_DIR` from `settings.local.json`. Verify: fresh clone into temp dir resolves both symlinks.

*True edges within Wave 0: only `R3 -> R4` (R4's corpus test and index gate assume R3's relocations and roots). R1, R2, R6 are dependency-free.*

### Wave 1 - Reachability (D4, D5, D13)

**SKE-R7 · Command promotion + MCP namespace repair** 🔨 *(task 6 is Lionel, manual)*
Task 0 (D13): promote `plan.md`, `session.md`, `preflight.md`, `review.md` into `hfs-development-kit/claude-config/commands/` (verified 2026-08-20: no canonical copies exist), then symlink runtime. Tasks 1-5: decision doc + rewrite the 5 dead call sites to `mcp__plugin_solomon_solomon__*`. Task 6 (Lionel): one `cp` per file. Verify: each command executes one live call.

**SKE-01 · Slash wrappers + inventory gates** ⚡
`/skill:search`, `/skill:meta`, `/skill:load-many`, `/skill:pattern` for the 4 unwrapped MCP tools. Add to `skills_inventory.py`: **`coverage`** (per org-authored skill: reachable via naming command / category command / description match; `{reachable, total, unreachable[]}`, non-zero exit below floor), **`name_collisions`** (bare-name overlap across roots - the Q4 tripwire), **`upstream_drift`** (Wrapper pins vs live lockfile hashes, report-only). Verify: 4 commands resolve live; all three fields emit with today's baselines.

**SKE-02 · Skill reachability sweep + runtime-local disposition** 🔨 *(shrunk from 🏗️: population 44, not 93)*
Goal: **44/44 org-authored accounted** - (a) a command names it, (b) a category command (`/skill:backend|frontend|ops|meta|agents`) lists it, or (c) `search_skills` description match. **Disposition `claude-design-prompts` per the Runtime-local rule (panel CRIT T-01): read it, apply the Portability test, then either promote into devkit (add frontmatter - it currently has none - land canonically, symlink runtime) or declare it Personal in the lint exclusion with a reason.** Fix the 7 dead commands (wire or delete). Remove the 2 PHANTOM CLAUDE.md entries; correct the layer description. Install the 7 devkit skills missing from runtime (incl. `skill-reviewer`). Vendored skills: verify `search_skills` finds each by description - no wrappers built or maintained for them (D5).
Verify: `coverage` = 44/44 accounted (reachable + dispositioned); CLAUDE.md registry 39/39 resolve; the disposition is recorded (promotion commit or exclusion entry).

**SKE-03 · Skill-load telemetry (Telemetry contract)** 🔨 (D7, D15)
Two emitters. (1) Server-side: OTEL counters in-process for `load_skill`/`search_skills`/`get_pattern` calls. (2) Hook-side: `PostToolUse` on `Skill` / `Read **/SKILL.md` appends one JSONL line `{ts, session_id, skill, path}` to **`~/.claude/telemetry/skill-loads.jsonl`** under the four-rule contract - local append only, unconditional exit 0, single-digit-ms, no locks (interleaved lines fine; each carries session id). **The hook `mkdir -p`s the directory before first append (panel SUGG I-04) - and that too is inside the exit-0 envelope: a failed mkdir drops the datapoint, never the session.** The hook never networks; Samson pulls the file on its own schedule.
Verify: one load per path (skill_tool / mcp / file_read) appends or increments; a simulated write failure (read-only dir) leaves the triggering session's exit status untouched.

*True edges within Wave 1: `R7 -> SKE-02` and `SKE-01 -> SKE-02` (the sweep verifies commands resolve and gates on `coverage`). SKE-03 is dependency-free within the wave.*

### Wave 2 - Measurement (D6, D9)

**SKE-04 · Eval harness with asserted environment** 🏗️
`ske/scripts/skill_eval.py`: cases `{id, prompt, should_trigger, expected_skill, rubric[], co_loaded[]}`; runner = headless `-p` mounting **the production surface exactly** - the org-authored index + pointer, search over both roots, real commands (Q6: trigger competition is the thing measured; option B/C environments measure fiction). At run start the harness renders `skills://index`, hashes it, and records the **Eval baseline triple: case set + index hash + upstream pins**. Later metric movement attributes in one comparison: index hash moved -> environment drift; pins moved -> upstream drift; both stable -> skill drift. Reports trigger precision/recall, rubric pass^3, co-loaded regression vs baseline. 20% sample on PR, full run weekly (SKE-12).
Verify: green on 3 hand-written case sets (plan-review-loop, development-workflow, hfs-client-engagement); baseline triple present in output.

**SKE-05 · skill-reviewer v2 - two scales** 🔨
Install to runtime. Rubric per D6 + "Measured behaviour" (20 pts: precision >=0.9, recall >=0.9, pass^3 >=0.8, no co-loaded regression). Per Q5: a skill **with** evals reports a **Measured score `x/100`**; a skill **without** evals reports an **Unmeasured score `x/80 - UNMEASURED (no evals)`** - a visibly different scale, a work queue entry, never a quality verdict. Any >=90 gate may only reference the /100 scale. Run against **every canonical devkit skill post-disposition** (43, or 44 if SKE-02 promoted `claude-design-prompts` - panel WARN T-02: the scope follows the disposition, so full org-authored coverage is reportable either way); commit artifacts to `devkit/reviews/`.
Verify: one artifact per canonical skill - expected day-one truth: **3 measured, the rest UNMEASURED awaiting evals**; reviewer itself records a telemetry load.

**SKE-06 · hfs-skill-creator v2.1** 🔨
Port `writing-for-agents` ideas: description-as-trigger (<=200 chars model-invoked, <=300 user-invoked), context-load vs cognitive-load budgeting, information hierarchy, checkable completion criteria, optional `invocation:` + `upstream:` frontmatter keys. Mandatory `references/` split >200 lines, mandatory `evals/`. Verify: throwaway skill -> SKILL.md <=150 lines + evals + Measured score >=90.

**SKE-06b · SESSION_FORMAT v1.12** ⚡ *(new - D11; sole owner of the spec bump)*
Create `SESSION_FORMAT_v1.12_XML.md` honoring v1.11's pending-split note: `<task size_tokens blocked_by>`, `<execution isolation="worktree|none">`, section-sign forbidden pattern, effort-enum normalization (`max` -> `xhigh` formalized from the v1.12 inline note). Strict superset; v1.10/v1.11 sessions parse unchanged. SKE-08, SKE-09, and R5 consume this file and do not edit it. **Rollback (panel I-03): additive-only by construction - rolling back = sessions keep declaring v1.10/v1.11, which the parser retains; no emitted document becomes unparseable, and the v1.12 file can be reverted in one commit with zero consumers stranded (consumers land in later sessions by design).** Verify: parser round-trips a v1.12 fixture; a v1.10 session still parses.

*True edges: `SKE-04 -> SKE-05` (measured category consumes the harness), `SKE-05 -> SKE-06` (creator's gate cites the reviewer). SKE-06b is dependency-free within the wave but blocks all of Wave 3.*

### Wave 3 - Enrich + author (D8) - parallel x4, native worktree isolation from session one

Per Q10: isolation is the harness's native `isolation: worktree` (mechanism exists today - SKE-09's *skill* documents the practice, nothing waits on it). Each session's PROMPTS entry carries a **File-ownership list**; lists are disjoint by construction, so the merge is trivial by design. Shared files each have exactly one owner.

**SKE-07 · Enrich tdd + code-review + diagnosing-bugs** 🔨
Wrapper skills `hfs-tdd`, `hfs-code-review` in devkit: load `agents:tdd` / `agents:code-review` **by qualified reference**, carry Upstream pins (`57e1bee8` / `9df6fdac`), add CONSTITUTION + forbidden checks, three-layer seam rule, Quart/pytest-asyncio + vitest recipes. Two-axis review (Standards vs Spec) rides **the vendored skill's own parallel-subagent mechanism** - `agents:code-review` already runs both axes as parallel sub-agents per its description; the wrapper adds the HFS checklists to each axis. **No Bishop: panel CRIT I-01 verified the service does not exist anywhere in the estate (0 hits) - it was an invention of the original draft. No new MCP server is built in this plan.** `debugging-workflow` gains diagnosing-bugs phase gates + verbatim failing-then-passing output. Evals for all three.
Owns: `skills/hfs-tdd/`, `skills/hfs-code-review/`, `skills/debugging-workflow/`. Verify: one real diff reviewed two-axis via the wrapper; RET ingests findings as Encoding commits.

**SKE-08 · tracer-tickets** 🏗️
PLAN.md -> vertical slices, each <=60k working-set tokens (OQ-02), `blocked_by` edges, expand->migrate->contract template. Emits **v1.12** tasks + DAG frontier; implementation-plan-generator calls it.
Owns: `skills/tracer-tickets/`, `skills/implementation-plan-generator/` (edit). Verify: regenerate one past PROMPTS doc; diff slice count / parallelism.

**SKE-09 · worktree-isolation** 🔨
Decision `decisions/SKE-09.md` (OQ-03, default native). Skill documents: worktree per agent, coordination via Mem0/Linear never shared TASKS.md, merge in DAG order, stale-worktree cleanup as a Samson task (**no Sentinel - panel WARN I-02: the service does not exist; 0 hits estate-wide**), **File-ownership list discipline** (this wave is the first consumer). References v1.12's `<execution isolation>` - consumes, does not edit.
Owns: `skills/worktree-isolation/`, `decisions/SKE-09.md`. Verify: 3-agent fan-out, zero merge conflicts on a throwaway repo.

**SKE-10 · blast-radius + interrogate** ⚡
`blast-radius`: callers, migrations, contracts via `/jacob:contract`; required before >3-file or schema changes; Jacob MCP tool. `interrogate`: adversarial one-question-at-a-time pass as iteration 0 of plan-review-loop (this grilling was its dry run), answers become ADR stubs.
Owns: `skills/blast-radius/`, `skills/interrogate/`, `skills/plan-review-loop/` (edit). Verify: both reachable, both with evals.

### Wave 4 - Disclosure + platform

**SKE-R5 · Section-sign ban** ⚡
CONSTITUTION, **v1.12** `<forbidden>` (consumes SKE-06b's file), skill-creator/reviewer forbidden lists, RET `known_patterns.py` entry `section-sign-usage` (regex `\u00A7`), pre-commit hooks, estate-wide sweep (incl. `ske/SKE_DISCOVERY.md`). Verify: sweep empty; hook blocks a test commit.

**SKE-11 · Disclosure refactor, devkit worst 6** 🏗️
Split worst monolithic devkit skills to SKILL.md <=150 + `references/`; trim 17 descriptions >400 chars to <=300. Gate: eval harness shows no trigger regression **vs the asserted Eval baseline** (Q6 - the triple, not the bare inventory sha). Verify: re-run inventory; devkit avg desc <=300; baseline comparison attributes any movement.

**SKE-12 · Cadence eval ritual + alerting** 🔨
Weekly full eval run -> Samson persists to `cadence_state`; alerting via **Samson's existing ingestion poller reading `cadence_state`** (the BE-08 mechanism - no new service; panel WARN I-02) on precision/recall drop >5 pts (attributable via the baseline triple) or any org-authored skill falling out of `coverage`. RET encoding proposals must carry an eval-case delta - **checkable per Encoding commit** (D14). *Coordinate with LHV-04's `friday-eval` hybrid-trigger recommendation - don't double-book the Friday slot.* Verify: one scheduled run recorded; one synthetic threshold breach produces an alert through the poller.

**SKE-13 · CONSTITUTION progressive split (conditional)** 🔨
Only if SKE-11 baseline stable. Verify: RET principle-violation rate unchanged over 2 weeks.

**SKE-14 · HFS Agentic Workflow v2.1 + SKE retrospective** ⚡
Document v1.12, tracer stage, tdd/review gates, eval gate, ownership taxonomy (org-authored/vendored, ADR-0002), single-root model. **Evaluate the Success claim if its date has arrived; otherwise record the evaluation date and the standing instruction** (section 7). Re-run `skills_usage.py` after Mem0 quota resets (2026-09-01); update ACTIVE/DORMANT.

### DAG (true edges only - waves order scheduling, edges claim data flow)

```
Wave 0: SKE-00d ; R1 ; R2 ; R3 → R4 ; R6                (only R3→R4 is an edge)
Wave 1: R7 → SKE-02 ; SKE-01 → SKE-02 ; SKE-03           (R7 task 6 = Lionel)
Wave 2: SKE-04 → SKE-05 → SKE-06 ; SKE-06b
Wave 3: SKE-06b → {SKE-07, SKE-08, SKE-09, SKE-10}       (parallel x4, native worktrees, ownership lists)
Wave 4: {07..10} → SKE-R5 ; SKE-04 → SKE-11 ; SKE-11 → SKE-12 → SKE-13(cond) → SKE-14
```

**24 sessions** (23 scheduled + SKE-00 done; SKE-06b added in v2.2). Peak parallelism 4. Estimate ~20-24 h. Wave 0 is ~2h and removes active corruption risk - do it this week.

---

## 4. Deferred (not scheduled)

| Item | Trigger |
|---|---|
| Usage-ranked pruning of the dormant org-authored skills | **The Success claim failing at its evaluation date** (section 7) - or >=60 days of telemetry showing no movement, whichever first |
| Vendored-set pruning / re-install policy | First observed upstream drift in `upstream_drift` |
| pstack `/architect`, multi-model panels | Cost/quality pilot on one wave |
| `codebase-design` deepening survey as Cadence ritual | Jacob health ritual live |
| Sentry plugin skill churn (1.2.0 vs 1.3.0 both cached) | Next plugin audit |

---

## 5. Risks

| Risk | Mitigation |
|---|---|
| ~~RET already corrupted a devkit file~~ | **Discharged 2026-08-20** (0 hits); grep re-run at R1 start |
| Removing XML parser breaks a consumer | R4 greps all callers of `constraints`/`forbidden` keys in solomon + hfs-aiops first; `CODE_BLOCK_PATTERN` out of scope (D2) |
| R4 regresses `get_pattern` | Regression floor >= 38 asserted in R4 tests |
| R1/R4 format skew | The shared round-trip test **is** the contract (Q8) - both sessions validate against one fixture, either landing order safe |
| Vendored skill invisible despite search ("searchable but unseen") | Pointer line names the 4 highest-value vendored skills; SKE-03 telemetry shows whether vendored loads occur - revisit pointer wording if flat after 30 days |
| Encoding commit on a dirty tree | Refused by design (D14); surfaced to the operator instead |
| Eval cost on Max plan | 20% sample on PR; full weekly |
| Namespace repair stalls on Lionel | Only R7 task 6 (a `cp`) is manual; canonical work automatable; blocked state visible in PROGRESS |
| Disclosure split drops a trigger | SKE-11 gated on the asserted Eval baseline |
| Telemetry hook degrades sessions | Four-rule contract (D15); simulated-failure test in SKE-03's gates |
| `mark_complete` unusable estate-wide | SKE-00d registers `solomon-workspace`; FS fallback until then |

---

## 6. Open questions (`decisions/SKE-OQ-{NN}.md`; defaults stand)

1. OQ-01 Eval runner: headless `-p` (default) vs API.
2. OQ-02 Tracer ticket budget: 60k tokens.
3. OQ-03 Isolation: native worktree (default; mechanism confirmed live 2026-08-20) vs T3 Code.
4. ~~OQ-04~~ **Closed (Q1/ADR-0002):** `~/.agents/skills` = read-only second root; never vendored into devkit.
5. OQ-05 DAG store: SESSION-only (default) vs Linear mirror via Samson.
6. OQ-06 solomon-docs `SESSION_HISTORY.md` backlog (675+ uncommitted lines) - commit before SKE-00d or after? Default: Lionel commits before.
7. ~~OQ-07~~ **Closed (Q2):** index = org-authored + pointer line, gate <=1,200; search reaches both roots.

---

## 7. Success claim (D16)

> **Within 60 days of Wave 1 completing, at least 11 of the 22 currently-DORMANT org-authored skills record >=1 load via any path** (SKE-03 telemetry), **while measured precision/recall on the eval'd set holds >=0.9.**

Baseline (2026-08-20, 57-day window): org-authored = 44 -> 11 ACTIVE, 11 RARE, 22 DORMANT. Recorded in SKE_PROGRESS at Wave 1 completion with the concrete evaluation date.

- **Holds** -> the reachability thesis stood; Waves 2-4 investment justified; SKE-14 records it with the number.
- **Fails** -> SKE-14 must record *"reachability was not the constraint"*, and the Deferred pruning trigger fires - the redirection is named in advance, not improvised.

The precision/recall guard exists so adoption cannot be bought by degraded triggering (e.g. category commands blast-loading everything).

---

**Next:** plan-review-panel (trigger-class per CLAUDE.md: 24 sessions, touches RET + production config + parser). The panel's **delta mode** fits: this grilling's 12 decisions + the v2.1 verification findings are the "prior findings" input. Then SKE_PROMPTS_v2.md in **v1.10 XML** (v1.12 does not exist until SKE-06b - the PROMPTS for SKE-06b itself are necessarily v1.10), Wave 0 first.
