# esther-preview

Real-time dashboard for the Esther AI Design Agent pipeline. Built with Next.js 16, shadcn/ui, and Tailwind CSS.

**Production URL:** preview.hfs.do

## Features

- **Pipeline Dashboard** — List and monitor all active design pipelines
- **Real-Time Updates** — WebSocket streaming of agent progress
- **Checkpoint Approval** — Approve, reject, or revise pipeline checkpoints
- **Design Spec Viewer** — Browse brand tokens, components, and generated code
- **Artifact Browser** — Preview and download pipeline artifacts from DO Spaces

## Setup

```bash
npm install
cp .env.example .env.local  # configure API URL
npm run dev
```

Open http://localhost:3000.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Esther cloud API base URL |
| `NEXT_PUBLIC_WS_URL` | Yes | WebSocket endpoint URL |

Example `.env.local`:

```
NEXT_PUBLIC_API_URL=https://api.hfs.do/esther/api/v1
NEXT_PUBLIC_WS_URL=wss://api.hfs.do/esther/api/v1/ws
```

## Architecture

```
esther-preview/
├── app/
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Pipeline dashboard (home)
│   ├── pipelines/
│   │   └── [id]/
│   │       └── page.tsx        # Pipeline detail + real-time progress
│   └── design-specs/
│       └── [id]/
│           └── page.tsx        # Design spec viewer
├── components/
│   ├── ui/                     # shadcn/ui base components
│   ├── pipeline-card.tsx       # Pipeline status card
│   ├── pipeline-progress.tsx   # Agent progress stepper
│   ├── checkpoint-dialog.tsx   # Approve/reject dialog
│   ├── brand-token-grid.tsx    # Brand token display
│   ├── code-preview.tsx        # Generated code viewer
│   └── artifact-list.tsx       # Artifact browser
├── hooks/
│   ├── use-pipeline.ts         # Pipeline data fetching
│   ├── use-websocket.ts        # WebSocket connection
│   └── use-checkpoint.ts       # Checkpoint actions
├── lib/
│   ├── api.ts                  # API client
│   └── types.ts                # TypeScript types
└── public/
```

## Key Pages

### Pipeline Dashboard (`/`)

Lists all pipelines with status indicators (created, running, paused, completed, failed). Supports filtering by status and creator.

### Pipeline Detail (`/pipelines/[id]`)

Real-time agent progress via WebSocket. Shows:
- Current agent and progress percentage
- Agent completion timeline
- Pending checkpoint with approval UI
- Error details if failed

### Design Spec Viewer (`/design-specs/[id]`)

Displays the completed Design Spec with tabs for:
- Brand tokens (color swatches, typography preview)
- Component manifest
- Generated code files with syntax highlighting
- WCAG audit report

## Deployment

### PM2 (Production)

```bash
npm run build
pm2 start ecosystem.config.js
```

### Caddy

Reverse proxy configuration in the Caddyfile:

```
preview.hfs.do {
    reverse_proxy localhost:3000
}
```

## Development

```bash
npm run dev       # Development server
npm run build     # Production build
npm run lint      # ESLint
```
