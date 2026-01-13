---
name: solomon-feature
description: Manage multiple features within a Solomon project. Use when working with multi-feature projects, adding new features, switching between features, or importing feature bundles. Provides execution isolation with shared knowledge via Mem0.
---

# Solomon Feature

Multi-feature management system for Solomon projects.

## Usage

```
/solomon-feature list              # List all features
/solomon-feature add <name>        # Add a new feature
/solomon-feature switch <name>     # Switch active feature
/solomon-feature import <bundle>   # Import from bundle
```

## MCP Tools

Feature management is exposed via `solomon-projects` MCP server:

### list_features

List all features in a project with progress.

```python
mcp__solomon-projects__list_features(
    project_name="solomon",
    include_archived=False
)
```

**Returns:** Features with status, progress, inheritance, libraries.

### add_feature

Add a new feature to a project.

```python
mcp__solomon-projects__add_feature(
    project_name="solomon",
    name="expanded-skills",
    prefix="EXP",
    plan_path="docs/plans/EXPANDED_SKILLS_PLAN.md",
    prompts_path="docs/prompts/EXP_PROMPTS.md",
    inherit_from=["initial-build"],
    libraries=["/fastmcp/fastmcp"],
    scaffold=True
)
```

**Arguments:**
- `name`: Feature name (lowercase, hyphens allowed)
- `prefix`: 3-letter uppercase prefix (e.g., EXP, FTR, MPR)
- `plan_path`: Optional path to PLAN.md
- `prompts_path`: Optional path to PROMPTS.md
- `inherit_from`: List of features to inherit decisions from
- `libraries`: List of Context7 library IDs to cache
- `scaffold`: Create directory structure if True

### switch_feature

Switch the active feature for a project.

```python
mcp__solomon-projects__switch_feature(
    project_name="solomon",
    feature_name="expanded-skills"  # or prefix "EXP"
)
```

**Returns:** Switched feature details and loaded Mem0 context.

### import_feature

Import a feature from a bundle file.

```python
mcp__solomon-projects__import_feature(
    project_name="solomon",
    bundle_path="/path/to/feature-bundle.zip",
    force=False
)
```

**Arguments:**
- `bundle_path`: Path to exported feature bundle
- `force`: Overwrite existing feature if True

## Feature Status Flow

```
PLANNING → PROMPTS_READY → IN_PROGRESS → COMPLETED
                                │
                            BLOCKED
```

## Execution Flow

### List Features

1. Call `list_features(project_name)`
2. Display table with:
   - Name, Prefix, Status
   - Progress (completed/total)
   - Inherited features
   - Library count

### Add Feature

1. Validate prefix is unique (3 uppercase letters)
2. Check circular inheritance
3. Validate Context7 library IDs
4. Create feature record
5. Optionally scaffold directories

### Switch Feature

1. Resolve feature by name or prefix
2. Update active_feature in registry
3. Load Mem0 context for new feature
4. Return feature details

### Import Feature

1. Extract bundle zip
2. Validate prompts format
3. Check session ID uniqueness
4. Register feature
5. Copy plan/prompts files

## Core Principles

1. **Execution Isolation** — Each feature has own sessions and progress
2. **Knowledge Sharing** — Project decisions via Mem0 flow to all features
3. **Inheritance** — Features can inherit from completed features
4. **Library Caching** — Context7 docs cached at project level

## Example: Adding a New Feature

```bash
# 1. Create plan and prompts (separate step)

# 2. Add feature to registry
mcp__solomon-projects__add_feature(
    project_name="solomon",
    name="feature-registry",
    prefix="FTR",
    plan_path="solomon-docs/plans/FEATURE_REGISTRY_PLAN_FINAL.md",
    prompts_path="solomon-docs/prompts/FTR_PROMPTS_FINAL.md",
    inherit_from=["initial-build"],
    scaffold=True
)

# 3. Switch to new feature
mcp__solomon-projects__switch_feature(
    project_name="solomon",
    feature_name="feature-registry"
)

# 4. Start working on sessions
/solomon-session FTR-01
```

## Constraints

- **CRITICAL**: Validate prefix uniqueness before registration
- **CRITICAL**: Check circular inheritance before registration
- **CRITICAL**: Validate session ID uniqueness on import
- **HIGH**: File locking for concurrent registry access
- **HIGH**: Graceful degradation when Mem0/Context7 unavailable
