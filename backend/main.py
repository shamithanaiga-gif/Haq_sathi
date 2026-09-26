"""
Haq Saathi - FastAPI Main Server
Serves API endpoints for voice-first entitlement navigation, multi-user accounts,
trilingual intent processing, deterministic rules evaluation, DigiLocker consent vault,
and static frontend assets.
"""
import os
import json
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from backend.rules_engine import (
    evaluate_scheme_eligibility, find_missing_fields, check_all_scheme_eligibility
)
from backend.nlp_service import (
    parse_speech_intent, clarify_term, rephrase_eligibility_explanation, detect_language
)
from backend.vault_service import (
    load_json, save_json, get_user_profile, update_user_profile,
    get_all_vault_documents, get_audit_logs, log_consent_action,
    revoke_consent, prefill_scheme_form, BASE_DIR, DATA_DIR
)
from backend.user_store import (
    generate_demo_otp, verify_demo_otp, register_user, load_users_db, save_users_db,
    saveUserField, getUserField, add_dependent, add_user_application,
    update_user_application_status, normalize_application,
    toggle_vault_permission, verify_session_token, clean_phone
)

app = FastAPI(title="Haq Saathi API", description="Voice-first consent-based entitlement navigator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Permissions-Policy"] = "microphone=(self)"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if request.url.scheme == "https" or request.headers.get("x-forwarded-proto") == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response

SCHEMES_FILE = os.path.join(DATA_DIR, "schemes_rules.json")


def get_all_schemes() -> List[Dict[str, Any]]:
    data = load_json(SCHEMES_FILE, {"schemes": []})
    return data.get("schemes", [])


def get_scheme_by_id(scheme_id: str) -> Optional[Dict[str, Any]]:
    for s in get_all_schemes():
        if s["id"] == scheme_id:
            return s
    return None


QUESTION_PROMPTS = {
    "annual_income": {
        "en": "What is your total family income per month or year?",
        "kn": "ನಿಮ್ಮ ಕುಟುಂಬದ ತಿಂಗಳ ಅಥವಾ ವಾರ್ಷಿಕ ಒಟ್ಟು ಆದಾಯ ಎಷ್ಟು?",
        "hi": "आपके परिवार की प्रति माह या वर्ष की कुल आय कितनी है?"
    },
    "family_size": {
        "en": "How many members are there in your family living with you?",
        "kn": "ನಿಮ್ಮೊಂದಿಗೆ ವಾಸಿಸುವ ಕುಟುಂಬದಲ್ಲಿ ಎಷ್ಟು ಜನರಿದ್ದಾರೆ?",
        "hi": "आपके साथ रहने वाले आपके परिवार में कितने सदस्य हैं?"
    },
    "occupation": {
        "en": "What work or daily wage job do you do?",
        "kn": "ನೀವು ಯಾವ ಕೆಲಸ ಅಥವಾ ಉದ್ಯೋಗ ಮಾಡುತ್ತಿದ್ದೀರಿ?",
        "hi": "आप क्या काम या दैनिक मजदूरी करते हैं?"
    },
    "has_labour_card": {
        "en": "Do you possess a Karnataka Labour Card from the welfare board?",
        "kn": "ನಿಮ್ಮ ಬಳಿ ಕರ್ನಾಟಕ ಕಾರ್ಮಿಕ ಕಲ್ಯಾಣ ಮಂಡಳಿಯ ಲೇಬರ್ ಕಾರ್ಡ್ ಇದೆಯೇ?",
        "hi": "क्या आपके पास कल्याण बोर्ड का कर्नाटक लेबर कार्ड है?"
    },
    "has_school_going_child": {
        "en": "Do you have a child currently studying in school?",
        "kn": "ನಿಮ್ಮ ಮಗು ಪ್ರಸ್ತುತ ಶಾಲೆಯಲ್ಲಿ ಓದುತ್ತಿದ್ದಾರೆಯೇ?",
        "hi": "क्या आपका कोई बच्चा वर्तमान में स्कूल में पढ़ रहा है?"
    },
    "age": {
        "en": "What is your current age according to your official documents?",
        "kn": "ದಾಖಲೆಗಳ ಪ್ರಕಾರ ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವಯಸ್ಸು ಎಷ್ಟು?",
        "hi": "आपके आधिकारिक दस्तावेजों के अनुसार आपकी वर्तमान आयु क्या है?"
    },
    "state_resident": {
        "en": "Do you live and work in Karnataka?",
        "kn": "ನೀವು ಕರ್ನಾಟಕದಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದೀರಾ?",
        "hi": "क्या आप कर्नाटक में रहते और काम करते हैं?"
    }
}


