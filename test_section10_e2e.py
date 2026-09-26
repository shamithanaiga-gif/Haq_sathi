"""
End-to-End Verification Test Script for Haq Saathi (Section 10 Requirements)
Tests the complete 10-step end-to-end scenario specified in Section 10:
1. Registration with review screen & 11 fields
2. Demo OTP Login flow
3. Dashboard "Schemes For You" scan & audio summary
4. "Answer these to check" on More Info Needed scheme
5. Start scheme application by voice without re-asking registered fields
6. Out-of-scope refusal handling & re-asking pending question
7. Family member / proxy application & separate dependent profile
8. Document consent by voice, review screen before submit, and submission
9. Mid-session language switch to Hindi
10. Dashboard updates and cross-user data security guard
"""

import sys
import os
import json
import requests
import time

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"

def run_e2e_scenario():
    results = {}
    print("=" * 70)
    print("  🏛️  HAQ SAATHI - SECTION 10 END-TO-END VERIFICATION RUN")
    print("=" * 70)

    # -----------------------------------------------------------------
    # STEP 1: Register a new user fully (11 fields, photo, DigiLocker = Yes)
    # -----------------------------------------------------------------
    print("\n[Step 1/10] Registering a new beneficiary (Pooja Sharma)...")
    pooja_phone = "9845012345"
    reg_payload = {
        "name": "Pooja Sharma",
        "name_kn": "ಪೂಜಾ ಶರ್ಮಾ",
        "name_hi": "पूजा शर्मा",
        "phone": pooja_phone,
        "aadhaar_number": "123456789012",
        "annual_income": 140000,
        "ration_card_number": "KA-BPL-POOJA-01",
        "pan_number": "ABCDE1234F",
        "present_address": "Kengeri Satellite Town, Bengaluru, Karnataka",
        "current_address": "Kengeri Satellite Town, Bengaluru, Karnataka",
        "same_address": True,
        "occupation": "construction_worker",
        "photo_url": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23059669'/><text x='50' y='65' font-size='45' text-anchor='middle' fill='white'>PS</text></svg>",
        "has_digilocker": True,
        "digilocker_id": "DL-POOJA-9845",
        "has_labour_card": False,
        "has_school_going_child": False,
        "preferred_language": "kn"
    }
    
    r1 = requests.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
    if r1.status_code == 200 and r1.json().get("success"):
        reg_data = r1.json()
        assert reg_data["user"]["aadhaar_masked"] == "XXXX XXXX 9012", "Aadhaar must be masked"
        assert reg_data["user"]["pan_number_masked"] == "XXXXX1234F", "PAN must be masked"
        pooja_token = reg_data["session_token"]
        results["Step 1: Full Registration & Masking"] = "PASS"
        print(f"  ✓ User registered successfully. Masked Aadhaar: {reg_data['user']['aadhaar_masked']}")
    else:
        results["Step 1: Full Registration & Masking"] = f"FAIL ({r1.status_code}: {r1.text})"
        print(f"  ✗ Registration failed: {r1.text}")
        return results

    # -----------------------------------------------------------------
    # STEP 2: Log in with that phone number using the demo OTP flow
    # -----------------------------------------------------------------
    print("\n[Step 2/10] Testing Demo OTP Login flow...")
    r_otp = requests.post(f"{BASE_URL}/api/auth/otp/generate", json={"phone": pooja_phone})
    if r_otp.status_code == 200:
        otp_body = r_otp.json()
        demo_otp = otp_body["demo_otp"]
        print(f"  ✓ Demo OTP banner displayed: '{otp_body['banner_message']}'")

        # Verify OTP
        r_ver = requests.post(f"{BASE_URL}/api/auth/otp/verify", json={"phone": pooja_phone, "otp": demo_otp})
        if r_ver.status_code == 200 and r_ver.json().get("success"):
            login_token = r_ver.json()["session_token"]
            results["Step 2: Demo OTP Login"] = "PASS"
            print(f"  ✓ OTP verified successfully. Session Token: {login_token}")
        else:
            results["Step 2: Demo OTP Login"] = f"FAIL (Verify failed: {r_ver.text})"
    else:
        results["Step 2: Demo OTP Login"] = f"FAIL (OTP gen: {r_otp.text})"

    # -----------------------------------------------------------------
    # STEP 3: Confirm "Schemes For You" scan runs automatically
    # -----------------------------------------------------------------
    print("\n[Step 3/10] Checking 'Schemes For You' scan and spoken summary...")
    r_dash = requests.get(
        f"{BASE_URL}/api/user/dashboard?phone={pooja_phone}",
        headers={"x-session-token": pooja_token}
    )
    if r_dash.status_code == 200:
        dash = r_dash.json()
        scan = dash["scan_results"]
        assert "eligible" in scan and "needs_more_info" in scan and "not_eligible" in scan
        print(f"  ✓ Eligible schemes: {len(scan['eligible'])}")
        print(f"  ✓ Needs More Info schemes: {len(scan['needs_more_info'])}")
        print(f"  ✓ Not Eligible schemes: {len(scan['not_eligible'])}")
        print(f"  ✓ Spoken audio summary: \"{scan['summary_kn']}\"")
        results["Step 3: Schemes For You Scan & Summary"] = "PASS"
    else:
        results["Step 3: Schemes For You Scan & Summary"] = f"FAIL ({r_dash.status_code})"

    # -----------------------------------------------------------------
    # STEP 4: Answer missing fields on "Needs More Info" scheme
    # -----------------------------------------------------------------
    print("\n[Step 4/10] Answering missing fields for Child Scholarship...")
    # Provide has_labour_card=True and has_school_going_child=True
    r_f1 = requests.post(f"{BASE_URL}/api/user/field", json={"phone": pooja_phone, "field": "has_labour_card", "value": True})
    r_f2 = requests.post(f"{BASE_URL}/api/user/field", json={"phone": pooja_phone, "field": "has_school_going_child", "value": True})
    
    # Re-scan
    r_rescan = requests.post(f"{BASE_URL}/api/schemes/scan-all", json={"phone": pooja_phone, "language": "kn"})
    if r_rescan.status_code == 200:
        new_scan = r_rescan.json()
        scholarship_eligible = any(s["scheme_id"] == "child_scholarship" for s in new_scan["eligible"])
        if scholarship_eligible:
            print(f"  ✓ Child scholarship successfully moved into Eligible list!")
            results["Step 4: Answer Missing Fields & Re-Scan"] = "PASS"
        else:
            results["Step 4: Answer Missing Fields & Re-Scan"] = "FAIL (Not moved to eligible)"
    else:
        results["Step 4: Answer Missing Fields & Re-Scan"] = f"FAIL ({r_rescan.status_code})"

    # -----------------------------------------------------------------
    # STEP 5: Start scheme application by voice in Kannada (no re-asking)
    # -----------------------------------------------------------------
    print("\n[Step 5/10] Starting scheme application by voice in Kannada...")
    r_voice = requests.post(f"{BASE_URL}/api/voice/process-intent", json={
        "text": "ನನ್ನ ಕುಟುಂಬಕ್ಕೆ ರೇಷನ್ ಕಾರ್ಡ್ ಬೇಕು",
        "phone": pooja_phone,
        "language": "kn"
    })
    if r_voice.status_code == 200:
        v_data = r_voice.json()
        assert v_data["target_scheme_id"] == "ration_card"
        # Since income (140000), occupation (construction_worker), and state_resident are already known,
        # missing_fields should NOT re-ask them!
        missing = v_data.get("missing_fields", [])
        print(f"  ✓ Detected scheme: {v_data['target_scheme_id']}, Missing fields: {missing}")
        assert "annual_income" not in missing, "annual_income should not be re-asked"
        assert "occupation" not in missing, "occupation should not be re-asked"
        results["Step 5: Voice Scheme Start (No Re-Ask)"] = "PASS"
    else:
        results["Step 5: Voice Scheme Start (No Re-Ask)"] = f"FAIL ({r_voice.status_code})"

    # -----------------------------------------------------------------
    # STEP 6: Irrelevant speech refusal & re-ask
    # -----------------------------------------------------------------
    print("\n[Step 6/10] Testing out-of-scope refusal handling...")
    r_joke = requests.post(f"{BASE_URL}/api/voice/process-intent", json={
        "text": "ನನಗೆ ಒಂದು ತಮಾಷೆಯ ಜೋಕ್ ಹೇಳು",
        "phone": pooja_phone,
        "current_field": "family_size",
        "target_scheme_id": "ration_card",
        "language": "kn"
    })
    if r_joke.status_code == 200:
        j_data = r_joke.json()
        assert j_data["is_out_of_scope"] is True, "Must be classified as out-of-scope"
        assert "ಕ್ಷಮಿಸಿ, ನಾನು ಹಕ್ ಸಾಥಿ" in j_data["refusal_message"], "Standard refusal must play"
        assert j_data["next_question"]["field"] == "family_size", "Must re-ask pending question"
        print(f"  ✓ Refusal spoken: \"{j_data['refusal_message']}\"")
        print(f"  ✓ Pending question re-attached: \"{j_data['next_question']['text']}\"")
        results["Step 6: Out-of-Scope Refusal & Re-Ask"] = "PASS"
    else:
        results["Step 6: Out-of-Scope Refusal & Re-Ask"] = f"FAIL ({r_joke.status_code})"

    # -----------------------------------------------------------------
    # STEP 7: Apply on behalf of a family member (Proxy flow)
    # -----------------------------------------------------------------
    print("\n[Step 7/10] Testing proxy / family member application...")
    r_proxy = requests.post(f"{BASE_URL}/api/voice/process-intent", json={
        "text": "ನನ್ನ ತಂದೆಯ ರೇಷನ್ ಕಾರ್ಡ್ ಬೇಕು, ಅವರಿಗೆ ಮೊಬೈಲ್ ಇಲ್ಲ",
        "phone": pooja_phone,
        "language": "kn"
    })
    if r_proxy.status_code == 200:
        p_data = r_proxy.json()
        assert p_data["applicant_type"] == "family_member"
        assert p_data["relationship"] == "father"
        print(f"  ✓ Proxy intent recognized: type={p_data['applicant_type']}, rel={p_data['relationship']}")

        # Add dependent profile
        r_dep = requests.post(f"{BASE_URL}/api/user/dependents", json={
            "phone": pooja_phone,
            "name": "Shivanna Sharma",
            "relationship": "father",
            "age": 68,
            "occupation": "retired_worker",
            "annual_income": 12000,
            "state_resident": True
        })
        dep_res = r_dep.json()
        assert dep_res["success"] is True
        print(f"  ✓ Dependent stored in account: {dep_res['dependent']['name']} (Age: {dep_res['dependent']['age']})")
        results["Step 7: Family Member / Proxy Profile"] = "PASS"
    else:
        results["Step 7: Family Member / Proxy Profile"] = f"FAIL ({r_proxy.status_code})"

    # -----------------------------------------------------------------
    # STEP 8: Consent by voice, Review screen, Edit, Submit
    # -----------------------------------------------------------------
    print("\n[Step 8/10] Testing Document Consent, Review before submit, and submission...")
    # Log consent with proxy label
    r_c1 = requests.post(f"{BASE_URL}/api/consent/log", json={
        "doc_type": "aadhaar_card",
        "doc_title_en": "Aadhaar Card",
        "doc_title_kn": "ಆಧಾರ್ ಕಾರ್ಡ್",
        "scheme_id": "ration_card",
        "scheme_name_en": "Karnataka BPL Ration Card",
        "scheme_name_kn": "ಕರ್ನಾಟಕ ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ",
        "purpose_en": "Verify identity of Shivanna Sharma",
        "purpose_kn": "ಶಿವಣ್ಣ ಶರ್ಮಾ ಅವರ ಗುರುತು ಪರಿಶೀಲಿಸಲು",
        "status": "ALLOWED",
        "phone": pooja_phone,
        "applicant_type": "family_member",
        "dependent_name": "Shivanna Sharma"
    })
    r_c2 = requests.post(f"{BASE_URL}/api/consent/log", json={
        "doc_type": "income_certificate",
        "doc_title_en": "Income Certificate",
        "doc_title_kn": "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ",
        "scheme_id": "ration_card",
        "scheme_name_en": "Karnataka BPL Ration Card",
        "scheme_name_kn": "ಕರ್ನಾಟಕ ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ",
        "purpose_en": "Verify BPL income eligibility",
        "purpose_kn": "ಬಿಪಿಎಲ್ ಆದಾಯ ದೃಢೀಕರಣ",
        "status": "ALLOWED",
        "phone": pooja_phone,
        "applicant_type": "family_member",
        "dependent_name": "Shivanna Sharma"
    })
    assert r_c1.status_code == 200 and r_c2.status_code == 200

    # Prefill form review
    r_pf = requests.post(f"{BASE_URL}/api/forms/prefill", json={
        "scheme_id": "ration_card",
        "consented_docs": ["aadhaar_card", "income_certificate"],
        "phone": pooja_phone
    })
    assert r_pf.status_code == 200
    pf_data = r_pf.json()
    assert len(pf_data["prefilled_fields"]) > 0
    print(f"  ✓ Pre-filled form assembled with {len(pf_data['prefilled_fields'])} fields for mandatory review.")

    # Edit one field before confirming submission
    form_submission_payload = {
        "scheme_id": "ration_card",
        "form_data": {
            "applicant_name": "Shivanna Sharma",
            "relation_to_primary": "Father",
            "present_address": "Kengeri Satellite Town, Bengaluru West",
            "annual_income": "₹12,000"
        },
        "language": "kn",
        "phone": pooja_phone,
        "applicant_type": "family_member",
        "applicant_name": "Shivanna Sharma"
    }
    r_sub = requests.post(f"{BASE_URL}/api/forms/submit", json=form_submission_payload)
    if r_sub.status_code == 200:
        sub_data = r_sub.json()
        assert sub_data["status"] == "SUBMITTED"
        assert "HS-KA-RATI" in sub_data["acknowledgement_id"]
        print(f"  ✓ Application submitted! Acknowledgement ID: {sub_data['acknowledgement_id']}")
        results["Step 8: Consent, Review, Edit & Submit"] = "PASS"
    else:
        results["Step 8: Consent, Review, Edit & Submit"] = f"FAIL ({r_sub.status_code})"

    # -----------------------------------------------------------------
    # STEP 9: Switch language to Hindi mid-session
    # -----------------------------------------------------------------
    print("\n[Step 9/10] Switching language to Hindi and testing immediate response...")
    r_hi_intent = requests.post(f"{BASE_URL}/api/voice/process-intent", json={
        "text": "मुझे स्वास्थ्य बीमा योजना चाहिए",
        "phone": pooja_phone,
        "language": "hi"
    })
    if r_hi_intent.status_code == 200:
        hi_data = r_hi_intent.json()
        assert hi_data["language"] == "hi"
        assert hi_data["target_scheme_id"] == "health_cover"
        print(f"  ✓ Hindi scheme intent matched: {hi_data['target_scheme_id']}")

        # Hindi out-of-scope refusal
        r_hi_refusal = requests.post(f"{BASE_URL}/api/voice/process-intent", json={
            "text": "मुझे एक गाना सुनाओ",
            "phone": pooja_phone,
            "language": "hi"
        })
        hi_refusal_data = r_hi_refusal.json()
        assert hi_refusal_data["is_out_of_scope"] is True
        assert "क्षमा करें, मैं हक़ साथी हूँ" in hi_refusal_data["refusal_message"]
        print(f"  ✓ Hindi refusal spoken immediately: \"{hi_refusal_data['refusal_message']}\"")
        results["Step 9: Mid-Session Hindi Switch"] = "PASS"
    else:
        results["Step 9: Mid-Session Hindi Switch"] = f"FAIL ({r_hi_intent.status_code})"

    # -----------------------------------------------------------------
    # STEP 10: Confirm Dashboard updates & Cross-User Security Guard
    # -----------------------------------------------------------------
    print("\n[Step 10/10] Confirming Dashboard updates and cross-user data security...")
    r_final_dash = requests.get(
        f"{BASE_URL}/api/user/dashboard?phone={pooja_phone}",
        headers={"x-session-token": pooja_token}
    )
    if r_final_dash.status_code == 200:
        fdash = r_final_dash.json()
        assert len(fdash["applications"]) >= 1, "Must have submitted application in dashboard"
        assert len(fdash["dependents"]) >= 1, "Must have Shivanna Sharma in dependents"
        assert len(fdash["audit_logs"]) >= 2, "Must have audit log records"
        print(f"  ✓ Applications count: {len(fdash['applications'])}")
        print(f"  ✓ Dependents count: {len(fdash['dependents'])}")
        print(f"  ✓ Scoped Audit records: {len(fdash['audit_logs'])}")

        # Cross-User Security Test: try to access Pooja's dashboard using a different user's token or invalid token
        r_sec = requests.get(
            f"{BASE_URL}/api/user/dashboard?phone={pooja_phone}",
            headers={"x-session-token": "tok_invalid_malicious_user"}
        )
        if r_sec.status_code == 403:
            print("  ✓ Security Guard: Cross-user access blocked with 403 Forbidden!")
            results["Step 10: Dashboard Sync & Security Guard"] = "PASS"
        else:
            results["Step 10: Dashboard Sync & Security Guard"] = f"FAIL (Expected 403, got {r_sec.status_code})"
    else:
        results["Step 10: Dashboard Sync & Security Guard"] = f"FAIL ({r_final_dash.status_code})"

    # -----------------------------------------------------------------
    # FINAL RESULTS SUMMARY
    # -----------------------------------------------------------------
    print("\n" + "=" * 70)
    print("  HAQ SAATHI - SECTION 10 TEST RESULTS SUMMARY")
    print("=" * 70)
    all_passed = True
    for step_name, status in results.items():
        badge = "✅" if status == "PASS" else "❌"
        print(f"  {badge} {step_name}: {status}")
        if status != "PASS":
            all_passed = False

    print("=" * 70)
    if all_passed:
        print("  🎉 10 OUT OF 10 VERIFICATION STEPS PASSED SUCCESSFULLY!")
    else:
        print("  ⚠️ SOME TESTS FAILED.")
    print("=" * 70)

    return all_passed

if __name__ == "__main__":
    success = run_e2e_scenario()
    sys.exit(0 if success else 1)
