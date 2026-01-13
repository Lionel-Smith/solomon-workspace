#!/usr/bin/env bash
# sync-claude-config.sh - Sync Claude Code settings across devices
# Usage: ./sync-claude-config.sh [install|sync|export|status]

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
CONFIG_DIR="$REPO_ROOT/claude-config"
CLAUDE_DIR="$HOME/.claude"

# Functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

validate_json() {
    local file="$1"
    if command -v jq &> /dev/null; then
        if jq empty "$file" 2>/dev/null; then
            return 0
        else
            log_error "Invalid JSON in $file"
            return 1
        fi
    else
        log_warn "jq not installed, skipping JSON validation"
        return 0
    fi
}

backup_existing() {
    local target="$1"
    if [[ -e "$target" ]]; then
        local backup="${target}.backup.$(date +%Y%m%d_%H%M%S)"
        cp -r "$target" "$backup"
        log_info "Backed up existing file to $backup"
    fi
}

sync_settings() {
    log_info "Syncing settings.json..."

    local template="$CONFIG_DIR/settings.template.json"
    local secrets="$CONFIG_DIR/secrets.env"
    local target="$CLAUDE_DIR/settings.json"

    # Check for template
    if [[ ! -f "$template" ]]; then
        log_error "Template not found at $template"
        return 1
    fi

    # Check for secrets
    if [[ ! -f "$secrets" ]]; then
        log_error "Secrets file not found at $secrets"
        log_info "Copy secrets.example.env to secrets.env and fill in your values"
        return 1
    fi

    # Load secrets
    # shellcheck disable=SC1090
    source "$secrets"

    # Create Claude directory if needed
    mkdir -p "$CLAUDE_DIR"

    # Backup existing
    backup_existing "$target"

    # Substitute variables and write settings
    local content
    content=$(cat "$template")
    content="${content//\{\{SOLOMON_WORKSPACE\}\}/$SOLOMON_WORKSPACE}"
    content="${content//\{\{MEM0_API_KEY\}\}/$MEM0_API_KEY}"
    content="${content//\{\{HOME\}\}/$HOME}"

    echo "$content" > "$target"

    # Validate result
    if ! validate_json "$target"; then
        log_error "Generated settings.json is invalid"
        return 1
    fi

    log_success "Settings synced to $target (from template + secrets)"
}

