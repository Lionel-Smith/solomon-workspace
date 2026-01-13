<?xml version="1.0" encoding="UTF-8"?>
<skill name="hfs-repo-maintenance" version="1.2">

  <metadata>
    <author>High Functioning Solutions Ltd.</author>
    <created>2026-01-07</created>
    <updated>2026-01-07</updated>
    <category>meta</category>
  </metadata>

  <description>
    <summary>Maintain and extend the HFS Development Kit repository</summary>
    <details>
      Meta-skill for evolving the HFS agentic workflow system. Documents coding
      philosophy, skill authoring patterns, and repository contribution guidelines.
      Use when adding new skills, updating workflows, or refining the agentic
      coding style that underpins all HFS projects.
    </details>
  </description>

  <triggers>
    <trigger>When adding a new skill to the HFS Development Kit</trigger>
    <trigger>When updating workflow documentation</trigger>
    <trigger>When refining agentic coding patterns</trigger>
    <trigger>When user says "update the HFS repo" or "add a skill"</trigger>
    <trigger>When documenting lessons learned from projects</trigger>
    <trigger>When encoding a new anti-pattern or constraint</trigger>
  </triggers>

  <!-- ═══════════════════════════════════════════════════════════════════════
       LIONEL'S AGENTIC CODING PHILOSOPHY
       Extracted from HFS Workflow v1.8 + BDOCS Retrospective
       ═══════════════════════════════════════════════════════════════════════ -->

  <philosophy>
    <principle name="prove-it-works" priority="1">
      Nothing is "done" until verified working end-to-end. UI rendering is not
      proof. API returning 200 with real data is proof. Tests passing against
      real backends is proof.
    </principle>

    <principle name="trust-but-verify" priority="2">
      Claude can do a lot autonomously, but always verify before declaring done.
      Run the tests. Check the network tab. Stop the backend and confirm error
      states render.
    </principle>

    <principle name="fail-fast-fail-visibly" priority="3">
      Errors must surface immediately, never be swallowed or masked. An empty
      array hiding a 404 is worse than a crash. A false positive UI is worse
      than an error screen.
    </principle>

    <principle name="ask-on-architecture" priority="4">
      Claude should be autonomous on implementation details but ask on design
      and structure choices. If it affects how systems connect, ask first.
    </principle>

    <principle name="educational-communication" priority="5">
      Explain what you're doing and why. Learning happens in the doing.
    </principle>
  </philosophy>

  <!-- ═══════════════════════════════════════════════════════════════════════
       CONSTRAINTS - Rules for Claude when working on HFS projects
       ═══════════════════════════════════════════════════════════════════════ -->

  <constraints>
    <!-- Repository structure constraints -->
    <constraint priority="critical">All skills must follow SKILL_FORMAT_v1.7.md structure</constraint>
    <constraint priority="critical">Version numbers in filenames must match content version</constraint>
    <constraint priority="critical">CHANGELOG.md must be updated for any user-facing change</constraint>

    <!-- Architecture constraints (from workflow) -->
    <constraint priority="critical">Follow three-layer architecture: Controller → Service → Repository</constraint>
    <constraint priority="critical">All new code must have tests</constraint>
    <constraint priority="critical">No mock fallbacks in catch blocks</constraint>
    <constraint priority="critical">Dependencies = completion + integration verification, not just sequence</constraint>

    <!-- Integration constraints (from BDOCS lesson) -->
    <constraint priority="critical">Frontend sessions BLOCKED until API Contract Lock verified</constraint>
    <constraint priority="critical">Pre-flight integration checks before ANY frontend session</constraint>
    <constraint priority="high">E2E tests must run against real backend, not mocked APIs</constraint>
    <constraint priority="high">"Renders correctly" is NOT sufficient verification - API must return 200</constraint>

    <!-- Documentation constraints -->
    <constraint priority="high">Skills must include at least one workflow with steps</constraint>
    <constraint priority="high">Forbidden patterns must include reasoning (the WHY)</constraint>
    <constraint priority="high">Examples should demonstrate real-world usage</constraint>
    <constraint priority="high">Retrospective lessons must be encoded into skills/forbidden patterns</constraint>

    <!-- Git constraints -->
    <constraint priority="high">Commits must be atomic - one logical change per commit</constraint>
    <constraint priority="medium">Commit messages should reference the skill or component changed</constraint>

    <!-- Async patterns (from workflow) -->
    <constraint priority="high">Use async patterns for Quart (selectinload, joinedload)</constraint>
    <constraint priority="high">Convert to DTOs while database session is open</constraint>
  </constraints>

  <!-- ═══════════════════════════════════════════════════════════════════════
       FORBIDDEN PATTERNS - Anti-patterns learned from experience
       Source: HFS Workflow v1.8 + BDOCS Retrospective
       ═══════════════════════════════════════════════════════════════════════ -->

  <forbidden>
    <!-- Error handling (BDOCS lessons) -->
    <pattern reason="hides errors, creates false positive UI">catch { return [] }</pattern>
    <pattern reason="hides errors, impossible to debug">catch { return MOCK_DATA }</pattern>
    <pattern reason="hides null responses, silent failure">response?.data ?? []</pattern>
    <pattern reason="swallows ALL errors including real bugs">catch { /* empty */ }</pattern>

    <!-- Mock/stub patterns (BDOCS anti-patterns) -->
    <pattern reason="'temporary' mocks become permanent">// Return mock data if endpoint doesn't exist yet</pattern>
    <pattern reason="creates false positive tests">E2E tests that mock APIs instead of calling real backend</pattern>
    <pattern reason="never gets removed, creates tech debt">// TODO: Replace with actual API call</pattern>
    <pattern reason="intent documented but never executed">TODO comments without tracking mechanism</pattern>

    <!-- Architecture violations -->
    <pattern reason="wrong layer - bypasses service logic">Database queries in controller</pattern>
    <pattern reason="wrong layer - couples service to HTTP">HTTP response codes in service layer</pattern>
    <pattern reason="wrong layer - business logic should be in service">Business logic in repository</pattern>
    <pattern reason="NIB lesson - confusing project structure">Nested app/app/ directories</pattern>

    <!-- Async issues -->
    <pattern reason="lazy loading fails outside session">Accessing SQLAlchemy relationships outside async session</pattern>
    <pattern reason="blocks event loop">Using sync SQLAlchemy in async Quart code</pattern>

    <!-- Repository maintenance -->
    <pattern reason="version drift">Updating workflow content without bumping version</pattern>
    <pattern reason="orphaned files">Creating skills without adding to README inventory</pattern>
    <pattern reason="breaks compatibility">Removing skill fields without deprecation period</pattern>
    <pattern reason="unclear purpose">Skills without clear trigger conditions</pattern>
    <pattern reason="untestable">Verification checks that can't be automated</pattern>

    <!-- Dependency/integration violations -->
    <pattern reason="BDOCS root cause - leads to mock fallbacks">Starting frontend sessions before API Contract Lock</pattern>
    <pattern reason="sequence ≠ integration verification">Dependencies as execution order only</pattern>
    <pattern reason="doesn't verify integration">Verification checklist without API connectivity checks</pattern>
  </forbidden>

  <requires>
    <!-- No required skills - this is a foundation skill -->
  </requires>

  <provides>
    <capability>Skill authoring guidelines</capability>
    <capability>Repository contribution workflow</capability>
    <capability>Agentic coding philosophy documentation</capability>
    <capability>Version management for HFS artifacts</capability>
    <capability>Retrospective-to-constraint encoding</capability>
  </provides>

  <!-- ═══════════════════════════════════════════════════════════════════════
       WORKFLOW - How to maintain this repository
       ═══════════════════════════════════════════════════════════════════════ -->

  <workflow>
    <step order="1">
      <n>Identify change type</n>
      <description>
        Determine if this is:
        - New skill creation
        - Skill update/enhancement
        - Workflow version bump
        - Documentation improvement
        - Retrospective capture / lesson encoding
      </description>
      <o>Change type classification</o>
    </step>

    <step order="2">
      <n>Review existing patterns</n>
      <description>
        Before creating/modifying, review:
        - SKILL_FORMAT_v1.7.md for structure
        - Similar existing skills for conventions
        - CHANGELOG.md for recent evolution
        - retrospectives/ for lessons learned
        - HFS_AGENTIC_WORKFLOW_v1.8_FINAL.md for philosophy
      </description>
      <o>Context for consistent contribution</o>
    </step>

    <step order="3">
      <n>Implement change</n>
      <description>
        Make the change following constraints:
        - Use XML structure for skills
        - Include all required sections
        - Add verification checks
        - Include reasoning for forbidden patterns
        - Update README.md inventory if new skill
      </description>
      <o>Updated/new skill file</o>
    </step>

    <step order="4">
      <n>Update CHANGELOG</n>
      <description>
        Add entry to CHANGELOG.md:
        - Version bump if significant
        - Date of change
        - Description of what changed
        - Link to relevant files
      </description>
      <o>Updated CHANGELOG.md</o>
    </step>

    <step order="5">
      <n>Commit with context</n>
      <description>
        Commit message format:
        feat(skill-name): description
        fix(workflow): description
        docs: description
      </description>
      <o>Atomic commit</o>
    </step>

    <step order="6">
      <n>Handle failures</n>
      <description>
        If validation fails or changes cause issues:
        - git stash or git checkout to revert
        - Document what went wrong in issue or notes
        - Create GitHub issue for tracking if systemic
        - Do NOT commit broken state
      </description>
      <o>Clean rollback or documented issue</o>
    </step>
  </workflow>

  <!-- ═══════════════════════════════════════════════════════════════════════
       ON_ERROR - Decision tree for problems
       ═══════════════════════════════════════════════════════════════════════ -->

  <on_error>
    <if condition="validation_fails">Fix issues, re-run validation before proceeding</if>
    <if condition="git_conflict">Resolve conflict, preserve both changes if possible</if>
    <if condition="skill_breaks_existing">Rollback, investigate compatibility, add deprecation if needed</if>
    <if condition="unclear_requirements">Ask user for clarification before proceeding</if>
    <if condition="xml_parse_error">Check for unescaped &lt; &gt; &amp; characters, use CDATA for code</if>
    <if condition="skill_too_large">Split into main skill + references/ files</if>
  </on_error>

  <!-- ═══════════════════════════════════════════════════════════════════════
       AGENTIC PATTERNS - Named patterns that define the HFS approach
       ═══════════════════════════════════════════════════════════════════════ -->

  <agentic-patterns>
    <pattern name="API Contract Lock">
      <description>
        Frontend work is BLOCKED until backend APIs are proven working.
        "Proven" means: health endpoint returns 200, data endpoint returns
        real records, CORS is configured. No exceptions.
      </description>
      <when>Before starting ANY frontend session in a fullstack project</when>
      <example>
        curl -sf http://localhost:5000/health || exit 1
        curl -sf http://localhost:5000/api/v1/inmates | jq '.total' | grep -q '[0-9]' || exit 1
      </example>
    </pattern>

    <pattern name="Integration Gate">
      <description>
        Pre-flight checks before frontend sessions. If any check fails,
        DO NOT PROCEED. Start the backend first.
      </description>
      <when>Before every FE-XX session</when>
      <example>
        <![CDATA[
<integration_gate enabled="true">
  <check name="health">curl -sf http://localhost:5000/health</check>
  <check name="data">curl -sf http://localhost:5000/api/v1/{entity} | jq '.total'</check>
  <action_on_fail>DO NOT PROCEED. Start backend first.</action_on_fail>
</integration_gate>
        ]]>
      </example>
    </pattern>

    <pattern name="Throw Don't Swallow">
      <description>
        Errors must surface, not hide. A visible error is infinitely better
        than a silent failure that looks like success.
      </description>
      <when>Any catch block, any error handling</when>
      <example>
        <![CDATA[
// WRONG - hides the error
catch { return []; }

// RIGHT - surfaces the error
catch (error) {
  throw new Error(`Failed to fetch: ${error.message}`);
}
        ]]>
      </example>
    </pattern>

    <pattern name="Verify Real Data">
      <description>
        "Renders correctly" is not verification. Verification means:
        - Open Network tab in DevTools
        - Confirm API returns HTTP 200
        - Confirm response contains expected data shape
        - Stop backend, confirm error state renders
      </description>
      <when>Completing any frontend session</when>
      <example>
        1. Browser Network tab shows 200 response
        2. Response body matches expected DTO shape
        3. Data displayed matches database content
        4. Stopping backend shows error state, not empty/mock data
      </example>
    </pattern>

    <pattern name="Retrospective to Constraint">
      <description>
        When a project reveals a failure mode, don't just fix it - encode it.
        Add a forbidden pattern with reasoning. Update affected skills.
        Future projects benefit automatically.
      </description>
      <when>After any project retrospective identifies an anti-pattern</when>
      <example>
        BDOCS showed catch { return [] } hides integration failures.
        → Added to global forbidden patterns with reason "hides errors"
        → Added to fullstack-integration skill constraints
        → Added verification check "error state renders when backend stopped"
      </example>
    </pattern>

    <pattern name="Dependencies Mean Integration">
      <description>
        When a session depends on another, it means "that session's OUTPUT
        is WORKING", not just "that session has been attempted". A frontend
        session depending on BE-04 means BE-04's endpoints return real data.
      </description>
      <when>Defining session dependencies</when>
      <example>
        <![CDATA[
<!-- WRONG - just ordering -->
<depends>BE-04</depends>

<!-- RIGHT - completion verified -->
<requires status="complete">BE-04</requires>
<integration_gate enabled="true">
  <check>curl -sf localhost:5000/api/v1/inmates</check>
</integration_gate>
        ]]>
      </example>
    </pattern>
  </agentic-patterns>

  <!-- ═══════════════════════════════════════════════════════════════════════
       TEMPLATES
       ═══════════════════════════════════════════════════════════════════════ -->

  <templates>
    <template name="new-skill-skeleton" language="xml">
      <description>Starting point for new skills</description>
      <code><![CDATA[
<?xml version="1.0" encoding="UTF-8"?>
<skill name="{skill-name}" version="1.0">

  <metadata>
    <author>High Functioning Solutions Ltd.</author>
    <created>{date}</created>
    <updated>{date}</updated>
    <category>{category}</category>
  </metadata>

  <description>
    <summary>{One-line description}</summary>
    <details>{Detailed description}</details>
  </description>

  <triggers>
    <trigger>When {condition}</trigger>
  </triggers>

  <constraints>
    <constraint priority="critical">{Must do}</constraint>
  </constraints>

  <forbidden>
    <pattern reason="{why}">{Anti-pattern}</pattern>
  </forbidden>

  <workflow>
    <step order="1">
      <n>{Step}</n>
      <description>{What to do}</description>
      <o>{Output}</o>
    </step>
  </workflow>

  <verification>
    <check name="{name}" command="{cmd}">{How to verify}</check>
  </verification>

</skill>
      ]]></code>
    </template>

    <template name="retrospective-entry" language="markdown">
      <description>Template for capturing project lessons</description>
      <code><![CDATA[
# Retrospective: {Project Name}

**Date**: {YYYY-MM-DD}
**Project**: {project}
**Skills Used**: {skill-1}, {skill-2}

## What Worked Well
- {positive outcome}

## What Didn't Work
- {problem area}

## Anti-Patterns Observed
| Pattern | Impact | Where Found |
|---------|--------|-------------|
| {pattern} | {impact} | {file/location} |

## Root Cause Analysis (5 Whys)
1. Why? {first level}
2. Why? {second level}
3. Why? {third level}
4. Why? {fourth level}
5. Why? **{root cause}**

## Lessons to Encode
| Lesson | Skill to Update | Change Type |
|--------|-----------------|-------------|
| {lesson} | {skill} | constraint / forbidden / pattern |

## Action Items
- [ ] Add forbidden pattern: {pattern} reason: {why}
- [ ] Update {skill} with constraint: {constraint}
- [ ] Add verification check: {check}
      ]]></code>
    </template>

    <template name="forbidden-pattern" language="xml">
      <description>Adding a new forbidden pattern with proper reasoning</description>
      <code><![CDATA[
<!-- In the relevant skill's <forbidden> section -->
<pattern reason="{WHY this is bad - what failure mode does it cause}">
  {The actual code pattern or practice to forbid}
</pattern>

<!-- Example from BDOCS lesson -->
<pattern reason="hides errors, creates false positive UI">catch { return [] }</pattern>
      ]]></code>
    </template>
  </templates>

  <!-- ═══════════════════════════════════════════════════════════════════════
       VERIFICATION - With automated commands where possible
       ═══════════════════════════════════════════════════════════════════════ -->

  <verification>
    <check name="skill-structure" command="grep -l '&lt;constraints&gt;' skills/*/SKILL.md | wc -l">
      All skill files have constraints section
    </check>
    <check name="forbidden-has-reasons" command="grep -c 'pattern reason=' skills/*/SKILL.md">
      Count forbidden patterns with reasons (should match total patterns)
    </check>
    <check name="readme-updated" command="ls -d skills/*/ | xargs -I{} basename {} | while read s; do grep -q $s README.md || echo 'Missing: '$s; done">
      README.md lists all skills in skills/ directory
    </check>
    <check name="changelog-current" command="head -20 CHANGELOG.md | grep -c $(date +%Y-%m)">
      CHANGELOG.md has entry for current month
    </check>
    <check name="no-orphans" command="find skills -type d -mindepth 1 -maxdepth 1 | xargs -I{} sh -c 'test -f {}/SKILL.md || echo Missing: {}'">
      All skill directories contain SKILL.md
    </check>
    <check name="version-in-xml" command="grep -c 'version=' skills/*/SKILL.md">
      All skills have version in XML declaration
    </check>
  </verification>

  <!-- ═══════════════════════════════════════════════════════════════════════
       EXAMPLES
       ═══════════════════════════════════════════════════════════════════════ -->

  <examples>
    <example name="add-new-skill">
      <input><![CDATA[
User: "I want to add a skill for API documentation generation"
      ]]></input>
      <o><![CDATA[
Claude (asks first - architecture decision):
"API documentation touches multiple systems. A few questions:
1. OpenAPI/Swagger, or manual markdown docs?
2. Should it auto-generate from code or be written separately?
3. Does it need to validate that docs match actual endpoints?"

[After answers]
1. Creates skills/api-docs-generator/SKILL.md using new-skill-skeleton
2. Fills in triggers, constraints, forbidden patterns
3. Adds workflow steps specific to API doc generation
4. Validates skill using hfs-skill-creator checklist
5. Updates README.md skill inventory
6. Updates CHANGELOG.md
7. Commits: feat(api-docs-generator): add API documentation skill
      ]]></o>
    </example>

    <example name="encode-lesson-from-retrospective">
      <input><![CDATA[
User: "The BDOCS project showed that catch { return [] } breaks debugging"
      ]]></input>
      <o><![CDATA[
Claude:
1. Reads retrospectives/2026-01-bdocs.md for full context
2. Identifies root cause and affected patterns
3. Adds to global forbidden patterns in workflow doc:
   <pattern reason="hides errors, creates false positive UI">catch { return [] }</pattern>
4. Adds to fullstack-integration skill
5. Adds verification check: "error state renders when backend stopped"
6. Updates CHANGELOG.md
7. Commits: fix(workflow): forbid error-swallowing catch blocks (BDOCS lesson)
      ]]></o>
    </example>

    <example name="claude-asks-on-architecture">
      <input><![CDATA[
User: "Add a skill for deployment"
      ]]></input>
      <o><![CDATA[
Claude (asks first - this is an architecture decision):
"Deployment touches infrastructure. A few questions:
1. Is this for Docker, k8s, bare metal, or cloud-specific (AWS/GCP)?
2. Should it cover CI/CD pipeline setup or just the deployment step?
3. Does it need rollback procedures?"

[Waits for answers before proceeding]
      ]]></o>
    </example>
  </examples>

</skill>
