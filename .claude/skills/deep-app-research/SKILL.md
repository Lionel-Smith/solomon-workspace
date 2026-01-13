---
name: deep-app-research
description: Comprehensive application research with competitor analysis, industry standards, architecture patterns, and Bahamas contextualization. Use when starting a new project that needs thorough market and technical research before architecture planning. Triggers on phrases like "research this app idea", "analyze competitors", "what are industry standards for", "how would this work in the Bahamas", or when creating requirements documents for government technology projects.
---

# Deep Application Research

Generate comprehensive research documents for application development, with special focus on Caribbean/Bahamian context and IDB alignment.

## Research Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  INPUT: Application concept/problem statement               │
└─────────────────────────────────────┬───────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────┐
          ▼                           ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  PHASE 1        │    │  PHASE 2        │    │  PHASE 3        │
│  MARKET         │    │  TECHNICAL      │    │  DESIGN         │
│  RESEARCH       │    │  RESEARCH       │    │  RESEARCH       │
│  • Competitors  │    │  • Architecture │    │  • UX patterns  │
│  • Market size  │    │  • Standards    │    │  • Accessibility│
│  • Case studies │    │  • Security     │    │  • Mobile-first │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 4: BAHAMAS CONTEXTUALIZATION                         │
│  • Local legislation/regulations                            │
│  • Government integration points                            │
│  • Infrastructure constraints                               │
│  • IDB programme alignment                                  │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  PHASE 5: REGIONAL EXPANSION ANALYSIS                       │
│  • CARICOM market potential                                 │
│  • Regional precedents (Jamaica, Trinidad, Barbados)        │
│  • Scalability considerations                               │
│  • Partnership opportunities                                │
└─────────────────────────────────┬───────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────┐
│  OUTPUT: {PROJECT}_RESEARCH.md                              │
│  Ready for input to project-plan-creator skill              │
└─────────────────────────────────────────────────────────────┘
```

## Research Phases Detail

### Phase 1: Market Research

```yaml
competitors:
  direct:
    - Name, market position, pricing
    - Key features and differentiators
    - Technology stack (if known)
    - Geographic coverage
  indirect:
    - Adjacent solutions
    - Potential pivot competitors
    
market_analysis:
  - Total addressable market (TAM)
  - Serviceable addressable market (SAM) 
  - Serviceable obtainable market (SOM)
  - Growth trends
  
case_studies:
  - Similar implementations (especially Caribbean/SIDS)
  - Success factors
  - Failure analysis
  - Lessons learned
```

### Phase 2: Technical Research

```yaml
architecture_patterns:
  - Dominant patterns in domain
  - Emerging patterns
  - Pros/cons for each
  - Recommended approach for scale
  
industry_standards:
  - Data formats (HL7 for health, NIEM for justice, etc.)
  - API standards (REST, GraphQL, FHIR, etc.)
  - Security standards (OWASP, SOC2, etc.)
  - Compliance requirements (GDPR, HIPAA equivalents)
  
integration_requirements:
  - Common integrations
  - API availability
  - Data exchange formats
  
security_considerations:
  - Threat model for domain
  - Authentication patterns
  - Data protection requirements
  - Audit trail needs
```

### Phase 3: Design Research

```yaml
ux_patterns:
  - Common user flows
  - Accessibility requirements (WCAG)
  - Mobile-first considerations
  - Offline capability needs
  
industry_leaders:
  - Top 5 products in space
  - UI/UX screenshots and analysis
  - Feature comparison matrix
  - Design language trends
  
user_research:
  - Target user personas
  - Pain points
  - Current workarounds
  - Desired outcomes
```

### Phase 4: Bahamas Contextualization

```yaml
legislative_framework:
  - Relevant acts and regulations
  - Pending legislation
  - Constitutional provisions
  - Ministry jurisdiction
  
government_integration:
  - MyGateway portal integration
  - Existing government systems
  - Data sharing agreements needed
  - Procurement requirements (vendor registration)
  
infrastructure:
  - Internet connectivity (BTC/Aliv coverage)
  - Power reliability (BPL considerations)
  - Mobile penetration rates
  - Hardware availability
  
idb_alignment:
  - Relevant active projects
  - Funding windows
  - Programme components
  - Application requirements
  
