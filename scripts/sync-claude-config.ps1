# sync-claude-config.ps1 - Sync Claude Code settings across devices (Windows)
# Usage: .\sync-claude-config.ps1 -Action [install|sync|export|status]

param(
    [Parameter(Position=0)]
    [ValidateSet('install', 'sync', 'export', 'status')]
    [string]$Action = 'sync'
)

$ErrorActionPreference = 'Stop'

# Paths
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent $ScriptDir
$ConfigDir = Join-Path $RepoRoot 'claude-config'
$ClaudeDir = Join-Path $env:USERPROFILE '.claude'

# Functions
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

function Test-ValidJson {
    param($FilePath)
    try {
        $null = Get-Content $FilePath -Raw | ConvertFrom-Json
        return $true
    } catch {
        Write-Error "Invalid JSON in $FilePath"
        return $false
    }
}

function Backup-Existing {
    param($Target)
    if (Test-Path $Target) {
        $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
        $backup = "${Target}.backup.${timestamp}"
        Copy-Item -Path $Target -Destination $backup -Recurse -Force
        Write-Info "Backed up existing file to $backup"
    }
}

function Sync-Settings {
    Write-Info "Syncing settings.json..."

    $source = Join-Path $ConfigDir 'settings.json'
    $target = Join-Path $ClaudeDir 'settings.json'

    if (-not (Test-Path $source)) {
        Write-Error "Source settings.json not found at $source"
        return $false
    }

    if (-not (Test-ValidJson $source)) { return $false }

    # Create Claude directory if needed
    if (-not (Test-Path $ClaudeDir)) {
        New-Item -ItemType Directory -Path $ClaudeDir -Force | Out-Null
    }

    # Backup existing
    Backup-Existing $target

    # Copy settings
    Copy-Item -Path $source -Destination $target -Force
    Write-Success "Settings synced to $target"
    return $true
}

function Sync-Skills {
    Write-Info "Syncing skills..."

    $sourceDir = Join-Path $ConfigDir 'skills'
    $targetDir = Join-Path $ClaudeDir 'skills'

    if (-not (Test-Path $sourceDir)) {
        Write-Warn "No skills directory in config, skipping"
        return
    }

    # Create skills directory if needed
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    # Count and copy skills
    $skills = Get-ChildItem -Path $sourceDir -Filter '*.skill' -ErrorAction SilentlyContinue
    $count = ($skills | Measure-Object).Count

    if ($count -eq 0) {
        Write-Warn "No .skill files found in $sourceDir"
        return
    }

    $skills | ForEach-Object { Copy-Item -Path $_.FullName -Destination $targetDir -Force }
    Write-Success "Synced $count skill(s) to $targetDir"
}

function Sync-Hooks {
    Write-Info "Syncing hooks..."

    $sourceDir = Join-Path $ConfigDir 'hooks'
    $targetDir = Join-Path $ClaudeDir 'hooks'

    if (-not (Test-Path $sourceDir)) {
        Write-Info "No hooks directory in config, skipping"
        return
    }

    # Create hooks directory if needed
    if (-not (Test-Path $targetDir)) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
    }

    # Copy hooks
    $items = Get-ChildItem -Path $sourceDir -ErrorAction SilentlyContinue
    if ($items) {
        Copy-Item -Path "$sourceDir\*" -Destination $targetDir -Recurse -Force
        Write-Success "Hooks synced to $targetDir"
    } else {
        Write-Info "No hooks to sync"
    }
}

function Install-GitHook {
    Write-Info "Installing git post-merge hook..."

    $gitDir = Join-Path $RepoRoot '.git'
    $hooksDir = Join-Path $gitDir 'hooks'
    $hookFile = Join-Path $hooksDir 'post-merge'

    if (-not (Test-Path $gitDir)) {
        Write-Warn "Not a git repository, skipping hook installation"
        return
    }

    if (-not (Test-Path $hooksDir)) {
        New-Item -ItemType Directory -Path $hooksDir -Force | Out-Null
    }

    $hookContent = @'
#!/usr/bin/env bash
# Auto-sync Claude config after git pull
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
if [[ -x "$SCRIPT_DIR/scripts/sync-claude-config.sh" ]]; then
    echo "Running Claude config sync..."
    "$SCRIPT_DIR/scripts/sync-claude-config.sh" sync
fi
'@

    Set-Content -Path $hookFile -Value $hookContent -Encoding UTF8
    Write-Success "Git post-merge hook installed"
}

function Invoke-Sync {
    Write-Info "Starting Claude config sync..."
    Write-Host ""

    Sync-Settings
    Sync-Skills
    Sync-Hooks

    Write-Host ""
    Write-Success "Claude config sync complete!"
    Write-Info "Restart Claude Code for changes to take effect"
}