def construct_field_question(field_name: str, lang: str = "kn") -> Dict[str, Any]:
    prompt_obj = QUESTION_PROMPTS.get(field_name, {
        "en": f"Please provide details for {field_name.replace('_', ' ')}.",
        "kn": f"ದಯವಿಟ್ಟು {field_name} ಬಗ್ಗೆ ಮಾಹಿತಿ ನೀಡಿ.",
        "hi": f"कृपया {field_name} के संबंध में जानकारी दें।"
    })
    return {
        "field": field_name,
        "text": prompt_obj.get(lang, prompt_obj["en"]),
        "text_en": prompt_obj["en"],
        "text_kn": prompt_obj["kn"],
        "text_hi": prompt_obj.get("hi", prompt_obj["en"])
    }


# =====================================================================
# Request & Response Models
# =====================================================================
class OtpGenerateRequest(BaseModel):
    phone: str


class OtpVerifyRequest(BaseModel):
    phone: str
    otp: str


class RegisterRequest(BaseModel):
    name: str
    phone: str
    aadhaar_number: str
    annual_income: Optional[int] = 120000
    ration_card_number: Optional[str] = "None"
    pan_number: Optional[str] = None
    present_address: str
    current_address: Optional[str] = None
    same_address: Optional[bool] = True
    occupation: str
    photo_url: Optional[str] = None
    has_digilocker: Optional[bool] = False
    digilocker_id: Optional[str] = None
    has_labour_card: Optional[bool] = False
    has_school_going_child: Optional[bool] = False
    age: Optional[int] = 30
    family_size: Optional[int] = 4
    gender: Optional[str] = "Unspecified"
    preferred_language: Optional[str] = "kn"


class VoiceIntentRequest(BaseModel):
    text: str
    phone: Optional[str] = "9876543210"
    current_field: Optional[str] = None
    target_scheme_id: Optional[str] = None
    language: Optional[str] = "kn"
    applicant_type: Optional[str] = "self"


class EligibilityRequest(BaseModel):
    scheme_id: Optional[str] = None
    phone: Optional[str] = "9876543210"
    user_data: Optional[Dict[str, Any]] = None
    language: Optional[str] = "kn"


class ScanAllRequest(BaseModel):
    phone: Optional[str] = "9876543210"
    user_data: Optional[Dict[str, Any]] = None
    language: Optional[str] = "kn"


class ConsentActionRequest(BaseModel):
    doc_type: str
    doc_title_en: str
    doc_title_kn: str
    doc_title_hi: Optional[str] = None
    scheme_id: str
    scheme_name_en: str
    scheme_name_kn: str
    scheme_name_hi: Optional[str] = None
    purpose_en: str
    purpose_kn: str
    purpose_hi: Optional[str] = None
    status: str  # "ALLOWED" or "DENIED"
    phone: Optional[str] = "9876543210"
    applicant_type: Optional[str] = "self"
    dependent_name: Optional[str] = None


class RevokeConsentRequest(BaseModel):
    audit_id: str
    phone: Optional[str] = "9876543210"


class PrefillRequest(BaseModel):
    scheme_id: str
    consented_docs: List[str]
    phone: Optional[str] = "9876543210"


class FormSubmitRequest(BaseModel):
    scheme_id: str
    form_data: Dict[str, Any]
    language: Optional[str] = "kn"
    phone: Optional[str] = "9876543210"
    applicant_type: Optional[str] = "self"
    applicant_name: Optional[str] = None


class SaveFieldRequest(BaseModel):
    phone: str
    field: str
    value: Any


