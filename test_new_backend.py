"""
Unit and integration tests for new Haq Saathi backend endpoints:
Auth, OTP lifecycle, Registration validation, Schemes Scan-All, Proxy dependents,
User-scoped data security, and Trilingual NLP.
"""
import sys
import requests
import json

BASE = "http://127.0.0.1:8000"

def test_backend_suite():
    print("--- 1. Testing OTP Generation & Cooldown ---")
    r = requests.post(f"{BASE}/api/auth/otp/generate", json={"phone": "9876543210"})
    assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
    data = r.json()
    assert data["success"] is True
    otp = data["demo_otp"]
    print(f"Generated OTP: {otp}, Banner: {data['banner_message']}")

    # Cooldown test (immediate second request)
    r2 = requests.post(f"{BASE}/api/auth/otp/generate", json={"phone": "9876543210"})
    assert r2.status_code == 429, f"Expected 429 cooldown, got {r2.status_code}"
    print("Cooldown verified successfully.")

    print("\n--- 2. Testing OTP Verification ---")
    # Bad OTP test
    r_bad = requests.post(f"{BASE}/api/auth/otp/verify", json={"phone": "9876543210", "otp": "000000"})
    assert r_bad.status_code == 400
    assert r_bad.json()["invalid"] is True

    # Good OTP test
    r_good = requests.post(f"{BASE}/api/auth/otp/verify", json={"phone": "9876543210", "otp": otp})
    assert r_good.status_code == 200, f"Expected 200, got {r_good.status_code}: {r_good.text}"
    auth_data = r_good.json()
    assert auth_data["success"] is True
    token = auth_data["session_token"]
    print(f"OTP Verified, Token: {token}")

    print("\n--- 3. Testing User Dashboard & Scoped Access ---")
    r_dash = requests.get(
        f"{BASE}/api/user/dashboard?phone=9876543210",
        headers={"x-session-token": token}
    )
    assert r_dash.status_code == 200, f"Dashboard error: {r_dash.text}"
    dash_data = r_dash.json()
    assert dash_data["user"]["name"] == "Ramesh Naik"
    assert "scan_results" in dash_data
    print(f"Dashboard loaded. Schemes summary: {dash_data['scan_results']['summary_en']}")

    # Security check: another user cannot access Ramesh's data with their token
    fake_token = "tok_other_user_123"
    # Register an active session for another user in user_store to test cross-access guard
    from backend.user_store import ACTIVE_SESSIONS
    ACTIVE_SESSIONS[fake_token] = {"phone": "9111111111", "created_at": 1000}
    r_blocked = requests.get(
        f"{BASE}/api/user/dashboard?phone=9876543210",
        headers={"x-session-token": fake_token}
    )
    assert r_blocked.status_code == 403, f"Expected 403 Forbidden, got {r_blocked.status_code}"
    print("Security Guard Verified: Cross-user data access blocked with 403.")

    print("\n--- 4. Testing Registration Flow (11 Fields) ---")
    new_user_payload = {
        "name": "Sunita Devi",
        "phone": "9123456780",
        "aadhaar_number": "998877665544",
        "annual_income": 96000,
        "ration_card_number": "KA-BPL-NEW-99",
        "pan_number": "ABCDE1234F",
        "present_address": "Peenya Industrial Area, Bengaluru",
        "current_address": "Peenya Industrial Area, Bengaluru",
        "same_address": True,
        "occupation": "domestic_worker",
        "has_digilocker": True,
        "digilocker_id": "DL-SUNITA-01",
        "has_labour_card": False,
        "has_school_going_child": True,
        "preferred_language": "hi"
    }
    r_reg = requests.post(f"{BASE}/api/auth/register", json=new_user_payload)
    assert r_reg.status_code == 200, f"Registration error: {r_reg.text}"
    reg_data = r_reg.json()
    assert reg_data["user"]["aadhaar_masked"] == "XXXX XXXX 5544"
    assert reg_data["user"]["pan_number_masked"] == "XXXXX1234F"
    print(f"Registered user with masked Aadhaar: {reg_data['user']['aadhaar_masked']}")

    print("\n--- 5. Testing Schemes For You Full Scan ---")
    r_scan = requests.post(f"{BASE}/api/schemes/scan-all", json={"phone": "9876543210", "language": "kn"})
    assert r_scan.status_code == 200
    scan_body = r_scan.json()
    assert "eligible" in scan_body
    assert "needs_more_info" in scan_body
    assert "not_eligible" in scan_body
    print(f"Scan groups -> Eligible: {len(scan_body['eligible'])}, Needs Info: {len(scan_body['needs_more_info'])}, Not Eligible: {len(scan_body['not_eligible'])}")

    print("\n--- 6. Testing Proxy Intent & Trilingual Voice Intent ---")
    # Proxy speech: "my father's ration card, he has no phone"
    r_proxy = requests.post(f"{BASE}/api/voice/process-intent", json={
        "text": "my father's ration card, he has no phone",
        "phone": "9876543210",
        "language": "en"
    })
    proxy_res = r_proxy.json()
    assert proxy_res["applicant_type"] == "family_member"
    assert proxy_res["relationship"] == "father"
    assert proxy_res["target_scheme_id"] == "ration_card"
    print(f"Proxy detected: type={proxy_res['applicant_type']}, rel={proxy_res['relationship']}, scheme={proxy_res['target_scheme_id']}")

    # Hindi out-of-scope refusal
    r_hindi_joke = requests.post(f"{BASE}/api/voice/process-intent", json={
        "text": "मुझे एक चुटकुला सुनाओ",
        "phone": "9876543210",
        "language": "hi"
    })
    joke_res = r_hindi_joke.json()
    assert joke_res["is_out_of_scope"] is True
    assert "क्षमा करें" in joke_res["refusal_message"]
    print("Hindi out-of-scope refusal verified.")

    # Hindi scheme intent
    r_hindi_scheme = requests.post(f"{BASE}/api/voice/process-intent", json={
        "text": "मुझे राशन कार्ड चाहिए",
        "phone": "9876543210",
        "language": "hi"
    })
    hi_scheme_res = r_hindi_scheme.json()
    assert hi_scheme_res["is_out_of_scope"] is False
    assert hi_scheme_res["target_scheme_id"] == "ration_card"
    print("Hindi scheme intent detected successfully.")

    print("\n--- 7. Testing Proxy Dependent Addition ---")
    r_dep = requests.post(f"{BASE}/api/user/dependents", json={
        "phone": "9876543210",
        "name": "Eeramma Naik",
        "relationship": "mother",
        "age": 66,
        "occupation": "homemaker",
        "annual_income": 0,
        "state_resident": True
    })
    assert r_dep.status_code == 200
    dep_data = r_dep.json()
    assert dep_data["dependent"]["name"] == "Eeramma Naik"
    print("Dependent added successfully to user profile.")

    print("\n--- 8. Testing saveUserField and getUserField ---")
    r_save = requests.post(f"{BASE}/api/user/field", json={
        "phone": "9876543210",
        "field": "native_district",
        "value": "Bidar"
    })
    assert r_save.status_code == 200
    r_get = requests.get(f"{BASE}/api/user/field?phone=9876543210&field=native_district")
    assert r_get.status_code == 200
    assert r_get.json()["value"] == "Bidar"
    print("saveUserField and getUserField verified successfully.")

    print("\nALL BACKEND INTEGRATION TESTS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_backend_suite()
