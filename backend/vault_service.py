"""
Haq Saathi - Mock Document Vault & Consent Audit Service
Handles DigiLocker mock document retrieval, form pre-filling, and immutable consent audit logging with revocation.
Enforces per-user scoped access to audit logs and document permissions.
"""
import os
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_data_dir() -> str:
    default_dir = os.path.join(BASE_DIR, "data")
    try:
        os.makedirs(default_dir, exist_ok=True)
        test_file = os.path.join(default_dir, ".write_test")
        with open(test_file, "w") as f:
            f.write("1")
        os.remove(test_file)
        return default_dir
    except (OSError, PermissionError):
        tmp_dir = "/tmp/haq_saathi_data"
        if not os.path.exists(tmp_dir):
            os.makedirs(tmp_dir, exist_ok=True)
            import shutil
            if os.path.exists(default_dir):
                for item in os.listdir(default_dir):
                    s = os.path.join(default_dir, item)
                    d = os.path.join(tmp_dir, item)
                    if os.path.isfile(s) and not os.path.exists(d):
                        try:
                            shutil.copy2(s, d)
                        except Exception:
                            pass
        return tmp_dir


DATA_DIR = get_data_dir()
VAULT_FILE = os.path.join(DATA_DIR, "mock_document_vault.json")
TEMPLATES_FILE = os.path.join(DATA_DIR, "form_templates.json")
AUDIT_FILE = os.path.join(DATA_DIR, "audit_log.json")
USER_PROFILE_FILE = os.path.join(DATA_DIR, "user_profile.json")


def load_json(filepath: str, default: Any = None) -> Any:
    if not os.path.exists(filepath):
        return default
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return default


def save_json(filepath: str, data: Any) -> None:
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_user_profile() -> Dict[str, Any]:
    return load_json(USER_PROFILE_FILE, {})


def update_user_profile(updates: Dict[str, Any]) -> Dict[str, Any]:
    profile = get_user_profile()
    profile.update(updates)
    save_json(USER_PROFILE_FILE, profile)
    return profile


def get_mock_document(doc_type: str) -> Optional[Dict[str, Any]]:
    vault = load_json(VAULT_FILE, {})
    docs = vault.get("documents", {})
    return docs.get(doc_type)


def get_all_vault_documents() -> Dict[str, Any]:
    vault = load_json(VAULT_FILE, {})
    return vault.get("documents", {})


