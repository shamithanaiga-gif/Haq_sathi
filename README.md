# 🏛️ Haq Saathi (ಹಕ್ಕು ಸಾಥಿ / हक़ साथी)
### Voice-First, Consent-Governed Entitlement Navigator for Migrant Workers

> **Haq Saathi** is an accessible, voice-first, consent-based web application designed for migrant workers and low-literacy citizens across India. It supports **English (`en-IN`)**, **Kannada (`kn-IN`)**, and **Hindi (`hi-IN`)** throughout, helping users discover, verify eligibility for, and apply for government welfare schemes without confusing bureaucratic jargon, middlemen, or privacy infringements.

---

## 🌟 Core Architecture & Specification Compliance

1. **Trilingual Voice Interaction (Web Speech API)**:
   - Unified `speakAndListen(text, language, onResult)` helper used across every screen.
   - Real-time speech-to-text and text-to-speech with Kannada (`kn-IN`), Hindi (`hi-IN`), and Indian English (`en-IN`).
   - Single source of truth for language (`currentLanguage` mapped via `getSpeechCode()`); mid-session language switching updates the active voice immediately without page reload.
   - Continuous listening with 1.8s silence pause detection and live interim speech transcripts.

2. **Beneficiary Account System (Register, Demo OTP Login, Dashboard)**:
   - **Voice-Guided Register Flow**: 11 fields collected step-by-step with visual progress ("Step 3 of 11") and active field highlight:
     Full Name, 10-digit Phone, 12-digit Aadhaar (masked `XXXX XXXX 1234`), Annual Income, Ration Card No (optional), PAN (optional, masked `XXXXX1234X`), Present Address, Current Address ("same as present"), Occupation, Passport Photo (preview, <=2MB), DigiLocker checkbox.
   - **Mandatory Pre-Registration Review**: All 11 fields shown with "Edit" buttons before finalizing account creation.
   - **Demo OTP Login**: Phone number entry -> random 6-digit OTP displayed in a clearly labeled demo banner -> 30s resend cooldown, 5-attempt limit, and session token generation.
   - **User Dashboard (5 Dedicated Tabs)**:
     1. *Profile Summary*: Name, photo, masked Aadhaar, occupation, income, dependents count, and edit option.
     2. *"Schemes For You"*: Deterministic eligibility scan across ALL schemes, grouped into Eligible (green), Needs More Information (amber with "Answer these to check"), and Not Eligible (red/grey), with spoken summary on load.
     3. *My Applications*: History of submitted scheme applications with Acknowledgement IDs (`HS-KA-...`) and status (`Submitted (Prototype)`).
     4. *My Documents*: DigiLocker vault documents with Active / Revoked status badges and toggle button.
     5. *Recent Activity*: User-filtered audit timeline.
     6. *"Start New Application"*: Launches voice conversation flow, silently using registered fields via `getUserField()` without re-asking.

3. **Strict Rules Engine Separation (Zero-LLM Decision Policy)**:
   - **Critical Rule**: The LLM is **NEVER** permitted to decide, calculate, or alter welfare eligibility.
   - All criteria are evaluated by a **pure, deterministic JSON Rules Engine** (`backend/rules_engine.py`).
   - The NLP service is used exclusively for entity extraction, term clarifications, and rephrasing decisions into warm, compassionate speech.

4. **Strict Code-Level Out-of-Scope Guard**:
   - Every user utterance is validated at the code level.
   - If an off-topic utterance is detected, the state machine halts screen progression and speaks the standardized refusal message:
     - **English**: *"Sorry, I am Haq Saathi, an assistant for finding and applying for government welfare schemes. This is not something I can help with."*
     - **Kannada**: *"ಕ್ಷಮಿಸಿ, ನಾನು ಹಕ್ ಸಾಥಿ, ಸರ್ಕಾರಿ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕಲು ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಸಹಾಯ ಮಾಡುವ ಸಹಾಯಕ. ಇದು ನಾನು ಸಹಾಯ ಮಾಡಬಹುದಾದ ವಿಷಯವಲ್ಲ."*
     - **Hindi**: *"क्षमा करें, मैं हक़ साथी हूँ, सरकारी कल्याणकारी योजनाओं को खोजने और आवेदन करने के लिए एक सहायक। यह ऐसी चीज़ नहीं है जिसमें मैं मदद कर सकूँ।"*
   - The pending question is automatically re-asked.

5. **Family Member / Proxy Applications**:
   - Detects proxy intent (e.g. *"my father's ration card, he has no phone"*, *"ನನ್ನ ತಂದೆ"*, *"मेरे पिताजी"*).
   - Collects dependent details (name, age, relationship) and stores them in a distinct `dependents` array on the user's account — never merged into the primary user profile.
   - Clearly labels consent requests and audit entries (e.g. *"We need [Father's Name]'s income certificate"*).

