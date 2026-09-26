"""
Haq Saathi - Vercel & Fly.io Configuration Verification Suite
Validates fly.toml schema, vercel.json rewrites and security headers,
and dynamic API URL fallback handling.
"""

import sys
import os
import json
import re

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
FLY_TOML = os.path.join(PROJECT_DIR, "fly.toml")
VERCEL_JSON = os.path.join(PROJECT_DIR, "vercel.json")
DOCKERFILE = os.path.join(PROJECT_DIR, "Dockerfile")
API_JS = os.path.join(PROJECT_DIR, "frontend", "js", "api.js")
MAIN_PY = os.path.join(PROJECT_DIR, "backend", "main.py")


def run_test(name, fn):
    print(f"\n[Verifying] {name}...")
    try:
        fn()
        print(f"  ✓ {name}: PASS")
        return True
    except Exception as e:
        print(f"  ❌ {name}: FAIL ({e})")
        return False


def test_fly_toml():
    assert os.path.exists(FLY_TOML), f"Missing {FLY_TOML}"
    with open(FLY_TOML, "r", encoding="utf-8") as f:
        content = f.read()

    assert "app = " in content, "Missing app name in fly.toml"
    assert "primary_region = " in content, "Missing primary_region in fly.toml"
    assert "internal_port = 8000" in content, "Missing internal_port 8000 in fly.toml"
    assert "source = \"haq_saathi_data\"" in content, "Missing persistent volume mount in fly.toml"
    assert "destination = \"/app/data\"" in content, "Missing /app/data destination in fly.toml"
    assert "/api/schemes" in content, "Missing health check for /api/schemes in fly.toml"


def test_vercel_json():
    assert os.path.exists(VERCEL_JSON), f"Missing {VERCEL_JSON}"
    with open(VERCEL_JSON, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Check headers
    headers = data.get("headers", [])
    assert len(headers) > 0, "No headers defined in vercel.json"
    
    perm_policy = False
    sw_header = False
    for h in headers:
        for item in h.get("headers", []):
            if item.get("key") == "Permissions-Policy" and "microphone" in item.get("value", ""):
                perm_policy = True
            if item.get("key") == "Service-Worker-Allowed" and item.get("value") == "/":
                sw_header = True
    assert perm_policy, "Missing Permissions-Policy: microphone header in vercel.json"
    assert sw_header, "Missing Service-Worker-Allowed: / header in vercel.json"

    # Check rewrites
    rewrites = data.get("rewrites", [])
    api_rewrite = any("/api/:path*" in r.get("source", "") and ".fly.dev" in r.get("destination", "") for r in rewrites)
    assert api_rewrite, "Missing /api/:path* rewrite to Fly.io backend in vercel.json"
    assert data.get("buildCommand") == "npm run build", "Missing npm run build in vercel.json"


def test_dockerfile_seed():
    assert os.path.exists(DOCKERFILE), f"Missing {DOCKERFILE}"
    with open(DOCKERFILE, "r", encoding="utf-8") as f:
        content = f.read()
    assert "COPY data/ ./data_seed/" in content, "Dockerfile must copy data_seed for persistent volume bootstrap"


def test_main_py_seed():
    assert os.path.exists(MAIN_PY), f"Missing {MAIN_PY}"
    with open(MAIN_PY, "r", encoding="utf-8") as f:
        content = f.read()
    assert "ensure_seed_data()" in content, "main.py must invoke ensure_seed_data() on startup"


def test_api_js_base():
    assert os.path.exists(API_JS), f"Missing {API_JS}"
    with open(API_JS, "r", encoding="utf-8") as f:
        content = f.read()
    assert "window.HAQ_SAATHI_API_BASE" in content, "api.js must support window.HAQ_SAATHI_API_BASE"
    assert "window.location.origin" in content, "api.js must fallback to window.location.origin"


def main():
    print("======================================================================")
    print("  🏛️  HAQ SAATHI - VERCEL & FLY.IO CONFIGURATION VERIFICATION")
    print("======================================================================")

    tests = [
        ("Fly.io Application & Volume Schema (fly.toml)", test_fly_toml),
        ("Vercel Routing, Rewrites & Security Headers (vercel.json)", test_vercel_json),
        ("Dockerfile Persistent Volume Seeding Setup", test_dockerfile_seed),
        ("FastAPI Backend Cloud Volume Seeding (main.py)", test_main_py_seed),
        ("Frontend API Client Flexibility (api.js)", test_api_js_base),
    ]

    passed = 0
    for name, fn in tests:
        if run_test(name, fn):
            passed += 1

    print("\n======================================================================")
    print(f"  RESULTS: {passed}/{len(tests)} TESTS PASSED ({100*passed//len(tests)}%)")
    print("======================================================================")

    if passed == len(tests):
        print("🎉 VERCEL & FLY.IO CONFIGURATIONS FULLY VERIFIED!")
        sys.exit(0)
    else:
        print("❌ ONE OR MORE TESTS FAILED.")
        sys.exit(1)


if __name__ == "__main__":
    main()
