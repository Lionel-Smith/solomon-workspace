---
name: project-plan-creator
description: Create comprehensive architecture and project planning documents for software development initiatives. Use when starting a new project, planning a major refactor, designing system integrations, or documenting technical decisions. Generates structured plans with executive summaries, design decisions, data models, API specifications, migration strategies, and implementation roadmaps.
---

# Project Plan Creator

Create comprehensive architecture documents that serve as the blueprint for implementation.

## When to Use This Skill

| Scenario | Example |
|----------|---------|
| **New project kickoff** | Smart-Tender hospitality ordering platform |
| **Major refactoring** | NIB Pipeline Unification (consolidating modules) |
| **System integration** | Connecting payroll systems to NIB submission |
| **Technical debt resolution** | Eliminating code duplication |
| **Migration planning** | Database schema changes, API versioning |

## Document Structure

A complete project plan contains these sections:

```
{PROJECT}_PLAN.md
├── 1. Executive Summary
│   ├── Problem statement (what's broken/missing)
│   ├── Solution overview (what we're building)
│   └── Key design decisions table
│
├── 2. Data Model
│   ├── New entities
│   ├── Extended entities
│   ├── Relationships diagram
│   └── Index strategy
│
├── 3. API Design
│   ├── Endpoint specifications
│   ├── Request/response schemas (Pydantic DTOs)
│   └── Error handling
│
├── 4. User Flows (Backend)
│   ├── Happy path scenarios
│   ├── Edge cases
│   └── Error recovery
│
├── 5. Implementation Roadmap
│   ├── Phases and milestones
│   ├── Dependencies (BE → INT → FE)
│   └── Risk assessment
│
├── 6. Open Questions
│   └── Questions with resolutions and rationale
│
├── 7. Backend Patterns
│   ├── Three-layer architecture
│   ├── Async patterns
│   └── Error handling
│
├── 8. Frontend Specification (REQUIRED - v1.8)
│   ├── 8.1 Template Source (React, Shadcn, Tailwind)
│   ├── 8.2 Component Inventory (MUST USE from Shadcn)
│   ├── 8.3 DO NOT CREATE (forbidden custom primitives)
│   ├── 8.4 Page Structure (routes, components, endpoints)
│   ├── 8.5 State Management (React Query, Context, Zod)
│   └── 8.6 Type Synchronization (DTO → TypeScript mapping)
│
├── 9. Frontend User Flows (REQUIRED - v1.8)
│   ├── 9.1 Flow Documentation Template
│   ├── 9.2 Screen-by-screen flow tables
│   └── 9.3 Error Handling Flows
│
├── 10. Frontend Screen Inventory (REQUIRED - v1.8)
│   ├── 10.1 Screen Catalog (ID, name, route, priority)
│   ├── 10.2 Screen Wireframe Descriptions
│   ├── 10.3 Component-to-Screen Matrix
│   └── 10.4 Responsive Breakpoints
│
├── 11. Integration Points
│   ├── API Contract (base URL, auth, CORS)
│   ├── Type Sync (Pydantic → TypeScript)
│   └── Error Response Format
│
└── Appendices
    ├── Database migration SQL
    ├── Sample API flows
    └── Metrics and targets
```

## Workflow

### Step 1: Gather Requirements

Collect information about:

| Category | Questions |
|----------|-----------|
| **Problem** | What's broken? What's inefficient? What's missing? |
| **Users** | Who uses this? What are their pain points? |
| **Constraints** | Tech stack? Timeline? Budget? Compliance? |
| **Scope** | What's in? What's explicitly out? |
| **Success** | How do we measure success? |

### Step 2: Analyze Current State

Document the existing system:

```markdown
## Current State Analysis

### What Exists
- Module A: [description, location, responsibility]
- Module B: [description, location, responsibility]

### Pain Points
1. [Pain point with evidence]
2. [Pain point with evidence]

### Technical Debt
| Area | Debt | Impact | Effort to Fix |
|------|------|--------|---------------|
| [area] | [description] | High/Med/Low | High/Med/Low |
```

