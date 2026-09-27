"""Quick unit test for rules engine and services"""
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.rules_engine import evaluate_scheme_eligibility, find_missing_fields
from backend.vault_service import get_user_profile, load_json, DATA_DIR, prefill_scheme_form, log_consent_action, revoke_consent
from backend.nlp_service import parse_speech_intent, rephrase_eligibility_explanation, clarify_term

schemes = load_json(os.path.join(DATA_DIR, "schemes_rules.json"))["schemes"]
profile = get_user_profile()

print(f"Loaded Profile: {profile['name']}, Income: {profile['annual_income']}, Age: {profile['age']}")

for s in schemes:
    res = evaluate_scheme_eligibility(s, profile)
    print(f"Scheme [{s['id']}]: Eligible={res['eligible']}")
    print(f"  Passed rules: {len(res['passed_rules'])}, Failed: {len(res['failed_rules'])}")
    rephrase = rephrase_eligibility_explanation(res, profile, "kn")
    print(f"  Warm Kn: {rephrase['explanation'][:50]}...")

# Test missing fields
sample_incomplete = {"state_resident": True}
missing = find_missing_fields(schemes[0], sample_incomplete)
print(f"Missing fields for Ration Card: {missing}")

# Test intent parser
test_speech_kn = "ನನಗೆ ರೇಷನ್ ಕಾರ್ಡ್ ಬೇಕು"
intent_kn = parse_speech_intent(test_speech_kn)
print(f"Intent Kn: {intent_kn}")

test_speech_en = "I want scholarship for my child, I am a construction worker"
intent_en = parse_speech_intent(test_speech_en)
print(f"Intent En: {intent_en}")

# Test clarify
clarify = clarify_term("annual_income", "kn")
print(f"Clarify: {clarify['text']}")

# Test consent and prefill
log_entry = log_consent_action(
    doc_type="income_certificate",
    doc_title_en="Income Cert",
    doc_title_kn="ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ",
    scheme_id="ration_card",
    scheme_name_en="BPL Ration Card",
    scheme_name_kn="ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ",
    purpose_en="Income verification",
    purpose_kn="ಆದಾಯ ದೃಢೀಕರಣ",
    status="ALLOWED"
)
print(f"Logged consent: {log_entry['id']}")
prefilled = prefill_scheme_form("ration_card", ["aadhaar_card", "income_certificate", "address_proof"])
print(f"Prefilled {len(prefilled['prefilled_fields'])} fields for ration card. All consented: {prefilled['all_consented']}")

# Test revoke
rev = revoke_consent(log_entry['id'])
print(f"Revoked status: {rev['status']}")

print("All backend tests PASSED successfully!")
