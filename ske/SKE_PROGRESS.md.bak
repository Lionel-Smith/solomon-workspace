# SKE_PROGRESS.md — Solomon Skills Evolution

**Plan:** `ske/SKE_PLAN_v2.md` (v2.4, panel-converged 2026-08-20)
**Prompts:** `ske/SKE_PROMPTS_v2.md`
**Branch:** master (trunk-based per standing preference)
**Started:** — (substrate emitted 2026-08-20; launch is user-owned)

**Discovery note (not a session row):** SKE-00, the skills ground-truth discovery, is ✅ DONE at commit `ea2e43c` (2026-08-20) — report at `ske/SKE_DISCOVERY.md`. It is deliberately excluded from the table below so the governor's catalog comparison sees exactly the 23 scheduled ids (panel S-01: SKE-00 vs SKE-00d confusion).

**Success claim (D16, plan section 7):** within 60 days of Wave 1 completing, ≥11 of the 22 currently-DORMANT org-authored skills record ≥1 load via any telemetry path, while measured precision/recall on the eval'd set holds ≥0.9. Baseline (2026-08-20): org-authored 44 = 11 ACTIVE / 11 RARE / 22 DORMANT. **Evaluation date = the day SKE-03 completes + 60 days — fill in at Wave 1 completion.** Holds → thesis stood, Waves 2–4 justified. Fails → SKE-14 records "reachability was not the constraint" and the dormant-pruning trigger fires.

## Wave / Session Status

| Session | Wave | Title | Status |
|---|---|---|---|
| SKE-00d | 0 | Scaffolding verification + project registration | ✅ Complete |
| SKE-R-01 | 0 | RET fail-closed + Encoding commits (P0) | ✅ Complete |
| SKE-R-02 | 0 | hfs-client-engagement frontmatter + validity guard | ✅ Complete |
| SKE-R-03 | 0 | Skills server: roots, index, resolution | ✅ Complete |
| SKE-R-04 | 0 | Parser: corpus-as-spec contract | ✅ Complete |
| SKE-R-06 | 0 | Path drift | ✅ Complete |
| SKE-R-07 | 1 | Command promotion + MCP namespace repair (task 6 = Lionel) | ✅ Complete |
| SKE-01 | 1 | Slash wrappers + inventory gates | ✅ Complete |
| SKE-02 | 1 | Skill reachability sweep + runtime-local disposition | ✅ Complete |
| SKE-03 | 1 | Skill-load telemetry (Telemetry contract) | ✅ Complete |
| SKE-04 | 2 | Eval harness with asserted environment | ✅ Complete |
| SKE-05 | 2 | skill-reviewer v2 — two scales | ✅ Complete |
| SKE-06 | 2 | hfs-skill-creator v2.1 | ✅ Complete |
| SKE-06b | 2 | SESSION_FORMAT v1.12 | ✅ Complete |
| SKE-07 | 3 | Enrich tdd + code-review + diagnosing-bugs | ✅ Complete |
| SKE-08 | 3 | tracer-tickets | ✅ Complete |
| SKE-09 | 3 | worktree-isolation | ✅ Complete |
| SKE-10 | 3 | blast-radius + interrogate | ✅ Complete |
| SKE-R-05 | 4 | Section-sign ban | ⬜ Pending |
| SKE-11 | 4 | Disclosure refactor, devkit worst 6 | ✅ Complete |
| SKE-12 | 4 | Cadence eval ritual + alerting | ✅ Complete |
| SKE-13 | 4 | CONSTITUTION progressive split (conditional) | ✅ Complete |
| SKE-14 | 4 | HFS Agentic Workflow v2.1 + SKE retrospective | ✅ Complete |

## Preconditions (tracked)

- ✅ Plan panel-converged (delta iteration 2, 0 CONFIRMED CRIT — `ske/SKE_PLAN_v2_review_v2.md`).
- ✅ RET corruption sweep clean as of 2026-08-20 (0 hits) — SKE-R-01 re-verifies at start.
- ✅ Measured-cost loop path live (LHV 4/4 complete 2026-08-20) — this chain runs on `session_cost.py` deltas from its first boundary.
- ⚠️ SKE-R-07 contains a user-executed runtime `cp` (task 6) — expect a chain STOP at its `copies_identical` gate; resume after the cp (LHV-03 precedent).
- ⚠️ `mark_complete` returns PROJECT_NOT_FOUND until SKE-00d registers the project — earlier sessions in the same chain use the filesystem fallback.

