"""
Haq Saathi - Multi-User Store, Authentication & Data Isolation Engine
Handles user accounts, masked identity verification, demo OTP lifecycle,
proxy dependent records, and strict per-user data access guards.
"""
import os
import json
import time
import re
import uuid
from typing import Dict, Any, List, Optional, Tuple

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
USERS_DB_FILE = os.path.join(DATA_DIR, "users_db.json")

# In-memory OTP storage for demo: { phone: { "otp": "123456", "created_at": float, "attempts": int } }
OTP_STORE: Dict[str, Dict[str, Any]] = {}
OTP_EXPIRY_SECONDS = 300  # 5 minutes
OTP_COOLDOWN_SECONDS = 30  # 30 seconds between resends
MAX_OTP_ATTEMPTS = 5

# Session tokens: { token: { "phone": str, "created_at": float } }
SESSIONS_FILE = os.path.join(DATA_DIR, "active_sessions.json")
ACTIVE_SESSIONS: Dict[str, Dict[str, Any]] = {}


def load_sessions() -> Dict[str, Dict[str, Any]]:
    if not os.path.exists(SESSIONS_FILE):
        return {}
    try:
        with open(SESSIONS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def save_sessions(sessions: Dict[str, Dict[str, Any]]) -> None:
    os.makedirs(os.path.dirname(SESSIONS_FILE), exist_ok=True)
    with open(SESSIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(sessions, f, indent=2, ensure_ascii=False)


def load_users_db() -> Dict[str, Any]:
    if not os.path.exists(USERS_DB_FILE):
        seed_users = init_seed_users()
        save_users_db(seed_users)
        return seed_users
    try:
        with open(USERS_DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return init_seed_users()


def save_users_db(data: Dict[str, Any]) -> None:
    os.makedirs(os.path.dirname(USERS_DB_FILE), exist_ok=True)
    with open(USERS_DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def mask_aadhaar(aadhaar: str) -> str:
    """Returns Aadhaar masked as 'XXXX XXXX 1234'."""
    clean = re.sub(r'[\s-]', '', str(aadhaar or ''))
    if len(clean) >= 4:
        last4 = clean[-4:]
        return f"XXXX XXXX {last4}"
    return "XXXX XXXX 1234"


def mask_pan(pan: str) -> str:
    """Returns PAN masked as 'XXXXX1234X'."""
    clean = re.sub(r'[\s-]', '', str(pan or '')).upper()
    if len(clean) == 10:
        return f"XXXXX{clean[5:9]}{clean[9]}"
    return "XXXXX1234X"


def validate_pan(pan: str) -> bool:
    """Format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)."""
    if not pan:
        return True  # Optional field
    clean = re.sub(r'[\s-]', '', str(pan)).upper()
    return bool(re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', clean))


def validate_phone(phone: str) -> bool:
    """Format: 10 digits."""
    clean = re.sub(r'[\s\-\+]', '', str(phone or ''))
    if clean.startswith('91') and len(clean) == 12:
        clean = clean[2:]
    return bool(re.match(r'^[6-9][0-9]{9}$', clean))


def clean_phone(phone: str) -> str:
    clean = re.sub(r'[\s\-\+]', '', str(phone or ''))
    if clean.startswith('91') and len(clean) == 12:
        clean = clean[2:]
    return clean


def init_seed_users() -> Dict[str, Any]:
    """Provides seed user Ramesh Naik for instant out-of-the-box demo testing."""
    return {
        "9876543210": {
            "phone": "9876543210",
            "name": "Ramesh Naik",
            "name_kn": "ರಮೇಶ್ ನಾಯ್ಕ್",
            "name_hi": "रमेश नायक",
            "age": 32,
            "family_size": 4,
            "gender": "Male",
            "aadhaar_masked": "XXXX XXXX 8912",
            "annual_income": 144000,
            "monthly_income": 12000,
            "ration_card_number": "KA-04-BPL-882194",
            "pan_number_masked": "XXXXX4412K",
            "present_address": "Kengeri Satellite Town, Bengaluru, Karnataka - 560060",
            "current_address": "Kengeri Satellite Town, Bengaluru, Karnataka - 560060",
            "native_district": "Kalaburagi",
            "current_city": "Bengaluru",
            "state": "Karnataka",
            "state_resident": True,
            "occupation": "construction_worker",
            "occupation_display": "Construction Labourer / Masonry Worker",
            "occupation_display_kn": "ಕಟ್ಟಡ ಕಾರ್ಮಿಕ",
            "occupation_display_hi": "भवन निर्माण मजदूर",
            "has_labour_card": True,
            "has_school_going_child": True,
            "has_digilocker": True,
            "digilocker_id": "DL-9876-RAMESH",
            "photo_url": "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23059669'/><text x='50' y='65' font-size='45' text-anchor='middle' fill='white'>RN</text></svg>",
            "dependents": [
                {
                    "id": "dep_father_01",
                    "relationship": "father",
                    "relationship_display": "Father (ತಂದೆ / पिता)",
                    "name": "Basappa Naik",
                    "age": 68,
                    "occupation": "retired_agricultural_worker",
                    "annual_income": 18000,
                    "has_labour_card": False,
                    "has_school_going_child": False,
                    "state_resident": True,
                    "aadhaar_masked": "XXXX XXXX 1954"
                }
            ],
            "applications": [
                {
                    "app_id": "HS-KA-RATI-9A4B12",
                    "scheme_id": "ration_card",
                    "scheme_title": "Karnataka Ahara BPL Ration Card (Priority Household)",
                    "applicant_type": "self",
                    "applicant_name": "Ramesh Naik",
                    "submitted_at": "2026-09-25T11:30:00Z",
                    "status": "Submitted (Prototype)",
                    "details": {
                        "annual_income": "₹1,44,000",
                        "fair_price_shop": "Kengeri FPS #42, Bengaluru West"
                    }
                }
            ],
            "vault_permissions": {
                "aadhaar_card": "ALLOWED",
                "income_certificate": "ALLOWED",
                "address_proof": "ALLOWED",
                "labour_card": "ALLOWED",
                "child_school_id": "ALLOWED",
                "bank_account_details": "ALLOWED"
            },
            "created_at": "2026-09-20T08:00:00Z",
            "last_login": "2026-09-26T12:00:00Z",
            "preferred_language": "kn"
        }
    }


# =====================================================================
# Centralized saveUserField and getUserField helpers (Section 8)
# =====================================================================
def saveUserField(phone: str, field: str, value: Any) -> bool:
    """Saves any field into the persistent per-user profile."""
    phone_clean = clean_phone(phone)
    db = load_users_db()
    if phone_clean not in db:
        return False
    user = db[phone_clean]
    
    # Specific handling for masked fields
    if field == "aadhaar_number":
        user["aadhaar_masked"] = mask_aadhaar(str(value))
    elif field == "pan_number":
        user["pan_number_masked"] = mask_pan(str(value))
    elif field == "monthly_income":
        try:
            val = int(value)
            user["monthly_income"] = val
            user["annual_income"] = val * 12
        except (ValueError, TypeError):
            user[field] = value
    elif field == "annual_income":
        try:
            val = int(value)
            user["annual_income"] = val
            user["monthly_income"] = val // 12
        except (ValueError, TypeError):
            user[field] = value
    else:
        user[field] = value
        
    save_users_db(db)
    return True


def getUserField(phone: str, field: str) -> Any:
    """Retrieves a field value from the user profile if known, else None."""
    phone_clean = clean_phone(phone)
    db = load_users_db()
    user = db.get(phone_clean)
    if not user:
        return None
    return user.get(field)


# =====================================================================
# Authentication & Demo OTP Flow (Section 2)
# =====================================================================
def generate_demo_otp(phone: str) -> Dict[str, Any]:
    """
    Generates a 6-digit random demo OTP.
    Enforces 30s resend cooldown.
    Returns status and demo banner message.
    """
    phone_clean = clean_phone(phone)
    if not validate_phone(phone_clean):
        return {"success": False, "message": "Invalid 10-digit phone number"}

    db = load_users_db()
    user_exists = phone_clean in db
    if not user_exists:
        return {
            "success": False,
            "user_exists": False,
            "message": "This phone number is not registered. Please tap 'Create New Account / Register' below to sign up.",
            "message_kn": "ಈ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿಲ್ಲ. ದಯವಿಟ್ಟು ಹೊಸ ಖಾತೆ ತೆರೆಯಲು 'ನೋಂದಾಯಿಸಿ' ಬಟನ್ ಒತ್ತಿರಿ.",
            "message_hi": "यह मोबाइल नंबर पंजीकृत नहीं है। कृपया नया खाता बनाने के लिए नीचे 'पंजीकरण करें' पर टैप करें।"
        }

    now = time.time()
    existing = OTP_STORE.get(phone_clean)

    if existing:
        time_elapsed = now - existing["created_at"]
        if time_elapsed < OTP_COOLDOWN_SECONDS:
            remaining = int(OTP_COOLDOWN_SECONDS - time_elapsed)
            return {
                "success": False,
                "cooldown": True,
                "remaining_seconds": remaining,
                "message": f"Please wait {remaining} seconds before requesting a new OTP."
            }

    import random
    otp = f"{random.randint(100000, 999999)}"
    OTP_STORE[phone_clean] = {
        "otp": otp,
        "created_at": now,
        "attempts": 0,
        "user_exists": user_exists
    }

    return {
        "success": True,
        "phone": phone_clean,
        "user_exists": user_exists,
        "demo_otp": otp,
        "banner_message": f"Demo Mode: Your OTP is {otp}",
        "banner_message_kn": f"ಡೆಮೋ ಮೋಡ್: ನಿಮ್ಮ OTP ಸಂಖ್ಯೆ {otp}",
        "banner_message_hi": f"डेमो मोड: आपका ओटीपी (OTP) है {otp}",
        "expires_in_seconds": OTP_EXPIRY_SECONDS,
        "cooldown_seconds": OTP_COOLDOWN_SECONDS
    }


def verify_demo_otp(phone: str, entered_otp: str) -> Dict[str, Any]:
    """
    Validates entered OTP against OTP_STORE with max 5 attempts.
    Issues session token on success.
    """
    phone_clean = clean_phone(phone)
    rec = OTP_STORE.get(phone_clean)

    if not rec:
        return {"success": False, "message": "No OTP found or expired. Please request a new OTP."}

    now = time.time()
    if (now - rec["created_at"]) > OTP_EXPIRY_SECONDS:
        del OTP_STORE[phone_clean]
        return {"success": False, "expired": True, "message": "OTP has expired. Please request a new one."}

    rec["attempts"] += 1
    if rec["attempts"] > MAX_OTP_ATTEMPTS:
        del OTP_STORE[phone_clean]
        return {"success": False, "max_attempts": True, "message": "Maximum 5 attempts exceeded. Please request a fresh OTP."}

    if entered_otp.strip() != rec["otp"]:
        attempts_left = MAX_OTP_ATTEMPTS - rec["attempts"]
        return {
            "success": False,
            "invalid": True,
            "attempts_left": attempts_left,
            "message": f"Incorrect OTP. {attempts_left} attempts remaining."
        }

    # OTP Verified!
    del OTP_STORE[phone_clean]
    db = load_users_db()
    user = db.get(phone_clean)

    if not user:
        return {
            "success": True,
            "user_exists": False,
            "redirect_to": "register",
            "phone": phone_clean,
            "message": "Phone number verified. Please complete 1-time registration."
        }

    token = f"tok_{uuid.uuid4().hex}"
    ACTIVE_SESSIONS[token] = {
        "phone": phone_clean,
        "created_at": now
    }
    save_sessions(ACTIVE_SESSIONS)
    user["last_login"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now))
    save_users_db(db)

    return {
        "success": True,
        "user_exists": True,
        "session_token": token,
        "user": user,
        "message": f"Welcome back, {user.get('name')}!"
    }


def verify_session_token(token: str) -> Optional[str]:
    """Returns phone number if session is valid, else None."""
    session = ACTIVE_SESSIONS.get(token)
    if not session:
        sessions = load_sessions()
        session = sessions.get(token)
        if session:
            ACTIVE_SESSIONS[token] = session
    if not session:
        return None
    return session.get("phone")


# =====================================================================
# Registration Flow (Section 2 & 8)
# =====================================================================
def register_user(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Registers a new user after validating 11 required/optional fields:
    Full Name, Phone (10 digits), Aadhaar (12 digits, masked), Annual Income,
    Ration Card No (optional), PAN (optional, format validated), Present Address,
    Current Address ("same as present"), Occupation, Photo (<=2MB), DigiLocker checkbox.
    """
    phone_clean = clean_phone(payload.get("phone", ""))
    if not validate_phone(phone_clean):
        return {"success": False, "field": "phone", "message": "Phone number must be a valid 10-digit mobile number."}

    name = str(payload.get("name", "")).strip()
    if not name or len(name) < 2:
        return {"success": False, "field": "name", "message": "Full Name is required."}

    aadhaar = str(payload.get("aadhaar_number", "")).strip()
    clean_aadhaar = re.sub(r'[\s-]', '', aadhaar)
    if len(clean_aadhaar) != 12 or not clean_aadhaar.isdigit():
        return {"success": False, "field": "aadhaar_number", "message": "Aadhaar must be a 12-digit number."}

    # PAN validation if provided
    pan_raw = payload.get("pan_number")
    pan = str(pan_raw).strip() if pan_raw and str(pan_raw).strip().lower() != "none" else ""
    if pan and not validate_pan(pan):
        return {"success": False, "field": "pan_number", "message": "Invalid PAN format. Standard format: ABCDE1234F."}

    # Photo validation (max 2MB)
    photo_url = payload.get("photo_url", "")
    if photo_url and len(photo_url) > 2.8 * 1024 * 1024:  # Base64 overhead for 2MB image
        return {"success": False, "field": "photo", "message": "Passport photo exceeds the 2MB limit."}

    if not photo_url:
        # Default avatar SVG
        initials = "".join([part[0].upper() for part in name.split()[:2]]) or "HS"
        photo_url = f"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23059669'/><text x='50' y='65' font-size='45' text-anchor='middle' fill='white'>{initials}</text></svg>"

    try:
        annual_income = int(payload.get("annual_income", 120000))
    except (ValueError, TypeError):
        annual_income = 120000

    present_addr = str(payload.get("present_address", "")).strip()
    current_addr = str(payload.get("current_address", "")).strip()
    if payload.get("same_address"):
        current_addr = present_addr

    occupation = str(payload.get("occupation", "construction_worker")).strip()

    # Determine Kannada/Hindi displays
    occ_map = {
        "construction_worker": ("ಕಟ್ಟಡ ಕಾರ್ಮಿಕ", "भवन निर्माण मजदूर"),
        "mason": ("ಗಾರೆ ಕೆಲಸಗಾರ", "राजमिस्त्री"),
        "carpenter": ("ಬಡಗಿ", "बढ़ई"),
        "driver": ("ಚಾಲಕ", "चालक"),
        "domestic_worker": ("ಮನೆ ಕೆಲಸಗಾರ", "घरेलू कामगार"),
        "street_vendor": ("ಬೀದಿ ವ್ಯಾಪಾರಿ", "फेरीवाला"),
        "agriculture_labourer": ("ಕೃಷಿ ಕಾರ್ಮಿಕ", "कृषि मजदूर")
    }
    occ_kn, occ_hi = occ_map.get(occupation.lower(), ("ಕಾರ್ಮಿಕ", "श्रमिक"))

    db = load_users_db()
    new_user = {
        "phone": phone_clean,
        "name": name,
        "name_kn": payload.get("name_kn") or name,
        "name_hi": payload.get("name_hi") or name,
        "age": int(payload.get("age", 30)),
        "family_size": int(payload.get("family_size", 4)),
        "gender": payload.get("gender", "Unspecified"),
        "aadhaar_masked": mask_aadhaar(clean_aadhaar),
        "annual_income": annual_income,
        "monthly_income": annual_income // 12,
        "ration_card_number": payload.get("ration_card_number") or "None",
        "pan_number_masked": mask_pan(pan) if pan else "None",
        "present_address": present_addr or "Karnataka, India",
        "current_address": current_addr or present_addr or "Karnataka, India",
        "state_resident": True,
        "state": "Karnataka",
        "occupation": occupation,
        "occupation_display": occupation.replace("_", " ").title(),
        "occupation_display_kn": occ_kn,
        "occupation_display_hi": occ_hi,
        "has_labour_card": bool(payload.get("has_labour_card", False)),
        "has_school_going_child": bool(payload.get("has_school_going_child", False)),
        "has_digilocker": bool(payload.get("has_digilocker", False)),
        "digilocker_id": payload.get("digilocker_id") if payload.get("has_digilocker") else None,
        "photo_url": photo_url,
        "dependents": [],
        "applications": [],
        "vault_permissions": {
            "aadhaar_card": "ALLOWED",
            "income_certificate": "ALLOWED",
            "address_proof": "ALLOWED",
            "labour_card": "ALLOWED" if payload.get("has_labour_card") else "REVOKED",
            "child_school_id": "ALLOWED" if payload.get("has_school_going_child") else "REVOKED",
            "bank_account_details": "ALLOWED"
        },
        "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "last_login": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "preferred_language": payload.get("preferred_language", "kn")
    }

    db[phone_clean] = new_user
    save_users_db(db)

    # Issue session token
    token = f"tok_{uuid.uuid4().hex}"
    ACTIVE_SESSIONS[token] = {
        "phone": phone_clean,
        "created_at": time.time()
    }
    save_sessions(ACTIVE_SESSIONS)

    return {
        "success": True,
        "session_token": token,
        "user": new_user,
        "message": "Registration successful! Welcome to Haq Saathi."
    }


# =====================================================================
# Dependents / Family Member (Proxy) Management (Section 7)
# =====================================================================
def add_dependent(phone: str, dependent_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Stores a separate dependent profile linked to the user's account.
    Never merged into the main user's own profile.
    """
    phone_clean = clean_phone(phone)
    db = load_users_db()
    user = db.get(phone_clean)
    if not user:
        return {"success": False, "message": "User not found"}

    dep_id = f"dep_{uuid.uuid4().hex[:6]}"
    name = str(dependent_data.get("name", "Dependent")).strip()
    rel = str(dependent_data.get("relationship", "family_member")).lower().strip()
    
    dep_profile = {
        "id": dep_id,
        "relationship": rel,
        "name": name,
        "age": int(dependent_data.get("age", 50)),
        "occupation": dependent_data.get("occupation", "none"),
        "annual_income": int(dependent_data.get("annual_income", 0)),
        "has_labour_card": bool(dependent_data.get("has_labour_card", False)),
        "has_school_going_child": bool(dependent_data.get("has_school_going_child", False)),
        "state_resident": bool(dependent_data.get("state_resident", True)),
        "aadhaar_masked": mask_aadhaar(str(dependent_data.get("aadhaar_number", ""))) if dependent_data.get("aadhaar_number") else "XXXX XXXX 0000"
    }

    if "dependents" not in user:
        user["dependents"] = []
    user["dependents"].append(dep_profile)
    save_users_db(db)

    return {"success": True, "dependent": dep_profile, "user": user}


# =====================================================================
# Applications & Vault Status Management
# =====================================================================
# Applications & Vault Status Management
# =====================================================================
def normalize_application(app: Dict[str, Any]) -> Dict[str, Any]:
    if not app:
        return app
    if not app.get("reference_id"):
        app_id_clean = re.sub(r'[^A-Za-z0-9]', '', str(app.get("app_id", "REF00000000")))
        app["reference_id"] = f"REF-{app_id_clean[-8:].upper()}"
    if not app.get("status"):
        app["status"] = "Submitted (Prototype)"
    return app


def add_user_application(phone: str, app_data: Dict[str, Any]) -> Dict[str, Any]:
    phone_clean = clean_phone(phone)
    db = load_users_db()
    user = db.get(phone_clean)
    if not user:
        return {"success": False, "message": "User not found"}

    if "applications" not in user:
        user["applications"] = []

    normalize_application(app_data)

    # Idempotency check: Do not generate a new Reference ID if the page is refreshed or user opens the application again
    scheme_id = app_data.get("scheme_id")
    applicant_type = app_data.get("applicant_type", "self")
    applicant_name = app_data.get("applicant_name", "Self")
    
    for idx, existing in enumerate(user["applications"]):
        normalize_application(existing)
        if (existing.get("reference_id") == app_data.get("reference_id") or
            existing.get("app_id") == app_data.get("app_id") or
            (scheme_id and existing.get("scheme_id") == scheme_id and
             existing.get("applicant_type", "self") == applicant_type and
             (applicant_type != "family_member" or existing.get("applicant_name") == applicant_name))):
            app_data["reference_id"] = existing.get("reference_id") or app_data["reference_id"]
            app_data["app_id"] = existing.get("app_id") or app_data["app_id"]
            app_data["submitted_at"] = existing.get("submitted_at") or app_data["submitted_at"]
            app_data["status"] = existing.get("status") or "Applied"
            user["applications"][idx] = app_data
            save_users_db(db)
            return {"success": True, "application": app_data, "reused": True}

    user["applications"].insert(0, app_data)
    save_users_db(db)
    return {"success": True, "application": app_data, "reused": False}


def update_user_application_status(phone: str, ref_or_app_id: str, new_status: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
    phone_clean = clean_phone(phone)
    db = load_users_db()
    user = db.get(phone_clean)
    if not user or "applications" not in user:
        return None

    for app in user["applications"]:
        normalize_application(app)
        if app.get("reference_id") == ref_or_app_id or app.get("app_id") == ref_or_app_id:
            app["status"] = new_status
            if notes:
                app["status_notes"] = notes
            app["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            save_users_db(db)
            return app
    return None


def toggle_vault_permission(phone: str, doc_type: str, new_status: str) -> Dict[str, Any]:
    phone_clean = clean_phone(phone)
    db = load_users_db()
    user = db.get(phone_clean)
    if not user:
        return {"success": False, "message": "User not found"}

    if "vault_permissions" not in user:
        user["vault_permissions"] = {}

    user["vault_permissions"][doc_type] = new_status
    save_users_db(db)
    return {"success": True, "permissions": user["vault_permissions"]}
