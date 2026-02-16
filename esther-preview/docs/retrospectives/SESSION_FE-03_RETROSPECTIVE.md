# Session FE-03: Checkpoint UI + Design Spec Viewer - Retrospective

**Duration:** ~45 minutes
**Completed:** 2026-02-16
**Commit:** 3b9da11

## What Was Built

- `src/components/checkpoint-panel.tsx` (+316 lines) — Full checkpoint approval panel with discriminated rendering by type
- `src/app/design-specs/[id]/spec-viewer.tsx` (+405 lines) — Tabbed Design Spec viewer (Tokens, Components, Code, Export)
- `src/components/brand/color-swatch-grid.tsx` (+59 lines) — Color palette grid with WCAG contrast labels
- `src/components/brand/typography-samples.tsx` (+98 lines) — Font preview at multiple sizes
- `src/components/brand/contrast-matrix.tsx` (+92 lines) — Foreground/background contrast ratio grid
- `src/components/brand/spacing-scale.tsx` (+33 lines) — Visual spacing bar chart
- `src/components/component-preview.tsx` (+121 lines) — Sandboxed iframe with responsive viewport toggle
- `src/app/design-specs/page.tsx` (+26 lines) — Specs list redirect page
- `src/app/design-specs/[id]/page.tsx` (+10 lines) — Route param wrapper
- `src/app/pipelines/[id]/pipeline-detail.tsx` (modified) — Replaced inline checkpoint card with CheckpointPanel
- `src/components/ui/tabs.tsx` (+91 lines) — shadcn/ui tabs component
- `src/components/ui/separator.tsx` (+28 lines) — shadcn/ui separator component

**Total:** +1,292 / -36 lines across 13 files

## Key Technical Decisions

1. **Discriminated rendering pattern for checkpoints**: Rather than a single generic renderer, each checkpoint type (brief_approval, brand_approval, layout_approval, final_review) gets its own preview component. This keeps each renderer focused and type-safe while allowing rich, type-specific UIs (e.g., color swatches for brand, score cards for review).

2. **`typeof` guards over truthy checks**: TypeScript strict mode with `Record<string, unknown>` data means `{data.field && <JSX>}` resolves to `unknown` — not assignable to `ReactNode`. Using `typeof data.field === "string"` narrows the type properly.

3. **Sandboxed iframe with viewport toggle for component previews**: Using `sandbox="allow-scripts allow-same-origin"` provides security isolation while allowing component rendering. Three viewport sizes (375/768/1280) simulate real responsive breakpoints.

4. **Export via Blob + URL.createObjectURL**: Client-side file download without server round-trip. Creates a temporary object URL, triggers download via programmatic anchor click, then revokes the URL.

## Challenges & Solutions

**Challenge:** TypeScript strict mode rejected `{data.project_name && <Component />}` pattern in checkpoint previews — `unknown` type from `Record<string, unknown>` isn't a valid ReactNode.
**Solution:** Replaced all truthy checks with explicit `typeof` guards: `typeof data.project_name === "string"` narrows the type and satisfies both TypeScript and React's render expectations.

## Patterns Established

- **Brand visualization components** extracted to `src/components/brand/` with barrel export — reusable across checkpoint previews and spec viewer
- **Score card pattern** for displaying normalized 0-1 scores as colored percentages (green >=90%, yellow >=70%, red <70%)
- **Tabbed viewer pattern** for complex data with Tokens | Components | Code | Export separation

## Lessons Learned

**What Worked Well:**
- Extracting brand components early paid off — they're used in both CheckpointPanel (brand_approval preview) and could be reused in SpecViewer token display
- The discriminated checkpoint type pattern made each preview component simple and testable in isolation
- ComponentPreview's viewport toggle provides genuine design review value

**What Could Be Improved:**
- The Code tab file tree is basic (flat list) — could benefit from a real tree structure for nested paths
- Export currently only supports JSON blob download; CSS and Tailwind exports should produce actual formatted output, not just JSON

## Next Session

FE-04: Frontend Polish + Deployment