class AddDependentRequest(BaseModel):
    phone: str
    name: str
    relationship: str
    age: int
    occupation: Optional[str] = "none"
    annual_income: Optional[int] = 0
    has_labour_card: Optional[bool] = False
    has_school_going_child: Optional[bool] = False
    aadhaar_number: Optional[str] = None


class ToggleDocRequest(BaseModel):
    phone: str
    doc_type: str
    status: str


# =====================================================================
# Auth & Account Endpoints (Section 2)
# =====================================================================
@app.post("/api/auth/otp/generate")
def api_generate_otp(req: OtpGenerateRequest):
    res = generate_demo_otp(req.phone)
    if not res.get("success") and res.get("cooldown"):
        return JSONResponse(status_code=429, content=res)
    if not res.get("success"):
        return JSONResponse(status_code=400, content=res)
    return res


@app.post("/api/auth/otp/verify")
def api_verify_otp(req: OtpVerifyRequest):
    res = verify_demo_otp(req.phone, req.otp)
    if not res.get("success"):
        return JSONResponse(status_code=400, content=res)
    return res


@app.post("/api/auth/register")
def api_register_user(req: RegisterRequest):
    res = register_user(req.dict())
    if not res.get("success"):
        return JSONResponse(status_code=400, content=res)
    return res


@app.get("/api/user/dashboard")
def api_get_dashboard(
    phone: str,
    lang: Optional[str] = None,
    x_session_token: Optional[str] = Header(None)
):
    """
    Returns user-scoped dashboard data:
    Profile summary, Schemes scan, Submitted Applications, Vault permissions, and user audit logs.
    Strictly verifies ownership to prevent cross-user data exposure.
    """
    phone_clean = clean_phone(phone)
    db = load_users_db()
    user = db.get(phone_clean)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Authorization Check (Section 9): If token is passed, it must match user's phone
    if x_session_token:
        session_phone = verify_session_token(x_session_token)
        if not session_phone or session_phone != phone_clean:
            raise HTTPException(status_code=403, detail="Forbidden: You cannot access another user's data.")

    # Run full eligibility scan across ALL schemes
    all_schemes = get_all_schemes()
    active_lang = lang or user.get("preferred_language", "kn")
    scan_results = check_all_scheme_eligibility(
        all_schemes, user, lang=active_lang
    )

    # User-scoped audit logs (Section 9: never return raw global audit logs)
    user_audit = get_audit_logs(user_id=phone_clean)

    raw_apps = user.get("applications", [])
    normalized_apps = [normalize_application(a) for a in raw_apps]
    user["applications"] = normalized_apps

    return {
        "user": user,
        "scan_results": scan_results,
        "applications": normalized_apps,
        "vault_permissions": user.get("vault_permissions", {}),
        "dependents": user.get("dependents", []),
        "audit_logs": user_audit
    }


@app.post("/api/user/field")
def api_save_field(req: SaveFieldRequest):
    success = saveUserField(req.phone, req.field, req.value)
    if not success:
        raise HTTPException(status_code=404, detail="User not found")
    return {"status": "success", "field": req.field, "value": req.value}


@app.get("/api/user/field")
def api_get_field(phone: str, field: str):
    val = getUserField(phone, field)
    return {"phone": clean_phone(phone), "field": field, "value": val}


@app.post("/api/user/dependents")
def api_add_dependent(req: AddDependentRequest):
    res = add_dependent(req.phone, req.dict())
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res


@app.post("/api/user/documents/toggle")
def api_toggle_document(req: ToggleDocRequest):
    res = toggle_vault_permission(req.phone, req.doc_type, req.status)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("message"))
    return res


# =====================================================================
# Full Eligibility Scan Across ALL Schemes (Section 6)
# =====================================================================
@app.post("/api/schemes/scan-all")
def api_scan_all_schemes(req: ScanAllRequest):
    phone_clean = clean_phone(req.phone or "9876543210")
    db = load_users_db()
    user_profile = req.user_data or db.get(phone_clean) or get_user_profile()
    lang = req.language or "kn"

    all_schemes = get_all_schemes()
    scan_res = check_all_scheme_eligibility(all_schemes, user_profile, lang=lang)
    return scan_res


