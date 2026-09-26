#!/usr/bin/env bash
# ==============================================================================
# Haq Saathi - Zero-Downtime Production Deployment Script
# Orchestrates Docker Compose with Caddy automated TLS and persistent storage.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

echo "======================================================================"
echo "  🏛️  Haq Saathi - Production Zero-Downtime Deployment"
echo "======================================================================"

# 1. Environment Configuration Check
ENV_FILE="${ROOT_DIR}/.env.production"
if [ ! -f "${ENV_FILE}" ]; then
    if [ -f "${ROOT_DIR}/.env" ]; then
        ENV_FILE="${ROOT_DIR}/.env"
        echo "ℹ️  Using existing .env file."
    else
        echo "⚠️  .env.production file not found!"
        echo "Creating .env.production from .env.production.example..."
        cp "${ROOT_DIR}/.env.production.example" "${ENV_FILE}"
        echo "👉 Created .env.production. Please edit it with your real domain before proceeding."
    fi
fi

# Load environment variables
set -a
# shellcheck disable=SC1090
source "${ENV_FILE}"
set +a

# 2. Variable Validation
DOMAIN_NAME="${DOMAIN_NAME:-localhost}"
if [ -z "${DOMAIN_NAME}" ]; then
    echo "❌ Error: DOMAIN_NAME is empty in ${ENV_FILE}"
    exit 1
fi

if [ -z "${HAQ_SAATHI_JWT_SECRET:-}" ]; then
    echo "⚠️  Warning: HAQ_SAATHI_JWT_SECRET is unset. Generating a secure 64-char secret..."
    GENERATED_SECRET=$(openssl rand -hex 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))")
    echo "HAQ_SAATHI_JWT_SECRET=${GENERATED_SECRET}" >> "${ENV_FILE}"
    export HAQ_SAATHI_JWT_SECRET="${GENERATED_SECRET}"
    echo "✓ Saved generated JWT secret to ${ENV_FILE}"
fi

echo "  Target Domain: https://${DOMAIN_NAME}"
echo "  Email (TLS):   ${LETSENCRYPT_EMAIL:-admin@haqsaathi.org}"
echo "======================================================================"

# 3. Prerequisites Check (Docker & Docker Compose)
if ! command -v docker &> /dev/null; then
    echo "❌ Error: 'docker' command is not installed or not in PATH."
    exit 1
fi

DOCKER_COMPOSE_CMD=""
if docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
else
    echo "❌ Error: Docker Compose is not installed."
    exit 1
fi

# 4. Ensure Persistent Data Directory Exists
mkdir -p "${ROOT_DIR}/data"
chmod -R 775 "${ROOT_DIR}/data" || true

# 5. Validate Compose Configuration
echo "==> Validating Docker Compose configuration..."
${DOCKER_COMPOSE_CMD} --env-file "${ENV_FILE}" -f docker-compose.prod.yml config > /dev/null
echo "✓ Docker Compose YAML configuration is valid."

# 6. Build and Deploy Containers with Zero-Downtime
echo "==> Building images and launching containers..."
${DOCKER_COMPOSE_CMD} --env-file "${ENV_FILE}" -f docker-compose.prod.yml up -d --build --remove-orphans

# 7. Healthcheck Polling
echo "==> Waiting for backend and proxy health status..."
HEALTH_RETRIES=15
until [ "${HEALTH_RETRIES}" -le 0 ]; do
    APP_STATUS=$(${DOCKER_COMPOSE_CMD} -f docker-compose.prod.yml ps --format '{{.Status}}' app 2>/dev/null || echo "unhealthy")
    if echo "${APP_STATUS}" | grep -q "healthy"; then
        echo "✓ Backend application container is healthy!"
        break
    fi
    echo "    Waiting for container healthcheck (${HEALTH_RETRIES} attempts remaining)..."
    sleep 3
    HEALTH_RETRIES=$((HEALTH_RETRIES - 1))
done

echo "======================================================================"
echo "  🎉 Haq Saathi Deployed Successfully!"
echo "  👉 Public URL:       https://${DOMAIN_NAME}"
echo "  👉 API Health:       https://${DOMAIN_NAME}/api/schemes"
echo "  👉 Interactive Docs: https://${DOMAIN_NAME}/docs"
echo "======================================================================"
