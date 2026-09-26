# ==============================================================================
# Haq Saathi - Zero-Configuration HTTPS Mobile Testing Tunnel (PowerShell)
# Creates an instant, trusted public HTTPS URL to test Web Speech API on mobile
# ==============================================================================

param(
    [int]$Port = 8000,
    [string]$Mode = "auto"
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🏛️  Haq Saathi - Mobile HTTPS Testing Gateway" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

python "$ProjectDir\run_local_https.py" --mode $Mode --port $Port
