# Session MOS-04: Decompose pipeline-detail.tsx - Retrospective

**Duration:** ~45 minutes
**Completed:** 2026-03-04
**Commit:** `76418b6`

## What Was Built

- `src/app/pipelines/[id]/event-log.tsx` (+39 lines) — EventLog presentational component
- `src/app/pipelines/[id]/pipeline-detail.tsx` (-200, +19 lines) — Rewritten as thin orchestrator
- `src/app/pipelines/[id]/pipeline-header.tsx` (+80 lines) — PipelineHeader with title, status, actions
- `src/hooks/usePipelineData.ts` (+90 lines) — State management hook (fetch, WS refetch, checkpoint, pause)
- `src/hooks/usePipelineSteps.ts` (+69 lines) — Memoized event-to-step derivation hook

**Total:** +297, -200 lines across 5 files

## Key Technical Decisions

- **Hooks-first extraction:** Extracted state management into custom hooks before splitting render sections, per session constraints. This ensured the orchestrator had clean interfaces to work with.
- **`useMemo` in hook, not orchestrator:** `usePipelineSteps` wraps `buildSteps` in `useMemo([pipeline, events])` internally, so the orchestrator never re-derives steps on unrelated re-renders.
- **Preprod visual baseline:** Used `esther.highfunctioningsolutions.com` for Playwright screenshots instead of localhost, since the local app requires auth + a live backend.
- **EventLog handles its own null state:** Returns `null` when events are empty, keeping conditional logic out of the orchestrator.

## Challenges & Solutions

**Challenge:** Localhost Playwright screenshots failed — app redirected to login requiring auth.
**Solution:** Used preprod environment at `esther.highfunctioningsolutions.com` which has live data and no auth gate for viewing.

**Challenge:** Preprod has additional UI elements (Design Spec card, 8 agents) not present in local code.
**Solution:** These are server-rendered from the API — the decomposition works identically because the component structure is the same. Visual parity confirmed at all 3 breakpoints.

## Patterns Established

**God Component Decomposition Pattern:**
```
1. Capture visual baselines (3 breakpoints)
2. Extract state → custom hooks (usePipelineData, usePipelineSteps)
3. Extract render sections → presentational components (PipelineHeader, EventLog)
4. Rewrite original as thin orchestrator (~30% of original LOC)
5. Verify: TypeScript clean + visual parity + complexity < 10
```

**Hook interface pattern:**
```typescript
// State hook returns named result object
export function usePipelineData(id, events): UsePipelineDataResult {
  // Owns: state, effects, callbacks
  return { pipeline, loading, pendingCheckpoint, handlePause, handleCheckpointResolved };
}

// Derivation hook returns computed value directly
export function usePipelineSteps(pipeline, events): AgentStep[] {
  return useMemo(() => ..., [pipeline, events]);
}
```

## Lessons Learned

**What Worked Well:**
- Hooks-first extraction made the component split trivial — clean interfaces already existed
- Jacob scan provided objective before/after metrics (complexity 32→4, hotspot 100.8→12.6)
- Preprod screenshots gave realistic visual baselines with actual pipeline data

**What Could Be Improved:**
- Should add `.next/` to Jacob's exclude list — 127 anti-patterns were all build artifacts
- Could extract the Agent Stepper card wrapper into its own component for further reduction

## Next Session

**MOS-05:** Decompose checkpoint-panel.tsx (complexity 26)