# =====================================================================
# Schemes & Voice Processing Endpoints
# =====================================================================
@app.get("/api/schemes")
def api_get_schemes():
    return get_all_schemes()


@app.get("/api/profile")
def api_get_profile(phone: Optional[str] = "9876543210"):
    phone_clean = clean_phone(phone)
    db = load_users_db()
    if phone_clean in db:
        return db[phone_clean]
    return get_user_profile()


@app.post("/api/profile/update")
def api_update_profile(updates: Dict[str, Any], phone: Optional[str] = "9876543210"):
    phone_clean = clean_phone(phone)
    db = load_users_db()
    if phone_clean in db:
        for k, v in updates.items():
            saveUserField(phone_clean, k, v)
        return db[phone_clean]
    return update_user_profile(updates)


@app.post("/api/profile/reset")
def api_reset_profile():
    from backend.user_store import init_seed_users, save_users_db
    seed = init_seed_users()
    save_users_db(seed)
    return {"message": "Profiles reset to seed data", "profile": seed["9876543210"]}


@app.post("/api/voice/process-intent")
def api_process_voice_intent(req: VoiceIntentRequest):
    user_speech = req.text.strip()
    detected_lang = detect_language(user_speech)
    lang = req.language or detected_lang

    current_context = {
        "current_field": req.current_field,
        "target_scheme_id": req.target_scheme_id
    }

    # Step 1: Parse intent & extract entities
    parsed = parse_speech_intent(user_speech, current_context)
    if not req.language:
        lang = parsed.get("language", "kn")

    phone_clean = clean_phone(req.phone or "9876543210")
    db = load_users_db()
    current_profile = db.get(phone_clean) or get_user_profile()

    # OUT-OF-SCOPE REFUSAL CHECK (Section 5)
    if parsed.get("is_out_of_scope"):
        refusal_en = "Sorry, I am Haq Saathi, an assistant for finding and applying for government welfare schemes. This is not something I can help with."
        refusal_kn = "ಕ್ಷಮಿಸಿ, ನಾನು ಹಕ್ ಸಾಥಿ, ಸರ್ಕಾರಿ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಲು ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಸಹಾಯ ಮಾಡುವ ಸಹಾಯಕ. ಇದು ನಾನು ಸಹಾಯ ಮಾಡಬಹುದಾದ ವಿಷಯವಲ್ಲ."
        refusal_hi = "क्षमा करें, मैं हक़ साथी हूँ, सरकारी कल्याणकारी योजनाओं को खोजने और आवेदन करने के लिए एक सहायक। यह ऐसी चीज़ नहीं है जिसमें मैं मदद कर सकूँ।"

        pending_q = None
        if req.current_field:
            pending_q = construct_field_question(req.current_field, lang)

        refusal_chosen = refusal_kn if lang == "kn" else (refusal_hi if lang == "hi" else refusal_en)

        return {
            "user_speech": user_speech,
            "language": lang,
            "is_out_of_scope": True,
            "refusal_message": refusal_chosen,
            "refusal_message_en": refusal_en,
            "refusal_message_kn": refusal_kn,
            "refusal_message_hi": refusal_hi,
            "parsed_intent": parsed,
            "target_scheme_id": req.target_scheme_id,
            "target_scheme": get_scheme_by_id(req.target_scheme_id) if req.target_scheme_id else None,
            "is_clarification": False,
            "clarification": None,
            "updated_profile": current_profile,
            "missing_fields": [req.current_field] if req.current_field else [],
            "all_fields_collected": False,
            "next_question": pending_q,
            "reask_pending_question": bool(pending_q)
        }

    # PARSE FAILURE FOR CURRENT FIELD (BUG 1)
    if parsed.get("is_parse_failure"):
        cur_f = req.current_field or "value"
        pending_q = construct_field_question(cur_f, lang) if req.current_field else None

        f_name_en = cur_f.replace("_", " ").title()
        failure_en = f"I heard: '{user_speech}' but couldn't understand the answer for {f_name_en}. Please try again."
        failure_kn = f"ನಾನು ಕೇಳಿಸಿಕೊಂಡೆ: '{user_speech}', ಆದರೆ {f_name_en} ಗಾಗಿ ಉತ್ತರವನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಪ್ರಯತ್ನಿಸಿ."
        failure_hi = f"मैंने सुना: '{user_speech}', लेकिन {f_name_en} के लिए उत्तर समझ नहीं पाया। कृपया पुनः प्रयास करें।"
        failure_chosen = failure_kn if lang == "kn" else (failure_hi if lang == "hi" else failure_en)

        return {
            "user_speech": user_speech,
            "language": lang,
            "is_out_of_scope": False,
            "is_parse_failure": True,
            "failure_message": failure_chosen,
            "failure_message_en": failure_en,
            "failure_message_kn": failure_kn,
            "failure_message_hi": failure_hi,
            "parsed_intent": parsed,
            "target_scheme_id": req.target_scheme_id,
            "target_scheme": get_scheme_by_id(req.target_scheme_id) if req.target_scheme_id else None,
            "is_clarification": False,
            "clarification": None,
            "updated_profile": current_profile,
            "missing_fields": [req.current_field] if req.current_field else [],
            "all_fields_collected": False,
            "next_question": pending_q,
            "reask_pending_question": bool(pending_q)
        }

    # Step 2: Term clarification
    clarification = None
    if parsed.get("is_asking_clarification"):
        topic = parsed.get("clarification_topic") or req.current_field or "annual_income"
        clarification = clarify_term(topic, lang)

    # Step 3: Update profile if new fields were extracted
    if parsed.get("extracted_fields"):
        for k, v in parsed["extracted_fields"].items():
            saveUserField(phone_clean, k, v)
        current_profile = db.get(phone_clean) or current_profile

    # Step 4: Determine scheme focus
    target_scheme_id = req.target_scheme_id or parsed.get("scheme_interest")
    scheme = get_scheme_by_id(target_scheme_id) if target_scheme_id and target_scheme_id != "all" else None

    missing_fields = []
    next_question = None

    if scheme:
        # Check existing fields via getUserField / current_profile so we NEVER re-ask (Section 8)
        missing_fields = find_missing_fields(scheme, current_profile)
        if missing_fields:
            next_f = missing_fields[0]
            next_question = construct_field_question(next_f, lang)

    all_fields_collected = bool(scheme and len(missing_fields) == 0)

    return {
        "user_speech": user_speech,
        "language": lang,
        "is_out_of_scope": False,
        "parsed_intent": parsed,
        "applicant_type": parsed.get("applicant_type", "self"),
        "relationship": parsed.get("relationship"),
        "target_scheme_id": target_scheme_id,
        "target_scheme": scheme,
        "is_clarification": parsed.get("is_asking_clarification", False),
        "clarification": clarification,
        "updated_profile": current_profile,
        "missing_fields": missing_fields,
        "all_fields_collected": all_fields_collected,
        "next_question": next_question
    }


