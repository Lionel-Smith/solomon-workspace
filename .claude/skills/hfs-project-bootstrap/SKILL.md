---
name: hfs-project-bootstrap
description: Orchestrate HFS project setup, including research, planning, and portable bundle creation. Use when starting a new HFS project, setting up a new Claude Project, or creating bundles to transfer work between projects. Triggers on phrases like "start new HFS project", "bootstrap project", "create project bundle", "set up new project", "export project for new chat".
---

# HFS Project Bootstrap Skill

Orchestrate complete HFS project setup from research through execution-ready bundles.

## Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    HFS PROJECT BOOTSTRAP                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  INPUT: Project idea/requirements                                    │
│                                                                      │
│    ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐  │
│    │   Research   │────>│   Planning   │────>│   Quality Gate   │  │
│    │ (Optional)   │     │   Pipeline   │     │  (Review Loop)   │  │
│    └──────────────┘     └──────────────┘     └──────────────────┘  │
│           │                    │                      │             │
│           ▼                    ▼                      ▼             │
│    ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐  │
│    │  RESEARCH.md │     │   PLAN.md    │     │   *_FINAL.md     │  │
│    │              │     │  PROMPTS.md  │     │  (Quality ≥90)   │  │
│    └──────────────┘     └──────────────┘     └──────────────────┘  │
│                                                      │              │
│                                                      ▼              │
│                              ┌─────────────────────────────────────┐│
│                              │         PROJECT BUNDLE              ││
│                              │  • Single combined .md file         ││
│                              │  • ZIP with all project files       ││
│                              │  • Ready for new Claude Project     ││
│                              └─────────────────────────────────────┘│
│                                                                      │
│  OUTPUT: Portable project bundle for execution                       │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Trigger Patterns

| User Says | Action |
|-----------|--------|
| "Start new HFS project for [X]" | Full pipeline: Research → Plan → Prompts → Review → Bundle |
| "Bootstrap [project name]" | Full pipeline |
| "Create project bundle for [X]" | Bundle existing project documents |
| "Export project to new chat" | Create portable bundle |
| "Set up new Claude Project for [X]" | Create bundle with HFS skills + project docs |
| "Package [X] for execution" | Create execution-ready bundle |

## Pipeline Stages

### Stage 1: Research (Optional)

Use when project needs market/technical research before planning.

```
Claude, use deep-app-research for [PROJECT_NAME]
Focus: [government | hospitality | health | finance | utilities]
```

**Output:** `{PROJECT}_RESEARCH.md`

**Skip if:**
- Requirements are already clear and complete
- Project is well-understood (e.g., internal tools)
- Time-constrained (can research during planning)

### Stage 2: Architecture Planning

Generate comprehensive architecture document.

```
Claude, create architecture plan for [PROJECT_NAME]

Context: [paste RESEARCH.md summary or requirements]
Tech: [Flask/Quart backend, React frontend, PostgreSQL]
Timeline: [X weeks]
```

**Output:** `{PROJECT}_PLAN.md`

**Includes:**
- Executive summary with design decisions
- Data model (PostgreSQL with PostGIS if geospatial)
- API specification
- User flows
- UI/UX wireframes
- Implementation roadmap

### Stage 3: Implementation Prompts

Convert architecture into executable sessions.

```
Claude, create implementation prompts from {PROJECT}_PLAN.md
```

**Output:** `{PROJECT}_PROMPTS.md`

**Includes:**
- Session metadata (ID, time, dependencies)
- Full code snippets per task
- Verification checklists
- Git commit templates
- Parallel execution map

### Stage 4: Quality Gate (Ralph Wiggum Loop)

Review and refine documents iteratively.

```
Claude, use plan-review-loop on {PROJECT}_PLAN.md --max-iterations 3
Claude, use plan-review-loop on {PROJECT}_PROMPTS.md --max-iterations 3
```

**Output:** 
- `{PROJECT}_PLAN_v1.md` → `{PROJECT}_PLAN_v2.md` → `{PROJECT}_PLAN_FINAL.md`
- `{PROJECT}_PROMPTS_v1.md` → `{PROJECT}_PROMPTS_FINAL.md`

**Exit criteria:**
- Quality score ≥ 90/100
- Zero critical issues
- All validation rules passed

### Stage 5: Bundle Creation

Package everything for portability.

