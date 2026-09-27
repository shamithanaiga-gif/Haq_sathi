"""
Haq Saathi - Production Deployment & Ingress Verification Script
Validates Docker Compose specifications, Caddyfile, Dockerfile, environment templates,
and tests live endpoint responses over HTTPS.
"""

import sys
import os
import json
import yaml
import re
import urllib.request
import urllib.error
import ssl

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
COMPOSE_FILE = os.path.join(PROJECT_DIR, "docker-compose.prod.yml")
CADDYFILE = os.path.join(PROJECT_DIR, "Caddyfile")
DOCKERFILE = os.path.join(PROJECT_DIR, "Dockerfile")
ENV_EXAMPLE = os.path.join(PROJECT_DIR, ".env.production.example")
DEPLOY_SH = os.path.join(PROJECT_DIR, "scripts", "deploy.sh")

HTTPS_URL = "https://127.0.0.1:8443"
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def run_check(title, fn):
    print(f"\n[Verifying] {title}...")
    try:
        fn()
        print(f"  ✓ {title}: PASS")
        return True
    except Exception as e:
        print(f"  ❌ {title}: FAIL ({e})")
        return False


def verify_docker_compose_syntax():
    assert os.path.exists(COMPOSE_FILE), f"Missing {COMPOSE_FILE}"
    with open(COMPOSE_FILE, "r", encoding="utf-8") as f:
        compose_data = yaml.safe_load(f)

    services = compose_data.get("services", {})
    assert "app" in services, "Missing 'app' service in docker-compose.prod.yml"
    assert "caddy" in services, "Missing 'caddy' service in docker-compose.prod.yml"

    # Validate 'app' service
    app = services["app"]
    assert "build" in app, "'app' must specify build context"
    assert "data" in str(app.get("volumes", [])), "'app' must mount persistent data volume"
    assert app.get("restart") == "unless-stopped", "'app' restart policy must be 'unless-stopped'"
    assert "workers 4" in app.get("command", ""), "'app' command must run with 4 workers"
    assert "healthcheck" in app, "'app' must define healthcheck"

    # Validate 'caddy' service
    caddy = services["caddy"]
    assert "caddy" in caddy.get("image", "").lower(), "'caddy' must use official Caddy image"
    assert "80:80" in caddy.get("ports", []), "'caddy' must bind port 80"
    assert "443:443" in caddy.get("ports", []), "'caddy' must bind port 443"
    assert caddy.get("restart") == "unless-stopped", "'caddy' restart policy must be 'unless-stopped'"
    assert "caddy_data" in str(caddy.get("volumes", [])), "'caddy' must mount persistent TLS certificates volume"
    assert "app" in str(caddy.get("depends_on", {})), "'caddy' must depend on 'app' service"


def verify_caddyfile():
    assert os.path.exists(CADDYFILE), f"Missing {CADDYFILE}"
    with open(CADDYFILE, "r", encoding="utf-8") as f:
        content = f.read()

    assert "{$DOMAIN_NAME" in content, "Caddyfile must use {$DOMAIN_NAME} environment variable"
    assert "reverse_proxy app:8000" in content, "Caddyfile must reverse proxy to app:8000"
    assert 'Permissions-Policy "microphone=(self)"' in content, "Caddyfile must enforce Permissions-Policy: microphone=(self)"
    assert 'Strict-Transport-Security "max-age=31536000' in content, "Caddyfile must enforce HSTS"
    assert 'X-Content-Type-Options "nosniff"' in content, "Caddyfile must set nosniff"
    assert 'X-Frame-Options "SAMEORIGIN"' in content, "Caddyfile must set SAMEORIGIN"
    assert "Cache-Control" in content and "no-cache" in content, "Caddyfile must enforce no-cache on sw.js"
    assert "Service-Worker-Allowed" in content, "Caddyfile must include Service-Worker-Allowed: /"
    assert "encode gzip zstd" in content, "Caddyfile must enable gzip and zstd compression"


def verify_dockerfile():
    assert os.path.exists(DOCKERFILE), f"Missing {DOCKERFILE}"
    with open(DOCKERFILE, "r", encoding="utf-8") as f:
        content = f.read()

    assert "python:3.11-slim" in content or "python:3.12-slim" in content, "Dockerfile must use python:3.11-slim"
    assert "requirements.txt" in content, "Dockerfile must install requirements.txt"
    assert "EXPOSE 8000" in content, "Dockerfile must expose port 8000"
    assert "workers" in content and "4" in content, "Dockerfile must run with 4 workers"