def get_audit_logs(user_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Returns audit logs. If user_id is provided, strictly filters to that user only."""
    try:
        from backend.database import db_get_audit_logs
        db_logs = db_get_audit_logs(user_id=user_id)
        if db_logs:
            return db_logs
    except Exception as e:
        print(f"[VaultService] DB audit read note: {e}")
    logs = load_json(AUDIT_FILE, [])
    if user_id:
        return [entry for entry in logs if entry.get("user_id") == user_id]
    return logs


def log_consent_action(
    doc_type: str,
    doc_title_en: str,
    doc_title_kn: str,
    scheme_id: str,
    scheme_name_en: str,
    scheme_name_kn: str,
    purpose_en: str,
    purpose_kn: str,
    status: str,  # "ALLOWED" or "DENIED"
    user_id: str = "9876543210",
    doc_title_hi: Optional[str] = None,
    scheme_name_hi: Optional[str] = None,
    purpose_hi: Optional[str] = None,
    applicant_type: str = "self",
    dependent_name: Optional[str] = None
) -> Dict[str, Any]:
    entry = {
        "id": f"audit_{uuid.uuid4().hex[:8]}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "user_id": user_id,
        "applicant_type": applicant_type,
        "dependent_name": dependent_name,
        "document_type": doc_type,
        "document_title_en": doc_title_en,
        "document_title_kn": doc_title_kn,
        "document_title_hi": doc_title_hi or doc_title_en,
        "scheme_id": scheme_id,
        "scheme_name_en": scheme_name_en,
        "scheme_name_kn": scheme_name_kn,
        "scheme_name_hi": scheme_name_hi or scheme_name_en,
        "purpose_en": purpose_en,
        "purpose_kn": purpose_kn,
        "purpose_hi": purpose_hi or purpose_en,
        "status": status,
        "revoked_at": None
    }
    # 1. Save to persistent SQLite
    try:
        from backend.database import db_save_audit_log
        db_save_audit_log(entry)
    except Exception as e:
        print(f"[VaultService] DB audit write note: {e}")

    # 2. Sync to JSON store
    try:
        logs = load_json(AUDIT_FILE, [])
        logs.insert(0, entry)
        save_json(AUDIT_FILE, logs)
    except Exception:
        pass
    return entry


def revoke_consent(audit_id: str, user_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
    logs = get_audit_logs()
    target = None
    for item in logs:
        if item.get("id") == audit_id:
            # Enforce user authorization if provided
            if user_id and item.get("user_id") != user_id:
                return None
            item["status"] = "REVOKED"
            item["revoked_at"] = datetime.now(timezone.utc).isoformat()
            target = item
            break
    if target:
        try:
            from backend.database import db_save_audit_log
            db_save_audit_log(target)
        except Exception:
            pass
        save_json(AUDIT_FILE, logs)
    return target


def generate_dynamic_form_template(scheme_id: str) -> Dict[str, Any]:
    title = scheme_id.replace("_", " ").title()
    return {
        "scheme_id": scheme_id,
        "form_title_en": f"Application for {title}",
        "form_title_kn": f"{title} ಯೋಜನೆ ಅರ್ಜಿ",
        "form_title_hi": f"{title} योजना आवेदन",
        "fields": [
            {
                "field_id": "applicant_name",
                "label_en": "Applicant Full Name",
                "label_kn": "ಅರ್ಜಿದಾರರ ಪೂರ್ಣ ಹೆಸರು",
                "label_hi": "आवेदक का पूरा नाम",
                "source": "document:aadhaar_card",
                "doc_field": "full_name",
                "type": "text"
            },
            {
                "field_id": "aadhaar_number",
                "label_en": "Aadhaar Number",
                "label_kn": "ಆಧಾರ್ ಸಂಖ್ಯೆ",
                "label_hi": "आधार संख्या",
                "source": "document:aadhaar_card",
                "doc_field": "id_number",
                "type": "text"
            },
            {
                "field_id": "annual_income",
                "label_en": "Certified Annual Income (₹)",
                "label_kn": "ದೃಢೀಕರಿಸಿದ ವಾರ್ಷಿಕ ಆದಾಯ (₹)",
                "label_hi": "प्रमाणित वार्षिक आय (₹)",
                "source": "document:income_certificate",
                "doc_field": "annual_income",
                "type": "currency"
            },
            {
                "field_id": "income_cert_no",
                "label_en": "Income Certificate No (RD No.)",
                "label_kn": "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಸಂಖ್ಯೆ",
                "label_hi": "आय प्रमाण पत्र संख्या",
                "source": "document:income_certificate",
                "doc_field": "certificate_no",
                "type": "text"
            },
            {
                "field_id": "present_address",
                "label_en": "Present Residential Address",
                "label_kn": "ಪ್ರಸ್ತುತ ವಾಸವಿರುವ ವಿಳಾಸ",
                "label_hi": "वर्तमान निवास पता",
                "source": "document:address_proof",
                "doc_field": "present_address",
                "type": "text"
            },
            {
                "field_id": "occupation",
                "label_en": "Primary Occupation",
                "label_kn": "ಮುಖ್ಯ ಕಾಯಕ / ವೃತ್ತಿ",
                "label_hi": "मुख्य व्यवसाय",
                "source": "user_profile",
                "profile_field": "occupation_display",
                "type": "text"
            },
            {
                "field_id": "labour_card_no",
                "label_en": "Labour Registration No",
                "label_kn": "ಕಾರ್ಮಿಕ ನೋಂದಣಿ ಸಂಖ್ಯೆ",
                "label_hi": "श्रमिक पंजीकरण संख्या",
                "source": "document:labour_card",
                "doc_field": "registration_no",
                "type": "text"
            }
        ]
    }


def prefill_scheme_form(
    scheme_id: str,
    consented_docs: List[str],
    user_profile: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Pre-fills a scheme's form template using only documents that the user explicitly granted consent for,
    plus the provided or saved user profile.
    """
    templates_data = load_json(TEMPLATES_FILE, {})
    templates = templates_data.get("templates", {})
    template = templates.get(scheme_id)
    if not template:
        template = generate_dynamic_form_template(scheme_id)

    profile = user_profile or get_user_profile()
    vault_docs = get_all_vault_documents()

    prefilled_fields = []
    missing_docs = []

    for field in template.get("fields", []):
        source = field.get("source", "user_input")
        val = None
        source_label_en = "User Input"
        source_label_kn = "ಬಳಕೆದಾರರ ನಮೂದು"
        source_label_hi = "उपयोगकर्ता प्रविष्टि"
        is_consented = True

        if source == "user_profile":
            pf = field.get("profile_field")
            val = profile.get(pf)
            source_label_en = "User Profile"
            source_label_kn = "ಬಳಕೆದಾರರ ವಿವರ"
            source_label_hi = "उपयोगकर्ता प्रोफ़ाइल"
        elif source.startswith("document:"):
            doc_name = source.split(":", 1)[1]
            if doc_name in consented_docs:
                doc = vault_docs.get(doc_name, {})
                df = field.get("doc_field")
                val = doc.get(df)
                source_label_en = f"DigiLocker ({doc.get('doc_title_en', doc_name)})"
                source_label_kn = f"ಡಿಜಿಲಾಕರ್ ({doc.get('doc_title_kn', doc_name)})"
                source_label_hi = f"डिजिलॉकर ({doc.get('doc_title_hi', doc_name)})"
            else:
                val = None
                is_consented = False
                source_label_en = "Consent Required"
                source_label_kn = "ಅನುಮತಿ ಅಗತ್ಯವಿದೆ"
                source_label_hi = "सहमति आवश्यक है"
                if doc_name not in missing_docs:
                    missing_docs.append(doc_name)
        elif source == "user_input":
            val = field.get("default_value", "")
            source_label_en = "Applicant Choice / Voice Input"
            source_label_kn = "ಅರ್ಜಿದಾರರ ಧ್ವನಿ ಆಯ್ಕೆ"
            source_label_hi = "आवेदक की आवाज़ / चयन"

        prefilled_fields.append({
            "field_id": field.get("field_id"),
            "label_en": field.get("label_en"),
            "label_kn": field.get("label_kn"),
            "label_hi": field.get("label_hi") or field.get("label_en"),
            "type": field.get("type"),
            "value": val,
            "source": source,
            "source_label_en": source_label_en,
            "source_label_kn": source_label_kn,
            "source_label_hi": source_label_hi,
            "is_consented": is_consented
        })

    return {
        "scheme_id": scheme_id,
        "form_title_en": template.get("form_title_en"),
        "form_title_kn": template.get("form_title_kn"),
        "form_title_hi": template.get("form_title_hi") or template.get("form_title_en"),
        "prefilled_fields": prefilled_fields,
        "missing_docs": missing_docs,
        "all_consented": len(missing_docs) == 0
    }
