---
name: debugging-workflow
description: Systematic debugging workflow for complex production issues. Use when facing hanging queries, performance problems, memory leaks, circular dependencies, async/await issues, or any bug requiring root cause analysis. Provides diagnostic scripts, isolation techniques, phased fix implementation, and verification testing.
---

# Debugging Workflow

Systematic approach to diagnosing and fixing complex bugs in production systems.

## When to Use This Skill

| Symptom | Example |
|---------|---------|
| **Application hangs** | Auth query stuck at 10%, page won't load |
| **Performance degradation** | Response time went from 100ms to 10s |
| **Intermittent failures** | Works sometimes, fails randomly |
| **Resource exhaustion** | Memory leak, connection pool depleted |
| **Circular dependencies** | Import errors, eager loading cycles |
| **Async/await issues** | Deadlocks, sync access in async context |

## Debugging Phases

```
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 0: OBSERVE                                                │
│  → Gather symptoms, reproduce issue, collect evidence            │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 1: DIAGNOSE                                               │
│  → Create diagnostic scripts, isolate root cause                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 2: HYPOTHESIZE                                            │
│  → Form theories, prioritize likely causes                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 3: FIX                                                    │
│  → Implement fixes incrementally with commits                    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 4: VERIFY                                                 │
│  → Run tests, check performance, confirm fix                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  PHASE 5: PREVENT                                                │
│  → Add regression tests, document root cause                     │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Create Debug Session Files

```bash
# In project root
touch SESSION_DEBUG.md PROGRESS_DEBUG.md
```

### 2. Initialize Tracking

```markdown
# SESSION_DEBUG.md

## Problem Summary
[One paragraph describing the symptom]

## Reproduction Steps
1. [Step to reproduce]
2. [Step to reproduce]

## Environment
- Python: 3.11
- Framework: Quart/Flask
- Database: PostgreSQL
- OS: Ubuntu 22.04

## Current Phase
Phase 0: Observe

## Hypotheses
1. [ ] [First theory]
2. [ ] [Second theory]

## Session Log
- [timestamp]: Started investigation
```

### 3. Follow Diagnostic Workflow

See [references/diagnostic-patterns.md](references/diagnostic-patterns.md)

## Common Bug Patterns

### Pattern 1: SQLAlchemy Relationship Hanging

**Symptoms:**
- Query hangs indefinitely
- Application freezes at specific percentage
- No error, just timeout

**Root Cause:** `lazy="selectin"` with bidirectional relationships causes circular eager loading

**Diagnostic:**
```python
# scripts/check_relationships.py
import logging
logging.getLogger('sqlalchemy.engine').setLevel(logging.DEBUG)

# Run query and watch for circular SELECT statements
```

**Fix:**
```python
# Change from:
subscription = relationship("Subscription", lazy="selectin")

# To:
subscription = relationship("Subscription", lazy="raise")
# Then add explicit loading where needed
```

### Pattern 2: Async Deadlock

**Symptoms:**
- Works in sync tests, hangs in async
- Greenlet errors
- "Cannot use sync function in async context"

**Root Cause:** Sync attribute access triggers implicit query in async context

**Diagnostic:**
```python
# Check for sync access patterns
grep -rn "\.subscription" app/modules/auth/
grep -rn "await.*\." app/ | grep -v "await self\." | grep -v "await session\."
```

**Fix:**
```python
# Bad: sync access triggers implicit query
user = await session.get(User, user_id)
sub = user.subscription  # HANGS - sync query in async context

# Good: explicit async loading
from sqlalchemy.orm import selectinload
stmt = select(User).options(selectinload(User.subscription))
result = await session.execute(stmt)
user = result.scalar_one()
sub = user.subscription  # Already loaded, no query
```

### Pattern 3: Connection Pool Exhaustion

**Symptoms:**
- "Connection pool exhausted"
- Timeouts increase over time
- Works after restart, degrades over hours

**Diagnostic:**
```python
# scripts/check_pool.py
async def check_pool_status():
    from src.database.async_db import async_pg_engine
    pool = async_pg_engine.pool
    print(f"Pool size: {pool.size()}")
    print(f"Checked in: {pool.checkedin()}")
    print(f"Checked out: {pool.checkedout()}")
    print(f"Overflow: {pool.overflow()}")
