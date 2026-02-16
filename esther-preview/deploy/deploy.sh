#!/usr/bin/env bash
# Deploy Esther Preview to the solomon-HFS droplet.
#
# Prerequisites:
#   - Node.js 20+ installed on the droplet
#   - PM2 installed globally: npm install -g pm2
#   - Caddy installed: apt install caddy
#   - DNS: A record for preview.hfs.do → 198.199.121.241 (in Squarespace DNS)
#
# Usage:
#   ssh solomon 'bash -s' < deploy/deploy.sh
#   # or run directly on the droplet

set -euo pipefail

APP_DIR="/opt/esther-preview"
REPO_URL="https://github.com/highfunctioningsolutions/esther-preview.git"

echo "==> Deploying Esther Preview"

# Clone or pull
if [ -d "$APP_DIR" ]; then
  echo "==> Pulling latest..."
  cd "$APP_DIR"
  git pull origin master
else
  echo "==> Cloning..."
  git clone "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

# Install dependencies
echo "==> Installing dependencies..."
npm ci --production=false

# Build
echo "==> Building Next.js..."
npm run build

# Create log directory
mkdir -p /var/log/esther-preview

# Environment
if [ ! -f .env.local ]; then
  cat > .env.local << 'ENVEOF'
NEXT_PUBLIC_API_URL=https://api.hfs.do/esther/api/v1
NEXT_PUBLIC_WS_URL=wss://api.hfs.do/esther/ws
AUTH_COOKIE_NAME=esther_token
ENVEOF
  echo "==> Created .env.local — review and adjust if needed"
fi

# PM2
echo "==> Starting with PM2..."
pm2 delete esther-preview 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Caddy
echo "==> Updating Caddy config..."
cp deploy/Caddyfile /etc/caddy/sites/esther-preview.caddy 2>/dev/null || \
  echo "==> NOTE: Copy deploy/Caddyfile to your Caddy config manually"
systemctl reload caddy 2>/dev/null || echo "==> NOTE: Reload Caddy manually"

echo ""
echo "==> Deployment complete!"
echo "    App: https://preview.hfs.do"
echo "    PM2: pm2 status esther-preview"
echo "    Logs: pm2 logs esther-preview"
echo ""
echo "    DNS REMINDER: Ensure preview.hfs.do A record points to $(curl -s ifconfig.me)"
