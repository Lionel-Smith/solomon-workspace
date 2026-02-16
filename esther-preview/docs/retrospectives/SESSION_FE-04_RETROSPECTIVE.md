# Session FE-04: Frontend Polish + Deployment - Retrospective

**Duration:** ~30 minutes
**Completed:** 2026-02-16
**Commit:** 833d126

## What Was Built

- `src/app/pipelines/loading.tsx` (+30 lines) — Skeleton table rows for pipeline list
- `src/app/pipelines/error.tsx` (+28 lines) — Error card with retry for pipeline list
- `src/app/pipelines/[id]/loading.tsx` (+42 lines) — Skeleton stepper + panels for pipeline detail
- `src/app/pipelines/[id]/error.tsx` (+34 lines) — Error card with back navigation
- `src/app/design-specs/[id]/loading.tsx` (+34 lines) — Skeleton tabs for spec viewer
- `src/app/design-specs/[id]/error.tsx` (+32 lines) — Error card with back navigation
- `src/app/error.tsx` (+24 lines) — Global error boundary
- `src/app/api/health/route.ts` (+8 lines) — Health check JSON endpoint
- `src/components/ui/skeleton.tsx` — shadcn skeleton component
- `ecosystem.config.js` (+18 lines) — PM2 process configuration
- `deploy/Caddyfile` (+27 lines) — Caddy reverse proxy with WebSocket support
- `deploy/deploy.sh` (+56 lines) — Automated deployment script
- `.env.production` (+3 lines) — Production environment variables
- `src/app/pipelines/page.tsx` (modified) — Mobile card layout + desktop table
- `src/app/pipelines/[id]/pipeline-detail.tsx` (modified) — Responsive header
- `src/app/design-specs/[id]/spec-viewer.tsx` (modified) — Responsive header + code tab
- `src/components/checkpoint-panel.tsx` (modified) — Toast notifications on actions
- `src/components/new-pipeline-dialog.tsx` (modified) — Toast on pipeline creation

**Total:** +517 / -47 lines across 19 files

## Key Technical Decisions

1. **Toasts at the action layer, not the fetch layer**: The API client runs in both Server and Client Components. Sonner toasts are browser-only, so notifications are wired at the user-action level (checkpoint approve/reject, pipeline create) rather than the generic fetch wrapper.

2. **Mobile card layout vs table**: On mobile (< md breakpoint), pipelines show as tappable cards with stacked info. On desktop, the full table layout provides the data density needed for scanning multiple pipelines. Both render from the same data — no duplication of logic.

3. **Caddy over Nginx**: Caddy provides automatic HTTPS via Let's Encrypt with zero certificate management. The WebSocket matcher ensures upgrade headers pass through cleanly.

4. **DNS handled via Squarespace**: The droplet runs Caddy but DNS is managed externally. Deploy script includes a reminder to add the A record in Squarespace DNS.

## Challenges & Solutions

**Challenge:** `.env.production` gitignored by the blanket `.env*` pattern.
**Solution:** Added `!.env.production` exception to `.gitignore` alongside the existing `!.env.local` — both files contain only public URLs, no secrets.

## Patterns Established

- **Per-route loading/error convention**: Every dynamic route gets `loading.tsx` (skeleton) + `error.tsx` (client component with retry). Global `app/error.tsx` catches anything not caught by route-level boundaries.
- **Skeleton mirroring**: Loading skeletons match the exact layout dimensions of the real content (same grid columns, same heights) for smooth CLS-free transitions.
- **Deploy script pattern**: `deploy/deploy.sh` + `deploy/Caddyfile` + `ecosystem.config.js` — all deployment artifacts live in the repo.

## Lessons Learned

**What Worked Well:**
- Phase 6 (Frontend) is now 100% complete — all 4 sessions (FE-01 through FE-04) delivered a full Next.js dashboard from scaffold to deployment config
- The shadcn component library approach paid off — skeleton, toast (sonner), and all UI primitives were simple CLI installs
- Responsive design was straightforward since Tailwind's breakpoint system (md:) maps cleanly to the mobile-first constraint

**What Could Be Improved:**
- The actual deployment (Task 4: smoke test) is deferred to when the droplet is ready — this session prepared all config but can't verify the live deployment
- Could add more granular loading states (individual card skeletons vs whole-page skeleton)

## Next Session

FINT-01: Linear Integration
