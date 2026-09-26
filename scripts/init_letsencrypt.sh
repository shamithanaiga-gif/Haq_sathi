#!/bin/bash
# ==============================================================================
# Haq Saathi - Let's Encrypt SSL Bootstrap Script for NGINX
# Solves the initial certificate dependency cycle for Let's Encrypt webroot challenge.
# ==============================================================================

set -e

if [ -f .env ]; then
  # Export variables from .env
  export $(grep -v '^#' .env | xargs)
fi

DOMAIN=${DOMAIN:-localhost}
EMAIL=${LETSENCRYPT_EMAIL:-admin@haqsaathi.org}
RSA_KEY_SIZE=4096
DATA_PATH="./certbot"

if [ "$DOMAIN" = "localhost" ]; then
  echo "⚠️ DOMAIN is set to localhost. For production Let's Encrypt, set DOMAIN in .env to a public domain."
fi

echo "======================================================================"
echo "  🏛️  Haq Saathi - Automated Let's Encrypt Initialization"
echo "  Domain: $DOMAIN | Contact: $EMAIL"
echo "======================================================================"

mkdir -p "$DATA_PATH/conf/live/$DOMAIN"
mkdir -p "$DATA_PATH/www"

# 1. Check if dummy certificate is needed to start NGINX initially
if [ ! -f "$DATA_PATH/conf/live/$DOMAIN/fullchain.pem" ]; then
  echo "==> Creating temporary self-signed certificate for initial NGINX startup..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$DATA_PATH/conf/live/$DOMAIN/privkey.pem" \
    -out "$DATA_PATH/conf/live/$DOMAIN/fullchain.pem" \
    -subj "/CN=localhost"
  echo "✓ Temporary certificate generated."
fi

# 2. Start NGINX
echo "==> Starting web and proxy containers..."
docker compose -f docker-compose.prod.yml up -d web proxy

# 3. Request genuine Let's Encrypt certificate
if [ "$DOMAIN" != "localhost" ]; then
  echo "==> Requesting genuine Let's Encrypt certificate for $DOMAIN..."
  
  # Select email argument
  if [ -z "$EMAIL" ]; then
    EMAIL_ARG="--register-unsafely-without-email"
  else
    EMAIL_ARG="--email $EMAIL"
  fi

  # Delete temporary cert before real certbot invocation
  rm -rf "$DATA_PATH/conf/live/$DOMAIN"
  rm -rf "$DATA_PATH/conf/archive/$DOMAIN"
  rm -rf "$DATA_PATH/conf/renewal/$DOMAIN.conf"

  docker compose -f docker-compose.prod.yml run --rm --entrypoint "\
    certbot certonly --webroot -w /var/www/certbot \
      $EMAIL_ARG \
      -d $DOMAIN \
      --rsa-key-size $RSA_KEY_SIZE \
      --agree-tos \
      --force-renewal" certbot

  # Reload NGINX to pick up real certificates
  echo "==> Reloading NGINX configuration..."
  docker compose -f docker-compose.prod.yml exec proxy nginx -s reload
  echo "✓ Production Let's Encrypt certificate installed successfully!"
fi

echo "======================================================================"
echo "  🎉 Production HTTPS Ingress is Active on https://$DOMAIN"
echo "======================================================================"
