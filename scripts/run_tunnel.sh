#!/usr/bin/env bash
# ==============================================================================
# Haq Saathi - Zero-Configuration HTTPS Mobile Testing Tunnel
# Creates an instant, trusted public HTTPS URL to test Web Speech API on mobile
# ==============================================================================

set -e

PORT=${1:-8000}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"

echo "======================================================================"
echo "  🏛️  Haq Saathi - Mobile HTTPS Testing Gateway"
echo "======================================================================"

python3 "$DIR/run_local_https.py" --mode auto --port "$PORT"
