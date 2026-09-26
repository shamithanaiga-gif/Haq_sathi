"""
End-to-End Test Suite for Haq Saathi:
Fix 1: Spoken Scheme Names on Login (Specific Schemes by name, Kannada/English/Hindi, zero-eligible fallback, dynamic updates)
Fix 2: Photo Preview During and After Registration (Step 10 preview, persistence in user profile, dashboard display)
"""

import sys
import json
import urllib.request
import urllib.parse
import time

if sys.platform.startswith("win"):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

BASE_URL = "http://127.0.0.1:8000"

def post_json(path, data, headers=None):
    url = f"{BASE_URL}{path}"
    payload = json.dumps(data).encode("utf-8")
    req_headers = {"Content-Type": "application/json"}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, data=payload, headers=req_headers, method="POST")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return json.loads(err_body)
        except:
            return {"error": err_body, "status": e.code}

def get_json(path, headers=None):
    url = f"{BASE_URL}{path}"
    req_headers = {}
    if headers:
        req_headers.update(headers)
    req = urllib.request.Request(url, headers=req_headers, method="GET")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return json.loads(err_body)
        except:
            return {"error": err_body, "status": e.code}

def run_tests():
    print("==================================================================")
    print("RUNNING HAQ SAATHI VERIFICATION SUITE FOR FIX 1 & FIX 2")
    print("==================================================================")

    # ------------------------------------------------------------------
    # TEST 1: Register New Account with Photo (FIX 2)
    # ------------------------------------------------------------------
    print("\n--- TEST 1: Register New Account with Photo (Step 10 Preview & Storage) ---")
    test_phone = f"99{int(time.time()) % 100000000:08d}"
    test_photo = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140'><rect width='120' height='140' fill='%23059669'/><text x='60' y='75' fill='white' font-size='20' text-anchor='middle'>Suresh</text></svg>"

    reg_payload = {
        "phone": test_phone,
        "name": "Suresh Gowda",
        "name_kn": "ಸುರೇಶ್ ಗೌಡ",
        "name_hi": "सुरेश गौड़ा",
        "aadhaar_number": "987654321098",
        "annual_income": 95000,
        "ration_card_number": "KA-BPL-2026-999",
        "pan_number": "ABCDE1234F",
        "present_address": "Peenya Industrial Area, Bengaluru",
        "same_address": True,
        "current_address": "Peenya Industrial Area, Bengaluru",
        "occupation": "construction_worker",
        "has_labour_card": False,
        "has_school_going_child": False,
        "photo_url": test_photo,
        "has_digilocker": False,
        "preferred_language": "en"
    }

    reg_res = post_json("/api/auth/register", reg_payload)
    assert reg_res.get("success"), f"Registration failed: {reg_res}"
    print(f"✓ Registered new user: {reg_res.get('user', {}).get('name')} ({test_phone})")
    assert reg_res["user"].get("photo_url") == test_photo, "Photo URL not stored properly in registered user"
    print("✓ Photo Data URL successfully linked and persisted in registered profile.")

    # ------------------------------------------------------------------
    # TEST 2: Complete Registration & Login -> Dashboard Photo & Profile (FIX 2)
    # ------------------------------------------------------------------
    print("\n--- TEST 2: Login & Fetch Dashboard -> Verify Photo Display & Fallback ---")
    otp_res = post_json("/api/auth/otp/generate", {"phone": test_phone})
    assert otp_res.get("success"), f"OTP generation failed: {otp_res}"
    demo_otp = otp_res.get("demo_otp")

    verify_res = post_json("/api/auth/otp/verify", {"phone": test_phone, "otp": demo_otp})
    assert verify_res.get("success"), f"OTP verify failed: {verify_res}"
    session_token = verify_res.get("session_token")
    print(f"✓ Verified login OTP, received session token: {session_token[:12]}...")

    dash_res = get_json(f"/api/user/dashboard?phone={test_phone}&lang=en", headers={"X-Session-Token": session_token})
    assert dash_res.get("user"), f"Dashboard fetch failed: {dash_res}"
    dash_user = dash_res["user"]
    assert dash_user.get("photo_url") == test_photo, "Dashboard user does not contain photo_url"
    print("✓ Dashboard user profile successfully returned user's passport photo Data URL.")

    # Also test fallback avatar when photo is omitted
    phone_no_photo = f"98{int(time.time() + 1) % 100000000:08d}"
    reg_no_photo_payload = {
        "phone": phone_no_photo,
        "name": "Anand Kumar",
        "aadhaar_number": "876543210987",
        "annual_income": 80000,
        "present_address": "Bengaluru",
        "occupation": "driver",
        "photo_url": "",  # Empty photo
        "preferred_language": "en"
    }
    reg_no_photo_res = post_json("/api/auth/register", reg_no_photo_payload)
    assert reg_no_photo_res.get("success"), f"Reg failed: {reg_no_photo_res}"
    saved_avatar = reg_no_photo_res["user"].get("photo_url")
    assert saved_avatar and "svg" in saved_avatar and "AK" in saved_avatar, f"Fallback avatar not generated properly: {saved_avatar}"
    print(f"✓ Fallback avatar placeholder generated with initials: {saved_avatar[:60]}...")

    # ------------------------------------------------------------------
    # TEST 3: Spoken Scheme Names on Login (FIX 1)
    # ------------------------------------------------------------------
    print("\n--- TEST 3: Spoken Summary on Login (Names Actual Eligible Schemes) ---")
    scan = dash_res.get("scan_results")
    assert scan, "No scan results returned on dashboard"
    
    summary_en = scan.get("summary_en", "")
    summary_kn = scan.get("summary_kn", "")
    summary_hi = scan.get("summary_hi", "")

    print(f"Spoken Summary (EN): \"{summary_en}\"")
    print(f"Spoken Summary (KN): \"{summary_kn}\"")
    print(f"Spoken Summary (HI): \"{summary_hi}\"")

    # Suresh Gowda has income 95,000 <= 1,20,000 and <= 5,00,000, state_resident=True
    # Eligible for Priority Ration Card AND Ayushman Health Cover
    assert "Priority Ration Card" in summary_en, f"'Priority Ration Card' missing from English summary: {summary_en}"
    assert "Ayushman Health Cover" in summary_en, f"'Ayushman Health Cover' missing from English summary: {summary_en}"
    assert "Suresh Gowda" in summary_en, f"User name missing from English summary: {summary_en}"
    assert "ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ" in summary_kn, f"Kannada scheme name missing: {summary_kn}"
    assert "ಆಯುಷ್ಮಾನ್ ಆರೋಗ್ಯ ಯೋಜನೆ" in summary_kn, f"Kannada health scheme name missing: {summary_kn}"
    assert "बीपीएल राशन कार्ड" in summary_hi, f"Hindi scheme name missing: {summary_hi}"
    assert "आयुष्मान स्वास्थ्य योजना" in summary_hi, f"Hindi health scheme name missing: {summary_hi}"
    print("✓ Spoken summary specifically names all eligible schemes out loud in EN, KN, and HI.")

    # Test Seed User Ramesh Naik
    ramesh_dash = get_json("/api/user/dashboard?phone=9876543210&lang=en")
    ramesh_summary = ramesh_dash["scan_results"]["summary_en"]
    print(f"\nRamesh Naik Spoken Summary: \"{ramesh_summary}\"")
    assert "Priority Ration Card" in ramesh_summary, "Ramesh summary should name Priority Ration Card"
    assert "Ayushman Health Cover" in ramesh_summary, "Ramesh summary should name Ayushman Health Cover"
    assert "Construction Worker Child Scholarship" in ramesh_summary, "Ramesh has labour card & child, should name Child Scholarship"
    print("✓ Ramesh Naik login summary names all 3 eligible schemes by name.")

    # ------------------------------------------------------------------
    # TEST 4: Zero-Eligible Guidance & Dynamic Update After Adding Fields (FIX 1)
    # ------------------------------------------------------------------
    print("\n--- TEST 4: Zero Eligible & Dynamic Update on Re-login ---")
    # Register high income user who is eligible for 0 schemes initially
    wealthy_phone = f"97{int(time.time() + 2) % 100000000:08d}"
    wealthy_payload = {
        "phone": wealthy_phone,
        "name": "Kavitha Rao",
        "aadhaar_number": "765432109876",
        "annual_income": 800000, # Ineligible for BPL and Ayushman
        "present_address": "Bengaluru",
        "occupation": "engineer",
        "preferred_language": "en"
    }
    post_json("/api/auth/register", wealthy_payload)
    wealthy_dash = get_json(f"/api/user/dashboard?phone={wealthy_phone}&lang=en")
    wealthy_summary = wealthy_dash["scan_results"]["summary_en"]
    print(f"Zero-Eligible Summary: \"{wealthy_summary}\"")
    assert "We don't have enough information yet to confirm any schemes" in wealthy_summary or "not currently eligible" in wealthy_summary, \
        f"Zero-eligible message expected: {wealthy_summary}"
    print("✓ Zero-eligible scenario provides polite, clear guidance on login.")

    # Now simulate Suresh Gowda obtaining a Labour Card and having a school-going child
    print("\nUpdating Suresh Gowda's profile with Labour Card and School-going child...")
    post_json("/api/user/field", {"phone": test_phone, "field": "has_labour_card", "value": True})
    post_json("/api/user/field", {"phone": test_phone, "field": "has_school_going_child", "value": True})

    # Suresh logs out and logs in again
    print("Simulating logout and fresh login...")
    updated_dash = get_json(f"/api/user/dashboard?phone={test_phone}&lang=en")
    updated_summary = updated_dash["scan_results"]["summary_en"]
    print(f"Updated Spoken Summary on Re-login: \"{updated_summary}\"")
    assert "Construction Worker Child Scholarship" in updated_summary, \
        f"Newly eligible scheme 'Construction Worker Child Scholarship' not mentioned in updated summary: {updated_summary}"
    assert "Priority Ration Card" in updated_summary
    assert "Ayushman Health Cover" in updated_summary
    print("✓ Dynamic update on re-login verified: Voice summary automatically includes newly unlocked schemes by name!")

    print("\n==================================================================")
    print("ALL TESTS PASSED SUCCESSFULLY! BOTH FIX 1 AND FIX 2 CONFIRMED.")
    print("==================================================================")

if __name__ == "__main__":
    run_tests()