```
Claude, create project bundle for [PROJECT_NAME]
Include: [skills | prompts | architecture | all]
```

## Bundle Types

### 1. Single-File Bundle (Recommended)

One `.md` file with everything needed for execution.

**Contents:**
```markdown
# {PROJECT} Complete Bundle

## Quick Reference
- Project ID, timeline, tech stack
- Key commands

## Part 1: Architecture Plan
[Full PLAN_FINAL.md content]

## Part 2: Implementation Prompts  
[Full PROMPTS_FINAL.md content]

## Part 3: Session Orchestrator Skill
[Skill for execution tracking]
```

**Use when:**
- Starting execution in new Claude Project
- Sharing project with team member
- Archiving completed planning

### 2. Full Bundle (ZIP)

All individual files for maximum flexibility.

**Contents:**
```
{project}-bundle/
├── README.md                    # Quick start guide
├── {PROJECT}_PLAN_FINAL.md      # Architecture
├── {PROJECT}_PROMPTS_FINAL.md   # Implementation
├── SKILL_session-orchestrator.md
├── SKILL_debugging-workflow.md
├── SKILL_plan-review-loop.md
└── [Additional project-specific files]
```

**Use when:**
- Need to modify individual files
- Want audit trail of versions
- Including reference data

### 3. HFS Full Stack Bundle

Complete HFS workflow with all skills.

**Contents:**
```
hfs-full-bundle/
├── HFS_ALL_SKILLS_COMBINED.md   # All 11 skills in one file
├── HFS_AGENTIC_WORKFLOW_v1_4.md # Latest workflow
├── INSTANT_BOOTSTRAP.md         # Quick start
└── [Project-specific files]
```

**Use when:**
- Setting up brand new HFS Claude Project
- Onboarding new team member
- Complete workflow needed

## Bundle Creation Commands

### Create Single-File Bundle

```bash
# Combine key files into one
cat > {PROJECT}_COMPLETE.md << 'EOF'
# {PROJECT} - Complete Project Bundle

**Project ID:** {ID}
**Export Date:** {DATE}
**Status:** Ready for Execution

---

## Quick Reference
[Summary info]

---

# PART 1: ARCHITECTURE PLAN

EOF

cat {PROJECT}_PLAN_FINAL.md >> {PROJECT}_COMPLETE.md

echo -e "\n---\n\n# PART 2: IMPLEMENTATION PROMPTS\n" >> {PROJECT}_COMPLETE.md
cat {PROJECT}_PROMPTS_FINAL.md >> {PROJECT}_COMPLETE.md

echo -e "\n---\n\n# PART 3: SESSION ORCHESTRATOR SKILL\n" >> {PROJECT}_COMPLETE.md
cat SKILL_session-orchestrator.md >> {PROJECT}_COMPLETE.md
```

### Create ZIP Bundle

```bash
mkdir -p {project}-bundle

# Copy files
cp {PROJECT}_PLAN_FINAL.md {project}-bundle/
cp {PROJECT}_PROMPTS_FINAL.md {project}-bundle/
cp SKILL_*.md {project}-bundle/

# Create README
cat > {project}-bundle/README.md << 'EOF'
# {PROJECT} Bundle

## Quick Start
1. Upload all .md files to Claude Project knowledge
2. Start: "Claude, execute session {PREFIX}-01"

## Files
- {PROJECT}_PLAN_FINAL.md - Architecture
- {PROJECT}_PROMPTS_FINAL.md - Implementation sessions
- SKILL_*.md - Supporting skills
EOF

# Create ZIP
zip -j {project}-bundle.zip {project}-bundle/*
```

## Quick Reference Commands

### Full Pipeline (New Project)

```
Claude, bootstrap new HFS project:

Project: [NAME]
Description: [What it does]
Users: [Target users]
Tech: Flask + React + PostgreSQL
Timeline: [X weeks]

Run full pipeline:
1. Deep research (if needed)
2. Architecture plan
3. Implementation prompts
4. Quality review (3 iterations)
5. Create portable bundle
```

### Bundle Existing Project

```
Claude, create project bundle for [PROJECT_NAME]

Include:
- Architecture plan (FINAL version)
- Implementation prompts (FINAL version)  
- Session orchestrator skill
- Debugging workflow skill

Output: Single combined .md file
```

### Setup New Claude Project

