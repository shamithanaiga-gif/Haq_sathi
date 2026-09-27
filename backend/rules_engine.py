"""
Haq Saathi - Pure Rules Engine
Constraint: This engine evaluates eligibility purely with deterministic if/else logic based on JSON criteria.
The LLM is NEVER used to decide or alter eligibility decisions.
"""
from typing import Dict, Any, List, Tuple


def evaluate_scheme_eligibility(scheme: Dict[str, Any], user_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Pure function that takes a scheme specification and user data,
    evaluating deterministic eligibility rules without any LLM involvement.
    """
    scheme_id = scheme.get("id")
    rules = scheme.get("eligibility_rules", {})
    passed_rules = []
    failed_rules = []
    is_eligible = True

    # Rule: State Residency
    if "state_resident" in rules:
        user_residency = user_data.get("state_resident", False)
        if user_residency == rules["state_resident"]:
            passed_rules.append({
                "rule": "state_resident",
                "condition": "Must reside in Karnataka",
                "actual": f"Resident: {user_residency}",
                "passed": True
            })
        else:
            failed_rules.append({
                "rule": "state_resident",
                "condition": "Must reside in Karnataka",
                "actual": f"Resident: {user_residency}",
                "passed": False
            })
            is_eligible = False

    # Rule: Maximum Annual Income
    if "annual_income_max" in rules:
        max_income = rules["annual_income_max"]
        # allow income from annual_income or monthly_income * 12
        user_income = user_data.get("annual_income")
        if user_income is None and user_data.get("monthly_income") is not None:
            user_income = user_data["monthly_income"] * 12

        if user_income is not None and user_income <= max_income:
            passed_rules.append({
                "rule": "annual_income_max",
                "condition": f"Annual income <= ₹{max_income:,}",
                "actual": f"Annual income: ₹{user_income:,}",
                "passed": True
            })
        else:
            actual_str = f"Annual income: ₹{user_income:,}" if user_income is not None else "Income not provided"
            failed_rules.append({
                "rule": "annual_income_max",
                "condition": f"Annual income <= ₹{max_income:,}",
                "actual": actual_str,
                "passed": False
            })
            is_eligible = False

    # Rule: Minimum Age
    if "min_age" in rules:
        min_age = rules["min_age"]
        user_age = user_data.get("age")
        if user_age is not None and user_age >= min_age:
            passed_rules.append({
                "rule": "min_age",
                "condition": f"Age >= {min_age} years",
                "actual": f"Age: {user_age} years",
                "passed": True
            })
        else:
            actual_str = f"Age: {user_age} years" if user_age is not None else "Age not provided"
            failed_rules.append({
                "rule": "min_age",
                "condition": f"Age >= {min_age} years",
                "actual": actual_str,
                "passed": False
            })
            is_eligible = False

    # Rule: Occupation
    if "occupation" in rules:
        required_occ = rules["occupation"]
        user_occ = str(user_data.get("occupation", "")).lower().strip()
        # Accept synonyms for construction worker
        acceptable_construction = ["construction_worker", "construction", "mason", "labourer", "building_worker", "coolie"]
        
        matches = False
        if required_occ == "construction_worker":
            matches = any(syn in user_occ for syn in acceptable_construction)
        else:
            matches = (user_occ == required_occ)

        if matches:
            passed_rules.append({
                "rule": "occupation",
                "condition": f"Must be {required_occ}",
                "actual": f"Occupation: {user_data.get('occupation_display', user_occ)}",
                "passed": True
            })
        else:
            failed_rules.append({
                "rule": "occupation",
                "condition": f"Must be {required_occ}",
                "actual": f"Occupation: {user_data.get('occupation_display', user_occ or 'Unknown')}",
                "passed": False
            })
            is_eligible = False

    # Rule: Has Labour Card
    if "has_labour_card" in rules:
        req_card = rules["has_labour_card"]
        has_card = user_data.get("has_labour_card", False)
        if has_card == req_card:
            passed_rules.append({
                "rule": "has_labour_card",
                "condition": "Must hold an active Labour Registration Card",
                "actual": f"Labour Card: {'Yes' if has_card else 'No'}",
                "passed": True
            })
        else:
            failed_rules.append({
                "rule": "has_labour_card",
                "condition": "Must hold an active Labour Registration Card",
                "actual": f"Labour Card: {'Yes' if has_card else 'No'}",
                "passed": False
            })
            is_eligible = False

    # Rule: Has School Going Child
    if "has_school_going_child" in rules:
        req_child = rules["has_school_going_child"]
        has_child = user_data.get("has_school_going_child", False)
        if has_child == req_child:
            passed_rules.append({
                "rule": "has_school_going_child",
                "condition": "Must have child enrolled in school",
                "actual": f"School child: {'Yes' if has_child else 'No'}",
                "passed": True
            })
        else:
            failed_rules.append({
                "rule": "has_school_going_child",
                "condition": "Must have child enrolled in school",
                "actual": f"School child: {'Yes' if has_child else 'No'}",
                "passed": False
            })
            is_eligible = False

    # Rule: Maximum Age
    if "max_age" in rules:
        max_age = rules["max_age"]
        user_age = user_data.get("age")
        if user_age is not None and user_age <= max_age:
            passed_rules.append({
                "rule": "max_age",
                "condition": f"Age <= {max_age} years",
                "actual": f"Age: {user_age} years",
                "passed": True
            })
        else:
            actual_str = f"Age: {user_age} years" if user_age is not None else "Age not provided"
            failed_rules.append({
                "rule": "max_age",
                "condition": f"Age <= {max_age} years",
                "actual": actual_str,
                "passed": False
            })
            is_eligible = False

    # Determine explanation from scheme's pre-configured bilingual/trilingual text
    explanation_map = scheme.get("explanation_text", {})
    outcome_key = "eligible" if is_eligible else "not_eligible"
    base_explanation = explanation_map.get(outcome_key, {})

    return {
        "scheme_id": scheme_id,
        "scheme_name_en": scheme.get("name_en"),
        "scheme_name_kn": scheme.get("name_kn"),
        "scheme_name_hi": scheme.get("name_hi") or scheme.get("name_en"),
        "benefit_en": scheme.get("benefit_en"),
        "benefit_kn": scheme.get("benefit_kn"),
        "benefit_hi": scheme.get("benefit_hi") or scheme.get("benefit_en"),
        "department_en": scheme.get("department_en"),
        "department_kn": scheme.get("department_kn"),
        "department_hi": scheme.get("department_hi") or scheme.get("department_en"),
        "source_url": scheme.get("source_url"),
        "source_type": scheme.get("source_type", "demo_reference"),
        "is_live_search": scheme.get("is_live_search", False),
        "live_search_note": scheme.get("live_search_note", ""),
        "category": scheme.get("category", "other"),
        "eligible": is_eligible,
        "passed_rules": passed_rules,
        "failed_rules": failed_rules,
        "required_documents": scheme.get("required_documents", []),
        "raw_explanation_en": base_explanation.get("en", ""),
        "raw_explanation_kn": base_explanation.get("kn", ""),
        "raw_explanation_hi": base_explanation.get("hi") or base_explanation.get("en", ""),
        "decision_source": "Deterministic Pure Rules Engine (JSON Logic)"
    }


def find_missing_fields(scheme: Dict[str, Any], user_data: Dict[str, Any]) -> List[str]:
    """
    Checks which required fields for a scheme are missing from the user data.
    """
    required = scheme.get("required_fields", [])
    missing = []
    for field in required:
        val = user_data.get(field)
        if val is None or val == "" or val == "unknown":
            missing.append(field)
    return missing


SCHEME_FRIENDLY_NAMES = {
    "ration_card": {
        "en": "Priority Ration Card",
        "kn": "ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ",
        "hi": "बीपीएल राशन कार्ड"
    },
    "health_cover": {
        "en": "Ayushman Health Cover",
        "kn": "ಆಯುಷ್ಮಾನ್ ಆರೋಗ್ಯ ಯೋಜನೆ",
        "hi": "आयुष्मान स्वास्थ्य योजना"
    },
    "child_scholarship": {
        "en": "Construction Worker Child Scholarship",
        "kn": "ಕಟ್ಟಡ ಕಾರ್ಮಿಕರ ಮಕ್ಕಳ ವಿದ್ಯಾರ್ಥಿವೇತನ",
        "hi": "निर्माण श्रमिक बाल छात्रवृत्ति"
    },
    "pension": {
        "en": "Sandhya Suraksha Pension",
        "kn": "ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ ಪಿಂಚಣಿ",
        "hi": "संध्या सुरक्षा पेंशन"
    }
}


def _format_friendly_list(items: List[str], conjunction: str) -> str:
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} {conjunction} {items[1]}"
    return f"{', '.join(items[:-1])}, {conjunction} {items[-1]}"


def check_all_scheme_eligibility(
    schemes: List[Dict[str, Any]],
    user_data: Dict[str, Any],
    lang: str = "kn"
) -> Dict[str, Any]:
    """
    Evaluates ALL schemes for the user without duplicating eligibility logic.
    Groups into:
    1. 'eligible' (green)
    2. 'needs_more_info' (amber, with missing fields listed)
    3. 'not_eligible' (grey/red, with failure reasons)
    Generates spoken audio summary on load naming actual eligible schemes.
    """
    eligible = []
    needs_more_info = []
    not_eligible = []

    for scheme in schemes:
        missing = find_missing_fields(scheme, user_data)
        if missing:
            needs_more_info.append({
                "scheme_id": scheme.get("id"),
                "scheme_name_en": scheme.get("name_en"),
                "scheme_name_kn": scheme.get("name_kn"),
                "scheme_name_hi": scheme.get("name_hi") or scheme.get("name_en"),
                "status": "NEEDS_MORE_INFO",
                "missing_fields": missing,
                "benefit_en": scheme.get("benefit_en"),
                "benefit_kn": scheme.get("benefit_kn"),
                "benefit_hi": scheme.get("benefit_hi") or scheme.get("benefit_en"),
                "department_en": scheme.get("department_en"),
                "department_kn": scheme.get("department_kn"),
                "department_hi": scheme.get("department_hi") or scheme.get("department_en"),
                "source_url": scheme.get("source_url"),
                "source_type": scheme.get("source_type", "demo_reference"),
                "is_live_search": scheme.get("is_live_search", False),
                "live_search_note": scheme.get("live_search_note", ""),
                "category": scheme.get("category", "other"),
                "required_documents": scheme.get("required_documents", [])
            })
        else:
            result = evaluate_scheme_eligibility(scheme, user_data)
            if result["eligible"]:
                result["status"] = "ELIGIBLE"
                eligible.append(result)
            else:
                result["status"] = "NOT_ELIGIBLE"
                not_eligible.append(result)

    user_name = user_data.get("name", "Beneficiary")
    user_name_kn = user_data.get("name_kn", user_name)
    user_name_hi = user_data.get("name_hi", user_name)

    names_en = [
        SCHEME_FRIENDLY_NAMES.get(s["scheme_id"], {}).get("en") or s.get("scheme_name_en", "Scheme")
        for s in eligible
    ]
    names_kn = [
        SCHEME_FRIENDLY_NAMES.get(s["scheme_id"], {}).get("kn") or s.get("scheme_name_kn", "ಯೋಜನೆ")
        for s in eligible
    ]
    names_hi = [
        SCHEME_FRIENDLY_NAMES.get(s["scheme_id"], {}).get("hi") or s.get("scheme_name_hi") or s.get("scheme_name_en", "योजना")
        for s in eligible
    ]

    need_names_en = [
        SCHEME_FRIENDLY_NAMES.get(s["scheme_id"], {}).get("en") or s.get("scheme_name_en", "Scheme")
        for s in needs_more_info
    ]
    need_names_kn = [
        SCHEME_FRIENDLY_NAMES.get(s["scheme_id"], {}).get("kn") or s.get("scheme_name_kn", "ಯೋಜನೆ")
        for s in needs_more_info
    ]
    need_names_hi = [
        SCHEME_FRIENDLY_NAMES.get(s["scheme_id"], {}).get("hi") or s.get("scheme_name_hi") or s.get("scheme_name_en", "योजना")
        for s in needs_more_info
    ]

    not_names_en = [
        SCHEME_FRIENDLY_NAMES.get(s["scheme_id"], {}).get("en") or s.get("scheme_name_en", "Scheme")
        for s in not_eligible
    ]
    not_names_kn = [
        SCHEME_FRIENDLY_NAMES.get(s["scheme_id"], {}).get("kn") or s.get("scheme_name_kn", "ಯೋಜನೆ")
        for s in not_eligible
    ]
    not_names_hi = [
        SCHEME_FRIENDLY_NAMES.get(s["scheme_id"], {}).get("hi") or s.get("scheme_name_hi") or s.get("scheme_name_en", "योजना")
        for s in not_eligible
    ]

    # English summary naming all three categories
    parts_en = [f"Welcome {user_name}!"]
    if names_en:
        parts_en.append(f"Based on your details, you are eligible for {_format_friendly_list(names_en, 'and')}.")
    else:
        parts_en.append("Based on your details, you are not immediately eligible for any confirmed schemes.")
    if need_names_en:
        parts_en.append(f"We need more information to check {_format_friendly_list(need_names_en, 'and')}.")
    if not_names_en:
        parts_en.append(f"You are not eligible for {_format_friendly_list(not_names_en, 'and')} right now.")
    summary_en = " ".join(parts_en)

    # Kannada summary naming all three categories
    parts_kn = [f"ಸುಸ್ವಾಗತ, {user_name_kn}!"]
    if names_kn:
        parts_kn.append(f"ನಿಮ್ಮ ವಿವರಗಳ ಪ್ರಕಾರ ನೀವು {_format_friendly_list(names_kn, 'ಮತ್ತು')} ಯೋಜನೆಗಳಿಗೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ.")
    else:
        parts_kn.append("ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವಿವರಗಳ ಪ್ರಕಾರ ಯಾವುದೇ ದೃಢಪಡಿಸಿದ ಯೋಜನೆಗಳು ಲಭ್ಯವಿಲ್ಲ.")
    if need_names_kn:
        parts_kn.append(f"{_format_friendly_list(need_names_kn, 'ಮತ್ತು')} ಯೋಜನೆಗಳನ್ನು ಪರಿಶೀಲಿಸಲು ನಮಗೆ ಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಬೇಕಾಗಿದೆ.")
    if not_names_kn:
        parts_kn.append(f"ನೀವು ಸದ್ಯಕ್ಕೆ {_format_friendly_list(not_names_kn, 'ಮತ್ತು')} ಯೋಜನೆಗಳಿಗೆ ಅರ್ಹರಾಗಿಲ್ಲ.")
    summary_kn = " ".join(parts_kn)

    # Hindi summary naming all three categories
    parts_hi = [f"स्वागत है, {user_name_hi}!"]
    if names_hi:
        parts_hi.append(f"आपके विवरण के अनुसार, आप {_format_friendly_list(names_hi, 'और')} के लिए पात्र हैं।")
    else:
        parts_hi.append("आपके विवरण के अनुसार आप वर्तमान में किसी पुष्टि की गई योजना के लिए पात्र नहीं हैं।")
    if need_names_hi:
        parts_hi.append(f"{_format_friendly_list(need_names_hi, 'और')} की जाँच के लिए हमें और जानकारी चाहिए।")
    if not_names_hi:
        parts_hi.append(f"आप अभी {_format_friendly_list(not_names_hi, 'और')} के लिए पात्र नहीं हैं।")
    summary_hi = " ".join(parts_hi)

    chosen_summary = summary_kn if lang == "kn" else (summary_hi if lang == "hi" else summary_en)

    return {
        "eligible": eligible,
        "needs_more_info": needs_more_info,
        "not_eligible": not_eligible,
        "summary": chosen_summary,
        "summary_en": summary_en,
        "summary_kn": summary_kn,
        "summary_hi": summary_hi,
        "total_schemes": len(schemes),
        "source_type": schemes[0].get("source_type", "demo_reference") if schemes else "demo_reference",
        "is_live_search": any(s.get("is_live_search") for s in schemes)
    }