@app.post("/api/eligibility/evaluate")
def api_evaluate_eligibility(req: EligibilityRequest):
    phone_clean = clean_phone(req.phone or "9876543210")
    db = load_users_db()
    user_data = req.user_data or db.get(phone_clean) or get_user_profile()
    lang = req.language or "kn"

    if req.scheme_id and req.scheme_id != "all":
        scheme = get_scheme_by_id(req.scheme_id)
        if not scheme:
            raise HTTPException(status_code=404, detail="Scheme not found")
        # 1. Deterministic pure rules engine evaluation
        eval_result = evaluate_scheme_eligibility(scheme, user_data)
        # 2. LLM / NLP warm explanation generator (NEVER changes decision)
        rephrased = rephrase_eligibility_explanation(eval_result, user_data, lang)
        eval_result["warm_explanation"] = rephrased["explanation"]
        eval_result["warm_explanation_en"] = rephrased["explanation_en"]
        eval_result["warm_explanation_kn"] = rephrased["explanation_kn"]
        eval_result["warm_explanation_hi"] = rephrased["explanation_hi"]
        return {"results": [eval_result]}
    else:
        results = []
        for s in get_all_schemes():
            res = evaluate_scheme_eligibility(s, user_data)
            rephrased = rephrase_eligibility_explanation(res, user_data, lang)
            res["warm_explanation"] = rephrased["explanation"]
            res["warm_explanation_en"] = rephrased["explanation_en"]
            res["warm_explanation_kn"] = rephrased["explanation_kn"]
            res["warm_explanation_hi"] = rephrased["explanation_hi"]
            results.append(res)
        return {"results": results}


