"""
End-to-End API verification script for Haq Saathi
"""
import requests
import json
import sys

sys.stdout.reconfigure(encoding="utf-8")
BASE = "http://127.0.0.1:8000"

print("--- 1. Testing GET / (Index page) ---")
r = requests.get(f"{BASE}/")
assert r.status_code == 200
assert "Haq Saathi" in r.text
print("✓ Index HTML served successfully!")

print("\n--- 2. Testing GET /api/profile ---")
r = requests.get(f"{BASE}/api/profile")
assert r.status_code == 200
profile = r.json()
assert profile["name"] == "Ramesh Naik"
assert profile["annual_income"] == 144000
print(f"✓ Profile loaded: {profile['name']} from {profile['native_district']}, Income: ₹{profile['annual_income']:,}")

print("\n--- 3. Testing GET /api/schemes ---")
r = requests.get(f"{BASE}/api/schemes")
assert r.status_code == 200
schemes = r.json()
assert len(schemes) == 4
scheme_ids = [s["id"] for s in schemes]
assert "ration_card" in scheme_ids
assert "health_cover" in scheme_ids
assert "child_scholarship" in scheme_ids
assert "pension" in scheme_ids
print(f"✓ 4 Schemes loaded: {scheme_ids}")

print("\n--- 4. Testing POST /api/voice/process-intent (Kannada) ---")
payload = {
    "text": "ನನಗೆ ರೇಷನ್ ಕಾರ್ಡ್ ಬೇಕು",
    "language": "kn"
}
r = requests.post(f"{BASE}/api/voice/process-intent", json=payload)
assert r.status_code == 200
intent_res = r.json()
assert intent_res["target_scheme_id"] == "ration_card"
assert intent_res["language"] == "kn"
print(f"✓ Kannada Intent processed: Target Scheme = {intent_res['target_scheme_id']}")

print("\n--- 5. Testing POST /api/voice/process-intent (Clarification) ---")
payload = {
    "text": "ವಾರ್ಷಿಕ ಆದಾಯ ಅಂದರೆ ಏನು?",
    "current_field": "annual_income",
    "language": "kn"
}
r = requests.post(f"{BASE}/api/voice/process-intent", json=payload)
assert r.status_code == 200
clarify_res = r.json()
assert clarify_res["is_clarification"] is True
print(f"✓ Clarification: {clarify_res['clarification']['text_kn']}")

print("\n--- 6. Testing POST /api/eligibility/evaluate (Rules Engine) ---")
r = requests.post(f"{BASE}/api/eligibility/evaluate", json={"scheme_id": "all", "language": "kn"})
assert r.status_code == 200
eval_res = r.json()["results"]
for er in eval_res:
    print(f"  Scheme [{er['scheme_id']}]: Eligible = {er['eligible']}")
    print(f"    Decision source: {er['decision_source']}")
    print(f"    Warm explanation (Kn): {er['warm_explanation'][:40]}...")
# Assert rules: Ramesh is eligible for ration_card, health_cover, child_scholarship; NOT eligible for pension (age 32 < 65)
assert next(x for x in eval_res if x["scheme_id"] == "ration_card")["eligible"] is True
assert next(x for x in eval_res if x["scheme_id"] == "health_cover")["eligible"] is True
assert next(x for x in eval_res if x["scheme_id"] == "child_scholarship")["eligible"] is True
assert next(x for x in eval_res if x["scheme_id"] == "pension")["eligible"] is False
print("✓ Pure Rules Engine evaluations match all criteria precisely!")

print("\n--- 7. Testing POST /api/consent/log ---")
consent_payload = {
    "doc_type": "income_certificate",
    "doc_title_en": "Revenue Dept Income Certificate",
    "doc_title_kn": "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ",
    "scheme_id": "ration_card",
    "scheme_name_en": "Karnataka Ahara BPL Ration Card",
    "scheme_name_kn": "ಕರ್ನಾಟಕ ಆಹಾರ ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ",
    "purpose_en": "To confirm family income under ₹1.44 Lakh for BPL category",
    "purpose_kn": "ಬಿಪಿಎಲ್ ಮಿತಿಯಲ್ಲಿ ಆದಾಯ ದೃಢೀಕರಿಸಲು",
    "status": "ALLOWED"
}
r = requests.post(f"{BASE}/api/consent/log", json=consent_payload)
assert r.status_code == 200
log_entry = r.json()["audit_entry"]
audit_id = log_entry["id"]
print(f"✓ Consent logged with ID: {audit_id}, Status: {log_entry['status']}")

print("\n--- 8. Testing POST /api/forms/prefill ---")
prefill_payload = {
    "scheme_id": "ration_card",
    "consented_docs": ["aadhaar_card", "income_certificate", "address_proof"]
}
r = requests.post(f"{BASE}/api/forms/prefill", json=prefill_payload)
assert r.status_code == 200
prefilled = r.json()
print(f"✓ Form prefilled: {prefilled['form_title_en']}, Fields count: {len(prefilled['prefilled_fields'])}")
for f in prefilled['prefilled_fields'][:3]:
    print(f"  Field: {f['label_en']} = '{f['value']}' (Source: {f['source_label_en']})")

print("\n--- 9. Testing POST /api/forms/submit ---")
submit_payload = {
    "scheme_id": "ration_card",
    "form_data": {"applicant_name": "Ramesh Naik", "income": 144000},
    "language": "kn"
}
r = requests.post(f"{BASE}/api/forms/submit", json=submit_payload)
assert r.status_code == 200
submit_res = r.json()
assert submit_res["status"] == "SUBMITTED"
print(f"✓ Application submitted: Ref #{submit_res['acknowledgement_id']}")
print(f"  Acknowledgement message: {submit_res['submission_message']}")

print("\n--- 10. Testing POST /api/consent/revoke ---")
r = requests.post(f"{BASE}/api/consent/revoke", json={"audit_id": audit_id})
assert r.status_code == 200
revoked_res = r.json()["revoked_entry"]
assert revoked_res["status"] == "REVOKED"
print(f"✓ Consent revoked successfully! Audit record status: {revoked_res['status']}, Revoked At: {revoked_res['revoked_at']}")

print("\n=======================================================")
print(" ALL 10 E2E API VERIFICATIONS PASSED WITH ZERO ERRORS! ")
print("=======================================================")
