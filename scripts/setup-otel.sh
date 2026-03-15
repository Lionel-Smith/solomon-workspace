#!/bin/bash
# setup-otel.sh — Deploy OTEL observability stack to solomon-HFS droplet
#
# Usage: ./scripts/setup-otel.sh
#
# Prerequisites:
#   - SSH access: ssh solomon (configured in ~/.ssh/config)
#   - Docker + Docker Compose on droplet
#   - solomon-ops network exists on droplet

set -euo pipefail

DROPLET="solomon"
REMOTE_DIR="/opt/observability"
LOCAL_DIR="$(cd "$(dirname "$0")/../observability" && pwd)"

echo "=== HFS Observability Deployment ==="
echo "Droplet: $DROPLET"
echo "Remote: $REMOTE_DIR"
echo ""

# 1. Create remote directory
echo "Creating remote directory..."
ssh "$DROPLET" "mkdir -p $REMOTE_DIR"

# 2. Copy config files
echo "Copying configuration files..."
scp "$LOCAL_DIR/docker-compose.otel.yml" "$DROPLET:$REMOTE_DIR/"
scp "$LOCAL_DIR/otel-config.yaml" "$DROPLET:$REMOTE_DIR/"
scp "$LOCAL_DIR/prometheus.yml" "$DROPLET:$REMOTE_DIR/"

# 3. Ensure network exists
echo "Ensuring solomon-ops network..."
ssh "$DROPLET" "docker network create solomon-ops 2>/dev/null || true"

# 4. Start services
echo "Starting OTEL stack..."
ssh "$DROPLET" "cd $REMOTE_DIR && docker compose -f docker-compose.otel.yml up -d"

# 5. Wait for health
echo "Waiting for services..."
sleep 5

# 6. Verify
echo ""
echo "=== Service Status ==="
ssh "$DROPLET" "docker compose -f $REMOTE_DIR/docker-compose.otel.yml ps"

echo ""
echo "=== Access URLs ==="
DROPLET_IP=$(ssh "$DROPLET" "hostname -I | awk '{print \$1}'")
echo "Prometheus:     http://$DROPLET_IP:9090"
echo "Grafana:        http://$DROPLET_IP:3001 (admin/hfs-admin)"
echo "OTEL Collector: http://$DROPLET_IP:4318"
echo ""
echo "Configure Claude Code:"
echo "  export CLAUDE_CODE_TELEMETRY=otel"
echo "  export OTEL_EXPORTER_OTLP_ENDPOINT=http://$DROPLET_IP:4318"
echo ""
echo "Done."