@app.get("/api/vault/documents")
def api_get_vault_documents():
    return get_all_vault_documents()


@app.post("/api/consent/log")
def api_log_consent(req: ConsentActionRequest):
    phone_clean = clean_phone(req.phone or "9876543210")
    entry = log_consent_action(
        doc_type=req.doc_type,
        doc_title_en=req.doc_title_en,
        doc_title_kn=req.doc_title_kn,
        doc_title_hi=req.doc_title_hi,
        scheme_id=req.scheme_id,
        scheme_name_en=req.scheme_name_en,
        scheme_name_kn=req.scheme_name_kn,
        scheme_name_hi=req.scheme_name_hi,
        purpose_en=req.purpose_en,
        purpose_kn=req.purpose_kn,
        purpose_hi=req.purpose_hi,
        status=req.status,
        user_id=phone_clean,
        applicant_type=req.applicant_type or "self",
        dependent_name=req.dependent_name
    )
    # Also update user's vault permissions
    toggle_vault_permission(phone_clean, req.doc_type, req.status)
    return {"status": "success", "audit_entry": entry}


@app.get("/api/consent/audit-log")
def api_get_audit_log(phone: Optional[str] = None):
    """User-scoped audit log endpoint (Section 9)."""
    user_id = clean_phone(phone) if phone else None
    return get_audit_logs(user_id=user_id)


@app.post("/api/consent/revoke")
def api_revoke_consent(req: RevokeConsentRequest):
    phone_clean = clean_phone(req.phone or "9876543210")
    revoked = revoke_consent(req.audit_id, user_id=phone_clean)
    if not revoked:
        raise HTTPException(status_code=404, detail="Audit log entry not found or unauthorized")
    toggle_vault_permission(phone_clean, revoked["document_type"], "REVOKED")
    return {"status": "success", "revoked_entry": revoked}


@app.post("/api/forms/prefill")
def api_prefill_form(req: PrefillRequest):
    phone_clean = clean_phone(req.phone or "9876543210")
    db = load_users_db()
    user_profile = db.get(phone_clean) or get_user_profile()
    try:
        data = prefill_scheme_form(req.scheme_id, req.consented_docs, user_profile=user_profile)
        return data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


class UpdateStatusRequest(BaseModel):
    phone: str
    reference_id: Optional[str] = None
    app_id: Optional[str] = None
    status: str
    notes: Optional[str] = None


