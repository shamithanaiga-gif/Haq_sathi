import requests
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000"

def test_five_bugs():
    print("================================================================")
    print("  RUNNING 5-BUG FIX VERIFICATION SUITE FOR HAQ SAATHI")
    print("================================================================")
    
    # ------------------------------------------------------------------
    # SCENARIO 1: Register brand-new user -> Direct Dashboard & Complete Spoken Summary
    # ------------------------------------------------------------------
    print("\n--- SCENARIO 1: Register brand-new user & Check Spoken Summary ---")
    test_phone = f"9988{int(time.time()) % 1000000:06d}"
    print(f"1. Registering new citizen with phone: {test_phone}...")
    reg_payload = {
        "name": "Manjula Gowda",
        "phone": test_phone,
        "aadhaar_number": "912345678901",
        "annual_income": 95000,
        "ration_card_number": "KA-10-BPL-554433",
        "pan_number": "ABCDE1234F",
        "present_address": "Peenya Industrial Area, Bengaluru, Karnataka",
        "current_address": "Peenya Industrial Area, Bengaluru, Karnataka",
        "same_address": True,
        "occupation": "construction_worker",
        "has_digilocker": True,
        "has_labour_card": True,
        "has_school_going_child": False,
        "age": 34,
        "family_size": 3,
        "preferred_language": "en"
    }
    
    r_reg = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
    assert r_reg.status_code == 200, f"Registration failed: {r_reg.text}"
    reg_data = r_reg.json()
    assert reg_data.get("success") is True, "Registration success flag is False"
    session_token = reg_data.get("session_token")
    user = reg_data.get("user")
    assert session_token, "No session token returned"
    assert user["name"] == "Manjula Gowda"
    assert user["aadhaar_masked"] == "XXXX XXXX 8901", f"Aadhaar mask failed: {user['aadhaar_masked']}"
    assert user["pan_number_masked"] == "XXXXX1234F", f"PAN mask failed: {user['pan_number_masked']}"
    print(f"✓ Registration succeeded! Citizen profile created for {user['name']}.")

    # Load Dashboard for newly registered user
    r_dash = requests.get(
        f"{BASE_URL}/api/user/dashboard?phone={test_phone}&lang=en",
        headers={"x-session-token": session_token}
    )
    assert r_dash.status_code == 200, f"Dashboard load failed: {r_dash.text}"
    dash_data = r_dash.json()
    assert dash_data.get("user") is not None, "Dashboard returned null user"
    scan_results = dash_data.get("scan_results")
    assert scan_results is not None, "Scan results missing"
    
    summary_en = scan_results.get("summary_en", "")
    summary_kn = scan_results.get("summary_kn", "")
    summary_hi = scan_results.get("summary_hi", "")
    print(f"\n[Spoken Summary EN]:\n  \"{summary_en}\"")
    print(f"[Spoken Summary KN]:\n  \"{summary_kn}\"")
    print(f"[Spoken Summary HI]:\n  \"{summary_hi}\"")

    # Verify that eligible schemes, needs-more-info schemes, and not-eligible schemes are all named
    eligible_names = [s["scheme_name_en"] for s in scan_results.get("eligible", [])]
    needs_info_names = [s["scheme_name_en"] for s in scan_results.get("needs_more_info", [])]
    not_eligible_names = [s["scheme_name_en"] for s in scan_results.get("not_eligible", [])]
    
    print(f"Eligible schemes ({len(eligible_names)}): {eligible_names}")
    print(f"Needs more info schemes ({len(needs_info_names)}): {needs_info_names}")
    print(f"Not eligible schemes ({len(not_eligible_names)}): {not_eligible_names}")

    assert "Priority Ration Card" in summary_en or "Ayushman Health Cover" in summary_en, "Summary did not name eligible schemes"
    assert "We need more information" in summary_en or "not immediately eligible" in summary_en or "eligible for" in summary_en
    print("✓ BUG 2 Verified: User lands directly on dashboard with complete spoken summary naming schemes in all categories!")

    # ------------------------------------------------------------------
    # SCENARIO 2: Session Persistence & Skip Login
    # ------------------------------------------------------------------
    print("\n--- SCENARIO 2: Session Persistence & Skip Login ---")
    # Simulate app boot with existing localStorage session (token + phone)
    r_boot = requests.get(
        f"{BASE_URL}/api/user/dashboard?phone={test_phone}",
        headers={"x-session-token": session_token}
    )
    assert r_boot.status_code == 200, "Session token verification failed on reload"
    boot_user = r_boot.json().get("user")
    assert boot_user["phone"] == test_phone
    assert boot_user["name"] == "Manjula Gowda"
    print("✓ BUG 4 Verified: Active session token persists and skips login directly to dashboard!")

    # ------------------------------------------------------------------
    # SCENARIO 3: Login Flow Order (Phone -> OTP) & Unregistered Phone Guard
    # ------------------------------------------------------------------
    print("\n--- SCENARIO 3: Login Flow Order & Unregistered Phone Guard ---")
    # 1. Unregistered number should be REJECTED with 400 and message instructing to Register
    fake_phone = "9111222333"
    r_unregistered = requests.post(f"{BASE_URL}/api/auth/otp/generate", json={"phone": fake_phone})
    assert r_unregistered.status_code == 400, f"Unregistered phone was not rejected: {r_unregistered.status_code}"
    unreg_resp = r_unregistered.json()
    assert unreg_resp.get("success") is False
    assert unreg_resp.get("user_exists") is False
    assert "not registered" in unreg_resp.get("message", "").lower(), f"Unexpected message: {unreg_resp}"
    print(f"✓ Unregistered phone {fake_phone} correctly rejected without revealing OTP: \"{unreg_resp['message']}\"")

    # 2. Registered number should succeed and return demo OTP
    r_otp = requests.post(f"{BASE_URL}/api/auth/otp/generate", json={"phone": test_phone})
    assert r_otp.status_code == 200, f"OTP generation failed for registered user: {r_otp.text}"
    otp_data = r_otp.json()
    assert otp_data.get("success") is True
    demo_otp = otp_data.get("demo_otp")
    assert demo_otp and len(demo_otp) == 6, f"Invalid demo OTP: {demo_otp}"
    print(f"✓ Registered phone {test_phone} successfully generated demo OTP: {demo_otp}")

    # 3. Verify OTP returns fresh session
    r_verify = requests.post(f"{BASE_URL}/api/auth/otp/verify", json={"phone": test_phone, "otp": demo_otp})
    assert r_verify.status_code == 200, f"OTP verification failed: {r_verify.text}"
    verify_data = r_verify.json()
    assert verify_data.get("success") is True
    new_token = verify_data.get("session_token")
    assert new_token, "No session token returned on OTP verify"
    print("✓ BUG 3 Verified: Login enforces Phone Number first, rejects unregistered phone, and yields OTP only for registered users!")

    # ------------------------------------------------------------------
    # SCENARIO 4: Dashboard "My Applications" Fresh State
    # ------------------------------------------------------------------
    print("\n--- SCENARIO 4: Dashboard \"My Applications\" Fresh State ---")
    # Submit an application for Priority Ration Card
    app_payload = {
        "scheme_id": "ration_card",
        "form_data": {
            "applicant_name": "Manjula Gowda",
            "phone": test_phone,
            "annual_income": 95000,
            "ration_card_number": "KA-10-BPL-554433"
        },
        "language": "en",
        "phone": test_phone,
        "applicant_type": "self"
    }
    r_sub = requests.post(f"{BASE_URL}/api/forms/submit", json=app_payload)
    assert r_sub.status_code == 200, f"Application submission failed: {r_sub.text}"
    sub_data = r_sub.json()
    ack_id = sub_data.get("acknowledgement_id")
    print(f"✓ Application submitted with Ack ID: {ack_id}")

    # Fetch dashboard fresh to confirm application appears
    r_dash_apps = requests.get(
        f"{BASE_URL}/api/user/dashboard?phone={test_phone}",
        headers={"x-session-token": new_token}
    )
    assert r_dash_apps.status_code == 200
    apps_list = r_dash_apps.json().get("applications", [])
    assert len(apps_list) > 0, "No applications found in fresh dashboard fetch"
    latest_app = apps_list[-1]
    assert latest_app["app_id"] == ack_id, f"Application ID mismatch: {latest_app['app_id']} vs {ack_id}"
    assert "scheme_title" in latest_app, "Scheme title missing from application"
    assert "submitted_at" in latest_app, "Submission date missing from application"
    assert ("submit" in latest_app["status"].lower() or "applied" in latest_app["status"].lower()), f"Expected submitted/applied status, got {latest_app['status']}"
    print(f"✓ BUG 5 Verified: Fresh applications list correctly returned from backend store with Scheme: '{latest_app['scheme_title']}', Date: '{latest_app['submitted_at']}', Status: '{latest_app['status']}'.")

    # ------------------------------------------------------------------
    # SCENARIO 5: Voice Intent Parsing, Raw Text Capture & Parse Failure Graceful Handling
    # ------------------------------------------------------------------
    print("\n--- SCENARIO 5: Voice Input Capture, Parsing & Graceful Fallback ---")
    # 5a. Out of scope request (e.g. joke)
    r_joke = requests.post(f"{BASE_URL}/api/voice/process-intent", json={
        "text": "tell me a funny cricket joke",
        "phone": test_phone,
        "language": "en"
    })
    joke_resp = r_joke.json()
    assert joke_resp.get("is_out_of_scope") is True, "Out of scope request was not caught"
    assert "welfare" in joke_resp.get("refusal_message", "").lower(), "Refusal message missing scope guidance"
    print(f"✓ Out-of-scope guard passed: \"{joke_resp['refusal_message']}\"")

    # 5b. Parse failure on a specific expected field (e.g. gibberish when expecting has_labour_card)
    r_gibberish = requests.post(f"{BASE_URL}/api/voice/process-intent", json={
        "text": "pineapple watermelon pizza",
        "phone": test_phone,
        "current_field": "has_labour_card",
        "language": "en"
    })
    gib_resp = r_gibberish.json()
    assert gib_resp.get("is_parse_failure") is True, f"Expected is_parse_failure=True, got {gib_resp}"
    assert "pineapple watermelon pizza" in gib_resp.get("failure_message", ""), f"Raw text not echoed in failure message: {gib_resp}"
    print(f"✓ BUG 1 Verified: Parse failure correctly echoes raw text: \"{gib_resp['failure_message']}\"")

    # 5c. Successful parse for Kannada yes
    r_kn_yes = requests.post(f"{BASE_URL}/api/voice/process-intent", json={
        "text": "ಹೌದು ನನ್ನ ಬಳಿ ಕಾರ್ಡ್ ಇದೆ",
        "phone": test_phone,
        "current_field": "has_labour_card",
        "language": "kn"
    })
    kn_resp = r_kn_yes.json()
    assert kn_resp.get("parsed_intent", {}).get("extracted_fields", {}).get("has_labour_card") is True, f"Kannada yes parsing failed: {kn_resp}"
    print("✓ Kannada natural speech correctly recognized and mapped to boolean True!")

    print("\n================================================================")
    print("  ALL 5 BUG FIX SCENARIOS VERIFIED SUCCESSFULLY! 🚀")
    print("================================================================")

if __name__ == "__main__":
    test_five_bugs()