### Step 3: Design Solution

Apply design principles:

| Principle | Application |
|-----------|-------------|
| **Single Responsibility** | Each module has one clear purpose |
| **DRY** | Identify and eliminate duplication |
| **YAGNI** | Don't over-engineer |
| **Explicit > Implicit** | Document all decisions with rationale |

### Step 4: Document Decisions

Use decision tables for key choices:

```markdown
## Key Design Decisions

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|------------------------|-----------|
| Database matching | PostgreSQL pg_trgm | Python fuzzy matching | Performance at scale |
| Task processing | Celery batch per-file | Per-employee tasks | Reduce overhead |
| Auth strategy | JWT tokens | Sessions | Stateless scaling |
```

### Step 5: Define Data Model

Document schema changes:

```markdown
## Data Model Changes

### New Tables

#### employee_roster
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PK | Auto-increment |
| business_id | INTEGER | FK → businesses.id | Owning business |
| ni_number | VARCHAR(9) | NOT NULL, UNIQUE | NIB number |

### Extended Tables

#### nib_records (existing)
| New Column | Type | Default | Purpose |
|------------|------|---------|---------|
| roster_employee_id | INTEGER | NULL | FK to roster |
| match_status | VARCHAR(20) | 'PENDING' | Matching state |
```

### Step 6: Specify APIs

Document endpoints with full detail:

```markdown
## API Specification

### POST /api/v1/submissions/import

**Purpose**: Import payroll file and create draft submission

**Request**:
```json
{
  "file": "<multipart>",
  "source_system": "QUICKBOOKS",
  "month": 11,
  "year": 2025
}
```

**Response (Success)**:
```json
{
  "success": true,
  "data": {
    "submission_id": 1,
    "status": "ROSTER_SETUP_REQUIRED",
    "employees": [...]
  }
}
```

**Response (Error)**:
```json
{
  "success": false,
  "error": "PARSE_ERROR",
  "details": "Unrecognized column: 'Salary'"
}
```
```

### Step 7: Map User Flows

Document complete user journeys:

```markdown
## User Flows

### Flow 1: First-Time Import

```
1. POST /api/v1/submissions/import
   → Response: { status: "ROSTER_SETUP_REQUIRED", employees: [...] }

2. POST /api/v1/roster/template
   → Response: CSV file download

3. User fills in NI numbers, DOB, etc.

4. POST /api/v1/roster/import
   → Response: { imported: 15, errors: 0 }

5. POST /api/v1/submissions/{id}/continue
   → Response: { status: "READY_FOR_VALIDATION" }
```

### Flow 2: Returning User (New Hire Detected)

[similar step-by-step]
```

## v1.8 Frontend Sections (REQUIRED)

Every architecture plan must include Sections 8, 9, and 10. These are NOT optional.

### Section 8: Frontend Specification Template