## Session Log

(append after each session completes)

- **SKE-00d** (2026-08-21): project registered at ~/.solomon/projects/solomon-workspace/config.json (payroll-converter field shape); PROGRESS round-trips ProgressParser (23 rows, SKE-00 absent). Gate note: progress_parses command in PROMPTS calls nonexistent ProgressParser.parse() — real API is async parse_file; intent validated.
- **SKE-R-01** (2026-08-21, solomon `cb17f3c`): 6/6 gates pass; 11 new tests + 6 legacy tests updated off the old XML/sibling-.bak contract; corruption sweep 0 hits pre+post; dry-run of 3 known_patterns entries clean. Pre-existing jacob/visual test failures (64) confirmed unrelated via stash-check.
- **SKE-R-02** (2026-08-21, devkit `8078e02` + workspace `5880f21`): scalar quoted (single-line diff), yaml parses, guard exit-1 fail-path exercised; skill became live-discoverable mid-session (harness surfaced it). Inventory JSON regeneration reverted — SKE-11 owns that baseline.
- **SKE-R-03** (2026-08-21, solomon `4841629` + devkit `55f8e5d`): 4/4 gates; health 82 (43+39) live; index 43 entries + pointer at ~1,139 tok (under 1,200 budget); 60 tests (7 new two-root/collision); _meta relocation done; hermetic AGENTS_ROOT patching in tests.
- **SKE-R-04** (2026-08-21, solomon `80c2aaf` + devkit `165434e`): 5/5 gates; corpus yield 15/11 (vs 3/2 XML), pattern floor 38 held, index 1,139 tok; fullstack-integration was the 1-file outlier (## Constraints wrapping v1.7 XML) — converted to corpus format rather than adding a parser dialect; regex deletion landed as single revertable commit; consumer sweep clean (solomon + hfs-aiops).
- **SKE-R-06** (2026-08-21, workspace `aba82fb`): 3/3 gates; 43 lionelj entries purged (discovery's 6 was an undercount) + phantom SKILLS_DIR; backup at ~/.claude/backups/settings.local.json.20260821-144953; symlinks $HOME-based (relative form dangles from arbitrary clone dirs — the fresh_clone gate decided).
- **SKE-01** (2026-08-21, devkit `701fb7c` + workspace `6a652fe`): 3/3 gates + floor fail-path; coverage 43/43 (population correct pre-SKE-02), collisions [], drift [] (pins land in SKE-07); reachability fields merged into existing coverage dict (key collision found live); commands use live plugin namespace, runtime sync deferred to D13 user step.
- **SKE-03** (2026-08-21, solomon `4c3b0d0` + devkit `2c1dedf`): 4/4 gates + 8 tests; hook measured ~13ms wall (bash spawn floor; sed-only parsing); exploding-counter test proves telemetry failure never fails the tool; USER WIRING PENDING (D13): PostToolUse entry for Skill + Read → claude-config/hooks/skill-telemetry.sh in runtime settings.
- **SKE-R-07** (2026-08-21, devkit `c696378`+`c15bd37`, solomon `904732d`): 3/3 gates — copies_identical went MACHINE-checkable: discovery drift found, the 4 'runtime-only' files are symlinks → solomon/commands/ (plugin repo), so the live fix landed as repo edits and the planned user cp is a NO-OP (would sever symlinks — decision doc ske/decisions/SKE-R-07.md). 5 declared + 4 same-class dead refs repaired; 0 dead namespaces remain in command surfaces.
- **SKE-02** (2026-08-21, devkit `71bb3e6`+`78ca6d9`, workspace `2ac9804`): 3/3 gates (registry_resolves as-written over-matches prose fragments — intent validated on enumeration lines: 27 refs, 0 phantoms); claude-design-prompts PROMOTED (Portability: 0 user refs, YOUNG) + runtime symlinked w/ backup; 7 commands wired; 7 skills symlinked to runtime (all live-surfaced); 39/39 vendored findable by search; floor now 44; server sees 83.
- **SKE-04** (2026-08-21): 2/2 gates; headless haiku runner live (12 cases ~2min); FIRST MEASURED BASELINE P=1.0 R=1.0 (variance to ~0.86 across runs — metrics recorded, not gated), index_hash 4563d142; static proxy P/R 0.43 (documented as crude PR-sample only); prl-04 negative corrected (was a real debugging-workflow trigger).
- **SKE-05** (2026-08-21): 4/4 gates; 44 artifacts (3 Measured w/ baseline triple, 41 UNMEASURED); reviewer's FIRST run ever; pass^3/co-loaded withheld PENDING weekly ritual; sweep is mechanical/deterministic (skill_review_run.py); plan-review-loop scored 70/100 — its own sections don't parse corpus-as-spec (work-queue signal, feeds SKE-11).
- **SKE-06** (2026-08-21): 2/2 gates; throwaway csv-schema-probe built per v2.1, scored 90/100 Measured (the max while pass^3/co-loaded are PENDING), deleted after gate reading; no upstream idioms found to strip.
- **SKE-06b** (2026-08-21, solomon + devkit): 3/3 gates; v1.12 delta spec + additive parser extraction (4 new tests, 79 legacy green); PARSER FACT for consumers: session `version` attr is never read — the block regex needs id/project adjacent, an attr between them breaks matching (spec documents this); shim removal deferred (superset rule).
- **SKE-07** (2026-08-21, devkit `d0410bc`+`5f7274d`, solomon `92b5766`, ws `d11fca2`): 4/4 gates; pins both `match` in upstream_drift (SKE-01 field lit end-to-end); LIVE two-axis run on e10e83f: Standards caught a real import-in-loop defect in my own commit → fixed → RET Encoding commit `5f7274d` (full SKE-R-01 contract exercised in production); Spec axis clean; org-authored now 46.
- **SKE-08** (2026-08-21, devkit `7fae929`, ws `148ae9f`): 3/3 gates; calibration vs LHV: identical 4-slice/2-wave/3-wide shape (working sets all <60k so no splits fire), tracer drops 1 non-dataflow edge and sizes 4/4 tasks — method adds signal without distorting well-sized plans.
- **SKE-09** (2026-08-21): 3/3 gates; fanout_test.sh: 3 parallel worktrees, disjoint ownership, DAG-order merges, 0 conflicts, porcelain clean; OQ-03 DECIDED native (revisit triggers recorded).
- **SKE-10** (2026-08-21, devkit): 3/3 gates; both skills runtime-linked; plan-review-loop (already symlinked since Jul 18) carries iteration-0 wiring live; jacob_contract reused, zero new MCP surface. Wave 3 COMPLETE.
- **SKE-11** (2026-08-21, devkit `fb87495`, ws `f08a2bf`): 3/3 gates; worst-6 split (all <=150 + references/), 18 descs trimmed (avg 381->270), index 5,948 tok; EVAL GATE EARNED ITS KEEP: dw-02 recall regression caught (2-of-3 miss), root-caused to index-competition shift on an ambiguous prompt — fixed by description disambiguation (dev-workflow vs project-bootstrap territory), 3/3 PASS post-fix; hfs-client-engagement consumer clause relocated to body.
- **SKE-12** (2026-08-21, solomon `548c57b`, ws): 4/4 gates; existence check FAILED as memory predicted (samson SERVFAIL, no endpoint) → local jsonl + Slack path, Samson leg dated-pending in routine doc; Sat 09:00 slot (no friday-eval collision); RET Encoding commits now carry regression eval cases (D14 amended); first run P=1.0 R=1.0 coverage 50/50; synthetic breach alert fired end-to-end. USER STEP: create the weekly-skill-eval Routine in the Anthropic UI from routines/weekly-skill-eval.md and add its rt_* id to .created.yml.
- **SKE-13** (2026-08-21, devkit): condition MET (quantified: >=1 post-SKE-11 run, zero >5pt drops) → SPLIT LANDED: core 14 lines + 5 modules + path-mapped loader hook (tested live, exit-0 envelope); violation_rate gate = 2-week observation window OPEN from 2026-08-21, check ~2026-09-04 via RET entries; USER STEP: wire constitution-loader.sh as PreToolUse Edit|Write hook.
- **SKE-14** (2026-08-21): 3/3 gates; workflow v2.1 shipped; retro encoded 2 lessons into hfs-skill-creator (`28a7628`, `30342cf` — zero-sum triggers, skill-free negatives) AND caught a live RET defect (post-commit rollback on mark_encoded failure — fixed in solomon). **Success claim: DATED PENDING — Wave 1 completed 2026-08-21, evaluation date = 2026-10-20; standing instruction: run skills_usage.py + telemetry tally, claim holds if >=11 of the 22 baseline-DORMANT org-authored skills recorded >=1 load AND eval P/R >=0.9.** Mem0 usage re-run: DATED PENDING until after 2026-09-01 quota reset.