sync_skills() {
    log_info "Syncing skills..."

    local source_dir="$CONFIG_DIR/skills"
    local target_dir="$CLAUDE_DIR/skills"

    if [[ ! -d "$source_dir" ]]; then
        log_warn "No skills directory in config, skipping"
        return 0
    fi

    # Create skills directory if needed
    mkdir -p "$target_dir"

    # Count skills
    local count
    count=$(find "$source_dir" -name "*.skill" 2>/dev/null | wc -l | tr -d ' ')

    if [[ "$count" -eq 0 ]]; then
        log_warn "No .skill files found in $source_dir"
        return 0
    fi

    # Copy skills
    cp "$source_dir"/*.skill "$target_dir/" 2>/dev/null || true
    log_success "Synced $count skill(s) to $target_dir"
}

sync_hooks() {
    log_info "Syncing hooks..."

    local source_dir="$CONFIG_DIR/hooks"
    local target_dir="$CLAUDE_DIR/hooks"

    if [[ ! -d "$source_dir" ]]; then
        log_info "No hooks directory in config, skipping"
        return 0
    fi

    # Create hooks directory if needed
    mkdir -p "$target_dir"

    # Copy hooks
    if [[ -n "$(ls -A "$source_dir" 2>/dev/null)" ]]; then
        cp -r "$source_dir"/* "$target_dir/"
        log_success "Hooks synced to $target_dir"
    else
        log_info "No hooks to sync"
    fi
}

install_git_hook() {
    log_info "Installing git post-merge hook..."

    local git_dir="$REPO_ROOT/.git"
    local hooks_dir="$git_dir/hooks"
    local hook_file="$hooks_dir/post-merge"

    if [[ ! -d "$git_dir" ]]; then
        log_warn "Not a git repository, skipping hook installation"
        return 0
    fi

    mkdir -p "$hooks_dir"

    cat > "$hook_file" << 'EOF'
#!/usr/bin/env bash
# Auto-sync Claude config after git pull
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [[ -x "$SCRIPT_DIR/scripts/sync-claude-config.sh" ]]; then
    echo "Running Claude config sync..."
    "$SCRIPT_DIR/scripts/sync-claude-config.sh" sync
fi
EOF

    chmod +x "$hook_file"
    log_success "Git post-merge hook installed"
}

do_sync() {
    log_info "Starting Claude config sync..."
    echo ""

    sync_settings
    sync_skills
    sync_hooks

    echo ""
    log_success "Claude config sync complete!"
    log_info "Restart Claude Code for changes to take effect"
}

do_install() {
    log_info "Installing Claude config sync..."
    echo ""

    do_sync
    install_git_hook

    echo ""
    log_success "Installation complete!"
}

do_export() {
    log_info "Exporting current Claude config to repo..."
    echo ""

    # Export settings.json
    if [[ -f "$CLAUDE_DIR/settings.json" ]]; then
        validate_json "$CLAUDE_DIR/settings.json" || {
            log_error "Current settings.json is invalid, aborting export"
            return 1
        }
        cp "$CLAUDE_DIR/settings.json" "$CONFIG_DIR/settings.json"
        log_success "Exported settings.json"
    else
        log_warn "No settings.json found at $CLAUDE_DIR"
    fi

    # Export skills
    if [[ -d "$CLAUDE_DIR/skills" ]]; then
        mkdir -p "$CONFIG_DIR/skills"
        local count
        count=$(find "$CLAUDE_DIR/skills" -name "*.skill" 2>/dev/null | wc -l | tr -d ' ')
        if [[ "$count" -gt 0 ]]; then
            cp "$CLAUDE_DIR/skills"/*.skill "$CONFIG_DIR/skills/" 2>/dev/null || true
            log_success "Exported $count skill(s)"
        fi
    fi

    echo ""
    log_success "Export complete!"
    log_info "Review changes with: git diff claude-config/"
    log_warn "Remember to sanitize any API keys before committing!"
}

do_status() {
    echo ""
    echo "=== Claude Config Sync Status ==="
    echo ""

    # Config directory
    echo "Config Directory: $CONFIG_DIR"
    if [[ -d "$CONFIG_DIR" ]]; then
        echo -e "  ${GREEN}✓${NC} Exists"

        if [[ -f "$CONFIG_DIR/settings.template.json" ]]; then
            echo -e "  ${GREEN}✓${NC} settings.template.json present"
            if validate_json "$CONFIG_DIR/settings.template.json" 2>/dev/null; then
                echo -e "  ${GREEN}✓${NC} settings.template.json valid JSON"
            else
                echo -e "  ${RED}✗${NC} settings.template.json invalid JSON"
            fi
        else
            echo -e "  ${YELLOW}○${NC} settings.template.json missing"
        fi

        if [[ -f "$CONFIG_DIR/secrets.env" ]]; then
            echo -e "  ${GREEN}✓${NC} secrets.env present (local)"
        else
            echo -e "  ${YELLOW}○${NC} secrets.env missing - copy from secrets.example.env"
        fi

        local skill_count
        skill_count=$(find "$CONFIG_DIR/skills" -name "*.skill" 2>/dev/null | wc -l | tr -d ' ')
        echo "  Skills in repo: $skill_count"
    else
        echo -e "  ${RED}✗${NC} Does not exist"
    fi

    echo ""

    # Claude directory
    echo "Claude Directory: $CLAUDE_DIR"
    if [[ -d "$CLAUDE_DIR" ]]; then
        echo -e "  ${GREEN}✓${NC} Exists"

        local local_skill_count
        local_skill_count=$(find "$CLAUDE_DIR/skills" -name "*.skill" 2>/dev/null | wc -l | tr -d ' ')
        echo "  Skills installed: $local_skill_count"
    else
        echo -e "  ${YELLOW}○${NC} Does not exist"
    fi

    echo ""

    # Git hook
    echo "Git Hook:"
    if [[ -f "$REPO_ROOT/.git/hooks/post-merge" ]]; then
        echo -e "  ${GREEN}✓${NC} post-merge hook installed"
    else
        echo -e "  ${YELLOW}○${NC} post-merge hook not installed"
    fi

    echo ""

    # Sync status
    echo "Sync Status:"
    if [[ -f "$CONFIG_DIR/settings.template.json" ]] && [[ -f "$CONFIG_DIR/secrets.env" ]]; then
        echo -e "  ${GREEN}✓${NC} Ready to sync (template + secrets available)"
    elif [[ -f "$CONFIG_DIR/settings.template.json" ]]; then
        echo -e "  ${YELLOW}○${NC} Need secrets.env to sync"
    else
        echo -e "  ${RED}✗${NC} Missing template file"
    fi

    echo ""
}

# Main
case "${1:-sync}" in
    install)
        do_install
        ;;
    sync)
        do_sync
        ;;
    export)
        do_export
        ;;
    status)
        do_status
        ;;
    *)
        echo "Usage: $0 [install|sync|export|status]"
        echo ""
        echo "Commands:"
        echo "  install  - Sync config and install git hook (run once per device)"
        echo "  sync     - Sync config from repo to local Claude directory"
        echo "  export   - Export local Claude config to repo"
        echo "  status   - Show sync status"
        exit 1
        ;;
esac