function Invoke-Install {
    Write-Info "Installing Claude config sync..."
    Write-Host ""

    Invoke-Sync
    Install-GitHook

    Write-Host ""
    Write-Success "Installation complete!"
}

function Invoke-Export {
    Write-Info "Exporting current Claude config to repo..."
    Write-Host ""

    # Export settings.json
    $settingsSource = Join-Path $ClaudeDir 'settings.json'
    $settingsTarget = Join-Path $ConfigDir 'settings.json'

    if (Test-Path $settingsSource) {
        if (-not (Test-ValidJson $settingsSource)) {
            Write-Error "Current settings.json is invalid, aborting export"
            return
        }
        Copy-Item -Path $settingsSource -Destination $settingsTarget -Force
        Write-Success "Exported settings.json"
    } else {
        Write-Warn "No settings.json found at $ClaudeDir"
    }

    # Export skills
    $skillsDir = Join-Path $ClaudeDir 'skills'
    if (Test-Path $skillsDir) {
        $targetSkillsDir = Join-Path $ConfigDir 'skills'
        if (-not (Test-Path $targetSkillsDir)) {
            New-Item -ItemType Directory -Path $targetSkillsDir -Force | Out-Null
        }
        $skills = Get-ChildItem -Path $skillsDir -Filter '*.skill' -ErrorAction SilentlyContinue
        $count = ($skills | Measure-Object).Count
        if ($count -gt 0) {
            $skills | ForEach-Object { Copy-Item -Path $_.FullName -Destination $targetSkillsDir -Force }
            Write-Success "Exported $count skill(s)"
        }
    }

    Write-Host ""
    Write-Success "Export complete!"
    Write-Info "Review changes with: git diff claude-config/"
    Write-Warn "Remember to sanitize any API keys before committing!"
}

function Show-Status {
    Write-Host ""
    Write-Host "=== Claude Config Sync Status ===" -ForegroundColor Cyan
    Write-Host ""

    # Config directory
    Write-Host "Config Directory: $ConfigDir"
    if (Test-Path $ConfigDir) {
        Write-Host "  [OK] Exists" -ForegroundColor Green

        $settingsPath = Join-Path $ConfigDir 'settings.json'
        if (Test-Path $settingsPath) {
            Write-Host "  [OK] settings.json present" -ForegroundColor Green
            if (Test-ValidJson $settingsPath 2>$null) {
                Write-Host "  [OK] settings.json valid JSON" -ForegroundColor Green
            } else {
                Write-Host "  [X] settings.json invalid JSON" -ForegroundColor Red
            }
        } else {
            Write-Host "  [?] settings.json missing" -ForegroundColor Yellow
        }

        $skillsDir = Join-Path $ConfigDir 'skills'
        $skillCount = (Get-ChildItem -Path $skillsDir -Filter '*.skill' -ErrorAction SilentlyContinue | Measure-Object).Count
        Write-Host "  Skills in repo: $skillCount"
    } else {
        Write-Host "  [X] Does not exist" -ForegroundColor Red
    }

    Write-Host ""

    # Claude directory
    Write-Host "Claude Directory: $ClaudeDir"
    if (Test-Path $ClaudeDir) {
        Write-Host "  [OK] Exists" -ForegroundColor Green

        $localSkillsDir = Join-Path $ClaudeDir 'skills'
        $localSkillCount = (Get-ChildItem -Path $localSkillsDir -Filter '*.skill' -ErrorAction SilentlyContinue | Measure-Object).Count
        Write-Host "  Skills installed: $localSkillCount"
    } else {
        Write-Host "  [?] Does not exist" -ForegroundColor Yellow
    }

    Write-Host ""

    # Git hook
    Write-Host "Git Hook:"
    $hookPath = Join-Path $RepoRoot '.git\hooks\post-merge'
    if (Test-Path $hookPath) {
        Write-Host "  [OK] post-merge hook installed" -ForegroundColor Green
    } else {
        Write-Host "  [?] post-merge hook not installed" -ForegroundColor Yellow
    }

    Write-Host ""

    # Sync status
    Write-Host "Sync Status:"
    $repoSettings = Join-Path $ConfigDir 'settings.json'
    $localSettings = Join-Path $ClaudeDir 'settings.json'
    if ((Test-Path $repoSettings) -and (Test-Path $localSettings)) {
        $repoContent = Get-Content $repoSettings -Raw
        $localContent = Get-Content $localSettings -Raw
        if ($repoContent -eq $localContent) {
            Write-Host "  [OK] settings.json in sync" -ForegroundColor Green
        } else {
            Write-Host "  [?] settings.json differs" -ForegroundColor Yellow
        }
    }

    Write-Host ""
}

# Main
switch ($Action) {
    'install' { Invoke-Install }
    'sync' { Invoke-Sync }
    'export' { Invoke-Export }
    'status' { Show-Status }
}
