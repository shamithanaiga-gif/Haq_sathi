"""
Haq Saathi - Automated HTTPS & Ingress Verification Suite
Validates TLS termination, PWA Security Headers, Service Worker delivery,
caching policies, and API routing over HTTPS.
"""

import sys
import os
import json
import urllib.request
import urllib.error
import ssl

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

HTTPS_URL = "https://127.0.0.1:8443"
HTTP_URL = "http://127.0.0.1:8000"

# Insecure context for testing self-signed local certs
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE


def run_test(name, fn):
    print(f"\n[Test] {name}...")
    try:
        fn()
        print(f"  ✓ {name}: PASS")
        return True
    except Exception as e:
        print(f"  ❌ {name}: FAIL ({e})")
        return False


def test_tls_handshake():
    req = urllib.request.Request(f"{HTTPS_URL}/")
    with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
        assert resp.status == 200, f"Expected status 200, got {resp.status}"


def test_audio_security_headers():
    req = urllib.request.Request(f"{HTTPS_URL}/")
    with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
        headers = {k.lower(): v for k, v in resp.headers.items()}
        
        # 1. Microphone permission policy
        perm = headers.get("permissions-policy")
        assert perm and "microphone=(self)" in perm, f"Missing or invalid Permissions-Policy: {perm}"

        # 2. X-Content-Type-Options
        assert headers.get("x-content-type-options") == "nosniff", "Missing X-Content-Type-Options: nosniff"

        # 3. X-Frame-Options
        assert headers.get("x-frame-options") == "SAMEORIGIN", "Missing X-Frame-Options: SAMEORIGIN"

        # 4. Strict-Transport-Security
        hsts = headers.get("strict-transport-security")
        assert hsts and "max-age=" in hsts, f"Missing or invalid Strict-Transport-Security: {hsts}"


def test_service_worker_delivery():
    req = urllib.request.Request(f"{HTTPS_URL}/sw.js")
    with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        headers = {k.lower(): v for k, v in resp.headers.items()}
        
        # Verify Service-Worker-Allowed header for root scoping
        assert headers.get("service-worker-allowed") == "/", f"Expected Service-Worker-Allowed: /, got {headers.get('service-worker-allowed')}"
        
        # Verify no-cache policy
        cache_ctrl = headers.get("cache-control", "")
        assert "no-cache" in cache_ctrl, f"Expected no-cache in Cache-Control, got {cache_ctrl}"


def test_manifest_delivery():
    req = urllib.request.Request(f"{HTTPS_URL}/manifest.json")
    with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        data = json.loads(resp.read().decode("utf-8"))
        assert "name" in data or "short_name" in data, "Invalid manifest.json content"


def test_api_proxy_routing():
    # 1. GET /api/schemes
    req = urllib.request.Request(f"{HTTPS_URL}/api/schemes")
    with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        schemes = json.loads(resp.read().decode("utf-8"))
        assert len(schemes) == 4, f"Expected 4 schemes, got {len(schemes)}"

    # 2. POST /api/voice/process-intent (Kannada)
    payload = json.dumps({"text": "ನನಗೆ ರೇಷನ್ ಕಾರ್ಡ್ ಬೇಕು", "language": "kn"}).encode("utf-8")
    req_intent = urllib.request.Request(
        f"{HTTPS_URL}/api/voice/process-intent",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_intent, context=ctx, timeout=5) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        intent = json.loads(resp.read().decode("utf-8"))
        assert intent.get("target_scheme_id") == "ration_card", f"Unexpected scheme: {intent}"

    # 3. POST /api/eligibility/evaluate
    eval_payload = json.dumps({"scheme_id": "ration_card", "language": "kn"}).encode("utf-8")
    req_eval = urllib.request.Request(
        f"{HTTPS_URL}/api/eligibility/evaluate",
        data=eval_payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req_eval, context=ctx, timeout=5) as resp:
        assert resp.status == 200, f"Expected 200, got {resp.status}"
        eval_data = json.loads(resp.read().decode("utf-8"))
        assert "results" in eval_data and eval_data["results"][0]["eligible"] is True, f"Unexpected evaluate response: {eval_data}"


def test_static_assets_over_https():
    assets = [
        "/static/css/style.css",
        "/static/js/app.js",
        "/static/js/api.js",
        "/static/js/voice.js",
        "/static/js/i18n.js"
    ]
    for asset in assets:
        req = urllib.request.Request(f"{HTTPS_URL}{asset}")
        with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
            assert resp.status == 200, f"Failed to load {asset}: status {resp.status}"


def main():
    print("======================================================================")
    print("  🏛️  HAQ SAATHI - HTTPS & INGRESS VERIFICATION SUITE")
    print("======================================================================")

    tests = [
        ("TLS 1.2 / 1.3 Handshake", test_tls_handshake),
        ("Audio & PWA Security Headers (Permissions-Policy)", test_audio_security_headers),
        ("Service Worker Delivery & Scope Header", test_service_worker_delivery),
        ("PWA Web App Manifest Delivery", test_manifest_delivery),
        ("Static Assets Delivery over HTTPS", test_static_assets_over_https),
        ("FastAPI API Proxy Routing over HTTPS", test_api_proxy_routing),
    ]

    passed = 0
    for name, fn in tests:
        if run_test(name, fn):
            passed += 1

    print("\n======================================================================")
    print(f"  RESULTS: {passed}/{len(tests)} TESTS PASSED ({100*passed//len(tests)}%)")
    print("======================================================================")

    if passed == len(tests):
        print("🎉 ALL HTTPS & INGRESS VERIFICATIONS PASSED SUCCESSFULLY!")
        sys.exit(0)
    else:
        print("❌ SOME VERIFICATION TESTS FAILED!")
        sys.exit(1)


if __name__ == "__main__":
    main()
