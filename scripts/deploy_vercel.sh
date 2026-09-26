#!/usr/bin/env bash
# ==============================================================================
# Haq Saathi - Vercel Frontend Deployment Script
# Deploys the Progressive Web App to Vercel's global edge network.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "======================================================================"
echo "  ⚡ Deploying Haq Saathi Frontend to Vercel"
echo "======================================================================"

if command -v vercel &> /dev/null; then
    VERCEL_CMD="vercel"
elif command -v npx &> /dev/null; then
    VERCEL_CMD="npx vercel"
else
    echo "❌ Error: Neither 'vercel' nor 'npx' was found."
    echo "Install Node.js or run: npm i -g vercel"
    exit 1
fi

echo "==> Deploying to Vercel production..."
${VERCEL_CMD} --prod --yes

echo "======================================================================"
echo "  🎉 Frontend Successfully Deployed to Vercel!"
echo "  👉 Inspect your deployment URL in the output above."
echo "======================================================================"
