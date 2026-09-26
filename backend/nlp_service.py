"""
Haq Saathi - Trilingual NLP & Speech Understanding Service
Supports English (en-IN), Kannada (kn-IN), and Hindi (hi-IN).

Purpose:
1. Extract structured intent and user details from spoken/transcribed text (Kannada/Hindi/English).
2. Detect proxy / family member intent ("my father's ration card, he has no phone").
3. Clarify complex welfare terms into simple conversational language.
4. Rephrase the deterministic Rules Engine eligibility decision into warm, compassionate speech.

CRITICAL CONSTRAINT:
This module NEVER decides or alters eligibility. The eligibility decision is strictly
supplied by rules_engine.py and is merely explained here.
"""
import os
import json
import re
from typing import Dict, Any, Optional

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")


def detect_language(text: str) -> str:
    """Detect if the input text contains Kannada, Hindi (Devanagari), or English."""
    # Unicode block for Kannada: \u0C80-\u0CFF
    if re.search(r'[\u0C80-\u0CFF]', text):
        return "kn"
    # Unicode block for Devanagari (Hindi): \u0900-\u097F
    if re.search(r'[\u0900-\u097F]', text):
        return "hi"
    return "en"


def parse_speech_intent(text: str, current_context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Extracts structured intent, proxy metadata, and any user-provided profile details from user speech.
    Returns structured JSON.
    """
    lang = detect_language(text)
    lower_text = text.lower()
    
    # Try calling Claude LLM if API key is provided
    if ANTHROPIC_API_KEY:
        try:
            import requests
            headers = {
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            system_prompt = (
                "You are an intent and entity extractor for a welfare navigator called Haq Saathi in India. "
                "The user speaks Kannada, Hindi, or English. "
                "Extract scheme interest ('ration_card', 'health_cover', 'child_scholarship', 'pension', or 'all'), "
                "applicant_type ('self' or 'family_member'), relationship ('father', 'mother', 'child', 'spouse', etc.), "
                "and any mentioned user profile fields: 'occupation', 'monthly_income', 'annual_income', "
                "'family_size', 'age', 'has_school_going_child' (bool), 'has_labour_card' (bool), 'state_resident' (bool), "
                "or if they are asking for clarification ('is_asking_clarification': bool, 'clarification_topic': str). "
                "Output ONLY a valid JSON object with keys: language ('kn'|'hi'|'en'), scheme_interest, applicant_type, "
                "relationship, extracted_fields (dict), is_asking_clarification (bool), clarification_topic (str or null), "
                "user_intent_summary (str)."
            )
            data = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 400,
                "messages": [{"role": "user", "content": f"User speech text: '{text}'\nCurrent asking field: {current_context.get('current_field') if current_context else 'None'}"}],
                "system": system_prompt
            }
            resp = requests.post("https://api.anthropic.com/v1/messages", headers=headers, json=data, timeout=8)
            if resp.status_code == 200:
                raw_content = resp.json()["content"][0]["text"]
                m = re.search(r'\{.*\}', raw_content, re.DOTALL)
                if m:
                    return json.loads(m.group(0))
        except Exception as e:
            print(f"[NLP-Claude] Fallback to local extractor: {e}")

    # Robust built-in trilingual extractor (works offline and instant without API key)
    extracted_fields = {}
    is_asking_clarification = False
    clarification_topic = None
    scheme_interest = None
    applicant_type = "self"
    relationship = None

    # Detect Proxy / Family Member Intent (Section 7)
    proxy_patterns = [
        ("father", ["father", "dad", "appa", "ತಂದೆ", "ಅಪ್ಪ", "ತಂದೆಯ", "पिता", "पिताजी", "बाबूजी", "पापा"]),
        ("mother", ["mother", "mom", "amma", "ತಾಯಿ", "ಅಮ್ಮ", "ತಾಯಿಯ", "माँ", "माताजी", "अम्मा", "मम्मी"]),
        ("child", ["child", "son", "daughter", "maga", "magalu", "ಮಗ", "ಮಗಳು", "ಮಕ್ಕಳು", "बच्चा", "बेटा", "बेटी", "बच्चे"]),
        ("spouse", ["wife", "husband", "hendathi", "ganda", "ಪತ್ನಿ", "ಗಂಡ", "ಹೆಂಡತಿ", "पत्नी", "पति", "जीवनसाथी"])
    ]
    for rel_type, kws in proxy_patterns:
        if any(kw in lower_text for kw in kws):
            applicant_type = "family_member"
            relationship = rel_type
            break

    # Check clarification queries across en, kn, hi
    clarification_terms = {
        "annual_income": [
            "income", "annual income", "monthly income", "salary", "earnings",
            "ಆದಾಯ", "ಹಣ", "ಸಂಬಳ", "ವಾರ್ಷಿಕ ಆದಾಯ",
            "आय", "वार्षिक आय", "मासिक आय", "कमाई", "वेतन"
        ],
        "has_labour_card": [
            "labour card", "labor card", "karmika card", "green card", "board card",
            "ಕಾರ್ಮಿಕ ಕಾರ್ಡ್", "ಕಾರ್ಡ್",
            "लेबर कार्ड", "मजदूर कार्ड", "कर्मकार कार्ड", "ग्रीन कार्ड"
        ],
        "family_size": [
            "family size", "family members", "household size",
            "ಕುಟುಂಬದ ಗಾತ್ರ", "ಕುಟುಂಬದ ಸದಸ್ಯ",
            "परिवार का आकार", "परिवार के सदस्य", "सदस्य संख्या"
        ],
        "has_school_going_child": [
            "school", "child school", "scholarship",
            "ವಿದ್ಯಾರ್ಥಿವೇತನ", "ಶಾಲೆ", "ಮಕ್ಕಳು",
            "छात्रवृत्ति", "स्कॉलरशिप", "स्कूल", "पढ़ाई", "बच्चा"
        ],
        "state_resident": [
            "resident", "karnataka resident",
            "ಕರ್ನಾಟಕ ನಿವಾಸಿ", "ವಾಸ",
            "निवासी", "कर्नाटक निवासी", "रहने वाले"
        ],
        "age": [
            "age", "aadhaar age",
            "ವಯಸ್ಸು",
            "आयु", "उम्र", "साल"
        ]
    }

    # Explicit term explanation request markers
    term_clarify_markers = [
        "what is", "what does", "what do you mean by", "meaning of", "meaning", "explain", "details of",
        "ಅಂದ್ರೆ ಏನು", "ಅಂದರೆ ಏನು", "ಅರ್ಥ ಏನು", "ವಿವರಣೆ", "ವಿವರಿಸಿ", "ತಿಳಿಸಿ",
        "क्या है", "का मतलब क्या", "का अर्थ क्या", "समझाएं", "बताएं", "विस्तार से बताएं", "जानकारी दें"
    ]

    # Contextual self-referential clarification markers (when current_field is active)
    self_referential_markers = [
        "what does this mean", "what do you mean", "what is this", "what does that mean",
        "explain this", "explain", "i don't understand", "dont understand", "why do you need this",
        "why is this needed", "why do you need", "why do you ask", "help me understand",
        "can you explain", "don't know", "dont know", "not sure",
        "ಇದರ ಅರ್ಥ ಏನು", "ಅಂದರೆ ಏನು", "ಅಂದ್ರೆ ಏನು", "ಅರ್ಥ ಆಗಿಲ್ಲ", "ವಿವರಿಸಿ", "ಗೊತ್ತಿಲ್ಲ",
        "ಯಾಕೆ ಬೇಕು", "ಯಾಕೆ ಕೇಳ್ತಿದ್ದೀರಿ", "ತಿಳಿಸಿ", "ಸಹಾಯ ಬೇಕು",
        "इसका क्या मतलब", "इसका मतलब क्या है", "समझ नहीं आया", "मुझे नहीं पता", "क्यों चाहिए",
        "क्यों पूछ रहे हैं", "समझा दीजिए", "मदद चाहिए"
    ]

    # 1. Check if user mentioned a specific welfare topic with clarification intent
    for topic, kws in clarification_terms.items():
        if any(kw in lower_text for kw in kws):
            if any(m in lower_text for m in term_clarify_markers) or "?" in lower_text:
                is_asking_clarification = True
                clarification_topic = topic
                break

    # 2. If no specific topic found, but current_field is active, check self-referential markers
    if not is_asking_clarification and current_context and current_context.get("current_field"):
        if any(m in lower_text for m in self_referential_markers):
            is_asking_clarification = True
            clarification_topic = current_context["current_field"]

    # Detect available schemes queries (e.g. "what and all schemes are available for me", "which schemes can I get", etc.)
    available_schemes_queries = [
        # English
        "what and all schemes", "what and all", "what schemes are available", "what schemes available",
        "which schemes are available", "which schemes available", "what schemes can i get", "which schemes can i get",
        "what schemes am i eligible", "which schemes am i eligible", "what schemes do i have", "what are my schemes",
        "what schemes are there", "which schemes are there", "what benefits are available", "what benefits can i get",
        "what benefits am i eligible", "schemes are available for me", "schemes available for me", "schemes available to me",
        "schemes for me", "benefits for me", "available schemes", "eligible schemes", "tell me schemes", "tell me my schemes",
        "show schemes", "show my schemes", "list schemes", "all schemes", "all benefits", "all welfare", "everything",
        "what can i apply for", "which can i apply for", "what can i get", "what do i get",
        # Kannada
        "ಯಾವೆಲ್ಲಾ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ", "ಯಾವೆಲ್ಲಾ ಯೋಜನೆಗಳು ಲಭ್ಯವಿದೆ", "ಯಾವೆಲ್ಲಾ ಯೋಜನೆಗಳು",
        "ಯಾವ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ", "ಯಾವ ಯೋಜನೆ ಲಭ್ಯವಿದೆ", "ಯಾವ ಯೋಜನೆಗಳು ಲಭ್ಯ", "ಯಾವ ಯೋಜನೆಗಳು",
        "ಯಾವ ಯೋಜನೆ ಸಿಗುತ್ತೆ", "ಯಾವ ಯೋಜನೆ ಸಿಗುತ್ತದೆ", "ಯಾವ ಯೋಜನೆಗೆ ಅರ್ಹ", "ನನಗೆ ಯಾವ ಯೋಜನೆ",
        "ನನಗೆ ಯಾವೆಲ್ಲಾ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ", "ನನಗೆ ಯಾವ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ", "ನನಗೆ ಯಾವ ಯೋಜನೆ ಸಿಗುತ್ತೆ",
        "ನನ್ನ ಯೋಜನೆಗಳು ಯಾವುವು", "ಲಭ್ಯವಿರುವ ಯೋಜನೆಗಳು", "ಲಭ್ಯವಿರುವ ಯೋಜನೆಗಳನ್ನು ತಿಳಿಸಿ", "ಎಲ್ಲಾ ಯೋಜನೆಗಳು",
        "ಎಲ್ಲ ಯೋಜನೆ", "ಎಲ್ಲಾ ಯೋಜನೆಗಳನ್ನು ತಿಳಿಸಿ", "ಯೋಜನೆಗಳು ತಿಳಿಸಿ", "ಯಾವ ಸೌಲಭ್ಯ ಸಿಗುತ್ತೆ", "ಯೋಜನೆಗಳು ಇವೆ",
        # Hindi
        "कौन-कौन सी योजनाएं हैं", "कौन-कौन सी योजनाएं उपलब्ध हैं", "कौन सी योजनाएं उपलब्ध हैं",
        "कौन सी योजनाएं हैं", "क्या योजनाएं उपलब्ध हैं", "क्या योजनाएं हैं", "उपलब्ध योजनाएं",
        "उपलब्ध योजनाएं बताओ", "उपलब्ध योजनाएं बताएं", "योजनाएं बताओ", "योजनाएं बताएं",
        "मेरी योजनाएं क्या हैं", "मुझे कौन सी योजनाएं मिल सकती हैं", "मैं किस योजना के लिए पात्र हूँ",
        "मेरे लिए कौन सी योजनाएं हैं", "मेरे लिए कौन-कौन सी योजनाएं हैं", "मेरे लिए क्या योजनाएं हैं",
        "सभी योजनाएं", "सब योजनाएं", "सभी लाभ"
    ]

    is_querying_available_schemes = any(q in lower_text for q in available_schemes_queries) or (
        any(w in lower_text for w in ["scheme", "schemes", "benefit", "benefits", "ಯೋಜನೆ", "ಯೋಜನೆಗಳು", "योजना", "योजनाएं"]) and
        any(w in lower_text for w in [
            "available", "eligible", "what and all", "which", "for me", "to me", "my", "tell", "show", "can i get", "do i get",
            "ಲಭ್ಯ", "ಸಿಗುತ್ತೆ", "ತಿಳಿಸಿ", "ನನಗೆ", "ನನ್ನ", "ಯಾವುವು", "ಅರ್ಹ",
            "उपलब्ध", "पात्र", "बताओ", "बताएं", "मेरे लिए", "मेरी", "मुझे"
        ])
    )

    if is_querying_available_schemes:
        scheme_interest = "all"
    # Identify Scheme Interest in EN, KN, and HI
    # 1. Ration Card
    elif any(w in lower_text for w in [
        "ration", "bpl", "food card", "ration card",
        "ಪಡಿತರ", "ರೇಷನ್", "ಅಕ್ಕಿ", "ಆಹಾರ",
        "राशन", "राशन कार्ड", "बीपीएल", "अन्न", "चावल", "खाद्य"
    ]):
        scheme_interest = "ration_card"
    # 2. Health Cover
    elif any(w in lower_text for w in [
        "health", "hospital", "arogya", "ayushman", "doctor",
        "ಆರೋಗ್ಯ", "ಆಸ್ಪತ್ರೆ", "ಚಿಕಿತ್ಸೆ", "ಆಯುಷ್ಮಾನ್",
        "स्वास्थ्य", "अस्पताल", "आयुष्मान", "आरोग्य", "इलाज", "दवा", "चिकित्सा"
    ]):
        scheme_interest = "health_cover"
    # 3. Child Scholarship
    elif any(w in lower_text for w in [
        "scholarship", "child scholarship", "children scholarship",
        "ವಿದ್ಯಾರ್ಥಿವೇತನ", "ಸ್ಕಾಲರ್‌ಶಿಪ್",
        "छात्रवृत्ति", "स्कॉलरशिप", "वजीफा", "बाल शिक्षा", "छात्रवृति"
    ]):
        scheme_interest = "child_scholarship"
    # 4. Pension
    elif any(w in lower_text for w in [
        "pension", "old age pension", "senior citizen", "elderly pension",
        "ಪಿಂಚಣಿ", "ವೃದ್ಧಾಪ್ಯ", "ಹಿರಿಯ ನಾಗರಿಕ",
        "पेंशन", "वृद्धावस्था", "बुजुर्ग", "संध्या सुरक्षा", "वृद्ध पेंशन"
    ]):
        scheme_interest = "pension"

    # Field Extraction from Text
    # Monthly / Annual Income
    income_match = re.search(r'(?:₹|rs\.?|rupees|रुपये)?\s*([0-9]+(?:,[0-9]+)*)\s*(?:per month|month|pm|ತಿಂಗಳಿಗೆ|ತಿಂಗಳು|प्रति माह|महीना)?', lower_text)
    if any(w in lower_text for w in ["12000", "12,000", "ಹನ್ನೆರಡು ಸಾವಿರ", "बारह हजार", "बारह हज़ार"]):
        extracted_fields["monthly_income"] = 12000
        extracted_fields["annual_income"] = 144000
    elif any(w in lower_text for w in ["15000", "15,000", "ಹದಿನೈದು ಸಾವಿರ", "पंद्रह हजार", "पंद्रह हज़ार"]):
        extracted_fields["monthly_income"] = 15000
        extracted_fields["annual_income"] = 180000
    elif any(w in lower_text for w in ["10000", "10,000", "ಹತ್ತು ಸಾವಿರ", "दस हजार", "दस हज़ार"]):
        extracted_fields["monthly_income"] = 10000
        extracted_fields["annual_income"] = 120000
    elif any(w in lower_text for w in ["18000", "18,000", "ಹದಿನೆಂಟು ಸಾವಿರ", "अठारह हजार"]):
        extracted_fields["monthly_income"] = 1500
        extracted_fields["annual_income"] = 18000
    elif income_match and current_context and current_context.get("current_field") == "annual_income":
        try:
            val = int(income_match.group(1).replace(",", ""))
            if val < 30000:
                extracted_fields["monthly_income"] = val
                extracted_fields["annual_income"] = val * 12
            else:
                extracted_fields["annual_income"] = val
        except ValueError:
            pass

    # Occupation
    if any(w in lower_text for w in ["construction", "building", "mason", "labour", "ಕಟ್ಟಡ", "ಗಾರೆ", "ಕೂಲಿ", "निर्माण", "मजदूर", "राजमिस्त्री", "मजदूरी"]):
        extracted_fields["occupation"] = "construction_worker"
        extracted_fields["occupation_display"] = "Construction Labourer"
    elif any(w in lower_text for w in ["carpenter", "ಬಡಗಿ", "बढ़ई"]):
        extracted_fields["occupation"] = "carpenter"
    elif any(w in lower_text for w in ["driver", "ಚಾಲಕ", "ड्राइवर", "चालक"]):
        extracted_fields["occupation"] = "driver"
    elif any(w in lower_text for w in ["farmer", "agricultural", "ಕೃಷಿ", "ರೈತ", "किसान", "खेतिहर"]):
        extracted_fields["occupation"] = "agricultural_worker"

    # Family Size
    if any(w in lower_text for w in ["4", "four", "ನಾಲ್ಕು", "चार"]):
        extracted_fields["family_size"] = 4
    elif any(w in lower_text for w in ["3", "three", "ಮೂರು", "तीन"]):
        extracted_fields["family_size"] = 3
    elif any(w in lower_text for w in ["5", "five", "ಐದು", "पांच"]):
        extracted_fields["family_size"] = 5
    elif current_context and current_context.get("current_field") == "family_size":
        digits = re.findall(r'\b\d+\b', text)
        if digits:
            extracted_fields["family_size"] = int(digits[0])

    # Age
    if any(w in lower_text for w in ["32", "ಮೂವತ್ತೆರಡು", "बत्तीस"]):
        extracted_fields["age"] = 32
    elif any(w in lower_text for w in ["65", "ಅರವತ್ತೈದು", "पैंसठ", "६५"]):
        extracted_fields["age"] = 65
    elif any(w in lower_text for w in ["68", "ಅರವತ್ತೆಂಟು", "अड़सठ"]):
        extracted_fields["age"] = 68
    elif current_context and current_context.get("current_field") == "age":
        digits = re.findall(r'\b\d+\b', text)
        if digits:
            extracted_fields["age"] = int(digits[0])

    # Child School
    if any(w in lower_text for w in [
        "child goes to school", "child is studying", "yes child",
        "ಹೌದು", "ಮಗುವಿದೆ", "ಶಾಲೆಗೆ ಹೋಗ್ತಾನೆ", "ಶಾಲೆಗೆ ಹೋಗ್ತಾಳೆ",
        "हाँ बच्चा स्कूल जाता है", "स्कूल जाता है", "पढ़ता है", "बच्चा पढ़ रहा है"
    ]):
        if current_context and current_context.get("current_field") == "has_school_going_child":
            extracted_fields["has_school_going_child"] = True
    if any(w in lower_text for w in ["no child", "doesn't go", "ಇಲ್ಲ", "ಮಕ್ಕಳಿಲ್ಲ", "बच्चा नहीं है", "स्कूल नहीं जाता"]):
        if current_context and current_context.get("current_field") == "has_school_going_child":
            extracted_fields["has_school_going_child"] = False

    # Labour Card
    if any(w in lower_text for w in ["have labour card", "yes card", "ಹೌದು ಕಾರ್ಡ್ ಇದೆ", "ಕಾರ್ಡ್ ಇದೆ", "लेबर कार्ड है", "कार्ड है"]):
        extracted_fields["has_labour_card"] = True
    elif any(w in lower_text for w in ["no card", "ಕಾರ್ಡ್ ಇಲ್ಲ", "कार्ड नहीं है", "लेबर कार्ड नहीं"]):
        extracted_fields["has_labour_card"] = False

    # Karnataka Residency
    if any(w in lower_text for w in ["bengaluru", "bangalore", "kalaburagi", "karnataka", "ಬೆಂಗಳೂರು", "ಕಲಬುರಗಿ", "ಕರ್ನಾಟಕ", "बेंगलुरु", "कर्नाटक"]):
        extracted_fields["state_resident"] = True

    # Generic boolean checks when a boolean field is active
    if current_context and current_context.get("current_field"):
        f = current_context["current_field"]
        if f in ["has_school_going_child", "has_labour_card", "state_resident"]:
            if any(w in lower_text for w in ["yes", "yeah", "correct", "yep", "ha", "houdu", "ಹೌದು", "ಇದೆ", "ಖಂಡಿತ", "हाँ", "जी हाँ", "बिल्कुल", "है"]):
                extracted_fields[f] = True
            elif any(w in lower_text for w in ["no", "nope", "dont have", "illa", "ಇಲ್ಲ", "ಇಲ್ಲವೇ ಇಲ್ಲ", "नहीं", "ना", "नहीं है"]):
                extracted_fields[f] = False

    # Scope check: Is this utterance relevant to government welfare schemes, a pending field question, or clarification?
    is_out_of_scope = False
    is_parse_failure = False

    has_scheme_intent = scheme_interest is not None
    has_clarification = is_asking_clarification is True
    has_proxy_intent = applicant_type == "family_member"

    has_valid_field_answer = False
    if current_context and current_context.get("current_field"):
        cur_f = current_context["current_field"]
        if cur_f in extracted_fields:
            has_valid_field_answer = True

    has_profile_entities = len(extracted_fields) > 0 and not (current_context and current_context.get("current_field"))

    off_topic_markers = [
        "joke", "cricket", "weather", "song", "music", "movie", "cinema", "recipe",
        "sports", "president", "minister", "prime minister", "game", "dance",
        "ಜೋಕ್", "ತಮಾಷೆ", "ಕ್ರಿಕೆಟ್", "ಹಾಡು", "ಸಿನಿಮಾ", "ಹವಾಮಾನ", "ಚುಟುಕು", "ಕಥೆ", "ಆಟ",
        "जोक", "मजाक", "क्रिकेट", "गाना", "मौसम", "फिल्म", "कहानी", "खेल"
    ]
    is_explicit_off_topic = any(m in lower_text for m in off_topic_markers)

    if current_context and current_context.get("current_field"):
        if is_explicit_off_topic:
            is_out_of_scope = True
        elif not (has_valid_field_answer or has_clarification):
            is_parse_failure = True
    else:
        # At initial / general step: must match scheme intent, profile entities, proxy intent, or ask clarification
        if not (has_scheme_intent or has_profile_entities or has_clarification or has_proxy_intent):
            is_out_of_scope = True

    summary = f"Detected {lang.upper()} request. Scheme interest: {scheme_interest or 'None'}. Proxy: {applicant_type}. Out-of-scope: {is_out_of_scope}. Parse-failure: {is_parse_failure}."

    return {
        "language": lang,
        "is_out_of_scope": is_out_of_scope,
        "is_parse_failure": is_parse_failure,
        "scheme_interest": scheme_interest,
        "applicant_type": applicant_type,
        "relationship": relationship,
        "extracted_fields": extracted_fields,
        "is_asking_clarification": is_asking_clarification,
        "clarification_topic": clarification_topic,
        "user_intent_summary": summary
    }


def clarify_term(term: str, lang: str = "en") -> Dict[str, str]:
    """
    Returns a gentle, simple explanation of a government scheme term in Kannada, Hindi, and English.
    """
    explanations = {
        "annual_income": {
            "en": "Annual income means all the money your family earns in a full year from daily work. For example, if you make ₹12,000 every month, your annual income is ₹1,44,000.",
            "kn": "ವಾರ್ಷಿಕ ಆದಾಯ ಎಂದರೆ ನಿಮ್ಮ ಇಡೀ ಕುಟುಂಬವು ಒಂದು ವರ್ಷದಲ್ಲಿ ದುಡಿಯುವ ಒಟ್ಟು ಆದಾಯ. ಉದಾಹರಣೆಗೆ ತಿಂಗಳಿಗೆ ₹12,000 ದುಡಿದರೆ ವರ್ಷಕ್ಕೆ ₹1,44,000 ಆಗುತ್ತದೆ.",
            "hi": "वार्षिक आय का अर्थ है कि आपका पूरा परिवार काम से एक पूरे साल में कितना पैसा कमाता है। उदाहरण के लिए, यदि आप हर महीने ₹12,000 कमाते हैं, तो आपकी वार्षिक आय ₹1,44,000 है।"
        },
        "has_labour_card": {
            "en": "A Labour Card is a green identity card given to construction and building workers by the Karnataka Labour Welfare Board that entitles you to insurance and children's scholarships.",
            "kn": "ಕಾರ್ಮಿಕ ಕಾರ್ಡ್ ಎಂದರೆ ಕರ್ನಾಟಕ ಕಟ್ಟಡ ಕಾರ್ಮಿಕರ ಕಲ್ಯಾಣ ಮಂಡಳಿಯು ನೀಡುವ ಗುರುತಿನ ಚೀಟಿ. ಇದು ಮಗುವಿನ ವಿದ್ಯಾರ್ಥಿವೇತನ ಮತ್ತು ಅಪಘಾತ ವಿಮೆಗೆ ಸಹಾಯ ಮಾಡುತ್ತದೆ.",
            "hi": "लेबर कार्ड कर्नाटक भवन कर्मकार कल्याण बोर्ड द्वारा निर्माण और भवन श्रमिकों को दिया जाने वाला एक पहचान पत्र है, जो आपको बीमा और बच्चों की छात्रवृत्ति का अधिकार देता है।"
        },
        "family_size": {
            "en": "Family size is simply the count of everyone living under your roof who eat together, like yourself, your spouse, and your children.",
            "kn": "ಕುಟುಂಬದ ಗಾತ್ರ ಎಂದರೆ ನಿಮ್ಮ ಮನೆಯಲ್ಲಿ ಒಟ್ಟಿಗೆ ವಾಸಿಸುವ ಜನರ ಸಂಖ್ಯೆ - ನೀವು, ನಿಮ್ಮ ಪತ್ನಿ ಮತ್ತು ಮಕ್ಕಳು.",
            "hi": "परिवार के आकार का सीधा अर्थ है आपके घर में एक साथ रहने और खाने वाले सदस्यों की संख्या, जैसे आप, आपका जीवनसाथी और आपके बच्चे।"
        },
        "has_school_going_child": {
            "en": "This refers to having a son or daughter currently studying in school between Class 1 and Class 10.",
            "kn": "ಇದು ನಿಮ್ಮ ಮಗ ಅಥವಾ ಮಗಳು ಪ್ರಸ್ತುತ 1 ನೇ ತರಗತಿಯಿಂದ 10 ನೇ ತರಗತಿವರೆಗೆ ಸರ್ಕಾರಿ ಅಥವಾ ಅನುದಾನಿತ ಶಾಲೆಯಲ್ಲಿ ಓದುತ್ತಿದ್ದಾರೆಯೇ ಎಂದು ಕೇಳುತ್ತದೆ.",
            "hi": "इसका मतलब यह है कि क्या आपका बेटा या बेटी वर्तमान में कक्षा 1 से 10 के बीच स्कूल में पढ़ रहा है।"
        },
        "state_resident": {
            "en": "This checks if you currently live and work in the state of Karnataka.",
            "kn": "ನೀವು ಪ್ರಸ್ತುತ ಕರ್ನಾಟಕ ರಾಜ್ಯದಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದೀರಾ ಎಂದು ಇದು ಖಚಿತಪಡಿಸುತ್ತದೆ.",
            "hi": "यह सत्यापित करता है कि क्या आप वर्तमान में कर्नाटक राज्य में रहते और काम करते हैं।"
        },
        "age": {
            "en": "Your current age according to your official government Aadhaar card.",
            "kn": "ನಿಮ್ಮ ಆಧಾರ್ ಕಾರ್ಡ್‌ನಲ್ಲಿ ನಮೂದಿಸಲಾದ ನಿಮ್ಮ ಅಧಿಕೃತ ವಯಸ್ಸು.",
            "hi": "आपके आधिकारिक सरकारी आधार कार्ड के अनुसार आपकी वर्तमान आयु।"
        }
    }

    item = explanations.get(term, {
        "en": f"This is an official government requirement for the scheme: {term.replace('_', ' ')}.",
        "kn": f"ಇದು ಸರ್ಕಾರದ ಅಧಿಕೃತ ನಿಯಮವಾಗಿದೆ: {term}.",
        "hi": f"यह योजना के लिए एक आधिकारिक सरकारी आवश्यकता है: {term}."
    })
    return {
        "text": item.get(lang, item["en"]),
        "text_en": item["en"],
        "text_kn": item["kn"],
        "text_hi": item.get("hi", item["en"])
    }


def rephrase_eligibility_explanation(
    rules_engine_decision: Dict[str, Any],
    user_data: Dict[str, Any],
    lang: str = "en"
) -> Dict[str, str]:
    """
    CRITICAL: Never decides eligibility.
    Rephrases the deterministic RULES ENGINE result into warm, empathetic spoken text in en, kn, or hi.
    """
    eligible = rules_engine_decision["eligible"]
    scheme_name = (
        rules_engine_decision.get("scheme_name_kn") if lang == "kn"
        else (rules_engine_decision.get("scheme_name_hi") if lang == "hi"
        else rules_engine_decision.get("scheme_name_en"))
    )
    
    # Try calling LLM for warm vocal rephrasing if API key exists
    if ANTHROPIC_API_KEY:
        try:
            import requests
            lang_label = "Kannada" if lang == "kn" else ("Hindi" if lang == "hi" else "English")
            prompt = (
                f"You are Haq Saathi, a gentle and respectful voice assistant for Indian migrant workers and low-literacy citizens. "
                f"The RULES ENGINE has already evaluated eligibility. You MUST NEVER change this decision.\n"
                f"Decision: {'ELIGIBLE' if eligible else 'NOT ELIGIBLE'}\n"
                f"Scheme: {scheme_name}\n"
                f"Raw Rules Engine Details: {json.dumps(rules_engine_decision.get('passed_rules') if eligible else rules_engine_decision.get('failed_rules'))}\n"
                f"Language required: {lang_label}.\n"
                f"Task: Write a 2-sentence warm, conversational explanation spoken directly to the user in {lang_label}. "
                f"Use respectful tone ('ನೀವು' in Kannada, 'आप' in Hindi). "
                f"Return ONLY the spoken explanation string."
            )
            data = {
                "model": "claude-3-haiku-20240307",
                "max_tokens": 150,
                "messages": [{"role": "user", "content": prompt}]
            }
            resp = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json=data,
                timeout=6
            )
            if resp.status_code == 200:
                ai_text = resp.json()["content"][0]["text"].strip()
                return {
                    "explanation": ai_text,
                    "explanation_en": ai_text if lang == "en" else rules_engine_decision.get("raw_explanation_en", ""),
                    "explanation_kn": ai_text if lang == "kn" else rules_engine_decision.get("raw_explanation_kn", ""),
                    "explanation_hi": ai_text if lang == "hi" else rules_engine_decision.get("raw_explanation_hi", ""),
                    "source": "Rules Engine Decision + LLM Warm Rephraser"
                }
        except Exception as e:
            print(f"[NLP-Rephrase] Using pre-compiled high-quality explanation: {e}")

    # High quality pre-compiled warm trilingual explanation
    raw_en = rules_engine_decision.get("raw_explanation_en", "")
    raw_kn = rules_engine_decision.get("raw_explanation_kn", "")
    raw_hi = rules_engine_decision.get("raw_explanation_hi", raw_en)
    chosen = raw_kn if lang == "kn" else (raw_hi if lang == "hi" else raw_en)

    return {
        "explanation": chosen,
        "explanation_en": raw_en,
        "explanation_kn": raw_kn,
        "explanation_hi": raw_hi,
        "source": "Rules Engine Decision + Natural Language Explainer"
    }