```
Claude, create HFS project setup bundle

Include:
- All 11 HFS skills (combined)
- Latest workflow (v1.4)
- Instant bootstrap prompt
- [Specific project files if any]
```

## File Naming Conventions

| File Type | Pattern | Example |
|-----------|---------|---------|
| Research | `{PROJECT}_RESEARCH.md` | `NIB_CALCULATOR_RESEARCH.md` |
| Architecture | `{PROJECT}_PLAN.md` | `NIB_CALCULATOR_PLAN.md` |
| Prompts | `{PROJECT}_PROMPTS.md` | `NIB_CALCULATOR_PROMPTS.md` |
| Review version | `{FILE}_v{N}.md` | `NIB_CALCULATOR_PLAN_v2.md` |
| Final approved | `{FILE}_FINAL.md` | `NIB_CALCULATOR_PLAN_FINAL.md` |
| Combined bundle | `{PROJECT}_COMPLETE.md` | `NIB_CALCULATOR_COMPLETE.md` |
| ZIP bundle | `{project}-bundle.zip` | `nib-calculator-bundle.zip` |

## Integration with HFS Workflow v1.4

```
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 0: Research (NEW - optional)                                 │
│  • Use deep-app-research skill                                      │
│  • Output: {PROJECT}_RESEARCH.md                                    │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 1: Architecture                                              │
│  • Use project-plan-creator skill                                   │
│  • Output: {PROJECT}_PLAN.md                                        │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 2: Implementation Planning                                   │
│  • Use implementation-plan-generator skill                          │
│  • Output: {PROJECT}_PROMPTS.md                                     │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 2.7: Quality Gate (NEW)                                      │
│  • Use plan-review-loop skill                                       │
│  • Output: {PROJECT}_*_FINAL.md (quality ≥ 90)                      │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 2.8: Bundle Creation (NEW)                                   │
│  • Use hfs-project-bootstrap skill                                  │
│  • Output: {PROJECT}_COMPLETE.md or {project}-bundle.zip            │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Phase 3: Execution                                                 │
│  • Use session-orchestrator skill                                   │
│  • Upload bundle to new Claude Project                              │
│  • Execute sessions sequentially                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## Example: Full Project Bootstrap

```
User: Bootstrap new HFS project for Smart-Tender restaurant ordering

Claude:
Starting HFS Project Bootstrap for Smart-Tender...

## Stage 1: Research
Running deep-app-research for hospitality/tourism market...
[Creates SMART_TENDER_RESEARCH.md]

## Stage 2: Architecture  
Creating architecture plan...
[Creates SMART_TENDER_PLAN.md]

## Stage 3: Implementation Prompts
Generating session prompts...
[Creates SMART_TENDER_PROMPTS.md]

## Stage 4: Quality Gate
Running plan-review-loop (3 iterations)...

Review Iteration 1: Score 76/100
- [CRIT-001] Missing payment error handling → Fixed
- [WARN-002] No offline mode → Fixed
[Creates SMART_TENDER_PLAN_v1.md]

Review Iteration 2: Score 88/100
- [WARN-003] Missing rate limiting → Fixed
[Creates SMART_TENDER_PLAN_v2.md]

Review Iteration 3: Score 94/100
- No critical issues
[Creates SMART_TENDER_PLAN_FINAL.md]

## Stage 5: Bundle Creation
Creating portable bundle...
[Creates SMART_TENDER_COMPLETE.md]
[Creates smart-tender-bundle.zip]

✅ Bootstrap Complete!

Files ready for download:
- SMART_TENDER_COMPLETE.md (single file, 85KB)
- smart-tender-bundle.zip (full bundle, 120KB)

Next: Upload to new Claude Project and run:
"Claude, execute session ST-01 from Smart-Tender prompts"
```

## Common Mistakes to Avoid

| Mistake | Impact | Prevention |
|---------|--------|------------|
| Skipping quality gate | Bugs in prompts, rework | Always run plan-review-loop |
| Not including skills in bundle | Can't execute properly | Include session-orchestrator at minimum |
| Creating nested folders | Claude can't read | Use flat file structure |
| Huge single file | Context overflow | Split if > 100KB |
| Missing version in filename | Confusion | Always use _v{N} or _FINAL |

---

*HFS Project Bootstrap Skill v1.0*
*High Functioning Solutions Ltd.*
