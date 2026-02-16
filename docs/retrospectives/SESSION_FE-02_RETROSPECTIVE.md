# Session FE-02: Pipeline Dashboard - Retrospective

**Duration:** ~30 min
**Completed:** 2026-02-16
**Commit:** 3048e7a

## What Was Built

- `src/app/pipelines/page.tsx` — Server Component pipeline list with table, status badges, cookie forwarding
- `src/app/pipelines/[id]/page.tsx` + `pipeline-detail.tsx` — Client Component detail page with WebSocket
- `src/components/agent-stepper.tsx` — 7-agent progress visualization (5 states, responsive)
- `src/components/pipeline-status-badge.tsx` — Color-coded status badges (6 states, running=pulse)
- `src/components/new-pipeline-dialog.tsx` — Modal form with zod validation
- `src/components/new-pipeline-button.tsx` — Client island for dialog trigger
- `src/lib/api/server.ts` — Server-side cookie forwarding for RSC data fetching
- 4 new shadcn/ui components: dialog, select, textarea, table

**Total:** +1,398 lines across 16 files

## Key Technical Decisions

- **Server Component for list, Client Component for detail**: List page fetches data server-side (zero client JS for data), detail needs WebSocket (must be client). This is the canonical RSC split pattern.
- **Cookie forwarding via `serverHeaders()`**: Server Components can't use `credentials: "include"`. Created a helper that reads `cookies()` from `next/headers` and passes the auth cookie as a header.
- **Client island for "New Pipeline" button**: The list page is a Server Component, but the dialog needs `useState`. Solution: extract a tiny `"use client"` wrapper around the button + dialog.
- **`buildSteps()` state machine**: Processes WebSocket events oldest-first to construct agent state. Falls back to `pipeline.current_agent` when no events exist.
- **Inline SVGs for stepper icons**: Used inline SVGs (Check, X, Spinner) to avoid adding lucide-react as a component dependency in the stepper.

## Challenges & Solutions

**Challenge:** Server Components can't use browser `credentials: "include"` for API calls.
**Solution:** Created `lib/api/server.ts` with `serverHeaders()` that reads the auth cookie via `next/headers` cookies() and passes it as a `Cookie` header.

**Challenge:** "New Pipeline" button needs `useState` but lives on a Server Component page.
**Solution:** Islands architecture — extracted `NewPipelineButton` as a `"use client"` component that owns both the button and the dialog state.

## Patterns Established

```tsx
// Server Component data fetching with cookie forwarding
export default async function Page() {
  const headers = await serverHeaders();
  const data = await getPipelines(1, 50, { headers });
  return <Table data={data} />;
}
```

```tsx
// Client island on a Server Component page
// page.tsx (server): <NewPipelineButton />
// new-pipeline-button.tsx ("use client"): owns dialog state
```

```tsx
// Agent step state machine from WebSocket events
const steps = buildSteps(pipeline, events);
// Maps 7 canonical agent names → pending|active|completed|failed|skipped
```

## Lessons Learned

**What Worked Well:**
- shadcn/ui dialog + select + table installed cleanly with one command
- The RSC split (server list / client detail) was natural — each page has a clear reason for its rendering mode
- zod validation provided clean error handling without complex form libraries

**What Could Be Improved:**
- The `params` type in Next.js 16 dynamic routes is `Promise<{ id: string }>` (must be awaited) — different from Next.js 14 docs
- Could add skeleton loading states for the pipeline list and detail pages

## Next Session

**FE-03** — Checkpoint UI + Design Spec Viewer
