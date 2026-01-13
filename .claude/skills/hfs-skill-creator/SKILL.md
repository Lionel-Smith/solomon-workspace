---
name: hfs-skill-creator
description: Create, validate, and enhance skills following HFS Workflow v1.7 XML format. Use when creating new skills, updating existing skills to v1.7 format, validating skill completeness, or converting markdown skills to XML format.
---

# HFS Skill Creator

Guide for creating effective skills that integrate with the HFS agentic development workflow.

## Triggers

- When user wants to create a new skill
- When user wants to update an existing skill to v1.7 format
- When user says "create skill for X"
- When user says "validate this skill"
- When user says "enhance this skill"
- When converting markdown skills to XML format
- When reviewing skill quality before adding to HFS Development Kit

## Constraints

### Structure (Critical)
- Skills MUST use XML format with proper structure
- Skills MUST have: metadata, description, triggers, constraints, forbidden, workflow, verification
- All constraint tags MUST have priority attribute (critical/high/medium)
- All forbidden patterns MUST have reason attribute explaining WHY

### Content (High)
- Description must clearly state WHEN to use the skill (triggers)
- Workflow must have numbered steps with name, description, output
- Verification checks must be automatable where possible
- Examples should demonstrate real-world usage patterns

### Size (High/Medium)
- SKILL.md body should be under 500 lines
- Split large reference content into separate files
- Use CDATA for code templates to preserve formatting

### Integration (High/Medium)
- Skills must integrate with HFS Workflow phases
- Forbidden patterns from skills merge with session forbidden patterns
- Consider which other skills this skill requires or provides

## Forbidden Patterns

| Pattern | Reason |
|---------|--------|
| Using markdown format instead of XML for HFS skills | loses constraint enforcement |
| Constraints without priority attribute | constraints get ignored |
| Forbidden patterns without reason attribute | patterns get skipped without understanding |
| Missing or vague description/triggers | skill never triggers |
| Verification checks that can't be automated | untestable, unclear success criteria |
| Workflows without clear outputs per step | skill purpose unclear |
| Examples that don't show real code/commands | too abstract to be useful |
| Duplicating content between SKILL.md and references | context window bloat |
| Creating skills without updating README inventory | orphaned skill |
| Skills that don't declare requires/provides | breaks dependency chain |
| Skills without version in metadata | version drift |

## Workflow

### Step 1: Understand Skill Purpose
Gather concrete examples of how the skill will be used:
- What user requests should trigger this skill?
- What tasks does it help accomplish?
- What would Claude do differently WITH vs WITHOUT this skill?
- What mistakes should this skill prevent?

ASK these questions if not clear. Don't assume.

**Output:** Clear understanding of skill scope and triggers

### Step 2: Identify Constraints and Forbidden Patterns
Extract the rules this skill enforces:
- What MUST always happen? (constraints with priority)
- What must NEVER happen? (forbidden with reason)
- What lessons from past projects apply?
- What integration requirements exist?

This is the CORE VALUE of HFS skills - enforcement through structure.

**Output:** List of constraints with priorities, forbidden patterns with reasons

### Step 3: Design Workflow Steps
Break the skill's process into numbered steps:
- Each step has: name, description, output
- Steps should be sequential and verifiable
- Include decision points where relevant
- Consider what happens on errors

**Output:** Numbered workflow with clear progression

### Step 4: Define Verification Checks
Create checks that confirm skill was applied correctly:
- Prefer automated commands over manual inspection
- Include both positive checks (X exists) and negative (Y absent)
- Reference constraints - each critical constraint needs a check

**Output:** Verification section with named, automatable checks

### Step 5: Write XML Structure
Assemble the skill using the XML template:
- Start with metadata (author, dates, category)
- Write description with clear triggers
- Add constraints with priorities
- Add forbidden patterns with reasons
- Include requires/provides for integration
- Add workflow steps
- Add verification checks
- Add templates if applicable
- Add examples showing usage

**Output:** Complete SKILL.md in XML format

### Step 6: Validate Skill
Run validation checklist:
- All required sections present?
- All constraints have priority?
- All forbidden patterns have reason?
- Workflow has clear outputs?
- Verification checks automatable?
- Size under 500 lines?
- No duplicate content?

