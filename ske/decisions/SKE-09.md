# SKE-09 — OQ-03: worktree isolation mechanism

**Date:** 2026-08-21 · **Status:** DECIDED — **default native**

## Decision

Parallel-agent isolation uses the **harness-native worktree mechanism**
(`Agent`/`Workflow` `isolation: "worktree"`, proven live 2026-08-20 in this
estate) as the default. No third-party isolation layer (T3 Code or similar) is
adopted.

## Rationale

1. Native isolation is zero-install, auto-cleans unchanged worktrees, and is
   already exercised by the workflow engine this estate runs on.
2. A third-party layer adds a supply-chain + drift surface for a capability the
   harness ships; "unique value at this layer?" fails (integration-temptation
   rule).
3. The v1.12 `<execution isolation="worktree"/>` element (SKE-06b) is
   mechanism-agnostic — sessions declare the NEED; the harness supplies it.

## Revisit trigger

Reopen if either: (a) native worktrees can't express per-agent env/deps
(e.g. two agents needing conflicting venvs), or (b) fan-out regularly exceeds
the harness cap (min(16, cores-2)) and an external scheduler becomes the
bottleneck fix. Owner: whoever hits the trigger; file under ske/decisions/.