```

**Fix:**
- Add `pool_pre_ping=True` to engine
- Add connection timeout
- Ensure sessions are properly closed

### Pattern 4: Circular Import

**Symptoms:**
- ImportError on startup
- "Cannot import name X from partially initialized module"
- Works if import order changes

**Diagnostic:**
```bash
# Find circular imports
python -c "import app" 2>&1 | head -50
```

**Fix:**
- Use `TYPE_CHECKING` for type hints
- Move imports inside functions
- Restructure module dependencies

## Diagnostic Scripts

### Hang Detector with Stack Trace

```python
# scripts/detect_hang.py
import asyncio
import signal
import traceback

def timeout_handler(signum, frame):
    print("\n" + "=" * 60)
    print("🚨 HANG DETECTED - Stack trace:")
    print("=" * 60)
    traceback.print_stack(frame)
    raise TimeoutError("Operation exceeded timeout")

async def run_with_timeout(coro, timeout=5):
    """Run coroutine with timeout and stack trace on hang."""
    signal.signal(signal.SIGALRM, timeout_handler)
    signal.alarm(timeout)
    try:
        return await coro
    finally:
        signal.alarm(0)
```

### Query Timing Instrumentation

```python
# Add timing to isolate which operation hangs
import time

async def instrumented_operation():
    t0 = time.time()
    result1 = await step1()
    print(f"Step 1: {time.time() - t0:.3f}s")
    
    t1 = time.time()
    result2 = await step2()
    print(f"Step 2: {time.time() - t1:.3f}s")
    
    # Continue for each step...
```

### Dependency Check

```python
# scripts/check_dependencies.py
import subprocess
import sys

REQUIRED = {
    "greenlet": "Async SQLAlchemy relationships",
    "asyncpg": "PostgreSQL async driver",
    "redis": "Session/cache store",
}

for pkg, reason in REQUIRED.items():
    try:
        __import__(pkg)
        print(f"✅ {pkg}: installed ({reason})")
    except ImportError:
        print(f"❌ {pkg}: MISSING - required for {reason}")
        print(f"   Fix: pip install {pkg}")
```

## Progress Tracking Template

```markdown
# PROGRESS_DEBUG.md

## Phase 0: Observe
| Check | Status | Finding |
|-------|--------|---------|
| Reproduce issue | ⬜ | |
| Collect logs | ⬜ | |
| Note environment | ⬜ | |

## Phase 1: Diagnose
| Diagnostic | Status | Result |
|------------|--------|--------|
| DIAG-01: Check dependencies | ⬜ | |
| DIAG-02: Enable logging | ⬜ | |
| DIAG-03: Run hang detector | ⬜ | |

## Phase 2: Hypothesize
| # | Hypothesis | Likelihood | Tested |
|---|------------|------------|--------|
| 1 | [Theory] | High/Med/Low | ⬜ |

## Phase 3: Fix
| Fix | Status | Commit |
|-----|--------|--------|
| FIX-01: [Description] | ⬜ | |

## Phase 4: Verify
| Test | Status | Time |
|------|--------|------|
| Performance test | ⬜ | |
| Regression test | ⬜ | |

## Phase 5: Prevent
| Task | Status |
|------|--------|
| Add regression test | ⬜ |
| Update documentation | ⬜ |
```

## Commit Strategy

Every diagnostic and fix should be committed separately:

```bash
# Diagnostic commits
git commit -m "chore(debug): add diagnostic scripts"
git commit -m "chore(debug): add query logging"

# Fix commits (atomic, reversible)
git commit -m "fix(models): change lazy='selectin' to lazy='raise'"
git commit -m "fix(repository): add explicit selectinload"

# Verification commits
git commit -m "test(debug): add performance assertions"

# Final commit
git commit -m "fix: resolve [issue description]

Root cause: [what was wrong]
Solution: [what was changed]
Verified: [how it was tested]"
```

## References

- [Diagnostic Patterns](references/diagnostic-patterns.md) - Common diagnostic approaches
- [Fix Patterns](references/fix-patterns.md) - Common fix implementations
- [Debug Plan Template](assets/DEBUG_PLAN_TEMPLATE.md) - Full debug plan template