```markdown
## 8. Frontend Specification

### 8.1 Template Source
- Repository: react-frontend template
- UI Library: Shadcn/ui (pre-installed)
- Styling: Tailwind CSS

### 8.2 Component Inventory (MUST USE)

| Component | Import | When to Use |
|-----------|--------|-------------|
| Button | `@/components/ui/button` | All clickable actions |
| Card | `@/components/ui/card` | Content containers |
| Input | `@/components/ui/input` | Text inputs |
| Select | `@/components/ui/select` | Dropdowns |
| Dialog | `@/components/ui/dialog` | Modals, confirmations |
| Table | `@/components/ui/table` | Data display |
| Form | `@/components/ui/form` | Form wrappers |
| Badge | `@/components/ui/badge` | Status indicators |
| Skeleton | `@/components/ui/skeleton` | Loading states |
| Toast | `@/components/ui/toast` | Notifications |

### 8.3 DO NOT CREATE

❌ Custom Button, Card, Input, Select components
❌ Custom modal/dialog implementations
❌ Custom toast/notification systems
❌ Custom form validation UI

### 8.4 Page Structure

| Page | Route | Components Used | API Endpoints |
|------|-------|-----------------|---------------|
| Dashboard | `/` | Card, Badge | GET /api/v1/stats |
| List | `/items` | Table, Input | GET /api/v1/items |
| Detail | `/items/:id` | Card, Tabs | GET /api/v1/items/:id |
| Form | `/items/new` | Form, Input | POST /api/v1/items |

### 8.5 State Management

| State Type | Solution | Example |
|------------|----------|---------|
| Server state | React Query | API data, caching |
| Auth state | React Context | User session, tokens |
| Form state | react-hook-form + Zod | Controlled inputs |
| UI state | useState | Modals, tabs |

### 8.6 Type Synchronization

| Backend DTO | Frontend Type | File |
|-------------|---------------|------|
| ItemDTO | Item | src/types/item.ts |
| ItemCreateDTO | ItemCreateInput | src/types/item.ts |
| PaginatedResponse | PaginatedResult<T> | src/types/common.ts |
```

### Section 9: Frontend User Flows Template

```markdown
## 9. Frontend User Flows

### 9.1 Flow: [Flow Name]

| Step | Screen | User Action | Components | API |
|------|--------|-------------|------------|-----|
| 1 | List | Click "New" | Button | — |
| 2 | Create Form | — | Dialog opens | — |
| 3 | Create Form | Fill fields | Input, Form | — |
| 4 | Create Form | Click "Create" | Button (loading) | POST /items |
| 5 | Create Form | — | Toast (success) | — |
| 6 | List | — | Table refreshes | GET /items |

### 9.2 Error Handling Flows

| Scenario | Screen State | User Recovery |
|----------|--------------|---------------|
| Network error | ErrorState with retry | Click "Retry" |
| Validation error | Form field errors | Fix and resubmit |
| 401 Unauthorized | Redirect to login | Re-authenticate |
| 404 Not Found | EmptyState | Navigate back |
| 500 Server Error | ErrorState | Retry or contact support |
```

### Section 10: Frontend Screen Inventory Template

```markdown
## 10. Frontend Screen Inventory

### 10.1 Screen Catalog

| Screen ID | Name | Route | Layout | Priority |
|-----------|------|-------|--------|----------|
| SCR-01 | Login | /login | Auth | P0 |
| SCR-02 | Dashboard | / | Main | P0 |
| SCR-03 | Items List | /items | Main | P0 |

### 10.2 Screen Wireframe: SCR-03 Items List

**Purpose:** Display paginated list with search and filters

**Layout:**
┌─────────────────────────────────────────────┐
│ Header: "Items"              [+ New Item]   │
├─────────────────────────────────────────────┤
│ Search: [_______________]  Filter: [▼ All]  │
├─────────────────────────────────────────────┤
│ Table with data rows                        │
├─────────────────────────────────────────────┤
│ Pagination: < 1 2 3 ... 10 >                │
└─────────────────────────────────────────────┘

**States:**
- Loading: TableSkeleton (5 rows)
- Empty: EmptyState "No items found"
- Error: ErrorState with retry

### 10.3 Component-to-Screen Matrix

| Component | SCR-01 | SCR-02 | SCR-03 |
|-----------|--------|--------|--------|
| Button | ✓ | ✓ | ✓ |
| Card | ✓ | ✓ | ✓ |
| Table | | | ✓ |
| Skeleton | | ✓ | ✓ |

### 10.4 Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | <640px | Single column, cards instead of tables |
| Tablet | 640-1024px | Sidebar collapses |
| Desktop | >1024px | Full layout |
```

## Quality Checklist

Before finalizing a project plan:

