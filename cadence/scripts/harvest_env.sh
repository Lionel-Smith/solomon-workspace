#!/usr/bin/env bash
# HFS Cadence Layer — env harvest from droplet + local generation
#
# Pulls existing credentials from /opt/clawdbot.env on the solomon-HFS
# droplet, generates SAMSON_INTERNAL_TOKEN locally, and stages placeholders
# for the four vars that must be provisioned externally.
#
# Output target: hfs-aiops/.env (gitignored).
#
# This script is safe to re-run — it overwrites the target each time.
# SSH stdout is redirected directly to the target file; secret values
# never appear in this script's stdout.
#
# Usage:
#   ./solomon-workspace/cadence/scripts/harvest_env.sh
#
# After running, populate the 4 REPLACE_ME values manually:
#   - ANTHROPIC_ADMIN_KEY        (console.anthropic.com → Admin)
#   - SLACK_SIGNING_SECRET       (api.slack.com → Apps → clawdbot → Basic)
#   - TWILIO_ACCOUNT_SID, AUTH_TOKEN, WHATSAPP_NUMBER  (console.twilio.com)
#   - DATABASE_URL               (local postgres or DO postgres tunnel)
set -euo pipefail

TARGET="${1:-$HOME/Documents/GitHub/solomon-workspace/hfs-aiops/.env}"
SSH_HOST="${SSH_HOST:-solomon}"
DROPLET_ENV_PATH="${DROPLET_ENV_PATH:-/opt/clawdbot.env}"
HARVEST_KEYS='ANTHROPIC_API_KEY|SLACK_BOT_TOKEN|MEM0_API_KEY|LINEAR_API_KEY|GITHUB_TOKEN'

echo "→ Target: $TARGET"

# Step 1: header + provenance
cat > "$TARGET" <<HEADER
# HFS Cadence Layer .env — populated $(date '+%Y-%m-%d %H:%M:%S %Z')
# Harvest source: $SSH_HOST:$DROPLET_ENV_PATH
# Generator: solomon-workspace/cadence/scripts/harvest_env.sh
# GITIGNORED — never commit this file.

HEADER

# Step 2: harvest from droplet (stdout → file, never returned to caller)
echo "→ Harvesting from $SSH_HOST:$DROPLET_ENV_PATH ..."
{
  echo "# --- harvested from $SSH_HOST:$DROPLET_ENV_PATH ---"
  ssh "$SSH_HOST" "grep -E '^(${HARVEST_KEYS})=' '$DROPLET_ENV_PATH'" || {
    echo "# HARVEST FAILED — see /tmp/harvest_err.log"
    exit 1
  }
  echo ""
} >> "$TARGET"

# Step 3: generate SAMSON_INTERNAL_TOKEN locally
echo "→ Generating SAMSON_INTERNAL_TOKEN locally..."
{
  echo "# --- generated locally ---"
  python3 -c "import secrets; print(f'SAMSON_INTERNAL_TOKEN={secrets.token_urlsafe(36)}')"
  echo ""
} >> "$TARGET"

# Step 4: placeholders for vars that must be provisioned externally
{
  cat <<PLACEHOLDERS
# --- TODO: provision externally before SETUP-00 ---
# ANTHROPIC_ADMIN_KEY: console.anthropic.com → Admin → API Keys (rotate quarterly)
ANTHROPIC_ADMIN_KEY=sk-ant-admin01-REPLACE_ME
# SLACK_SIGNING_SECRET: api.slack.com → Apps → clawdbot → Basic Information
SLACK_SIGNING_SECRET=REPLACE_ME
# TWILIO_*: console.twilio.com (net-new for v1.1 Cadence Layer WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=REPLACE_ME
TWILIO_WHATSAPP_NUMBER=whatsapp:+1XXXXXXXXXX
# DATABASE_URL: local postgres or tunnel to DO postgres
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@localhost:5432/hfs_aiops
PLACEHOLDERS
} >> "$TARGET"

# Step 5: secure perms
chmod 600 "$TARGET"
echo "→ chmod 600 $TARGET"

# Step 6: presence-only verification (no values printed)
echo ""
echo "=== Resulting .env keys (names + lengths only) ==="
awk -F= '/^[A-Z_][A-Z0-9_]*=/ {key=$1; rest=substr($0, index($0,"=")+1); printf "  %-26s len=%d\n", key, length(rest)}' "$TARGET"

# Step 7: missing-vs-required summary
echo ""
echo "=== SETUP-00 verification preview ==="
REQUIRED='ANTHROPIC_API_KEY ANTHROPIC_ADMIN_KEY SLACK_BOT_TOKEN SLACK_SIGNING_SECRET TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_WHATSAPP_NUMBER MEM0_API_KEY DATABASE_URL SAMSON_INTERNAL_TOKEN'
populated=0
needs_replace=0
for var in $REQUIRED; do
  val=$(grep -E "^${var}=" "$TARGET" | head -1 | cut -d= -f2-)
  if [ -z "$val" ]; then
    printf "  --  %-26s MISSING ENTRY\n" "$var"
  elif echo "$val" | grep -iqE 'replace_me|x{4,}|user:password|acxxx'; then
    printf "  ??  %-26s PLACEHOLDER (needs provisioning)\n" "$var"
    needs_replace=$((needs_replace + 1))
  else
    printf "  OK  %-26s (populated)\n" "$var"
    populated=$((populated + 1))
  fi
done
echo ""
echo "Summary: $populated populated, $needs_replace placeholders, $((10 - populated - needs_replace)) missing of 10 required"
echo ""
echo "Source the file before SETUP-00:"
echo "  set -a && source $TARGET && set +a"
