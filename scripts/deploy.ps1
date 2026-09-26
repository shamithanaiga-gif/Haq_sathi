# ==============================================================================
# Haq Saathi - Zero-Downtime Production Deployment Script (PowerShell)
# Orchestrates Docker Compose with Caddy automated TLS and persistent storage.
# ==============================================================================

param(
    [string]$EnvFile = ".env.production"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Set-Location $RootDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🏛️  Haq Saathi - Production Zero-Downtime Deployment" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

# 1. Environment Configuration Check
$EnvPath = Join-Path $RootDir $EnvFile
if (-not (Test-Path $EnvPath)) {
    $FallbackEnv = Join-Path $RootDir ".env"
    if (Test-Path $FallbackEnv) {
        $EnvPath = $FallbackEnv
        Write-Host "ℹ️  Using existing .env file." -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  $EnvFile not found! Copying from .env.production.example..." -ForegroundColor Yellow
        Copy-Item (Join-Path $RootDir ".env.production.example") $EnvPath
        Write-Host "👉 Created $EnvFile. Please configure your DOMAIN_NAME." -ForegroundColor Cyan
    }
}

# 2. Check Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: 'docker' command is not installed or not in PATH." -ForegroundColor Red
    exit 1
}

# 3. Create persistent data folder
$DataDir = Join-Path $RootDir "data"
if (-not (Test-Path $DataDir)) {
    New-Item -ItemType Directory -Path $DataDir -Force | Out-Null
}

# 4. Validate Compose configuration
Write-Host "==> Validating Docker Compose configuration..." -ForegroundColor Cyan
docker compose --env-file $EnvPath -f docker-compose.prod.yml config | Out-Null
Write-Host "✓ Docker Compose YAML configuration is valid." -ForegroundColor Green

# 5. Build and launch
Write-Host "==> Building images and launching containers..." -ForegroundColor Cyan
docker compose --env-file $EnvPath -f docker-compose.prod.yml up -d --build --remove-orphans

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🎉 Haq Saathi Deployed Successfully via Docker Compose!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