### Completeness (Backend)
- [ ] Executive summary captures the "why"
- [ ] All key decisions documented with rationale
- [ ] Data model changes fully specified
- [ ] API contracts complete (request/response/errors)
- [ ] User flows cover happy path and edge cases
- [ ] Migration strategy defined

### Completeness (Frontend - v1.8 REQUIRED)
- [ ] Section 8: Frontend Specification exists
- [ ] Section 8.2: Component inventory documented
- [ ] Section 8.3: DO NOT CREATE list specified
- [ ] Section 8.6: Type synchronization table complete
- [ ] Section 9: Frontend user flows documented
- [ ] Section 10.1: Screen catalog complete
- [ ] Section 10.2: Wireframes for each screen
- [ ] Section 10.3: Component-to-screen matrix filled
- [ ] Section 10.4: Responsive breakpoints defined

### Clarity
- [ ] Non-technical stakeholder can understand summary
- [ ] Technical team can implement from spec
- [ ] No ambiguous requirements
- [ ] Open questions resolved or explicitly deferred

### Feasibility
- [ ] Scope is realistic for timeline
- [ ] Dependencies identified (BE → INT → FE)
- [ ] Risks assessed with mitigations
- [ ] Rollback strategy defined

### Alignment
- [ ] Solves the stated problem
- [ ] Fits existing architecture patterns
- [ ] Doesn't introduce unnecessary complexity
- [ ] Measurable success criteria defined

## Plan Types

### Refactoring Plan

Focus areas:
- Code duplication analysis (what to ELIMINATE, MERGE, KEEP)
- Migration strategy (how to move without breaking)
- Backward compatibility considerations
- Feature flags for gradual rollout

See [references/refactoring-plan.md](references/refactoring-plan.md)

### New Feature Plan

Focus areas:
- User stories and acceptance criteria
- Data model for new entities
- API design for new endpoints
- Integration with existing modules

See [references/feature-plan.md](references/feature-plan.md)

### Integration Plan

Focus areas:
- System interfaces and contracts
- Data transformation mappings
- Error handling across boundaries
- Testing strategy for integrations

See [references/integration-plan.md](references/integration-plan.md)

## Templates

- **Full project plan**: [assets/PROJECT_PLAN_TEMPLATE.md](assets/PROJECT_PLAN_TEMPLATE.md)
- **Refactoring plan**: [assets/REFACTORING_PLAN_TEMPLATE.md](assets/REFACTORING_PLAN_TEMPLATE.md)
- **API specification**: [assets/API_SPEC_TEMPLATE.md](assets/API_SPEC_TEMPLATE.md)

## Integration with Other Skills (v1.8)

```
┌─────────────────────────────────────────────────────────────────┐
│  Requirements / Problem Statement                                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  project-plan-creator                                            │
│  → Creates PROJECT_PLAN.md with Sections 1-11                    │
│  → Sections 8-10 REQUIRED (Frontend Spec, Flows, Screens)        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  implementation-plan-generator                                   │
│  → Creates IMPLEMENTATION_PROMPTS.md                             │
│  → BE-XX, INT-XX, FE-XX, E2E-XX sessions                         │
│  → FE sessions include visual_verification requirements          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  session-orchestrator                                            │
│  → Executes sessions with SESSION.md and PROGRESS.md             │
│  → Auto-commits, progress tracking                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼ (for FE sessions)
┌─────────────────────────────────────────────────────────────────┐
│  playwright-e2e-testing                                          │
│  → Phase 3.6: Visual Verification screenshots                    │
│  → Loading, data, error, mobile state captures                   │
└─────────────────────────────────────────────────────────────────┘
```

### v1.8 Execution Flow

```
BE-01 ─── BE-02 ─── BE-03 ─── BE-04 (API Contract Lock)
                                │
                                ▼
                            INT-01 (Pydantic → TypeScript)
                                │
                                ▼
FE-01 ─── FE-02 ─── FE-03 ─── FE-04 (each with visual verification)
                                │
                                ▼
                            E2E-01 (End-to-end tests)
```
