# HFS Observability Stack

OpenTelemetry collector + Prometheus + Grafana for Claude Code session metrics.

## Quick Start

```bash
# Deploy to droplet
./scripts/setup-otel.sh

# Or run locally
docker compose -f observability/docker-compose.otel.yml up -d
```

## Configure Claude Code

```bash
export CLAUDE_CODE_TELEMETRY=otel
export OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

## Access

| Service | URL | Purpose |
|---------|-----|---------|
| Prometheus | http://localhost:9090 | Query metrics, alerts |
| Grafana | http://localhost:3001 | Dashboards (admin/hfs-admin) |
| OTEL Collector | http://localhost:4318 | OTLP HTTP receiver |

## Key Metrics

| Metric | Description | Alert Threshold |
|--------|-------------|----------------|
| `hfs_session_duration_seconds` | Time per session | — |
| `hfs_session_tokens_input` | Context consumption | — |
| `hfs_session_tokens_output` | Generation tokens | — |
| `hfs_session_cost_usd` | Per-session spend | > $1.00 |
| `hfs_context_utilization_pct` | Context window usage | > 50% caution, > 70% critical |
| `hfs_session_tool_calls` | Tool call count | — |
| `hfs_rework_rate` | Reverted commits / total | > 10% |

## Architecture

```
Claude Code ──OTLP──→ OTEL Collector ──metrics──→ Prometheus ──query──→ Grafana
                          :4318              :8889           :9090        :3001

HFS Agents ──/_health──→ Prometheus (direct scrape)
  :8080-8088
```

## Resource Limits

| Service | Memory Limit | Purpose |
|---------|-------------|---------|
| OTEL Collector | 256 MB | Receive and batch telemetry |
| Prometheus | 512 MB | Store 30 days of metrics (2GB disk cap) |
| Grafana | 256 MB | Dashboard UI |

Total: ~1 GB additional on droplet (3.8 GB available).

## Prometheus Retention

- Time: 30 days
- Size: 2 GB max
- Sufficient for HFS volume (~10 sessions/day)

## Deployment

The `scripts/setup-otel.sh` script handles:
1. Copy config files to droplet via scp
2. Start containers with `docker compose up -d`
3. Verify collector health
4. Print access URLs
