"""
Comprehensive E2E Verification for Application Persistence, SQLite DB,
Stateless HMAC Session Tokens, and Sovereign Audit Log Trail.
"""
import sys
import os
import json
import sqlite3
import requests

# Ensure project root is in sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE_DIR)

from backend.database import get_db_path, get_connection, db_get_user_applications
from backend.user_store import create_session_token, verify_session_token

API_URL = "http://127.0.0.1:8000"

def test_full_persistence_lifecycle():
    print("=== TEST 1: Generate OTP and Login ===")
    test_phone = "9876543210"
    otp_res = requests.post(f"{API_URL}/api/auth/otp/generate", json={"phone": test_phone})
    assert otp_res.status_code == 200, f"OTP generate failed: {otp_res.text}"
    otp_data = otp_res.json()
    demo_otp = otp_data.get("demo_otp")
    assert demo_otp, "No demo OTP returned"

    verify_res = requests.post(f"{API_URL}/api/auth/otp/verify", json={"phone": test_phone, "otp": demo_otp})
    assert verify_res.status_code == 200, f"OTP verify failed: {verify_res.text}"
    verify_data = verify_res.json()
    token = verify_data.get("session_token")
    assert token, "No session token returned"
    assert token.startswith("hs_"), f"Token is not HMAC stateless format: {token}"
    print(f"Issued stateless HMAC token: {token[:20]}...")

    print("=== TEST 2: Verify Stateless Token Survival ===")
    verified_phone = verify_session_token(token)
    assert verified_phone == test_phone, f"Expected {test_phone}, got {verified_phone}"
    print("Stateless HMAC token verified successfully without server session state dependency.")

    print("=== TEST 3: Submit Application ===")
    submit_payload = {
        "scheme_id": "karnataka_building_workers_welfare",
        "form_data": {
            "applicant_name": "Ramesh Naik",
            "annual_income": "144000",
            "occupation": "Construction Worker",
            "has_labour_card": True
        },
        "language": "en",
        "phone": test_phone,
        "applicant_type": "self",
        "applicant_name": "Ramesh Naik"
    }
    sub_res = requests.post(f"{API_URL}/api/forms/submit", json=submit_payload)
    assert sub_res.status_code == 200, f"Submit failed: {sub_res.text}"
    sub_data = sub_res.json()
    assert sub_data.get("status") == "SUBMITTED", "Status is not SUBMITTED"
    ref_id = sub_data.get("reference_id")
    assert ref_id and ref_id.startswith("REF-"), f"Invalid ref_id format: {ref_id}"
    app_status = sub_data.get("application_status")
    assert app_status == "Submitted (Prototype)", f"Expected 'Submitted (Prototype)', got {app_status}"
    print(f"Application submitted successfully: Ref ID = {ref_id}, Status = {app_status}")

    print("=== TEST 4: Verify Direct SQLite DB Persistence ===")
    db_path = get_db_path()
    assert os.path.exists(db_path), f"SQLite database file not found at {db_path}"
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM applications WHERE phone = ? AND reference_id = ?;", (test_phone, ref_id))
        row = cursor.fetchone()
        assert row is not None, f"Application {ref_id} not found in SQLite applications table!"
        assert row["status"] == "Submitted (Prototype)", f"Status mismatch in SQLite: {row['status']}"
        print(f"Confirmed in SQLite database: Ref = {row['reference_id']}, Scheme = {row['scheme_id']}")
    finally:
        conn.close()

    print("=== TEST 5: Verify Dashboard Returns Application with Count > 0 ===")
    dash_res = requests.get(f"{API_URL}/api/user/dashboard?phone={test_phone}", headers={"x-session-token": token})
    assert dash_res.status_code == 200, f"Dashboard failed: {dash_res.text}"
    dash_data = dash_res.json()
    apps = dash_data.get("applications", [])
    assert len(apps) > 0, "Dashboard returned 0 applications!"
    found = any(a.get("reference_id") == ref_id for a in apps)
    assert found, f"Submitted application {ref_id} not found in dashboard response: {apps}"
    print(f"Dashboard verified: {len(apps)} application(s) present, including {ref_id}.")

    print("=== TEST 6: Verify Sovereign Audit Log Entry on Application Submit ===")
    audit_res = requests.get(f"{API_URL}/api/consent/audit-log?phone={test_phone}")
    assert audit_res.status_code == 200, f"Audit log request failed: {audit_res.text}"
    audit_logs = audit_res.json()
    assert len(audit_logs) > 0, "No audit logs returned"
    sub_audit = next((log for log in audit_logs if log.get("document_type") == "application_submission"), None)
    assert sub_audit is not None, "Application submission not recorded in audit log!"
    assert ref_id in sub_audit.get("purpose_en", "") or ref_id in sub_audit.get("doc_title_en", ""), "Ref ID not in audit log entry"
    print(f"Audit log verified: Found submission entry for {ref_id}.")

    print("=== TEST 7: Verify Zero Localhost URLs in Production Deploy Configs ===")
    with open(os.path.join(BASE_DIR, "vercel.json"), "r", encoding="utf-8") as f:
        v_content = f.read()
    assert "localhost" not in v_content and "127.0.0.1" not in v_content, "Localhost found in vercel.json!"
    assert "haq-saathi-backend.fly.dev" not in v_content, "Dead fly.dev rewrite still present in vercel.json!"
    assert "/api/index.py" in v_content, "Missing /api/index.py rewrite in vercel.json!"
    print("Production deployment configs verified: clean, universal routing.")

    print("\n[SUCCESS] ALL PERSISTENCE AND AUDIT E2E TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_full_persistence_lifecycle()