def verify_env_example():
    assert os.path.exists(ENV_EXAMPLE), f"Missing {ENV_EXAMPLE}"
    with open(ENV_EXAMPLE, "r", encoding="utf-8") as f:
        content = f.read()

    assert "DOMAIN_NAME" in content, ".env.production.example must include DOMAIN_NAME"
    assert "HAQ_SAATHI_JWT_SECRET" in content, ".env.production.example must include HAQ_SAATHI_JWT_SECRET"
    assert "SARVAM_API_KEY" in content, ".env.production.example must include SARVAM_API_KEY"


def verify_deploy_scripts():
    assert os.path.exists(DEPLOY_SH), f"Missing {DEPLOY_SH}"
    with open(DEPLOY_SH, "r", encoding="utf-8") as f:
        content = f.read()
    assert "docker compose" in content, "deploy.sh must invoke docker compose"
    assert "docker-compose.prod.yml" in content, "deploy.sh must reference docker-compose.prod.yml"


def verify_live_endpoints_and_headers():
    # 1. Root /
    req_root = urllib.request.Request(f"{HTTPS_URL}/")
    with urllib.request.urlopen(req_root, context=ctx, timeout=5) as resp:
        assert resp.status == 200, f"Expected 200 on /, got {resp.status}"
        headers = {k.lower(): v for k, v in resp.headers.items()}
        assert "microphone=(self)" in headers.get("permissions-policy", ""), "Missing microphone=(self) on /"
        assert headers.get("x-content-type-options") == "nosniff", "Missing nosniff on /"
        assert headers.get("x-frame-options") == "SAMEORIGIN", "Missing SAMEORIGIN on /"

    # 2. Service Worker /sw.js
    req_sw = urllib.request.Request(f"{HTTPS_URL}/sw.js")
    with urllib.request.urlopen(req_sw, context=ctx, timeout=5) as resp:
        assert resp.status == 200, f"Expected 200 on /sw.js, got {resp.status}"
        headers = {k.lower(): v for k, v in resp.headers.items()}
        assert "no-cache" in headers.get("cache-control", ""), f"Expected no-cache on /sw.js, got {headers.get('cache-control')}"
        assert headers.get("service-worker-allowed") == "/", f"Expected Service-Worker-Allowed: /, got {headers.get('service-worker-allowed')}"

    # 3. GET /api/schemes
    req_schemes = urllib.request.Request(f"{HTTPS_URL}/api/schemes")
    with urllib.request.urlopen(req_schemes, context=ctx, timeout=5) as resp:
        assert resp.status == 200, f"Expected 200 on /api/schemes, got {resp.status}"
        schemes = json.loads(resp.read().decode("utf-8"))
        assert len(schemes) == 4, f"Expected 4 schemes, got {len(schemes)}"

    # 4. GET /api/user/dashboard?phone=9876543210
    req_dash = urllib.request.Request(f"{HTTPS_URL}/api/user/dashboard?phone=9876543210")
    with urllib.request.urlopen(req_dash, context=ctx, timeout=5) as resp:
        assert resp.status == 200, f"Expected 200 on /api/user/dashboard, got {resp.status}"
        dash = json.loads(resp.read().decode("utf-8"))
        assert dash.get("user", {}).get("name") == "Ramesh Naik", f"Unexpected profile in dashboard: {dash}"


def main():
    print("======================================================================")
    print("  🏛️  HAQ SAATHI - PRODUCTION DOCKER & CADDY VERIFICATION")
    print("======================================================================")

    checks = [
        ("Docker Compose (docker-compose.prod.yml) Syntax & Schema", verify_docker_compose_syntax),
        ("Caddyfile Configuration & Security Rules", verify_caddyfile),
        ("Dockerfile Multi-Worker & Security Setup", verify_dockerfile),
        ("Environment Template (.env.production.example)", verify_env_example),
        ("Deployment Automation Script (scripts/deploy.sh)", verify_deploy_scripts),
        ("Live Endpoints, Dashboard & Security Headers (/sw.js, /api/*)", verify_live_endpoints_and_headers),
    ]

    passed = 0
    for title, fn in checks:
        if run_check(title, fn):
            passed += 1

    print("\n======================================================================")
    print(f"  RESULTS: {passed}/{len(checks)} CHECKS PASSED ({100*passed//len(checks)}%)")
    print("======================================================================")

    if passed == len(checks):
        print("🎉 PRODUCTION DOCKER & CADDY DEPLOYMENT CONFIGURATION FULLY VERIFIED!")
        sys.exit(0)
    else:
        print("❌ ONE OR MORE VERIFICATION CHECKS FAILED.")
        sys.exit(1)


if __name__ == "__main__":
    main()