6. **Consent Vault & Data Sovereignty**:
   - Documents reside in a simulated DigiLocker vault.
   - Every document request requires explicit consent (*"Allow"* / *"Don't Allow"* via voice or button).
   - All actions are logged to a user-scoped audit trail, with instant consent revocation.

7. **Data Persistence & Mandatory Review-Before-Submit**:
   - Centralized `saveUserField(phone, field, value)` and `getUserField(phone, field)` persist data across reloads.
   - Every submission point (Registration, Scheme Application) requires a review screen with field edit capability.

8. **Security & User Data Isolation**:
   - Multi-user data store in `data/users_db.json`.
   - Cross-user data access is strictly prevented with HTTP `403 Forbidden` verification.
   - Sensitive numbers (Aadhaar, PAN) are masked everywhere.

---

## 📁 Repository Structure

```
haq-saathi/
├── data/
│   ├── schemes_rules.json       # 4 welfare schemes with English, Kannada, and Hindi rules & text
│   ├── users_db.json            # Multi-user persistent account store (keyed by phone number)
│   ├── form_templates.json      # Form templates mapping fields to profile or DigiLocker docs
│   ├── mock_document_vault.json # Simulated DigiLocker documents
│   └── audit_log.json           # Append-only consent audit trail
├── backend/
│   ├── main.py                  # FastAPI application server with multi-user auth & scan endpoints
│   ├── user_store.py            # User accounts, masked identifiers, demo OTP, and proxy dependents
│   ├── rules_engine.py          # Deterministic JSON rules engine & full schemes scan
│   ├── nlp_service.py           # Trilingual intent parser, proxy detector, and warm explainer
│   └── vault_service.py         # Mock DigiLocker adapter, form pre-filler, user-scoped audit logger
├── frontend/
│   ├── index.html               # Mobile-first React 18 single-page application container
│   ├── manifest.json            # PWA manifest
│   ├── css/
│   │   └── style.css            # Accessible, high-contrast, touch-friendly styling
│   └── js/
│       ├── app.js               # React UI components (Dashboard, Register, Login, Voice Flow)
│       ├── voice.js             # Web Speech API STT/TTS singleton with silence pause detection
│       ├── api.js               # REST client for all backend endpoints
│       └── i18n.js              # Comprehensive trilingual dictionaries (en, kn, hi)
├── run.py                       # Server entry point
├── test_section10_e2e.py        # 10-step Section 10 verification test suite
├── test_backend.py              # Backend unit tests
├── test_voice_flow.py           # Pure voice scenario simulation
├── test_out_of_scope.py         # Out-of-scope refusal safeguards test
├── requirements.txt             # Python dependencies
└── README.md                    # Project documentation
```

---

## 🚀 Getting Started

### 1. Requirements
- Python 3.10+
- Installed packages: `fastapi`, `uvicorn`, `requests`, `pydantic`

### 2. Running the Application
From the project directory:
```bash
python run.py
```
Then open your browser at:
👉 **`http://127.0.0.1:8000`**

### 3. Running the Verification Suite
Execute the Section 11 End-to-End automated test suite:
```bash
python test_section11_e2e.py
```

---

## 🔒 Scalable HTTPS & Ingress Layer

HTTPS is mandatory for modern mobile browsers to grant **Microphone permissions** to the Web Speech API and enable Service Worker PWA installation.

### Production Containerized Deployment (Docker Compose)
- **NGINX + Let's Encrypt**:
  ```bash
  cp .env.example .env
  ./scripts/init_letsencrypt.sh
  ```
- **Zero-Touch Caddy Server**:
  ```bash
  export DOMAIN="haqsaathi.org"
  docker compose -f docker-compose.caddy.yml up -d
  ```

### Mobile Smartphone Testing (Zero-Domain Setup)
Test microphone input on physical Android & iOS devices over Wi-Fi without buying a domain:
```bash
# Instant Cloudflare Quick Tunnel (Public HTTPS, zero signup)
python run_local_https.py --mode tunnel

# Or Local Wi-Fi LAN TLS (https://<LAN-IP>:8443)
python run_local_https.py --mode lan

# Verify HTTPS ingress configuration:
python test_https_ingress.py
```
For detailed configuration, see the [HTTPS Deployment Guide](file:///c:/Users/shrey/Downloads/final/HTTPS_DEPLOYMENT_GUIDE.md).

---

## 👤 Pre-Seeded Demo Persona: Ramesh Naik

- **Phone**: `9876543210` (Quick login via Demo OTP)
- **Origin**: Migrated from **Kalaburagi** to **Bengaluru**
- **Occupation**: Construction Labourer / Masonry Worker (`construction_worker`)
- **Income**: ₹12,000 / month (₹1,44,000 / year)
- **Aadhaar**: `XXXX XXXX 8912`
- **Family Size**: 4 members
- **Active Dependent**: Father Basappa Naik (Age: 68)
