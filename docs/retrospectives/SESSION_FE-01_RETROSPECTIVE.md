# Session FE-01: Next.js App Scaffold - Retrospective

**Duration:** ~45 min
**Completed:** 2026-02-16
**Commit:** ec04c98

## What Was Built

- `esther-preview/` — Full Next.js 16 application scaffold (39 files, +13,234 lines)
- `src/lib/api/` — Typed API client layer (types.ts, client.ts, pipelines.ts, checkpoints.ts, design-specs.ts, index.ts)
- `src/hooks/useWebSocket.ts` — WebSocket hook with exponential backoff auto-reconnect
- `src/lib/auth/auth-context.tsx` — AuthProvider + useAuth() context (httpOnly cookie auth)
- `src/middleware.ts` — Edge middleware protecting /pipelines/* and /design-specs/*
- `src/app/login/` — Login page with Suspense boundary for useSearchParams
- `src/components/providers.tsx` — Client-side Providers wrapper (AuthProvider + Toaster)
- shadcn/ui components: button, card, input, label, badge, sonner

**Total:** +13,234 lines across 39 files (11,827 in package-lock.json)

## Key Technical Decisions

- **Next.js 16 + Turbopack**: Latest version with Turbopack as default bundler. Noted `middleware` → `proxy` deprecation warning but kept `middleware.ts` since it still works and the session spec explicitly names it.
- **Tailwind CSS v4 (oklch)**: shadcn/ui v4 initialized with the new Tailwind v4 approach using CSS-first configuration instead of `tailwind.config.ts`.
- **httpOnly cookie auth (not localStorage)**: All auth flows use `credentials: "include"` — the JWT is set/cleared by the server via Set-Cookie headers. Zero token management on the client side.
- **API client layering**: Base `client.ts` provides typed `get/post/put/del` with automatic error parsing. Domain modules compose on top. Barrel `index.ts` export allows `import { getPipeline } from "@/lib/api"`.
- **Suspense boundary for useSearchParams**: Next.js App Router requires `useSearchParams()` to be wrapped in `<Suspense>` because it triggers CSR bailout. Split login page into server wrapper + client form component.

## Challenges & Solutions

**Challenge:** `npx create-next-app` hung on interactive "React Compiler?" prompt.
**Solution:** Piped `echo "N"` to stdin to answer the prompt non-interactively.

**Challenge:** `useSearchParams()` caused build failure — "should be wrapped in a suspense boundary".
**Solution:** Split `login/page.tsx` into a server component wrapper with `<Suspense>` and a `login-form.tsx` client component that uses the hook.

**Challenge:** `export const config` name collision in middleware.ts (conflicts with imported `config` from lib/config).
**Solution:** Renamed import to `appConfig` to avoid the naming conflict with Next.js's expected `config` export.

**Challenge:** ESLint `react-hooks/immutability` rule rejected `useCallback` + `useEffect` pattern in WebSocket hook.
**Solution:** Moved `connect()` function definition inside the `useEffect` body with a `disposed` flag for cleanup, eliminating the need for `useCallback`.

## Patterns Established

```typescript
// API client pattern — all requests go through typed wrappers
import { get, post } from "./client";
import type { Pipeline } from "./types";

export async function getPipeline(id: string): Promise<Pipeline> {
  return get<Pipeline>(`/api/pipelines/${id}`);
}
```

```typescript
// WebSocket with disposed flag pattern — prevents reconnect after unmount
useEffect(() => {
  let disposed = false;
  function connect() {
    if (disposed) return;
    const ws = new WebSocket(url);
    ws.onclose = () => {
      if (!disposed) retryRef.current = setTimeout(connect, delay);
    };
  }
  connect();
  return () => { disposed = true; /* cleanup */ };
}, [pipelineId]);
```

## Lessons Learned

**What Worked Well:**
- shadcn/ui v4 initialization was smooth — `npx shadcn@latest init -d` with default config
- TypeScript types from Pydantic models were straightforward to mirror manually
- The API client layer pattern produces very clean, readable domain modules

**What Could Be Improved:**
- Next.js 16's `middleware` → `proxy` migration should be tracked — future sessions may need to rename the file
- ESLint rules in Next.js 16 are stricter about React hooks patterns — the `react-hooks/immutability` rule was unexpected
- Progress file divergence between EST_PROGRESS.md and features.json needs a sync mechanism

## Next Session

**FE-02** — Pipeline Dashboard