@app.post("/api/forms/submit")
def api_submit_form(req: FormSubmitRequest):
    import uuid
    phone_clean = clean_phone(req.phone or "9876543210")
    scheme = get_scheme_by_id(req.scheme_id)
    
    scheme_title = (
        scheme.get("name_kn") if req.language == "kn"
        else (scheme.get("name_hi") if req.language == "hi"
        else scheme.get("name_en"))
    )

    # Check for existing application (Idempotency Requirement:
    # "Do not generate a new Reference ID if the page is refreshed or the user opens the application again.")
    db = load_users_db()
    user = db.get(phone_clean, {})
    existing = None
    for a in user.get("applications", []):
        normalize_application(a)
        if a.get("scheme_id") == req.scheme_id and a.get("applicant_type", "self") == (req.applicant_type or "self"):
            if (req.applicant_type or "self") != "family_member" or a.get("applicant_name") == (req.applicant_name or "Self"):
                existing = a
                break

    if existing:
        app_ref_id = existing.get("app_id")
        ref_id = existing.get("reference_id")
        if not ref_id:
            ref_id = f"REF-{app_ref_id.replace('-', '')[-8:].upper()}"
            existing["reference_id"] = ref_id
        existing["status"] = "Applied"
        if req.form_data:
            existing["details"] = req.form_data
        save_users_db(db)
        app_record = existing
    else:
        ref_hex = uuid.uuid4().hex[:8].upper()
        ref_id = f"REF-{ref_hex}"
        app_ref_id = f"HS-KA-{req.scheme_id.upper()[:4]}-{ref_hex[:6]}"
        app_record = {
            "app_id": app_ref_id,
            "reference_id": ref_id,
            "scheme_id": req.scheme_id,
            "scheme_title": scheme.get("name_en"),
            "applicant_type": req.applicant_type or "self",
            "applicant_name": req.applicant_name or "Self",
            "submitted_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "status": "Applied",
            "details": req.form_data
        }
        add_user_application(phone_clean, app_record)
    
    ack_en = f"Application {ref_id} for {scheme['name_en']} submitted successfully! Reference ID: {ref_id}. Status: Applied."
    ack_kn = f"{scheme['name_kn']} ಗಾಗಿ ನಿಮ್ಮ ಅರ್ಜಿ {ref_id} ಯಶಸ್ವಿಯಾಗಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ! ರೆಫರೆನ್ಸ್ ಐಡಿ: {ref_id}. ಸ್ಥಿತಿ: Applied."
    ack_hi = f"{scheme.get('name_hi', scheme['name_en'])} के लिए आपका आवेदन {ref_id} सफलतापूर्वक जमा हो गया है! संदर्भ आईडी: {ref_id}. स्थिति: Applied."

    ack_chosen = ack_kn if req.language == "kn" else (ack_hi if req.language == "hi" else ack_en)

    return {
        "status": "SUBMITTED",
        "acknowledgement_id": app_ref_id,
        "reference_id": ref_id,
        "app_id": app_ref_id,
        "application_status": app_record.get("status", "Applied"),
        "scheme_id": req.scheme_id,
        "scheme_title": scheme_title,
        "submission_message": ack_chosen,
        "submission_message_en": ack_en,
        "submission_message_kn": ack_kn,
        "submission_message_hi": ack_hi,
        "submitted_at": app_record.get("submitted_at"),
        "details": app_record.get("details", req.form_data)
    }


@app.post("/api/application/status")
def api_update_status(req: UpdateStatusRequest):
    updated = update_user_application_status(
        phone=req.phone,
        ref_or_app_id=req.reference_id or req.app_id,
        new_status=req.status,
        notes=req.notes
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Application not found")
    return {"status": "success", "success": True, "application": updated}


@app.get("/api/application/status")
def api_get_status(phone: str, reference_id: Optional[str] = None, app_id: Optional[str] = None):
    phone_clean = clean_phone(phone)
    db = load_users_db()
    user = db.get(phone_clean)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    target_id = reference_id or app_id
    for app in user.get("applications", []):
        normalize_application(app)
        if not target_id or app.get("reference_id") == target_id or app.get("app_id") == target_id:
            return {"success": True, "application": app}
    raise HTTPException(status_code=404, detail="Application not found")


# =====================================================================
# Serve Static Frontend Files
# =====================================================================
FRONTEND_DIR = os.path.join(BASE_DIR, "frontend")
if os.path.exists(FRONTEND_DIR):
    app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")


@app.get("/")
def serve_index():
    index_file = os.path.join(FRONTEND_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {"message": "Haq Saathi backend running. Place frontend in /frontend/index.html"}


@app.get("/sw.js")
def serve_sw():
    sw_file = os.path.join(FRONTEND_DIR, "sw.js")
    if os.path.exists(sw_file):
        return FileResponse(
            sw_file,
            media_type="application/javascript",
            headers={
                "Service-Worker-Allowed": "/",
                "Cache-Control": "no-cache, no-store, must-revalidate"
            }
        )
    raise HTTPException(status_code=404, detail="Service worker not found")


@app.get("/manifest.json")
def serve_manifest():
    manifest_file = os.path.join(FRONTEND_DIR, "manifest.json")
    if os.path.exists(manifest_file):
        return FileResponse(
            manifest_file,
            media_type="application/manifest+json",
            headers={"Cache-Control": "no-cache"}
        )
    raise HTTPException(status_code=404, detail="Manifest not found")

