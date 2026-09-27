# ==============================================================================
# Haq Saathi - Fly.io Backend Deployment Script (PowerShell)
# Deploys the FastAPI backend to Fly.io in Mumbai (bom) with persistent storage.
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Set-Location $RootDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🚀 Deploying Haq Saathi Backend to Fly.io" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

# Check flyctl
$FlyCmd = Get-Command fly -ErrorAction SilentlyContinue
if (-not $FlyCmd) {
    $FlyCmd = Get-Command flyctl -ErrorAction SilentlyContinue
}

if (-not $FlyCmd) {
    Write-Host "❌ Error: 'fly' CLI is not installed." -ForegroundColor Red
    Write-Host "Install it in PowerShell using:" -ForegroundColor Yellow
    Write-Host "  powershell -Command `"iwr https://fly.io/install.ps1 -useb | iex`"" -ForegroundColor Yellow
    exit 1
}

# Check authentication
try {
    & $FlyCmd.Name auth whoami | Out-Null
} catch {
    Write-Host "==> Logging in to Fly.io..." -ForegroundColor Cyan
    & $FlyCmd.Name auth login
}

# Parse app name from fly.toml
$AppLine = Get-Content fly.toml | Where-Object { $_ -match '^app\s*=' }
$AppName = "haq-saathi-backend"
if ($AppLine -match '"([^"]+)"') {
    $AppName = $matches[1]
}

Write-Host "  Application Name: $AppName" -ForegroundColor Cyan
Write-Host "  Primary Region:   bom (Mumbai, India)" -ForegroundColor Cyan

# Create volume if missing
Write-Host "==> Checking persistent volume (haq_saathi_data)..." -ForegroundColor Cyan
$Volumes = & $FlyCmd.Name volumes list -a $AppName 2>$null
if ($Volumes -notmatch "haq_saathi_data") {
    Write-Host "Creating 1GB persistent volume in region bom..." -ForegroundColor Yellow
    & $FlyCmd.Name volumes create haq_saathi_data --size 1 --region bom -a $AppName --yes
} else {
    Write-Host "✓ Persistent volume 'haq_saathi_data' exists." -ForegroundColor Green
}

# Deploy
Write-Host "==> Deploying backend container to Fly.io..." -ForegroundColor Cyan
& $FlyCmd.Name deploy --ha=false

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🎉 Backend Successfully Deployed to Fly.io!" -ForegroundColor Green
Write-Host "  👉 Public URL:       https://$AppName.fly.dev" -ForegroundColor Green
Write-Host "  👉 Health Endpoint:  https://$AppName.fly.dev/api/schemes" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