local_data:
  - Use bahamian-research skill
  - Verify with official sources
  - Document collection dates
  - Note data gaps
```

### Phase 5: Regional Expansion

```yaml
caricom_analysis:
  - Market size by country
  - Similar initiatives (Jamaica, Trinidad, Barbados)
  - Regional standards (CSME, etc.)
  - Common infrastructure
  
scalability:
  - Multi-tenant architecture needs
  - Localization requirements
  - Currency handling
  - Legal variations by jurisdiction
  
partnerships:
  - Regional organizations
  - IDB/CDB/World Bank programmes
  - Caribbean-focused tech companies
  - University partnerships (UWI, etc.)
```

## Output Document Template

Quick structure:

```markdown
# {PROJECT} Research Document

## Executive Summary
- Problem statement
- Key findings (5-7 bullets)
- Recommended approach
- IDB alignment score

## 1. Institutional Context
- Organizational structure
- Key statistics
- Strategic direction

## 2. Legislative Framework
- Primary legislation
- Regulations
- Pending changes

## 3. Competitor Analysis
- Market landscape table
- Feature comparison matrix
- Differentiator opportunities

## 4. Industry Standards & Architecture
- Dominant patterns
- Recommended stack
- Integration requirements

## 5. Design & UX Research
- User personas
- Key user flows
- Accessibility requirements

## 6. Bahamas Integration Requirements
- Government systems
- Local data sources
- Infrastructure considerations

## 7. Regional Expansion Potential
- CARICOM market analysis
- Regional precedents
- Scalability roadmap

## 8. Recommendations
- MVP scope
- Phase 1 priorities
- Risk mitigation

## Appendices
- A: Detailed competitor profiles
- B: Technical standards reference
- C: Legislation excerpts
- D: Interview notes (if any)
```

## Invocation

```
Claude, use deep-app-research for:
Project: [name]
Domain: [health|justice|disaster|finance|education|etc.]
Problem: [one paragraph description]
Target Users: [who will use it]
```

## Research Source Priority

1. **Official Government Sources**
   - bahamas.gov.bs
   - Specific ministry websites
   - Official gazettes

2. **IDB Documentation**
   - Project documents (IDB website)
   - Country strategies
   - Sector studies

3. **Regional Precedents**
   - Jamaica government digital services
   - Trinidad & Tobago e-government
   - Barbados digital transformation

4. **Industry Sources**
   - Gartner/Forrester (if available)
   - Industry association publications
   - Academic papers

5. **Competitor Research**
   - Company websites
   - G2/Capterra reviews
   - Case studies

## Quality Checklist

Before finalizing research document:

```yaml
completeness:
  - [ ] All 8 sections populated
  - [ ] Executive summary reflects findings
  - [ ] Recommendations are actionable
  - [ ] Sources cited for key claims

bahamas_specific:
  - [ ] Local legislation referenced
  - [ ] Government integration points identified
  - [ ] Infrastructure constraints noted
  - [ ] IDB project alignment documented

technical:
  - [ ] Architecture pattern recommended
  - [ ] Standards identified
  - [ ] Security requirements outlined
  - [ ] Integration requirements listed

actionable:
  - [ ] MVP scope clearly defined
  - [ ] Phase 1 priorities identified
  - [ ] Risk mitigation strategies included
  - [ ] Next steps documented
```

## Integration with HFS Workflow

```
deep-app-research → {PROJECT}_RESEARCH.md
        ↓
project-plan-creator → {PROJECT}_PLAN.md
        ↓
implementation-plan-generator → {PROJECT}_PROMPTS.md
        ↓
plan-review-loop (refine both documents)
        ↓
session-orchestrator → Execute sessions
```

## Domain-Specific Additions

### Health Domain
- PAHO/WHO guidelines for Caribbean
- Ministry of Health and Wellness structure
- PHA integration requirements
- HIPAA-equivalent requirements

### Justice Domain
- Judiciary digital transformation status
- RBPF integration points
- Attorney General requirements
- ACA accreditation standards

### Disaster/Emergency Domain
- NEMA structure and requirements
- Hurricane season timeline
- BTC/Aliv emergency protocols
- Regional disaster coordination (CDEMA)

### Finance Domain
- Central Bank regulations
- NIB integration requirements
- PowerTranz/payment gateway landscape
- VAT compliance requirements
