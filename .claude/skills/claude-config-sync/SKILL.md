---
name: claude-config-sync
description: Sync Claude Code settings across Mac/Linux/Windows workstations. Maintains a single source of truth for Claude Code configuration including settings.json, custom skills, CLAUDE.md templates, and hooks. Use when setting up Claude on a new device, syncing settings, or exporting config for backup.
---

# Claude Config Sync

Cross-platform Claude Code settings synchronization.

## Philosophy

Your Claude environment should be reproducible. A new laptop should have your full Claude setup within minutes of cloning this repo.

## Triggers

- When setting up Claude Code on a new device
- When user says "sync my claude settings"
- When exporting Claude config for backup
- When updating shared Claude settings across team
- After enabling/disabling Claude plugins
- After creating/modifying custom skills

## Constraints

### Sync Direction (Critical)
- Repo is source of truth - sync direction is repo → device
- Never auto-push local changes to repo (explicit export required)

### What to Sync (Critical/High)
- Only sync configuration files, never sync history or cache
- settings.json must be valid JSON before syncing
- Skills must have .skill extension

### Platform Compatibility (High/Medium)
- Scripts must work on Mac, Linux, AND Windows
- Use platform-appropriate path separators
- PowerShell script should mirror bash script functionality exactly

### Verification (Critical/High)
- Pre-sync: Verify source files exist and are valid
- Post-sync: Verify destination files were written correctly
- Show diff summary when files change

## Forbidden Patterns

### Never Sync These
| Pattern | Reason |
|---------|--------|
| Syncing history.jsonl | device-specific, contains personal data |
| Syncing projects/ directory | device-specific project references |
| Syncing todos/, debug/, cache/ directories | temporary session data |
| Syncing files with API keys or tokens | contains sensitive tokens |

### Dangerous Operations
| Pattern | Reason |
|---------|--------|
| Auto-pushing to repo without explicit export | could overwrite unsaved local changes |
| Sync without backup of existing config | loses local customizations |
| Suppressing sync errors with `\|\| true` | silent failure |

### Cross-Platform Issues
| Pattern | Reason |
|---------|--------|
| Hardcoded Unix paths like /home/user | breaks on Windows |
| Hardcoded Windows paths like C:\Users | breaks on Mac/Linux |

## Workflow

### Step 1: Initial Setup (once per device)

Clone HFS repo and run install command:

**Mac/Linux:**
```bash
./scripts/sync-claude-config.sh install
```

**Windows (PowerShell):**
```powershell
.\scripts\sync-claude-config.ps1 -Action install
```

This syncs settings AND installs git post-merge hook.

**Output:** Claude configured + auto-sync enabled

### Step 2: Ongoing - Pull to Sync

After initial setup, just pull the repo:

```bash
git pull origin main
```

Post-merge hook automatically runs sync.

**Output:** Settings updated automatically

### Step 3: Exporting Changes

After changing settings locally (e.g., enabling a plugin):

1. Export: `./scripts/sync-claude-config.sh export`
2. Review: `git diff claude-config/`
3. Commit: `git add claude-config/ && git commit -m "chore: update claude settings"`
4. Push: `git push`

**Output:** Settings saved to repo, available on other devices

### Step 4: Verify Sync Status

Check what's synced and hook status:

```bash
./scripts/sync-claude-config.sh status
```

Shows:
- Files in repo vs local
- Directory file counts
- Git hook installation status

**Output:** Sync state visibility

## Error Handling

| Condition | Solution |
|-----------|----------|
| sync_fails_json_invalid | Validate settings.json with: `cat settings.json \| jq .` |
| permission_denied | Mac/Linux: `chmod +x scripts/sync-claude-config.sh` |
| windows_execution_policy | Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` |
| git_hook_not_running | Verify hook exists: `cat .git/hooks/post-merge` |
| settings_not_applying | Restart Claude Code after sync |
| skills_not_loading | Check .skill file syntax, must be valid format |

## Sync Manifest

### Files to Sync
| Path | Description | Destination |
|------|-------------|-------------|
| settings.json | Enabled plugins, permissions, preferences | ~/.claude/ |
| CLAUDE.md | Default project instructions template | ~/ |

### Directories to Sync
| Path | Description | Optional |
|------|-------------|----------|
| skills/ | Custom Claude skills (.skill files) | No |
| hooks/ | Hook configurations | Yes |

### Never Sync (Excluded)
| Path | Reason |
|------|--------|
| history.jsonl | Conversation history is device-specific |
| projects/ | Project references are device-specific |
| todos/ | Session todos are temporary |
| debug/ | Debug logs are temporary |
| cache/ | Cache is temporary |
| session-env/ | Session environment is temporary |
| file-history/ | File history is device-specific |
| shell-snapshots/ | Shell snapshots are device-specific |
| telemetry/ | Telemetry is device-specific |
| stats-cache.json | Stats are device-specific |
| *.lock | Lock files are temporary |

## Verification

```bash
# settings.json is valid JSON
cat claude-config/settings.json | jq . > /dev/null 2>&1 && echo PASS || echo FAIL

# At least one skill file exists
ls claude-config/skills/*.skill 2>/dev/null | wc -l

# Bash script is executable
test -x scripts/sync-claude-config.sh && echo PASS || echo FAIL

# Git post-merge hook exists
test -f .git/hooks/post-merge && echo PASS || echo 'NOT INSTALLED'

# Local settings match repo
diff -q ~/.claude/settings.json claude-config/settings.json 2>/dev/null && echo SYNCED || echo 'OUT OF SYNC'
```

## Examples

### New Laptop Setup
```bash
# Clone the HFS repo
git clone https://github.com/lionel-smith/hfs-development-kit.git
cd hfs-development-kit

# Run install (syncs + sets up auto-sync)
./scripts/sync-claude-config.sh install

# Verify
./scripts/sync-claude-config.sh status
```

Your Claude Code now has all plugins and custom skills. Future `git pull` commands will auto-sync any updates.

### Enable New Plugin
```bash
# Export current settings to repo
./scripts/sync-claude-config.sh export

# Review what changed
git diff claude-config/settings.json

# Commit and push
git add claude-config/
git commit -m "chore: enable new-plugin in Claude settings"
git push
```

On your other devices, just `git pull` - settings sync automatically.

### Windows Setup
```powershell
# Open PowerShell (may need Administrator)

# Clone and navigate
git clone https://github.com/lionel-smith/hfs-development-kit.git
cd hfs-development-kit

# If execution policy blocks script
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Run install
.\scripts\sync-claude-config.ps1 -Action install
```

Same settings, same skills, different OS.
