# Session MOS-06: Decompose spec-viewer.tsx - Retrospective

**Duration:** ~25 minutes
**Completed:** 2026-03-05
**Commit:** `aeb7bfd`

## What Was Built

- `src/hooks/useSpecData.ts` (+63 lines) — State management hook (fetch spec + tokens, export handler)
- `src/app/design-specs/[id]/spec-header.tsx` (+38 lines) — Title, version badge, status, date, back button
- `src/app/design-specs/[id]/spec-viewer-tabs.tsx` (+207 lines) — 4 tab components (Tokens, Components, Code, Export) + TokenValuePreview
- `src/app/design-specs/[id]/spec-viewer.tsx` (-306, +8 lines) — Thin orchestrator

**Total:** +348, -306 lines across 4 files

## Key Technical Decisions

- **Tab components grouped in one file:** All 4 tab components (20-50 lines each) stayed in `spec-viewer-tabs.tsx` rather than 4 separate files. They share the same UI patterns and data types — splitting would add fragmentation without meaningful complexity reduction.
- **useSpecData extracted despite simple state:** Even with only 3 useState + 1 useEffect + 1 useCallback, extracting the hook keeps the orchestrator purely compositional. The export handler (blob creation, download trigger) is business logic that belongs in a hook.
- **Session plan adapted:** Session specified SpecHeader, TokenDisplay, ComponentTree — but the actual code had 4 tab components + a header. Decomposed along actual seams.

## Challenges & Solutions

**Challenge:** `tsc --noEmit` CLI continues to hang on this machine.
**Solution:** Reused the Node.js TypeScript compiler API pattern established in MOS-05. Works instantly every time.

## Patterns Established

All three Phase 0B esther-preview decompositions follow the same pattern:
1. Read file → identify actual seams (not planned ones)
2. Extract state → custom hook (`useSpecData`, `usePipelineData`)
3. Extract render groups → co-located sub-component files
4. Rewrite original as thin orchestrator
5. Verify: TypeScript 0 errors via Node API

## Lessons Learned

**What Worked Well:**
- Third decomposition was fastest (~25 min) due to established pattern
- TypeScript Node API workaround is now reliable and repeatable
- Grouping related tab components prevented file fragmentation

**What Could Be Improved:**
- Session prompts consistently name components that don't exist — should always read file before planning decomposition targets

## Next Session

**MOS-07:** Decompose FeatureDetail.tsx (solomon-dashboard)
