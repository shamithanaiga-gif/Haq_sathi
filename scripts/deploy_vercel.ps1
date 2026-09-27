# ==============================================================================
# Haq Saathi - Vercel Frontend Deployment Script (PowerShell)
# Deploys the Progressive Web App to Vercel's global edge network.
# ==============================================================================

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Set-Location $RootDir

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  ⚡ Deploying Haq Saathi Frontend to Vercel" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan

$VercelCmd = Get-Command vercel -ErrorAction SilentlyContinue
if ($VercelCmd) {
    vercel --prod --yes
} elseif (Get-Command npx -ErrorAction SilentlyContinue) {
    npx vercel --prod --yes
} else {
    Write-Host "❌ Error: Neither 'vercel' nor 'npx' was found." -ForegroundColor Red
    Write-Host "Please install Node.js and run: npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  🎉 Frontend Successfully Deployed to Vercel!" -ForegroundColor Green
Write-Host "======================================================================" -ForegroundColor Cyan
