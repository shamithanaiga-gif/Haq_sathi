#!/usr/bin/env bash
# ==============================================================================
# Haq Saathi - Fly.io Backend Deployment Script
# Deploys the FastAPI backend to Fly.io in Mumbai (bom) with persistent storage.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "======================================================================"
echo "  🚀 Deploying Haq Saathi Backend to Fly.io"
echo "======================================================================"

# Check flyctl installation
if ! command -v fly &> /dev/null && ! command -v flyctl &> /dev/null; then
    echo "❌ Error: 'fly' or 'flyctl' CLI is not installed."
    echo "Install it via:"
    echo "  curl -L https://fly.io/install.sh | sh"
    exit 1
fi

FLY_CMD="fly"
if ! command -v fly &> /dev/null; then
    FLY_CMD="flyctl"
fi

# Check authentication
if ! ${FLY_CMD} auth whoami &> /dev/null; then
    echo "==> Please log in to Fly.io..."
    ${FLY_CMD} auth login
fi

# Check if app exists or launch
APP_NAME=$(grep -E '^app\s*=' fly.toml | cut -d'"' -f2 || echo "haq-saathi-backend")
echo "  Application Name: ${APP_NAME}"
echo "  Primary Region:   bom (Mumbai, India)"

# Create persistent volume if not already created
echo "==> Checking persistent volume (haq_saathi_data)..."
if ! ${FLY_CMD} volumes list -a "${APP_NAME}" 2>/dev/null | grep -q "haq_saathi_data"; then
    echo "Creating 1GB persistent volume in region bom..."
    ${FLY_CMD} volumes create haq_saathi_data --size 1 --region bom -a "${APP_NAME}" --yes
else
    echo "✓ Persistent volume 'haq_saathi_data' already exists."
fi

# Deploy application
echo "==> Deploying backend container to Fly.io..."
${FLY_CMD} deploy --ha=false

echo "======================================================================"
echo "  🎉 Backend Successfully Deployed to Fly.io!"
echo "  👉 Public URL:       https://${APP_NAME}.fly.dev"
echo "  👉 Health Endpoint:  https://${APP_NAME}.fly.dev/api/schemes"
echo "  👉 Interactive Docs: https://${APP_NAME}.fly.dev/docs"
echo "======================================================================"
