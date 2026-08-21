# SKE - Solomon Skills Evolution: Implementation Prompts

**Plan:** `ske/SKE_PLAN_v2.md` (v2.4, panel-converged 2026-08-20 - 0 CONFIRMED CRIT at delta iteration 2)
**Discovery:** `ske/SKE_DISCOVERY.md` (commit ea2e43c)
**Progress:** `ske/SKE_PROGRESS.md` (emitted with this file; SKE-00d verifies it)
**Sessions:** 23 across 5 waves (SKE-00 discovery is DONE at ea2e43c and appears only as a prose note in PROGRESS - never a table row). Sequential within wave via `/session:auto`; `<requires>` edges are true data-flow claims only (plan Q7) - waves order the pick, edges gate it.
**Format:** SESSION_FORMAT v1.10 XML (v1.12 does not exist until SKE-06b creates it; the PROMPTS for SKE-06b itself are necessarily v1.10).

**Execution notes:**
- Model: `claude-fable-5` throughout (workspace default; LHV chain precedent 2026-08-20). Effort per size: light=low, quick=medium, standard/heavy=high.
- Wave 3 sessions run under native `isolation: worktree` with disjoint file-ownership lists (plan Q10). No session edits another's owned paths.
- SKE-R-07 contains a user-executed step (runtime `cp`) - expect the chain to STOP at its `copies_identical` gate and hand over, exactly like LHV-03 (2026-08-20).
- The dogfood benchmark: this chain runs on the measured-cost path (LHV-03's `session_cost.py` wiring) from its first boundary.

---

## Wave 0 - Scaffolding + P0 safety (~2h)

```xml
<session id="SKE-00d" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>15 minutes</estimated_time>
    <effort>low</effort>
    <wave>0</wave>
  </metadata>

  <dependencies/>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-00d. The plan (v2.4) and the ske/SKE_PROGRESS.md skeleton are already
    emitted; this session verifies them and completes scaffolding. Discovery finding: only
    "LJP Invoicing" and "payroll-converter" exist under ~/.solomon/projects/, so mark_complete
    returns PROJECT_NOT_FOUND for every HFS session (hit live 2026-08-20).
  </context>

  <constraints>
    <constraint priority="critical">SKE-00 (done discovery, ea2e43c) must remain a prose note in PROGRESS, never a table row - the governor's catalog comparison sees exactly 23 ids (plan S-01).</constraint>
    <constraint priority="high">Mirror an existing registered project's config.json shape when registering; do not invent fields.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="CREATE">
      <title>Register solomon-workspace in ~/.solomon/projects/solomon-workspace/config.json, mirroring the field shape of an existing registered project (read ~/.solomon/projects/payroll-converter/config.json first)</title>
    </task>
    <task id="2" action="VERIFY">
      <title>Confirm ske/SKE_PROGRESS.md round-trips the real ProgressParser (23 rows, exact-token "Pending" statuses) and records the Success claim + evaluation-date formula (Wave 1 completion + 60 days)</title>
    </task>
  </tasks>

  <verification>
    <check name="project_registered" gate_class="machine" command="ls ~/.solomon/projects/solomon-workspace/config.json">present</check>
    <check name="mark_complete_resolves" gate_class="fuzzy" command="mcp mark_complete dry-run">no PROJECT_NOT_FOUND</check>
    <check name="progress_parses" gate_class="machine" command="cd solomon &amp;&amp; .venv/bin/python -c &quot;from solomon_mcp.utils.progress_parser import ProgressParser; r=ProgressParser().parse(open('../ske/SKE_PROGRESS.md').read()); assert len(r.sessions)==23, len(r.sessions)&quot;">exit 0</check>
    <check name="success_claim_recorded" gate_class="machine" command="grep -c 'Success claim' ske/SKE_PROGRESS.md">>= 1</check>
  </verification>

  <commit>
    <type>chore</type>
    <scope>ske</scope>
    <description>register solomon-workspace project + verify SKE progress substrate (SKE-00d)</description>
  </commit>
</session>
```

```xml
<session id="SKE-R-01" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace/solomon</working_directory>
    <estimated_time>75 minutes</estimated_time>
    <effort>high</effort>
    <wave>0</wave>
  </metadata>

  <dependencies/>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-R-01 (P0) + D2/D14. RET's _insert_into_section appends orphan XML when a
    target section is absent (38/43 skills lack one) and _find_skill_path resolves relative to
    cwd - through the runtime symlink that lands in canonical devkit. apply_encoding
    (service.py:490) writes with no git integration, so provenance evaporates and mark_encoded
    (write-time) can diverge from disk after a checkout. Corruption sweep 2026-08-20: 0 hits -
    this session is preventive. The Skill-section format is corpus-as-spec (CONTEXT.md):
    constraints = "## Constraints" with "### Critical|High Priority|Medium Priority" bullets;
    forbidden = "## Forbidden Patterns" table rows "| pattern | reason |".
  </context>

  <constraints>
    <constraint priority="critical">Re-run the corruption sweep at session start: grep -rn "Added by retrospective" ../hfs-development-kit/skills/ must return 0 hits; if nonzero, STOP and surface.</constraint>
    <constraint priority="critical">Never append on a missing section - raise SkillSectionMissingError. Never emit XML. Refuse on a dirty target path.</constraint>
    <constraint priority="critical">mark_encoded fires only after the Encoding commit succeeds (D14). Commit message: ret(&lt;skill&gt;): &lt;entry title&gt; [entry_id].</constraint>
    <constraint priority="high">Backup path moves outside the skills tree (SEC-01 rhyme: committed .bak files were that incident).</constraint>
    <constraint priority="high">The round-trip fixture at tests/fixtures/skill_sections/ is shared with SKE-R-04 - create it here if absent; do not change its format contract unilaterally.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="EDIT" file="solomon_mcp/retrospectives/service.py">
      <title>_insert_into_section: SkillSectionMissingError on absent section; emission per corpus-as-spec (SKILL_FORBIDDEN -> table row appended to existing "## Forbidden Patterns", create table-form section only when genuinely absent; SKILL_CONSTRAINT -> bullet under matching priority subhead)</title>
    </task>
    <task id="2" action="EDIT" file="solomon_mcp/retrospectives/service.py">
      <title>_find_skill_path resolves against configured SKILLS_DIR, never cwd; backup path relocated outside the skills tree</title>
    </task>
    <task id="3" action="EDIT" file="solomon_mcp/retrospectives/service.py">
      <title>apply_encoding lands an Encoding commit (single file, entry_id in message), refuses on dirty target, mark_encoded only after commit succeeds</title>
    </task>
    <task id="4" action="CREATE" file="tests/test_ret_encoding.py">
      <title>Fixtures from 3 real devkit skills (with table / without / XML-legacy): no write on missing section, no XML emitted, dirty-target refusal, round-trip (emit then parse back with priority intact - shared fixture with SKE-R-04)</title>
    </task>
    <task id="5" action="RUN">
      <title>Dry-run the three known_patterns.py entries against devkit; assert zero file mutations</title>
    </task>
  </tasks>

  <verification>
    <check name="tests_pass" gate_class="machine" command=".venv/bin/python -m pytest tests/test_ret_encoding.py -q">exit 0</check>
    <check name="no_xml_emission" gate_class="machine" command="grep -n '&lt;pattern reason=' solomon_mcp/retrospectives/service.py">absent from emission paths (generation code removed)</check>
    <check name="corruption_sweep" gate_class="machine" command="grep -rn 'Added by retrospective' ../hfs-development-kit/skills/ | wc -l">0</check>
    <check name="commit_wiring" gate_class="machine" command="grep -n 'mark_encoded' solomon_mcp/retrospectives/service.py">after commit success only</check>
    <check name="dry_run_clean" gate_class="machine" command="git -C ../hfs-development-kit status --porcelain -- skills/ | wc -l">0</check>
    <check name="backup_outside_tree" gate_class="machine" command=".venv/bin/python -m pytest tests/test_ret_encoding.py -q -k backup_outside &amp;&amp; ! grep -rn 'skills.*\.bak\|\.bak.*skills' solomon_mcp/retrospectives/service.py | grep -v test">backup path resolves outside the skills tree; test asserts no .bak lands under skills/ during apply (panel v2 WARN I-02; SEC-01 rhyme)</check>
  </verification>

  <commit>
    <type>fix</type>
    <scope>ret</scope>
    <description>fail-closed section insertion + corpus-format emission + Encoding commits (SKE-R-01)</description>
  </commit>
</session>
```

```xml
<session id="SKE-R-02" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>15 minutes</estimated_time>
    <effort>low</effort>
    <wave>0</wave>
  </metadata>

  <dependencies/>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-R-02. hfs-client-engagement/SKILL.md line 3 contains an unquoted
    ": " inside a plain scalar ("consumers: IAMS/NSA"), so yaml.safe_load raises and the
    skills server serves the skill as name="SKILL" - unfindable by search_skills. Discovery
    proved this is the only invalid frontmatter in the corpus (1/43).
  </context>

  <constraints>
    <constraint priority="critical">Quote the scalar only - no other content change to the skill (canonical devkit file).</constraint>
  </constraints>

  <tasks>
    <task id="1" action="EDIT" file="hfs-development-kit/skills/hfs-client-engagement/SKILL.md">
      <title>Quote the description scalar so it parses (wrap the full description value; verify with yaml.safe_load)</title>
    </task>
    <task id="2" action="EDIT" file="ske/scripts/skills_inventory.py">
      <title>Exit non-zero when any frontmatter_yaml_valid is false (validity guard for future regressions)</title>
    </task>
  </tasks>

  <verification>
    <check name="yaml_valid" gate_class="machine" command="solomon/.venv/bin/python -c &quot;import yaml,re; t=open('hfs-development-kit/skills/hfs-client-engagement/SKILL.md').read(); m=re.match(r'^---\n(.*?)\n---', t, re.S); d=yaml.safe_load(m.group(1)); assert d['name']=='hfs-client-engagement'&quot;">exit 0</check>
    <check name="inventory_guard" gate_class="machine" command="solomon/.venv/bin/python ske/scripts/skills_inventory.py >/dev/null &amp;&amp; echo ok">exit 0 (0 invalid)</check>
    <check name="searchable" gate_class="fuzzy" command="search_skills('client') via MCP">returns hfs-client-engagement</check>
  </verification>

  <commit>
    <type>fix</type>
    <scope>skills</scope>
    <description>quote hfs-client-engagement frontmatter scalar + inventory validity guard (SKE-R-02)</description>
  </commit>
</session>
```

```xml
<session id="SKE-R-03" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>30 minutes</estimated_time>
    <effort>medium</effort>
    <wave>0</wave>
  </metadata>

  <dependencies/>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-R-03 + D3. list_skills_impl's startswith("SKILL_") glob serves
    SKILL_FORMAT_v1.7.md and SKILL_TEMPLATE_v1.9.md as skills (45 vs 43). SKILLS_DIR defaults
    to the phantom ~/.hfs/skills. Per D3: two roots (devkit + ~/.agents read-only), index
    lists org-authored + one pointer line, bare names resolve only while unique, collisions
    return AMBIGUOUS_SKILL with qualified names (devkit:x / agents:x).
  </context>

  <constraints>
    <constraint priority="critical">Index lists 43 org-authored pre-disposition + pointer naming tdd, code-review, diagnosing-bugs, codebase-design; never enumerates vendored entries (ADR-0002).</constraint>
    <constraint priority="critical">Collision resolution is never by root order - refuse loudly (plan Q4).</constraint>
    <constraint priority="high">SKILL_FORMAT relocates to skills/_meta/ and becomes the D2 spec's home - update any references.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="EDIT" file="solomon/solomon_mcp/skills_server.py">
      <title>Glob restricted to */SKILL.md; SKILLS_DIR default removed (fail loudly if unset); SKILLS_ROOTS = [devkit, ~/.agents/skills read-only]</title>
    </task>
    <task id="2" action="RUN">
      <title>git mv hfs-development-kit/skills/SKILL_FORMAT_v1.7.md and SKILL_TEMPLATE_v1.9.md to hfs-development-kit/skills/_meta/</title>
    </task>
    <task id="3" action="EDIT" file="solomon/solomon_mcp/skills_server.py">
      <title>format_skills_index: org-authored entries + one pointer line; load/search traverse both roots; AMBIGUOUS_SKILL on bare-name collision; devkit:/agents: qualified resolution</title>
    </task>
    <task id="4" action="EDIT" file="solomon/tests/test_skills_server.py">
      <title>Update root/index tests; add collision fixture test (synthetic same-name skill in both roots -> AMBIGUOUS_SKILL); health reports per-root counts</title>
    </task>
  </tasks>

  <verification>
    <check name="tests_pass" gate_class="machine" command="cd solomon &amp;&amp; .venv/bin/python -m pytest tests/test_skills_server.py -q">exit 0</check>
    <check name="health_82" gate_class="machine" command="cd solomon &amp;&amp; SKILLS_DIR=../hfs-development-kit/skills .venv/bin/python -c &quot;import asyncio; from solomon_mcp.skills_server import health_impl; print(asyncio.run(health_impl()))&quot;">skills_count 82 (43+39)</check>
    <check name="index_no_template" gate_class="machine" command="cd solomon &amp;&amp; SKILLS_DIR=../hfs-development-kit/skills .venv/bin/python -c &quot;import asyncio; from solomon_mcp.skills_server import skills_index_resource; i=asyncio.run(skills_index_resource()); assert 'skill-name-here' not in i and 'FORMAT_v1.7' not in i&quot;">exit 0</check>
    <check name="pointer_line" gate_class="machine" command="cd solomon &amp;&amp; SKILLS_DIR=../hfs-development-kit/skills .venv/bin/python -c &quot;import asyncio; from solomon_mcp.skills_server import skills_index_resource; i=asyncio.run(skills_index_resource()); assert 'search_skills' in i&quot;">exit 0</check>
  </verification>

  <commit>
    <type>fix</type>
    <scope>skills-server</scope>
    <description>two-root SKILLS_ROOTS, org-authored index + pointer, loud collisions, no phantom default (SKE-R-03)</description>
  </commit>
</session>
```

```xml
<session id="SKE-R-04" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace/solomon</working_directory>
    <estimated_time>75 minutes</estimated_time>
    <effort>high</effort>
    <wave>0</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-R-03</requires>
    <requires status="pending">SKE-R-01</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-R-04 + D2. skill_parser.py extracts constraints/forbidden via XML regex;
    the corpus is YAML+MD, so load_skill_metadata is empty for 40/43. But CODE_BLOCK_PATTERN
    (markdown, comment-led code blocks) drives get_pattern for 38/43 and MUST NOT change.
    Corpus-as-spec: constraints from "## Constraints" priority subheads (15 files),
    forbidden from "## Forbidden Patterns" table rows (11 files). Depends on SKE-R-03: the
    corpus test iterates devkit after the _meta relocation, and the index gate assumes the
    two-root registration.
  </context>

  <constraints>
    <constraint priority="critical">Delete CONSTRAINT_PATTERN, FORBIDDEN_PATTERN, TEMPLATE_PATTERN only. CODE_BLOCK_PATTERN untouched - regression floor: get_pattern non-empty count >= 38.</constraint>
    <constraint priority="critical">Before deletion, grep all callers of constraints/forbidden keys in solomon + hfs-aiops (plan risk row) - surface any consumer that would break.</constraint>
    <constraint priority="high">Rollback: land the regex deletion as a single commit so git revert restores XML extraction wholesale.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="EDIT" file="solomon_mcp/utils/skill_parser.py">
      <title>Parse constraints from priority subhead bullets (subhead carries priority into SkillConstraint.priority) and forbidden from table rows; triggers from frontmatter OR "## Triggers" section (documented optional); delete the three XML regexes</title>
    </task>
    <task id="2" action="EDIT" file="solomon_mcp/utils/skill_parser.py">
      <title>lru_cache keyed (path, mtime) for index/list/search paths</title>
    </task>
    <task id="3" action="EDIT" file="tests/test_skills_server.py">
      <title>Replace synthetic XML fixtures with corpus iteration: metadata non-empty for every skill with a matching section (floor 15 constraints / 11 forbidden), get_pattern >= 38, the shared round-trip fixture from SKE-R-01 parses back with priority intact</title>
    </task>
  </tasks>

  <verification>
    <check name="tests_pass" gate_class="machine" command="SKILLS_DIR=../hfs-development-kit/skills .venv/bin/python -m pytest tests/test_skills_server.py tests/test_ret_encoding.py -q">exit 0 (SKILLS_DIR explicit - SKE-R-03 removed the default and fails loudly unset; panel WARN I-04)</check>
    <check name="corpus_yield" gate_class="machine" command="SKILLS_DIR=../hfs-development-kit/skills .venv/bin/python -m pytest tests/test_skills_server.py -q -k corpus">constraints >= 15, forbidden >= 11 (vs 3/2 today)</check>
    <check name="pattern_floor" gate_class="machine" command="SKILLS_DIR=../hfs-development-kit/skills .venv/bin/python -m pytest tests/test_skills_server.py -q -k pattern_floor">get_pattern non-empty >= 38</check>
    <check name="index_tokens" gate_class="machine" command="SKILLS_DIR=../hfs-development-kit/skills .venv/bin/python -c &quot;import asyncio; from solomon_mcp.skills_server import skills_index_resource; i=asyncio.run(skills_index_resource()); assert len(i)/4 &lt;= 1200, len(i)/4&quot;">served tokens &lt;= 1200</check>
    <check name="xml_regexes_gone" gate_class="machine" command="grep -c 'CONSTRAINT_PATTERN\|FORBIDDEN_PATTERN\|TEMPLATE_PATTERN' solomon_mcp/utils/skill_parser.py">0</check>
  </verification>

  <commit>
    <type>fix</type>
    <scope>skills-parser</scope>
    <description>corpus-as-spec constraints/forbidden parsing, XML regexes deleted, CODE_BLOCK_PATTERN preserved (SKE-R-04)</description>
  </commit>
</session>
```

```xml
<session id="SKE-R-06" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>15 minutes</estimated_time>
    <effort>low</effort>
    <wave>0</wave>
  </metadata>

  <dependencies/>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-R-06. The committed .claude/skills and .claude/commands symlinks point at
    /Users/lionelj/... (a different user path - blobs 682b982/badd09b); 6 lionelj entries plus
    the phantom SKILLS_DIR sit in settings.local.json. A fresh clone resolves neither symlink.
  </context>

  <constraints>
    <constraint priority="critical">settings.local.json is UNTRACKED: take a timestamped backup to ~/.claude/backups/ BEFORE any purge (plan rollback note, panel I-02).</constraint>
    <constraint priority="high">Symlinks re-committed as relative or $HOME-based - one commit, revertable.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="RUN">
      <title>Backup: mkdir -p ~/.claude/backups &amp;&amp; cp .claude/settings.local.json ~/.claude/backups/settings.local.json.$(date +%Y%m%d-%H%M%S)</title>
    </task>
    <task id="2" action="EDIT" file=".claude/settings.local.json">
      <title>Remove the 6 lionelj-path permission entries and the phantom SKILLS_DIR entry (lines 34, 295, 342-352 region - re-locate by grep, not line number)</title>
    </task>
    <task id="3" action="RUN">
      <title>Re-create .claude/skills and .claude/commands symlinks $HOME-relative; git add + commit the two symlinks</title>
    </task>
  </tasks>

  <verification>
    <check name="backup_exists" gate_class="machine" command="ls ~/.claude/backups/settings.local.json.* | head -1">present</check>
    <check name="no_lionelj" gate_class="machine" command="grep -c lionelj .claude/settings.local.json">0</check>
    <check name="fresh_clone_resolves" gate_class="machine" command="T=$(mktemp -d) &amp;&amp; git clone -q --depth 1 file://$PWD $T/w &amp;&amp; test -e $T/w/.claude/skills -a -e $T/w/.claude/commands &amp;&amp; rm -rf $T &amp;&amp; echo ok">ok</check>
  </verification>

  <commit>
    <type>fix</type>
    <scope>workspace</scope>
    <description>portable .claude symlinks + lionelj/settings purge with backup (SKE-R-06)</description>
  </commit>
</session>
```

---

## Wave 1 - Reachability

```xml
<session id="SKE-R-07" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>60 minutes</estimated_time>
    <effort>high</effort>
    <wave>1</wave>
  </metadata>

  <dependencies/>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-R-07 + D4/D13. Five command call sites reference three dead MCP
    namespaces (solomon-skills., mcp__solomon_skills__, mcp__solomon__); the live namespace is
    mcp__plugin_solomon_solomon__. Four of the five files (plan.md, session.md, preflight.md,
    review.md) exist ONLY at ~/.claude/commands/ - no canonical copy (verified 2026-08-20).
    D13: promote-then-symlink BEFORE editing; the LHV-03 handoff pattern (canonical work
    autonomous, runtime cp user-run) is the proven path. Task-id mapping: this session's
    tasks 1-4 correspond to the plan's task-0 (promotion), tasks 1-5 (rewrite), and task-6
    (user cp) - the plan's numbering is not reused here (panel v2 SUGG S-01).
  </context>

  <constraints>
    <constraint priority="critical">Do NOT write to ~/.claude/commands/ - 8 consecutive classifier denials recorded 2026-08-15, and fresh attempts reinforce the block. Canonical work only; task 6 is user-executed.</constraint>
    <constraint priority="critical">Promote (copy runtime content into devkit) BEFORE editing - never edit-then-promote, and never delete a runtime file.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="CREATE">
      <title>Promotion (D13): copy plan.md, session.md, preflight.md, review.md from ~/.claude/commands/ into hfs-development-kit/claude-config/commands/ verbatim (promotion commit, no content edits)</title>
    </task>
    <task id="2" action="CREATE" file="ske/decisions/SKE-R-07.md">
      <title>Decision doc: namespace = mcp__plugin_solomon_solomon__; the three dead namespaces listed with their call sites</title>
    </task>
    <task id="3" action="EDIT">
      <title>Rewrite the 5 call sites in the canonical copies: plan.md:100 + session.md (solomon-skills.load_skill), preflight.md (mcp__solomon_skills__list_skills), review.md + session/load.md (mcp__solomon__load_skill)</title>
    </task>
    <task id="4" action="RUN">
      <title>USER handoff: hand Lionel a two-step block - (1) timestamped backup of the 4 live files to ~/.claude/backups/commands.$(date +%Y%m%d-%H%M%S)/ FIRST, (2) then cp each promoted+edited file over its ~/.claude/commands/ counterpart. Never hand a cp without its backup line (panel CRIT I-02; SKE-R-06 precedent)</title>
    </task>
  </tasks>

  <verification>
    <check name="canonical_present" gate_class="machine" command="ls hfs-development-kit/claude-config/commands/plan.md hfs-development-kit/claude-config/commands/session.md hfs-development-kit/claude-config/commands/preflight.md hfs-development-kit/claude-config/commands/review.md">4 files</check>
    <check name="no_dead_namespaces" gate_class="machine" command="grep -rn 'solomon-skills\.\|mcp__solomon_skills__\|mcp__solomon__load_skill' hfs-development-kit/claude-config/commands/ | wc -l">0</check>
    <check name="copies_identical" gate_class="manual" command="diff each canonical file against ~/.claude/commands/">user cp executed; expect STOP here until it is</check>
  </verification>

  <commit>
    <type>fix</type>
    <scope>commands</scope>
    <description>promote 4 runtime-only commands to canonical + repair 5 dead MCP call sites (SKE-R-07)</description>
  </commit>
</session>
```

```xml
<session id="SKE-01" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>30 minutes</estimated_time>
    <effort>medium</effort>
    <wave>1</wave>
  </metadata>

  <dependencies/>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-01. Four MCP tools have no slash wrapper (search_skills,
    load_skill_metadata, load_skills, get_pattern) - violating mcp-server-building's own
    pairing rule. skills_inventory.py needs three new fields: coverage (D5 enforcement),
    name_collisions (Q4 tripwire), upstream_drift (Q3, wrapper pins vs live lockfile).
  </context>

  <constraints>
    <constraint priority="critical">New commands land canonically in hfs-development-kit/claude-config/commands/skill/ (D13) - runtime symlink/copy is a follow-up user step, not this session's write.</constraint>
    <constraint priority="high">coverage counts org-authored only. At THIS session's DAG position the discoverable population is 43 (claude-design-prompts sits outside both roots until SKE-02 dispositions it) - the field ships report-only with floor 0 here; SKE-02 raises the floor to 44-accounted after the disposition (panel v3 WARN T-01). Vendored skills never enter the gate population (ADR-0002).</constraint>
  </constraints>

  <tasks>
    <task id="1" action="CREATE">
      <title>Canonical commands skill/search.md, skill/meta.md, skill/load-many.md, skill/pattern.md wrapping the 4 unwrapped tools (live namespace)</title>
    </task>
    <task id="2" action="EDIT" file="ske/scripts/skills_inventory.py">
      <title>Add coverage {reachable, total, unreachable[]} over org-authored, name_collisions (bare-name overlap across devkit + ~/.agents), upstream_drift (frontmatter upstream: pins vs .skill-lock.json hashes, report-only); non-zero exit below coverage floor (default 0 = report-only until SKE-02 sets it)</title>
    </task>
  </tasks>

  <verification>
    <check name="four_commands" gate_class="machine" command="ls hfs-development-kit/claude-config/commands/skill/*.md | wc -l">4</check>
    <check name="fields_emit" gate_class="machine" command="solomon/.venv/bin/python ske/scripts/skills_inventory.py >/dev/null &amp;&amp; solomon/.venv/bin/python -c &quot;import json; d=json.load(open('ske/skills_inventory.json')); assert 'coverage' in d and 'name_collisions' in d and 'upstream_drift' in d&quot;">exit 0</check>
    <check name="idempotent" gate_class="machine" command="solomon/.venv/bin/python ske/scripts/skills_inventory.py >/dev/null &amp;&amp; cp ske/skills_inventory.json /tmp/i1.json &amp;&amp; solomon/.venv/bin/python ske/scripts/skills_inventory.py >/dev/null &amp;&amp; diff -q /tmp/i1.json ske/skills_inventory.json">identical</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>skills</scope>
    <description>slash wrappers for 4 unwrapped MCP tools + coverage/name_collisions/upstream_drift inventory fields (SKE-01)</description>
  </commit>
</session>
```

```xml
<session id="SKE-02" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>75 minutes</estimated_time>
    <effort>high</effort>
    <wave>1</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-R-07</requires>
    <requires status="pending">SKE-01</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-02 + D5. Population: 43 canonical + claude-design-prompts (79 lines,
    no frontmatter, ACTIVE at 3 loads, in NEITHER root - panel CRIT T-01). 7 dead commands
    reference no skill; 2 PHANTOM CLAUDE.md entries; 7 devkit skills missing from runtime
    (incl. skill-reviewer). Depends on SKE-R-07 (commands must resolve for reachability checks)
    and SKE-01 (the coverage field this session gates on).
  </context>

  <constraints>
    <constraint priority="critical">Disposition of claude-design-prompts follows the Portability test (CONTEXT.md): promote (add frontmatter, land canonically, symlink runtime) or declare Personal with reason - never silently drop an ACTIVE skill.</constraint>
    <constraint priority="critical">Vendored skills get NO wrappers - verify search_skills finds each by description only (ADR-0002).</constraint>
    <constraint priority="high">Rollback: promotion is one devkit commit + one symlink; Personal declaration is one exclusion line (panel I-02).</constraint>
  </constraints>

  <tasks>
    <task id="1" action="EDIT">
      <title>Read claude-design-prompts, apply the Portability test, execute the disposition (promotion commit or exclusion entry with reason)</title>
    </task>
    <task id="2" action="EDIT">
      <title>Wire or delete the 7 dead commands (complete-session, load-session, run-session, project/init, session/complete, session/next, session/run) - canonical copies per D13 where they exist; promote-first where runtime-only</title>
    </task>
    <task id="3" action="EDIT" file="CLAUDE.md">
      <title>Remove droplet-deployment + claude-config-sync phantoms; correct the layer description (1 command layer, symlink topology, org-authored/vendored split)</title>
    </task>
    <task id="4" action="RUN">
      <title>Install the 7 devkit skills missing from runtime as symlinks (promote-then-symlink is satisfied: canonical copies exist)</title>
    </task>
    <task id="5" action="RUN">
      <title>Category commands /skill:backend|frontend|ops|meta|agents (canonical) listing org-authored skills by area; set the coverage floor to 44</title>
    </task>
  </tasks>

  <verification>
    <check name="coverage_full" gate_class="machine" command="solomon/.venv/bin/python ske/scripts/skills_inventory.py >/dev/null &amp;&amp; solomon/.venv/bin/python -c &quot;import json; c=json.load(open('ske/skills_inventory.json'))['coverage']; assert c['reachable']==c['total']==44, c&quot;">44/44 accounted</check>
    <check name="registry_resolves" gate_class="machine" command="solomon/.venv/bin/python -c &quot;import json,re; inv=json.load(open('ske/skills_inventory.json')); names={r['name'] for r in inv['skills']}; import pathlib; t=pathlib.Path('CLAUDE.md').read_text(); missing=[c for c in re.findall(r'[a-z][a-z0-9]*(?:-[a-z0-9]+)+', t.split('## Skills Available')[1].split('## Compaction')[0]) if c not in names and c.count('-')>=1 and len(c)>6]; assert not missing, missing&quot;">39/39 resolve, 0 phantoms</check>
    <check name="disposition_recorded" gate_class="machine" command="git log --oneline -3 | grep -i 'claude-design-prompts' || grep -rn 'claude-design-prompts' hfs-development-kit/scripts/ ske/ | grep -i personal">promotion commit or exclusion entry</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>skills</scope>
    <description>44/44 org-authored accounted - disposition, dead commands, phantoms, runtime installs (SKE-02)</description>
  </commit>
</session>
```

```xml
<session id="SKE-03" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>60 minutes</estimated_time>
    <effort>high</effort>
    <wave>1</wave>
  </metadata>

  <dependencies/>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-03 + D7/D15. No skill-load telemetry exists; file reads are the
    dominant load path (80 of 114 discovery events). Two emitters: in-process OTEL counters in
    the skills server, and a PostToolUse hook under the four-rule Telemetry contract
    (CONTEXT.md). The Success claim (plan section 7) consumes this instrument.
  </context>

  <constraints>
    <constraint priority="critical">The hook obeys all four rules: local append only, unconditional exit 0, single-digit-ms no locks, path ~/.claude/telemetry/skill-loads.jsonl. It NEVER networks. A telemetry failure never becomes a session failure. One test seam exists: HFS_TELEMETRY_DIR overrides the directory, defaulting to the contract path - it exists SOLELY so the failure path is testable (panel v2 CRIT I-01: an untestable exit-0 guarantee is a green-but-empty gate) and must never be set in production wiring.</constraint>
    <constraint priority="critical">Hook file lands canonically (hfs-development-kit/claude-config/hooks/) per D13; wiring into settings is documented for the user, not auto-applied.</constraint>
    <constraint priority="high">mkdir -p inside the exit-0 envelope (panel I-04): failed mkdir drops the datapoint, never the session.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="EDIT" file="solomon/solomon_mcp/skills_server.py">
      <title>In-process OTEL counters for load_skill / search_skills / get_pattern (mcp path)</title>
    </task>
    <task id="2" action="CREATE" file="hfs-development-kit/claude-config/hooks/skill-telemetry.sh">
      <title>PostToolUse hook (Skill / Read **/SKILL.md): append {ts, session_id, skill, path} JSONL; mkdir -p first; exit 0 unconditionally</title>
    </task>
    <task id="3" action="CREATE" file="solomon/tests/test_skill_telemetry.py">
      <title>One load per path increments/appends; simulated write failure (read-only dir) leaves exit status 0</title>
    </task>
  </tasks>

  <verification>
    <check name="tests_pass" gate_class="machine" command="cd solomon &amp;&amp; .venv/bin/python -m pytest tests/test_skill_telemetry.py -q">exit 0</check>
    <check name="hook_exit0_on_failure" gate_class="machine" command="D=$(mktemp -d) &amp;&amp; chmod 500 &quot;$D&quot; &amp;&amp; HFS_TELEMETRY_DIR=&quot;$D/sub&quot; bash hfs-development-kit/claude-config/hooks/skill-telemetry.sh &lt;&lt;&lt; '{}'; RC=$?; chmod 700 &quot;$D&quot;; rm -rf &quot;$D&quot;; echo $RC">0 (mkdir -p fails inside a mode-500 parent - a real, Darwin-valid failure; the datapoint drops, the exit stays 0)</check>
    <check name="hook_never_networks" gate_class="machine" command="grep -cE 'curl|wget|nc |http' hfs-development-kit/claude-config/hooks/skill-telemetry.sh">0</check>
    <check name="jsonl_append" gate_class="machine" command="bash hfs-development-kit/claude-config/hooks/skill-telemetry.sh &lt;&lt;&lt; '{&quot;tool_input&quot;:{&quot;skill&quot;:&quot;test&quot;}}' &amp;&amp; tail -1 ~/.claude/telemetry/skill-loads.jsonl | solomon/.venv/bin/python -c 'import json,sys; json.loads(sys.stdin.read())'">valid JSONL row</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>telemetry</scope>
    <description>skill-load telemetry - server OTEL + four-rule PostToolUse hook (SKE-03)</description>
  </commit>
</session>
```

---

## Wave 2 - Measurement

```xml
<session id="SKE-04" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>90 minutes</estimated_time>
    <effort>high</effort>
    <wave>2</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-02</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-04 + Q6. Requires SKE-02 (panel v3 WARN I-04): the "production
    surface" the runner mounts IS SKE-02's output - post-disposition index, resolving
    commands - a true data-flow edge, consistent with SKE-05/SKE-11. Eval harness measuring trigger precision/recall, rubric
    pass^3, co-loaded regression. Runner mounts the PRODUCTION surface (org-authored index +
    pointer, search over both roots, real commands) - trigger competition is the thing
    measured; an enumerated-94 or isolated environment measures fiction. Eval baseline =
    triple (case set + rendered-index hash + upstream pins), asserted at run start.
  </context>

  <constraints>
    <constraint priority="critical">The baseline triple is recorded in every run's output; a run that cannot render/hash the index fails loudly, never silently proceeds (attribution depends on it).</constraint>
    <constraint priority="high">Headless -p runner (OQ-01 default); 20% sample on PR, full run weekly (consumed by SKE-12).</constraint>
  </constraints>

  <tasks>
    <task id="1" action="CREATE" file="ske/scripts/skill_eval.py">
      <title>Case schema {id, prompt, should_trigger, expected_skill, rubric[], co_loaded[]}; headless -p runner against the production surface; reports precision/recall, pass^3, co-loaded regression vs baseline; asserts + records the baseline triple</title>
    </task>
    <task id="2" action="CREATE">
      <title>Three hand-written case sets under ske/evals/: plan-review-loop, development-workflow, hfs-client-engagement (the 3 most ACTIVE)</title>
    </task>
  </tasks>

  <verification>
    <check name="three_sets_green" gate_class="machine" command="solomon/.venv/bin/python ske/scripts/skill_eval.py --cases ske/evals/ --report /tmp/eval1.json &amp;&amp; solomon/.venv/bin/python -c &quot;import json; d=json.load(open('/tmp/eval1.json')); assert d['baseline']['index_hash'] and d['baseline']['upstream_pins'] is not None&quot;">runs green, triple present</check>
    <check name="rerunnable" gate_class="machine" command="solomon/.venv/bin/python ske/scripts/skill_eval.py --cases ske/evals/ --report /tmp/eval2.json &amp;&amp; solomon/.venv/bin/python -c &quot;import json; a=json.load(open('/tmp/eval1.json')); b=json.load(open('/tmp/eval2.json')); assert a['baseline']['index_hash']==b['baseline']['index_hash']&quot;">baseline stable across runs</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>evals</scope>
    <description>skill eval harness with asserted production-surface baseline triple (SKE-04)</description>
  </commit>
</session>
```

```xml
<session id="SKE-05" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>60 minutes</estimated_time>
    <effort>high</effort>
    <wave>2</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-04</requires>
    <requires status="pending">SKE-02</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-05 + Q5. Requires SKE-02: this session scores the corpus
    POST-DISPOSITION - the population it iterates is SKE-02's output, a true data-flow
    edge (panel review v1 CRIT T-02 / WARN I-03), not just wave order. skill-reviewer has NEVER run (0 Final Score artifacts, 1
    commit, not installed). Two scales: Measured x/100 (evals present, measured category ran)
    vs Unmeasured x/80 UNMEASURED (rubric-only, a work queue entry). Any >=90 gate references
    /100 only. Depends on SKE-04: the measured category consumes the harness.
  </context>

  <constraints>
    <constraint priority="critical">An eval-less skill's artifact must be visually distinct (x/80 - UNMEASURED) - never a bare number that reads as a quality verdict (CONTEXT.md: Unmeasured score).</constraint>
    <constraint priority="high">Rubric per D6: name + description (+ optional allowed-tools, model, upstream); never deduct for absent author/date/phase/triggers/related_skills.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="EDIT" file="hfs-development-kit/skills/skill-reviewer/SKILL.md">
      <title>v2 rubric: D6 conformance + Measured behaviour category (20 pts: precision >=0.9, recall >=0.9, pass^3 >=0.8, no co-loaded regression); two-scale output format</title>
    </task>
    <task id="2" action="RUN">
      <title>Install skill-reviewer to runtime (symlink - canonical exists, promote-then-symlink satisfied)</title>
    </task>
    <task id="3" action="RUN">
      <title>Run against every canonical devkit skill post-disposition; commit artifacts to hfs-development-kit/reviews/</title>
    </task>
  </tasks>

  <verification>
    <check name="artifact_per_skill" gate_class="machine" command="test $(ls hfs-development-kit/reviews/*.md | wc -l) -eq $(ls -d hfs-development-kit/skills/*/ | grep -v _meta | wc -l) &amp;&amp; echo ok">artifact count EQUALS canonical skill count post-disposition (dynamic - panel SUGG T-05)</check>
    <check name="two_scales" gate_class="machine" command="grep -l 'UNMEASURED' hfs-development-kit/reviews/*.md | wc -l">eval-less skills marked (expected ~40)</check>
    <check name="measured_three" gate_class="machine" command="grep -L 'UNMEASURED' hfs-development-kit/reviews/*.md | wc -l">3 measured (the SKE-04 case-set skills)</check>
    <check name="reviewer_installed" gate_class="machine" command="test -e ~/.claude/skills/skill-reviewer &amp;&amp; echo ok">ok</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>skills</scope>
    <description>skill-reviewer v2 two-scale rubric + first-ever full review artifacts (SKE-05)</description>
  </commit>
</session>
```

```xml
<session id="SKE-06" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>60 minutes</estimated_time>
    <effort>high</effort>
    <wave>2</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-05</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-06. hfs-skill-creator v2.1: description-as-trigger (&lt;=200 chars
    model-invoked / &lt;=300 user-invoked), context-load vs cognitive-load budgeting,
    information hierarchy, checkable completion criteria, optional invocation: + upstream:
    frontmatter keys, mandatory references/ split >200 lines, mandatory evals/. Depends on
    SKE-05: the creation gate cites the reviewer's Measured scale.
  </context>

  <constraints>
    <constraint priority="high">Strip upstream idioms that don't fit HFS (em-dash ban, GitHub-only tracker assumptions).</constraint>
  </constraints>

  <tasks>
    <task id="1" action="EDIT" file="hfs-development-kit/skills/hfs-skill-creator/SKILL.md">
      <title>v2.1 per plan: trigger budgets, hierarchy, completion criteria, optional keys, mandatory references/ + evals/</title>
    </task>
    <task id="2" action="RUN">
      <title>Create a throwaway skill end-to-end; score it with skill-reviewer; delete it after the gate reading</title>
    </task>
  </tasks>

  <verification>
    <check name="throwaway_gate" gate_class="fuzzy" command="creator run transcript">SKILL.md &lt;=150 lines + evals/ present + Measured score >= 90</check>
    <check name="creator_updated" gate_class="machine" command="grep -c 'evals' hfs-development-kit/skills/hfs-skill-creator/SKILL.md">mandatory evals present in spec</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>skills</scope>
    <description>hfs-skill-creator v2.1 - trigger budgets, disclosure hierarchy, mandatory evals (SKE-06)</description>
  </commit>
</session>
```

```xml
<session id="SKE-06b" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>30 minutes</estimated_time>
    <effort>medium</effort>
    <wave>2</wave>
  </metadata>

  <dependencies/>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-06b + D11 (sole owner of the spec bump). v1.11 shipped April 2026
    with FE-verification gates and its own header records a pending v1.12 split. All D11
    additions land at once here; SKE-08, SKE-09, and SKE-R-05 consume this file and never edit
    it (three-owner collision was panel-era defect Q10).
  </context>

  <constraints>
    <constraint priority="critical">Strict superset: every valid v1.10/v1.11 session parses unchanged. Additive only.</constraint>
    <constraint priority="high">Rollback: additive-only by construction - revert is one commit, no emitted document becomes unparseable, consumers land in later sessions by design (panel I-03).</constraint>
  </constraints>

  <tasks>
    <task id="1" action="CREATE" file="hfs-development-kit/workflow/SESSION_FORMAT_v1.12_XML.md">
      <title>v1.12: task size_tokens + blocked_by attributes, execution isolation="worktree|none", section-sign forbidden pattern, effort-enum normalization (max -> xhigh formalized from the v1.11 inline note)</title>
    </task>
    <task id="2" action="EDIT" file="solomon/solomon_mcp/utils/session_parser.py">
      <title>Parser fact (verified 2026-08-20): the regex-extraction SessionParser treats unknown elements as inert text, so v1.12 additions are already non-breaking. Add explicit extraction ONLY for size_tokens/blocked_by (tracer + availability consumers) and execution isolation; add a v1.12 fixture test asserting both the new extraction and v1.10 pass-through</title>
    </task>
  </tasks>

  <verification>
    <check name="v112_exists" gate_class="machine" command="ls hfs-development-kit/workflow/SESSION_FORMAT_v1.12_XML.md">present</check>
    <check name="v110_still_parses" gate_class="machine" command="cd solomon &amp;&amp; .venv/bin/python -m pytest tests/ -q -k session_parser">exit 0, no regression</check>
    <check name="roundtrip_v112" gate_class="machine" command="cd solomon &amp;&amp; .venv/bin/python -m pytest tests/ -q -k v112">v1.12 fixture parses</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>workflow</scope>
    <description>SESSION_FORMAT v1.12 - task sizing, execution isolation, forbidden pattern (SKE-06b)</description>
  </commit>
</session>
```

---

## Wave 3 - Enrich + author (parallel x4, native worktree isolation, disjoint file-ownership lists)

```xml
<session id="SKE-07" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>75 minutes</estimated_time>
    <effort>high</effort>
    <wave>3</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-06b</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-07 + D8. Wrapper skills load vendored originals by QUALIFIED reference
    (agents:tdd, agents:code-review) and carry report-only Upstream pins (tdd 57e1bee8,
    code-review 9df6fdac - zero drift as of 2026-08-20). Two-axis review rides the vendored
    skill's OWN parallel-subagent mechanism - no Bishop (panel CRIT I-01: does not exist).
    File-ownership: skills/hfs-tdd/, skills/hfs-code-review/, skills/debugging-workflow/ only.
  </context>

  <constraints>
    <constraint priority="critical">No new MCP server. Two-axis = the vendored code-review skill's parallel subagents + HFS checklists layered per axis.</constraint>
    <constraint priority="critical">Write only owned paths (worktree isolation; disjoint by construction).</constraint>
    <constraint priority="high">Every wrapper ships evals/ (D9).</constraint>
  </constraints>

  <tasks>
    <task id="1" action="CREATE" file="hfs-development-kit/skills/hfs-tdd/SKILL.md">
      <title>Wrapper: qualified load of agents:tdd, upstream pin, CONSTITUTION + forbidden checks, three-layer seam rule, Quart/pytest-asyncio + vitest recipes, evals/</title>
    </task>
    <task id="2" action="CREATE" file="hfs-development-kit/skills/hfs-code-review/SKILL.md">
      <title>Wrapper: qualified load of agents:code-review, upstream pin, HFS Standards+Spec checklists layered on its two-axis subagent mechanism, evals/</title>
    </task>
    <task id="3" action="EDIT" file="hfs-development-kit/skills/debugging-workflow/SKILL.md">
      <title>diagnosing-bugs phase gates + verbatim failing-then-passing output rule, evals/</title>
    </task>
  </tasks>

  <verification>
    <check name="pins_present" gate_class="machine" command="grep -l 'upstream:' hfs-development-kit/skills/hfs-tdd/SKILL.md hfs-development-kit/skills/hfs-code-review/SKILL.md | wc -l">2</check>
    <check name="qualified_refs" gate_class="machine" command="grep -c 'agents:' hfs-development-kit/skills/hfs-tdd/SKILL.md hfs-development-kit/skills/hfs-code-review/SKILL.md | grep -v ':0' | wc -l">2</check>
    <check name="evals_present" gate_class="machine" command="ls hfs-development-kit/skills/hfs-tdd/evals/ hfs-development-kit/skills/hfs-code-review/evals/ hfs-development-kit/skills/debugging-workflow/evals/ | wc -l">>= 3</check>
    <check name="two_axis_live" gate_class="fuzzy" command="review one real diff via hfs-code-review">both axes report; RET ingests findings as Encoding commits</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>skills</scope>
    <description>hfs-tdd + hfs-code-review wrappers with upstream pins + debugging-workflow gates (SKE-07)</description>
  </commit>
</session>
```

```xml
<session id="SKE-08" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>90 minutes</estimated_time>
    <effort>high</effort>
    <wave>3</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-06b</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-08. tracer-tickets: PLAN.md -> vertical slices (schema -> repo ->
    service -> controller -> FE -> test), each &lt;=60k working-set tokens (OQ-02), blocked_by
    edges, expand->migrate->contract template. Emits v1.12 tasks + DAG frontier (consumes
    SKE-06b's spec, never edits it). File-ownership: skills/tracer-tickets/ +
    skills/implementation-plan-generator/ only.
  </context>

  <constraints>
    <constraint priority="critical">Consumes SESSION_FORMAT v1.12; any spec gap found is reported, not patched here (SKE-06b owns the file).</constraint>
    <constraint priority="critical">Write only owned paths.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="CREATE" file="hfs-development-kit/skills/tracer-tickets/SKILL.md">
      <title>Slicing method, token-budget rule, blocked_by emission, expand->migrate->contract template, v1.12 task output format, evals/</title>
    </task>
    <task id="2" action="EDIT" file="hfs-development-kit/skills/implementation-plan-generator/SKILL.md">
      <title>Call tracer-tickets for slice decomposition (reference, not duplication)</title>
    </task>
    <task id="3" action="RUN">
      <title>Regenerate one past PROMPTS doc (suggest: LHV) through the tracer; diff slice count and parallelism vs the original as the calibration artifact</title>
    </task>
  </tasks>

  <verification>
    <check name="skill_exists" gate_class="machine" command="ls hfs-development-kit/skills/tracer-tickets/SKILL.md hfs-development-kit/skills/tracer-tickets/evals/">present with evals</check>
    <check name="v112_tasks" gate_class="machine" command="grep -c 'size_tokens' hfs-development-kit/skills/tracer-tickets/SKILL.md">emits v1.12 attributes</check>
    <check name="calibration_diff" gate_class="fuzzy" command="regeneration artifact">slice-count/parallelism diff recorded</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>skills</scope>
    <description>tracer-tickets vertical-slice skill + planner integration (SKE-08)</description>
  </commit>
</session>
```

```xml
<session id="SKE-09" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>60 minutes</estimated_time>
    <effort>high</effort>
    <wave>3</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-06b</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-09 + Q10. The isolation MECHANISM is harness-native (proven live
    2026-08-20); this skill documents the PRACTICE: worktree per agent, coordination via
    Mem0/Linear never a shared TASKS.md, merge in DAG order, stale-worktree cleanup as a
    Samson task (no Sentinel - does not exist), File-ownership list discipline. Decision doc
    resolves OQ-03 (default native). File-ownership: skills/worktree-isolation/ +
    ske/decisions/SKE-09.md only.
  </context>

  <constraints>
    <constraint priority="critical">Consumes v1.12's execution isolation element; never edits the spec.</constraint>
    <constraint priority="critical">Write only owned paths.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="CREATE" file="ske/decisions/SKE-09.md">
      <title>Decision: native isolation vs T3 Code (OQ-03) - default native, rationale + revisit trigger</title>
    </task>
    <task id="2" action="CREATE" file="hfs-development-kit/skills/worktree-isolation/SKILL.md">
      <title>The practice doc + evals/; references v1.12 execution element and the File-ownership list term</title>
    </task>
    <task id="3" action="RUN">
      <title>3-agent fan-out on a throwaway repo; assert zero merge conflicts</title>
    </task>
  </tasks>

  <verification>
    <check name="skill_and_decision" gate_class="machine" command="ls hfs-development-kit/skills/worktree-isolation/SKILL.md ske/decisions/SKE-09.md">both present</check>
    <check name="fanout_clean" gate_class="machine" command="bash ske/scripts/fanout_test.sh /tmp/ske09-throwaway &amp;&amp; git -C /tmp/ske09-throwaway status --porcelain | wc -l">script exits 0 AND porcelain count is 0 (no conflicts, clean tree)</check>
    <check name="no_sentinel" gate_class="machine" command="grep -ci sentinel hfs-development-kit/skills/worktree-isolation/SKILL.md">0</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>skills</scope>
    <description>worktree-isolation practice skill + OQ-03 decision (SKE-09)</description>
  </commit>
</session>
```

```xml
<session id="SKE-10" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>30 minutes</estimated_time>
    <effort>medium</effort>
    <wave>3</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-06b</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-10. blast-radius: callers/migrations/contracts via the EXISTING
    /jacob:contract surface (jacob_contract is live in the gateway - no new tool), required
    before >3-file or schema changes. interrogate: adversarial one-question-at-a-time pass as
    iteration 0 of plan-review-loop; answers become ADR stubs (the 2026-08-20 SKE grilling is
    its documented dry run: 12 questions -> 12 decisions + 15 glossary terms + ADR-0002).
    File-ownership: skills/blast-radius/, skills/interrogate/, skills/plan-review-loop/ only.
  </context>

  <constraints>
    <constraint priority="critical">Wire to the existing jacob_contract tool; no new MCP surface.</constraint>
    <constraint priority="critical">Write only owned paths.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="CREATE" file="hfs-development-kit/skills/blast-radius/SKILL.md">
      <title>Skill + evals/: caller/migration/contract enumeration via /jacob:contract, trigger rule (>3 files or any schema)</title>
    </task>
    <task id="2" action="CREATE" file="hfs-development-kit/skills/interrogate/SKILL.md">
      <title>Skill + evals/: one-question-at-a-time protocol, per-question recommendation, glossary/ADR capture as you go (dry-run precedent cited)</title>
    </task>
    <task id="3" action="EDIT" file="hfs-development-kit/skills/plan-review-loop/SKILL.md">
      <title>interrogate registered as iteration 0 of the loop</title>
    </task>
  </tasks>

  <verification>
    <check name="both_skills" gate_class="machine" command="ls hfs-development-kit/skills/blast-radius/SKILL.md hfs-development-kit/skills/interrogate/SKILL.md">present</check>
    <check name="evals_present" gate_class="machine" command="ls hfs-development-kit/skills/blast-radius/evals/ hfs-development-kit/skills/interrogate/evals/ | wc -l">>= 2</check>
    <check name="loop_wired" gate_class="machine" command="grep -c interrogate hfs-development-kit/skills/plan-review-loop/SKILL.md">>= 1</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>skills</scope>
    <description>blast-radius + interrogate skills, interrogate as review iteration 0 (SKE-10)</description>
  </commit>
</session>
```

---

## Wave 4 - Disclosure + platform

```xml
<session id="SKE-R-05" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>30 minutes</estimated_time>
    <effort>medium</effort>
    <wave>4</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-07</requires>
    <requires status="pending">SKE-08</requires>
    <requires status="pending">SKE-09</requires>
    <requires status="pending">SKE-10</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-R-05 + D10. Estate-wide section-sign (U+00A7) ban. The Wave-3 edges are
    data flow, not reading order: the sweep's input set must include the skill files Wave 3
    authors - run earlier it would certify files that don't exist yet. v1.12 already carries
    the forbidden pattern (SKE-06b owns that file; this session consumes it).
  </context>

  <constraints>
    <constraint priority="critical">Sweep replaces the character with "section N" / plain numbering - never a mechanical delete.</constraint>
    <constraint priority="high">Pre-commit hooks land canonically (devkit + workspace pre-commit config), user-wired where runtime.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="EDIT">
      <title>CONSTITUTION (Code Quality) + hfs-skill-creator + skill-reviewer forbidden lists gain the ban</title>
    </task>
    <task id="2" action="EDIT" file="solomon/solomon_mcp/retrospectives/known_patterns.py">
      <title>section-sign-usage known pattern (regex for U+00A7, targets SKILL_FORBIDDEN + CLAUDE_MD)</title>
    </task>
    <task id="3" action="EDIT">
      <title>Pre-commit hook in devkit + solomon-workspace: staged-diff grep for the character fails the commit</title>
    </task>
    <task id="4" action="RUN">
      <title>Pre-sweep gate: git status --porcelain must be clean in each target repo (a bulk mechanical replacement on a dirty tree is unrevertable per-hunk); THEN estate sweep (devkit, solomon-workspace incl. ske/SKE_DISCOVERY.md, solomon-docs): replace occurrences, one commit per repo</title>
    </task>
  </tasks>

  <verification>
    <check name="sweep_empty" gate_class="machine" command="grep -rl $'\xc2\xa7' hfs-development-kit solomon-docs ske CLAUDE.md CONTEXT.md 2>/dev/null | grep -v '.git' | wc -l">0</check>
    <check name="hook_blocks" gate_class="machine" command="test commit containing the character is rejected by pre-commit">blocked</check>
    <check name="known_pattern" gate_class="machine" command="grep -c 'section-sign-usage' solomon/solomon_mcp/retrospectives/known_patterns.py">>= 1</check>
  </verification>

  <commit>
    <type>chore</type>
    <scope>estate</scope>
    <description>section-sign ban - constitution, reviewer, RET pattern, pre-commit, estate sweep (SKE-R-05)</description>
  </commit>
</session>
```

```xml
<session id="SKE-11" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>90 minutes</estimated_time>
    <effort>high</effort>
    <wave>4</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-04</requires>
    <requires status="pending">SKE-02</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-11. Requires SKE-02 (true data flow, panel CRIT T-02): the
    refactor operates on the post-disposition corpus, and the inventory tool it diffs
    with carries SKE-01's fields via SKE-02's populated coverage (transitive through
    the SKE-02 edge). Disclosure refactor of the worst 6 monolithic devkit skills (by
    lines from skills_inventory.json): SKILL.md &lt;=150 + references/. Trim 17 descriptions
    >400 chars to &lt;=300 (hfs-preprod-deploy is 872). Gated on the SKE-04 asserted Eval
    baseline - the triple attributes any trigger movement.
  </context>

  <constraints>
    <constraint priority="critical">Gate: eval harness shows no trigger regression vs the recorded baseline triple. A regression reverts the split for that skill, not a rubric argument.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="RUN">
      <title>Record the pre-refactor baseline triple (skill_eval full run)</title>
    </task>
    <task id="2" action="EDIT">
      <title>Split the worst 6 (per inventory lines, devkit, monolithic): SKILL.md &lt;=150 + references/; trim the 17 long descriptions to &lt;=300 chars</title>
    </task>
    <task id="3" action="RUN">
      <title>Re-run eval; diff vs baseline; re-run inventory and diff vs the 3726824f-lineage baseline (the canonical pyyaml-backend inventory sha recorded in SKE_DISCOVERY section 9.6 and the plan)</title>
    </task>
  </tasks>

  <verification>
    <check name="no_trigger_regression" gate_class="machine" command="solomon/.venv/bin/python ske/scripts/skill_eval.py --cases ske/evals/ --report /tmp/post11.json --compare-baseline /tmp/pre11.json">exit 0 = precision/recall within tolerance vs the recorded pre-refactor baseline</check>
    <check name="desc_budget" gate_class="machine" command="solomon/.venv/bin/python -c &quot;import json; d=json.load(open('ske/skills_inventory.json')); dev=[r for r in d['skills'] if r['root']=='devkit']; assert sum(r['description_chars'] for r in dev)/len(dev) &lt;= 300&quot;">devkit avg desc &lt;= 300</check>
    <check name="split_landed" gate_class="machine" command="for f in $(solomon/.venv/bin/python -c &quot;import json; d=json.load(open('ske/skills_inventory.json')); print(' '.join(sorted([r['name'] for r in d['skills'] if r['root']=='devkit' and r['monolithic']], key=lambda n: -next(x['lines'] for x in d['skills'] if x['name']==n))[:6]))&quot;); do wc -l hfs-development-kit/skills/$f/SKILL.md; done">each of the worst-6 &lt;= 150 lines and has references/</check>
  </verification>

  <commit>
    <type>refactor</type>
    <scope>skills</scope>
    <description>disclosure split of worst 6 + description trims, eval-gated (SKE-11)</description>
  </commit>
</session>
```

```xml
<session id="SKE-12" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>60 minutes</estimated_time>
    <effort>high</effort>
    <wave>4</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-11</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-12. Weekly full eval run with alerting. INFRASTRUCTURE TRUTH (panel
    v3 CRIT I-01, matching project memory): the Samson cadence API is NOT BUILT - cadence_state
    persistence and the BE-08 poller cannot be assumed live. Task 0 verifies what exists; the
    ritual persists locally (ske/evals/history/*.jsonl) with Slack alerting (live per routines
    infra), and the Samson/cadence_state wiring is recorded as a dated pending step IF the
    existence check fails. Depends on SKE-11: the weekly baseline must be the post-refactor
    one, else week-1 alerts fire on SKE-11's intended changes.
  </context>

  <constraints>
    <constraint priority="critical">No gate may assume unbuilt infrastructure: cadence_state/poller wiring only lands if task 0's existence check passes; otherwise local persistence + Slack alerting, and the Samson leg is a dated pending step (panel v3 CRIT I-01).</constraint>
    <constraint priority="critical">RET encoding proposals must carry an eval-case delta - checkable per Encoding commit (D14).</constraint>
    <constraint priority="high">Budget re-check per the routines README 15-run/day math before scheduling; verify the Friday slot is not double-booked vs LHV-04's friday-eval recommendation (panel v3 WARN I-05).</constraint>
  </constraints>

  <tasks>
    <task id="1" action="VERIFY">
      <title>Existence check: does cadence_state accept writes and does a poller consume it? Record the answer; it decides task 2's wiring</title>
    </task>
    <task id="2" action="CREATE">
      <title>Weekly Routine definition (prompt file + inventory row): full eval run persisting to ske/evals/history/&lt;date&gt;.jsonl; Slack alert on >5pt precision/recall drop or coverage loss; Samson/cadence_state leg wired ONLY if task 1 passed, else recorded as dated pending</title>
    </task>
    <task id="3" action="EDIT">
      <title>RET eval-case-delta rule wired into the proposal flow</title>
    </task>
    <task id="4" action="RUN">
      <title>One scheduled run + one synthetic threshold breach through whichever alert path task 2 wired</title>
    </task>
  </tasks>

  <verification>
    <check name="run_recorded" gate_class="machine" command="ls ske/evals/history/*.jsonl | wc -l">>= 1 (one scheduled run persisted)</check>
    <check name="alert_fires" gate_class="fuzzy" command="synthetic breach transcript">alert produced through the wired path (Slack message or poller row)</check>
    <check name="friday_slot_clear" gate_class="machine" command="grep -c '0 16 \* \* 5' routines/.created.yml">this ritual does not claim Fri 16:00 (friday-eval's slot)</check>
    <check name="budget_math" gate_class="machine" command="grep -A4 'Daily Budget' routines/README.md">updated table stays under 15/day</check>
  </verification>

  <commit>
    <type>feat</type>
    <scope>cadence</scope>
    <description>weekly skill-eval ritual + poller alerting + RET eval-delta rule (SKE-12)</description>
  </commit>
</session>
```

```xml
<session id="SKE-13" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>60 minutes</estimated_time>
    <effort>high</effort>
    <wave>4</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-12</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-13 (CONDITIONAL). CONSTITUTION progressive split: &lt;=15-line core
    always loaded + per-domain modules force-loaded by path/operation hook; RET targets
    updated. Condition: SKE-11's eval baseline has been stable.
  </context>

  <constraints>
    <constraint priority="critical">Condition gate at run start: stable means >=1 post-SKE-11 full eval run AND no such run with a >5 pt precision/recall drop vs the SKE-11 baseline (panel WARN T-04 - quantified, same threshold as SKE-12). If not met, complete as a documented no-op ("condition not met, no changes") - the chain flows on; do not force the split.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="VERIFY">
      <title>Condition check (quantified): stable = at least one full eval run recorded AFTER SKE-11, and NO post-SKE-11 run shows a precision or recall drop >5 pts vs the SKE-11 baseline (the same threshold SKE-12 alerts on). Fewer than one post-SKE-11 run = NOT stable</title>
    </task>
    <task id="2" action="EDIT">
      <title>(only if stable) CONSTITUTION core &lt;=15 lines + per-domain modules + force-load hook; RET known-pattern targets updated</title>
    </task>
  </tasks>

  <verification>
    <check name="condition_recorded" gate_class="machine" command="grep -c 'SKE-13' ske/SKE_PROGRESS.md">completion row present with either outcome (split landed / condition-not-met no-op) documented in the Session Log</check>
    <check name="violation_rate" gate_class="fuzzy" command="RET principle-violation rate over 2 weeks">unchanged (post-split observation window)</check>
  </verification>

  <commit>
    <type>refactor</type>
    <scope>constitution</scope>
    <description>progressive CONSTITUTION split (conditional on stable baseline) (SKE-13)</description>
  </commit>
</session>
```

```xml
<session id="SKE-14" project="SKE_SKILLS_EVOLUTION">
  <metadata>
    <working_directory>~/Documents/GitHub/solomon-workspace</working_directory>
    <estimated_time>30 minutes</estimated_time>
    <effort>medium</effort>
    <wave>4</wave>
  </metadata>

  <dependencies>
    <requires status="pending">SKE-13</requires>
  </dependencies>

  <system_configuration>
    <model>claude-fable-5</model>
  </system_configuration>

  <context>
    Plan section 3, SKE-14. HFS Agentic Workflow v2.1 doc + SKE retrospective. The Success
    claim (plan section 7): >=11 of 22 dormant org-authored skills record a load within 60
    days of Wave 1 completion, precision/recall guard >=0.9; failure fires the pruning trigger.
  </context>

  <constraints>
    <constraint priority="critical">No fixed-calendar gate may block completion (panel I-01): if the Success-claim date or the Mem0 reset (2026-09-01) has not arrived, record each as a dated pending step and complete.</constraint>
  </constraints>

  <tasks>
    <task id="1" action="CREATE">
      <title>HFS Agentic Workflow v2.1: v1.12, tracer stage, tdd/review gates, eval gate, ownership taxonomy (ADR-0002), single-root model</title>
    </task>
    <task id="2" action="RUN">
      <title>RET retrospective over the SKE chain; encode accepted lessons as Encoding commits</title>
    </task>
    <task id="3" action="VERIFY">
      <title>Success claim: evaluate if due, else record evaluation date + standing instruction. Mem0 usage re-run: execute if past 2026-09-01, else record as dated pending</title>
    </task>
  </tasks>

  <verification>
    <check name="workflow_doc" gate_class="machine" command="ls hfs-development-kit/workflow/HFS_AGENTIC_WORKFLOW_v2.1*.md">present</check>
    <check name="claim_handled" gate_class="machine" command="grep -c 'Success claim' ske/SKE_PROGRESS.md">evaluated or dated-pending recorded</check>
    <check name="retro_encoded" gate_class="machine" command="git -C hfs-development-kit log --oneline --grep 'ret(' | head -3">at least one Encoding commit from the retro (or a documented zero-lesson outcome)</check>
  </verification>

  <commit>
    <type>docs</type>
    <scope>workflow</scope>
    <description>HFS Agentic Workflow v2.1 + SKE retrospective + success-claim disposition (SKE-14)</description>
  </commit>
</session>
```