**Output:** Validation report with pass/fail per check

### Step 7: Integrate into Kit
If adding to HFS Development Kit:
- Create skills/{skill-name}/SKILL.md
- Update README.md skill inventory
- Update CHANGELOG.md
- Commit with descriptive message

**Output:** Skill integrated and documented

## Validation Checklist

### Structure Checks
| ID | Severity | Check |
|----|----------|-------|
| S1 | Critical | Has XML declaration and root skill element |
| S2 | Critical | Has metadata section with author, created, updated, category |
| S3 | Critical | Has description with summary and details |
| S4 | Critical | Has triggers section with at least one trigger |
| S5 | Critical | Has constraints section |
| S6 | Critical | Has forbidden section |
| S7 | High | Has workflow section with steps |
| S8 | High | Has verification section |
| S9 | Medium | Has requires/provides sections |
| S10 | Medium | Has examples section |

### Constraint Checks
| ID | Severity | Check |
|----|----------|-------|
| C1 | Critical | Every constraint has priority attribute |
| C2 | Critical | Priority values are: critical, high, or medium |
| C3 | High | At least one critical constraint exists |
| C4 | High | Constraints are specific and actionable |
| C5 | Medium | Constraints don't duplicate forbidden patterns |

### Forbidden Pattern Checks
| ID | Severity | Check |
|----|----------|-------|
| F1 | Critical | Every pattern has reason attribute |
| F2 | High | Reasons explain the failure mode (WHY it's bad) |
| F3 | High | Patterns are specific enough to match |
| F4 | Medium | Patterns cover known failure modes from experience |

## Scoring Rubric

| Category | Weight | 10 Points | 7 Points | 4 Points | 1 Point |
|----------|--------|-----------|----------|----------|---------|
| Structure | 25% | All sections, proper XML | Most sections, minor issues | Missing key sections | Wrong format |
| Constraints | 25% | Comprehensive with priorities | Good but missing some | Basic, vague | No/trivial constraints |
| Forbidden | 25% | Comprehensive with reasons | Some missing reasons | Basic, generic | No patterns/reasons |
| Workflow | 15% | Clear with outputs, automatable | Good but not fully automatable | Basic, weak verification | No workflow |
| Integration | 10% | Clear triggers, requires/provides | Good triggers, missing details | Vague triggers | Unclear usage |

### Grades
- **90+**: Excellent - Ready for production use
- **75-89**: Good - Minor improvements recommended
- **60-74**: Acceptable - Needs enhancement before use
- **40-59**: Poor - Significant rework required
- **0-39**: Failing - Does not meet HFS standards

## Skill Template

```xml
<?xml version="1.0" encoding="UTF-8"?>
<skill name="{skill-name}" version="1.0">

  <metadata>
    <author>High Functioning Solutions Ltd.</author>
    <created>{YYYY-MM-DD}</created>
    <updated>{YYYY-MM-DD}</updated>
    <category>{backend|frontend|planning|testing|research|meta}</category>
  </metadata>

  <description>
    <summary>{One-line description}</summary>
    <details>{Detailed description}</details>
  </description>

  <triggers>
    <trigger>When {specific condition}</trigger>
  </triggers>

  <constraints>
    <constraint priority="critical">{Absolute requirement}</constraint>
    <constraint priority="high">{Important rule}</constraint>
  </constraints>

  <forbidden>
    <pattern reason="{why}">{Anti-pattern}</pattern>
  </forbidden>

  <requires>
    <skill optional="true">{optional-skill}</skill>
  </requires>

  <provides>
    <capability>{What this skill enables}</capability>
  </provides>

  <workflow>
    <step order="1">
      <name>{Step name}</name>
      <description>{What to do}</description>
      <output>{What this step produces}</output>
    </step>
  </workflow>

  <verification>
    <check name="{check-name}">{How to verify}</check>
  </verification>

  <examples>
    <example name="{example-name}">
      <input>{User request}</input>
      <output>{Expected response}</output>
    </example>
  </examples>

</skill>
```

## Verification

- Created skill passes all S1-S8 structure checks
- All constraints have priority, all forbidden have reason
- Workflow has numbered steps with outputs
- Skill scores 60+ on rubric
