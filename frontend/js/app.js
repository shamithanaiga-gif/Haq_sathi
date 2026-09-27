// Haq Saathi - React Application Component (Full Trilingual Voice-Driven Flow)
// Meets all requirements for Accounts, Schemes Scan, Voice Assistant, Out-of-Scope Guards, Proxy Applications, and Mandatory Review.

const { useState, useEffect, useRef } = React;

const DEFAULT_SCHEMES = [
  {
    id: "ration_card",
    name_en: "Karnataka Ahara BPL Ration Card (Priority Household)",
    name_kn: "ಕರ್ನಾಟಕ ಆಹಾರ ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ (ಆದ್ಯತಾ ಕುಟುಂಬ)",
    name_hi: "कर्नाटक अहारा बीपीएल राशन कार्ड (प्राथमिकता गृहस्थी)",
    department_en: "Food, Civil Supplies & Consumer Affairs Dept, Govt. of Karnataka",
    department_kn: "ಆಹಾರ ಮತ್ತು ನಾಗರಿಕ ಸರಬರಾಜು ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ",
    benefit_en: "Subsidized food grains (5kg rice/person free under Anna Bhagya), sugar, kerosene, and official BPL identity card.",
    benefit_kn: "ಅನ್ನಭಾಗ್ಯ ಯೋಜನೆಯಡಿ ಪ್ರತಿ ವ್ಯಕ್ತಿಗೆ ತಿಂಗಳಿಗೆ 5 ಕೆಜಿ ಉಚಿತ ಅಕ್ಕಿ ಮತ್ತು ರಿಯಾಯಿತಿ ದರದಲ್ಲಿ ಅಗತ್ಯ ಆಹಾರ ಧಾನ್ಯಗಳು.",
    benefit_hi: "अन्न भाग्य योजना के तहत प्रति व्यक्ति 5 किलोग्राम मुफ्त चावल और रियायती खाद्यान्न।",
    required_fields: ["annual_income", "family_size", "state_resident", "occupation"]
  },
  {
    id: "health_cover",
    name_en: "Ayushman Bharat - Arogya Karnataka (AB-ArK)",
    name_kn: "ಆಯುಷ್ಮಾನ್ ಭಾರತ್ - ಆರೋಗ್ಯ ಕರ್ನಾಟಕ",
    name_hi: "आयुष्मान भारत - आरोग्य कर्नाटक",
    department_en: "Health and Family Welfare Department, Govt. of Karnataka",
    department_kn: "ಆರೋಗ್ಯ ಮತ್ತು ಕುಟುಂಬ ಕಲ್ಯಾಣ ಇಲಾಖೆ, ಕರ್ನಾಟಕ ಸರ್ಕಾರ",
    benefit_en: "Free cash-less secondary and tertiary healthcare up to ₹5,00,000 per family per year in empanelled hospitals.",
    benefit_kn: "ಸರ್ಕಾರಿ ಮತ್ತು ನೋಂದಾಯಿತ ಖಾಸಗಿ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ವರ್ಷಕ್ಕೆ ₹5,00,000 ದವರೆಗೆ ಸಂಪೂರ್ಣ ಉಚಿತ ಚಿಕಿತ್ಸೆ ಮತ್ತು ಶಸ್ತ್ರಚಿಕಿತ್ಸೆ.",
    benefit_hi: "प्रति परिवार प्रति वर्ष ₹5,00,000 तक मुफ्त कैशलेस माध्यमिक और तृतीयक स्वास्थ्य सेवा।",
    required_fields: ["annual_income", "family_size", "state_resident"]
  },
  {
    id: "child_scholarship",
    name_en: "Karnataka BOCW Pre-Matric Construction Worker Child Scholarship",
    name_kn: "ಕರ್ನಾಟಕ ಕಟ್ಟಡ ಕಾರ್ಮಿಕರ ಮಕ್ಕಳ ಪ್ರೀ-ಮೆಟ್ರಿಕ್ ವಿದ್ಯಾರ್ಥಿವೇತನ (BOCW)",
    name_hi: "कर्नाटक निर्माण श्रमिक बाल छात्रवृत्ति",
    department_en: "Karnataka Building & Other Construction Workers Welfare Board",
    department_kn: "ಕರ್ನಾಟಕ ಕಟ್ಟಡ ಮತ್ತು ಇತರೆ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕರ ಕಲ್ಯಾಣ ಮಂಡಳಿ",
    benefit_en: "Direct bank transfer of ₹3,000 to ₹10,000 annual education grant for children of registered construction workers.",
    benefit_kn: "ನೋಂದಾಯಿತ ಕಟ್ಟಡ ಕಾರ್ಮಿಕರ ಮಕ್ಕಳಿಗೆ ವಾರ್ಷಿಕ ₹3,000 ರಿಂದ ₹10,000 ವರೆಗೆ ಶೈಕ್ಷಣಿಕ ಧನಸಹಾಯ.",
    benefit_hi: "पंजीकृत निर्माण श्रमिकों के बच्चों के लिए ₹3,000 से ₹10,000 तक की वार्षिक शिक्षा छात्रवृत्ति।",
    required_fields: ["has_labour_card", "has_school_going_child", "state_resident"]
  },
  {
    id: "pension",
    name_en: "Sandhya Suraksha Senior Citizen Social Security Pension",
    name_kn: "ಸಂಧ್ಯಾ ಸುರಕ್ಷಾ ಹಿರಿಯ ನಾಗರಿಕರ ಸಾಮಾಜಿಕ ಭದ್ರತಾ ಪಿಂಚಣಿ ಯೋಜನೆ",
    name_hi: "संध्या सुरक्षा वरिष्ठ नागरिक पेंशन योजना",
    department_en: "Revenue Department (Social Security), Govt. of Karnataka",
    department_kn: "ಕಂದಾಯ ಇಲಾಖೆ (ಸಾಮಾಜಿಕ ಭದ್ರತೆ), ಕರ್ನಾಟಕ ಸರ್ಕಾರ",
    benefit_en: "Monthly direct bank transfer of ₹1,000 lifelong financial pension for low-income senior citizens aged 65 and above.",
    benefit_kn: "65 ವರ್ಷ ಮೇಲ್ಪಟ್ಟ ಕಡಿಮೆ ಆದಾಯದ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಮಾಸಿಕ ₹1,000 ಜೀವಿತಾವಧಿ ಆರ್ಥಿಕ ಪಿಂಚಣಿ.",
    benefit_hi: "65 वर्ष और उससे अधिक आयु के कम आय वाले वरिष्ठ नागरिकों के लिए मासिक ₹1,000 की आजीवन पेंशन।",
    required_fields: ["age", "annual_income", "state_resident"]
  }
];

function HaqSaathiApp() {
  // Single source of truth for language: 'kn' | 'hi' | 'en'
  const [lang, setLang] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem('haq_lang')) || 'kn');
  const [hasStartedAudio, setHasStartedAudio] = useState(() => (typeof localStorage !== 'undefined' && !!localStorage.getItem('haq_lang')));
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const u = typeof localStorage !== 'undefined' && localStorage.getItem('haq_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  });
  const [sessionToken, setSessionToken] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem('haq_token')) || null);
  const [currentScreen, setCurrentScreen] = useState(() => (typeof localStorage !== 'undefined' && localStorage.getItem('haq_phone')) ? 'dashboard' : 'login'); // 'login' | 'register' | 'register_review' | 'dashboard' | 'scheme_flow'
  const [activeTab, setActiveTab] = useState('schemes'); // 'schemes' | 'profile' | 'applications' | 'documents' | 'activity'
  
  // Auth state
  const [loginStep, setLoginStep] = useState('phone_input'); // 'lang_select' | 'phone_input'
  const [loginPhone, setLoginPhone] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [demoOtpBanner, setDemoOtpBanner] = useState(null);
  const [otpCooldown, setOtpCooldown] = useState(0);
  const [otpAttemptsLeft, setOtpAttemptsLeft] = useState(5);
  const [authError, setAuthError] = useState('');
  const [speechParseError, setSpeechParseError] = useState('');

  // Register wizard state (11 fields)
  const [regStep, setRegStep] = useState(1);
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    aadhaar_number: '',
    annual_income: 144000,
    ration_card_number: '',
    no_ration_card: false,
    pan_number: '',
    present_address: '',
    current_address: '',
    same_address: true,
    occupation: 'construction_worker',
    photo_url: '',
    has_digilocker: true,
    digilocker_id: ''
  });
  const [regError, setRegError] = useState('');
  const [isSubmittingReg, setIsSubmittingReg] = useState(false);

  // Dashboard & schemes scan state
  const [schemes, setSchemes] = useState(DEFAULT_SCHEMES);
  const [scanResults, setScanResults] = useState(null);
  const [isBreakSearchActive, setIsBreakSearchActive] = useState(false);
  const [isSubmittingApplication, setIsSubmittingApplication] = useState(false);
  const [userApplications, setUserApplications] = useState([]);
  const [vaultDocs, setVaultDocs] = useState({});
  const [userAuditLogs, setUserAuditLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Missing fields answer modal (from "Answer these to check")
  const [missingFieldsModal, setMissingFieldsModal] = useState(null); // { scheme, missing_fields: [], current_index: 0, answers: {} }

  // Core single-scheme / proxy voice flow state
  const [activeSchemeId, setActiveSchemeId] = useState('ration_card');
  const [applicantType, setApplicantType] = useState('self'); // 'self' | 'family_member'
  const [proxyDependent, setProxyDependent] = useState(null); // { name, age, relationship }
  const [flowStep, setFlowStep] = useState('greeting'); // 'greeting' | 'questioning' | 'eligibility' | 'consent' | 'review' | 'submitted'
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [schemeTypedAnswer, setSchemeTypedAnswer] = useState('');
  const [clarification, setClarification] = useState(null);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [eligibilityError, setEligibilityError] = useState(null);
  const [declarationAgreed, setDeclarationAgreed] = useState(false);
  const [consents, setConsents] = useState({});
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [prefilledForm, setPrefilledForm] = useState(null);
  const [submittedApp, setSubmittedApp] = useState(null);
  const [printReceiptApp, setPrintReceiptApp] = useState(null);
  const [detailsModalApp, setDetailsModalApp] = useState(null);

  // Voice controller state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [interimText, setInterimText] = useState('');
  const [conversationHistory, setConversationHistory] = useState([]);

  // Active language dictionary
  const t = I18N[lang] || I18N.en;

  // Initialize data on mount
  useEffect(() => {
    const savedPhone = localStorage.getItem('haq_phone');
    const savedToken = localStorage.getItem('haq_token');
    const savedLang = localStorage.getItem('haq_lang');
    if (savedLang) {
      setLang(savedLang);
    }
    
    // Register voice state listener
    if (window.voiceCtrl) {
      window.voiceCtrl.onStateChangeCallback = (state) => {
        setIsListening(state.isListening);
        setIsSpeaking(state.isSpeaking);
      };
      window.voiceCtrl.setLanguage(savedLang || lang);
    }

    // Load available schemes from backend
    api.getSchemes().then((res) => {
      if (Array.isArray(res) && res.length > 0) {
        setSchemes(res);
      }
    }).catch((e) => console.warn('Schemes load fallback:', e));

    if (savedPhone) {
      setCurrentScreen('dashboard');
      loadDashboardData(savedPhone, savedToken, false);
    } else {
      setCurrentScreen('login');
      setLoginStep('phone_input');
    }
  }, []);

  // Safeguard: Ensure dashboard screen is never left hanging without currentUser
  useEffect(() => {
    if (currentScreen === 'dashboard' && !currentUser) {
      const savedPhone = typeof localStorage !== 'undefined' ? localStorage.getItem('haq_phone') : null;
      if (savedPhone) {
        const u = localStorage.getItem('haq_user');
        if (u) {
          try { setCurrentUser(JSON.parse(u)); return; } catch (e) {}
        }
      }
      setCurrentScreen('login');
      setLoginStep('phone_input');
    }
  }, [currentScreen, currentUser]);

  // Sync voice controller language when lang changes
  useEffect(() => {
    if (window.voiceCtrl) {
      window.voiceCtrl.setLanguage(lang);
    }
  }, [lang]);

  // OTP cooldown timer countdown
  useEffect(() => {
    let timer = null;
    if (otpCooldown > 0) {
      timer = setInterval(() => {
        setOtpCooldown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // Application reconciliation helper: merges server applications with persistent local cache
  const reconcileUserApplications = (incomingApps = [], phone = null) => {
    const userPhone = phone || (currentUser ? currentUser.phone : localStorage.getItem('haq_phone'));
    const localKey = userPhone ? `haq_apps_${userPhone}` : 'haq_apps';
    let cachedApps = [];
    try {
      cachedApps = JSON.parse(localStorage.getItem(localKey) || '[]');
    } catch (e) {}

    const mergedMap = new Map();
    // 1. Server-persisted applications take high priority
    (incomingApps || []).forEach(a => {
      const k = a.reference_id || a.app_id;
      if (k) mergedMap.set(k, a);
    });
    // 2. Client cached applications merged (ensuring zero loss during async propagation)
    cachedApps.forEach(a => {
      const k = a.reference_id || a.app_id;
      if (k && !mergedMap.has(k)) {
        mergedMap.set(k, a);
      }
    });

    const mergedList = Array.from(mergedMap.values());
    if (mergedList.length > 0) {
      try {
        localStorage.setItem(localKey, JSON.stringify(mergedList));
      } catch (e) {}
    }
    return mergedList;
  };

  // Load user data and scan schemes (FIX 1 & 2: Speaks specific named schemes)
  const loadDashboardData = async (phone, token = null, speakSummary = true) => {
    setIsLoading(true);
    try {
      const res = await api.getDashboard(phone, token, lang);
      if (res && res.user) {
        setCurrentUser(res.user);
        setSessionToken(token);
        localStorage.setItem('haq_phone', res.user.phone);
        localStorage.setItem('haq_user', JSON.stringify(res.user));
        if (token) localStorage.setItem('haq_token', token);
        setScanResults(res.scan_results);
        const reconciled = reconcileUserApplications(res.applications || (res.user && res.user.applications) || [], res.user.phone);
        setUserApplications(reconciled);
        setVaultDocs(res.vault_permissions || {});
        setUserAuditLogs(res.audit_logs || []);
        setCurrentScreen('dashboard');

        // Automatically speak the specific eligible schemes by name!
        if (speakSummary && res.scan_results) {
          const spokenSummary = (lang === 'kn' && res.scan_results.summary_kn)
            ? res.scan_results.summary_kn
            : ((lang === 'hi' && res.scan_results.summary_hi)
                ? res.scan_results.summary_hi
                : res.scan_results.summary_en);

          if (spokenSummary) {
            console.log("[Dashboard] Speaking eligibility scan summary:", spokenSummary);
            speakAndListen(spokenSummary, lang, null, { listenAfter: false });
          }
        }
      } else if (!currentUser && !phone) {
        // Direct to login only if no profile found and no phone passed
        setCurrentScreen('login');
      }
    } catch (e) {
      console.warn('Dashboard load fallback:', e);
      if (phone) {
        const cached = reconcileUserApplications([], phone);
        if (cached && cached.length > 0) {
          setUserApplications(cached);
        }
      }
      if (!currentUser && !phone) {
        setCurrentScreen('login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatAppDate = (dateInput) => {
    if (!dateInput) {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
    try {
      const d = new Date(dateInput);
      if (isNaN(d.getTime())) return String(dateInput);
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch (e) {
      return String(dateInput);
    }
  };

  const handleOpenPrintBill = (app) => {
    if (!app) return;
    const refId = app.reference_id || (app.acknowledgement_id || app.app_id ? `REF-${(app.acknowledgement_id || app.app_id).replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase()}` : 'REF-UNKNOWN');
    const enriched = {
      ...app,
      reference_id: refId,
      applicant_name: app.applicant_name || (currentUser ? currentUser.name : 'Self'),
      applicant_type: app.applicant_type || 'self',
      status: app.application_status || app.status || 'Applied',
      submitted_at: app.submitted_at || new Date().toISOString()
    };
    setPrintReceiptApp(enriched);
  };

  const handleUpdateStatus = async (refOrAppId, newStatus) => {
    if (!currentUser || !currentUser.phone) return;
    setIsLoading(true);
    try {
      const res = await api.updateApplicationStatus(currentUser.phone, refOrAppId, newStatus);
      if (res && res.status === 'success') {
        setUserApplications((prev) => prev.map((a) => {
          if (a.reference_id === refOrAppId || a.app_id === refOrAppId) {
            return { ...a, status: newStatus };
          }
          return a;
        }));
        if (detailsModalApp && (detailsModalApp.reference_id === refOrAppId || detailsModalApp.app_id === refOrAppId)) {
          setDetailsModalApp((prev) => ({ ...prev, status: newStatus }));
        }
        if (submittedApp && (submittedApp.reference_id === refOrAppId || submittedApp.acknowledgement_id === refOrAppId)) {
          setSubmittedApp((prev) => ({ ...prev, application_status: newStatus, status: newStatus }));
        }
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatusBadge = (status) => {
    const norm = (status || 'Submitted (Prototype)').toLowerCase();
    let badgeClass = 'status-applied';
    let label = 'Submitted (Prototype) 🏛️';
    if (norm.includes('review')) {
      badgeClass = 'status-under-review';
      label = 'Under Review ⏳';
    } else if (norm.includes('approved')) {
      badgeClass = 'status-approved';
      label = 'Approved 🎉';
    } else if (norm.includes('rejected')) {
      badgeClass = 'status-rejected';
      label = 'Rejected ❌';
    } else if (norm.includes('prototype') || norm.includes('applied') || norm.includes('submitted')) {
      badgeClass = 'status-applied';
      label = 'Submitted (Prototype) 🏛️';
    }
    return <span className={`status-badge ${badgeClass}`}>{label}</span>;
  };

  const renderStatusStepper = (status) => {
    const norm = (status || 'Submitted (Prototype)').toLowerCase();
    const isApplied = true;
    const isUnderReview = norm.includes('review') || norm.includes('approved');
    const isApproved = norm.includes('approved');
    const isRejected = norm.includes('rejected');

    return (
      <div className="status-stepper" aria-label="Application Status Stages">
        <div className={`stepper-step ${isApplied ? 'active' : ''}`}>
          <div className="stepper-circle">{isApplied ? '✓' : '1'}</div>
          <div className="stepper-label">Submitted (Prototype)</div>
        </div>
        <div className={`stepper-line ${isUnderReview ? 'active' : ''}`} />
        <div className={`stepper-step ${isUnderReview ? 'active' : ''}`}>
          <div className="stepper-circle">{isUnderReview ? '✓' : '2'}</div>
          <div className="stepper-label">Under Review</div>
        </div>
        <div className={`stepper-line ${isApproved ? 'active' : (isRejected ? 'rejected' : '')}`} />
        <div className={`stepper-step ${isApproved ? 'active' : (isRejected ? 'rejected' : '')}`}>
          <div className="stepper-circle">{isApproved ? '✓' : (isRejected ? '✕' : '3')}</div>
          <div className="stepper-label">{isRejected ? 'Rejected' : 'Approved'}</div>
        </div>
      </div>
    );
  };

  const renderApplicationCard = (app) => {
    const refId = app.reference_id || (app.app_id ? `REF-${app.app_id.replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase()}` : 'REF-UNKNOWN');
    const formattedDate = formatAppDate(app.submitted_at);
    const schemeTitle = app.scheme_title || app.scheme_name || (app.scheme_id ? app.scheme_id.replace(/_/g, ' ').toUpperCase() : 'Welfare Scheme Application');

    return (
      <div key={app.app_id || refId} id={`app_card_${refId}`} className="app-dashboard-card step-card" style={{ marginBottom: '14px' }}>
        <div className="app-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>
              Application
            </div>
            <h4 className="app-scheme-title" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '4px 0 2px 0' }}>
              {schemeTitle}
            </h4>
          </div>
          <div>
            {renderStatusBadge(app.status)}
          </div>
        </div>

        <div className="app-card-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
          <div className="app-meta-item">
            <span className="app-meta-label" style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Reference ID</span>
            <span className="app-meta-value app-ref-id" style={{ fontFamily: 'monospace', fontWeight: 700, color: '#0369a1', fontSize: '13px' }}>
              "{refId}"
            </span>
          </div>
          <div className="app-meta-item">
            <span className="app-meta-label" style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Status</span>
            <span className="app-meta-value" style={{ fontWeight: 600, fontSize: '13px' }}>
              "{app.status || 'Applied'}"
            </span>
          </div>
          <div className="app-meta-item">
            <span className="app-meta-label" style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Date</span>
            <span className="app-meta-value" style={{ fontWeight: 600, fontSize: '13px' }}>
              {formattedDate}
            </span>
          </div>
          <div className="app-meta-item">
            <span className="app-meta-label" style={{ fontSize: '11px', color: '#64748b', display: 'block' }}>Applicant</span>
            <span className="app-meta-value" style={{ fontSize: '13px', color: '#334155' }}>
              {app.applicant_name || 'Self'} ({app.applicant_type || 'self'})
            </span>
          </div>
        </div>

        {/* Dynamic Status Stepper */}
        <div style={{ margin: '10px 0 14px 0' }}>
          {renderStatusStepper(app.status)}
        </div>

        {/* Action Buttons */}
        <div className="app-card-actions" style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
          <button
            id={`btn_view_details_${refId}`}
            className="btn-view-details"
            onClick={() => setDetailsModalApp({ ...app, reference_id: refId })}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '9px 16px',
              borderRadius: '7px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#1e293b',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            👁️ View Details
          </button>

          <button
            id={`btn_print_bill_${refId}`}
            className="btn-print-bill"
            onClick={() => handleOpenPrintBill({ ...app, reference_id: refId })}
            style={{
              flex: 1,
              minWidth: '120px',
              padding: '9px 16px',
              borderRadius: '7px',
              border: '1px solid #0284c7',
              background: '#f0f9ff',
              color: '#0284c7',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            🖨️ Print Bill
          </button>
        </div>
      </div>
    );
  };

  /**
   * Centralized speakAndListen helper used everywhere across the application (Section 4)
   */
  const speakAndListen = (text, targetLang = lang, onResult = null, options = {}) => {
    const chosenLang = targetLang || lang;
    if (!window.voiceCtrl) return;

    window.voiceCtrl.speakAndListen(
      text,
      chosenLang,
      (speechResult) => {
        const cleanText = (typeof speechResult === 'string' ? speechResult : '').trim();
        if (!cleanText) return;
        setVoiceText('');
        setInterimText('');
        setIsProcessingVoice(true);

        try {
          if (onResult) {
            onResult(cleanText);
          } else {
            handleUniversalVoiceRouter(cleanText, chosenLang);
          }
        } finally {
          setTimeout(() => setIsProcessingVoice(false), 800);
        }
      },
      {
        listenAfter: options.listenAfter !== false,
        onInterim: (interim) => setInterimText(interim),
        onStateChange: (state) => {
          setIsListening(state.isListening);
          setIsSpeaking(state.isSpeaking);
        }
      }
    );

    if (text) {
      addConversationBubble('assistant', text);
    }
  };

  const addConversationBubble = (sender, text) => {
    setConversationHistory((prev) => [
      ...prev.slice(-15), // Keep recent 15 entries
      {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        sender,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const stopAudio = () => {
    if (window.voiceCtrl) {
      window.voiceCtrl.stopSpeaking();
      window.voiceCtrl.stopListening();
    }
    setIsSpeaking(false);
    setIsListening(false);
    setIsProcessingVoice(false);
  };

  const toggleLanguage = (newLang) => {
    setLang(newLang);
    const ackMessages = {
      kn: "ಕನ್ನಡ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ಈಗ ನೀವು ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಬಹುದು.",
      hi: "हिन्दी भाषा चुनी गई है। अब आप हिन्दी में बोल सकते हैं।",
      en: "Switched to English. You can now speak in English."
    };
    const ack = ackMessages[newLang] || ackMessages.en;
    speakAndListen(ack, newLang, null, { listenAfter: false });
  };

  // =====================================================================
  // Registration Wizard Voice Guidance (Section 2, 4, 8)
  // =====================================================================
  const REG_FIELD_NAMES = [
    'name', 'phone', 'aadhaar_number', 'annual_income', 'ration_card_number',
    'pan_number', 'present_address', 'current_address', 'occupation', 'photo_url', 'has_digilocker'
  ];

  const getRegStepPrompt = (step) => {
    const prompts = {
      1: {
        en: "Step 1 of 11: Please tell us your Full Name.",
        kn: "ಹಂತ 1: ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ತಿಳಿಸಿ.",
        hi: "चरण 1: कृपया अपना पूरा नाम बताएं।"
      },
      2: {
        en: "Step 2 of 11: Please provide your 10-digit mobile number.",
        kn: "ಹಂತ 2: ನಿಮ್ಮ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.",
        hi: "चरण 2: कृपया अपना 10 अंकों का मोबाइल नंबर बताएं।"
      },
      3: {
        en: "Step 3 of 11: Please enter your 12-digit Aadhaar Card number.",
        kn: "ಹಂತ 3: ನಿಮ್ಮ 12 ಅಂಕಿಗಳ ಆಧಾರ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆಯನ್ನು ತಿಳಿಸಿ.",
        hi: "चरण 3: कृपया अपना 12 अंकों का आधार कार्ड नंबर दर्ज करें।"
      },
      4: {
        en: "Step 4 of 11: What is your family's annual income in rupees?",
        kn: "ಹಂತ 4: ನಿಮ್ಮ ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಒಟ್ಟು ಆದಾಯ ಎಷ್ಟು?",
        hi: "चरण 4: आपके परिवार की वार्षिक आय कितनी है?"
      },
      5: {
        en: "Step 5 of 11: Do you have a Ration Card number? You can also say 'I don't have one'.",
        kn: "ಹಂತ 5: ನಿಮ್ಮ ಬಳಿ ರೇಷನ್ ಕಾರ್ಡ್ ಇದೆಯೇ? 'ನನ್ನ ಬಳಿ ಇಲ್ಲ' ಎಂದೂ ಹೇಳಬಹುದು.",
        hi: "चरण 5: क्या आपके पास राशन कार्ड है? आप 'नहीं है' भी कह सकते हैं।"
      },
      6: {
        en: "Step 6 of 11: Please provide your PAN Card number, or say 'Skip'.",
        kn: "ಹಂತ 6: ನಿಮ್ಮ ಪ್ಯಾನ್ ಕಾರ್ಡ್ ಸಂಖ್ಯೆ ತಿಳಿಸಿ, ಅಥವಾ 'ಮುಂದೆ ಹೋಗಿ' ಎಂದು ಹೇಳಿ.",
        hi: "चरण 6: कृपया अपना पैन कार्ड नंबर बताएं, या 'छोड़ें' कहें।"
      },
      7: {
        en: "Step 7 of 11: What is your present address in Karnataka?",
        kn: "ಹಂತ 7: ಕರ್ನಾಟಕದಲ್ಲಿ ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವಿಳಾಸವನ್ನು ತಿಳಿಸಿ.",
        hi: "चरण 7: कर्नाटक में आपका वर्तमान पता क्या है?"
      },
      8: {
        en: "Step 8 of 11: Is your native address the same as your present address?",
        kn: "ಹಂತ 8: ನಿಮ್ಮ ಊರಿನ ವಿಳಾಸ ಮತ್ತು ಪ್ರಸ್ತುತ ವಿಳಾಸ ಒಂದೇ ಆಗಿದೆಯೇ?",
        hi: "चरण 8: क्या आपका स्थायी पता वर्तमान पते के समान है?"
      },
      9: {
        en: "Step 9 of 11: What is your daily wage occupation or trade?",
        kn: "ಹಂತ 9: ನಿಮ್ಮ ದೈನಂದಿನ ಕಾಯಕ ಅಥವಾ ಉದ್ಯೋಗ ಯಾವುದು?",
        hi: "चरण 9: आपका व्यवसाय या दैनिक कार्य क्या है?"
      },
      10: {
        en: "Step 10 of 11: Please upload a passport-size photo under 2MB.",
        kn: "ಹಂತ 10: 2MB ಗಿಂತ ಕಡಿಮೆ ಅಳತೆಯ ಪಾಸ್‌ಪೋರ್ಟ್ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ.",
        hi: "चरण 10: कृपया 2MB से कम आकार का पासपोर्ट फोटो अपलोड करें।"
      },
      11: {
        en: "Step 11 of 11: Do you have an active DigiLocker account? Say Yes or No.",
        kn: "ಹಂತ 11: ನಿಮ್ಮ ಬಳಿ ಡಿಜಿಲಾಕರ್ ಖಾತೆ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ತಿಳಿಸಿ.",
        hi: "चरण 11: क्या आपके पास सक्रिय डिजीलॉकर खाता है? हाँ या नहीं कहें।"
      }
    };
    return (prompts[step] && prompts[step][lang]) || prompts[step]?.en || "";
  };

  // =====================================================================
  // Trilingual Language Selection on Login (FIX 2)
  // =====================================================================
  const triggerTrilingualLanguagePrompt = () => {
    const trilingualMsg = "Please choose your language. English, Hindi, or Kannada? कृपया अपनी भाषा चुनें। अंग्रेज़ी, हिंदी, या कन्नड़? ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ, ಅಥವಾ ಕನ್ನಡ?";
    console.log("[App] Triggering trilingual language prompt:", trilingualMsg);

    if (window.voiceCtrl && window.voiceCtrl.speakTrilingualLanguagePrompt) {
      window.voiceCtrl.speakTrilingualLanguagePrompt((detectedLang) => {
        handleSelectLanguageChoice(detectedLang);
      });
    } else {
      speakAndListen(trilingualMsg, 'en', (spoken) => {
        const detected = window.voiceCtrl ? window.voiceCtrl.detectLanguageFromSpeech(spoken) : null;
        if (detected) {
          handleSelectLanguageChoice(detected);
        }
      });
    }
  };

  const handleSelectLanguageChoice = (chosenLang) => {
    console.log("[App] Language selected:", chosenLang);
    setLang(chosenLang);
    setHasStartedAudio(true);
    if (window.voiceCtrl) {
      window.voiceCtrl.setLanguage(chosenLang);
    }
    localStorage.setItem('haq_lang', chosenLang);

    // Proceed to phone number field on Login page
    setLoginStep('phone_input');

    // FIX 2: Phone number field should ONLY accept typed keyboard input.
    // Speak short confirmation in that chosen language, but DO NOT open mic (listenAfter: false).
    const phonePrompts = {
      kn: "ಸರಿ, ಕನ್ನಡ ಆಯ್ಕೆಯಾಗಿದೆ. ಲಾಗಿನ್ ಮಾಡಲು ನಿಮ್ಮ 10 ಅಂಕಿಗಳ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ.",
      hi: "ठीक है, हिंदी चुनी गई है। लॉग इन करने के लिए अपना 10 अंकों का मोबाइल नंबर टाइप करें।",
      en: "English selected. Please enter your 10-digit mobile number to log in."
    };
    speakAndListen(phonePrompts[chosenLang] || phonePrompts.en, chosenLang, null, { listenAfter: false });
  };

  // =====================================================================
  // Registration Wizard Voice Guidance & Typing-Only Handlers
  // =====================================================================
  const isVoiceStep = (step) => {
    // FIX 2 & FIX 3: Fields that KEEP voice: 1 (Full Name), 7 (Present Address), 8 (Current Address), 11 (DigiLocker Yes/No).
    // Numeric fields (Phone, Aadhaar, Income, PAN) and Occupation are strictly TYPED ONLY.
    return step === 1 || step === 7 || step === 8 || step === 11;
  };

  const startRegisterFlow = () => {
    setCurrentScreen('register');
    setRegStep(1);
    if (window.voiceCtrl) {
      window.voiceCtrl.setLanguage(lang);
    }
    const p = getRegStepPrompt(1);
    // Step 1: Full Name is voice-enabled
    speakAndListen(p, lang, (answer) => handleRegisterVoiceInput(answer, 1));
  };

  const triggerRegFieldVoice = (step, fieldName) => {
    // Only voice-enabled steps can trigger speech recognition
    if (!isVoiceStep(step)) return;
    if (window.voiceCtrl) {
      window.voiceCtrl.setLanguage(lang);
    }
    const p = getRegStepPrompt(step);
    speakAndListen(p, lang, (answer) => handleRegisterVoiceInput(answer, step));
  };

  const goToNextRegStep = (nextStep, customUpdatedForm = null) => {
    if (customUpdatedForm) {
      setRegForm(customUpdatedForm);
    }
    if (nextStep <= 11) {
      setRegStep(nextStep);
      if (window.voiceCtrl) {
        window.voiceCtrl.setLanguage(lang);
      }
      const nextPrompt = getRegStepPrompt(nextStep);
      if (isVoiceStep(nextStep)) {
        speakAndListen(nextPrompt, lang, (ans) => handleRegisterVoiceInput(ans, nextStep));
      } else {
        // FIX 2 & FIX 3: Numeric fields & Occupation do NOT auto-listen. Speak prompt, wait for typed input!
        speakAndListen(nextPrompt, lang, null, { listenAfter: false });
      }
    } else {
      setCurrentScreen('register_review');
    }
  };

  const handleRegisterVoiceInput = (answer, step) => {
    const clean = (answer || '').trim();
    if (!clean) return;

    setVoiceText(clean);

    const lower = clean.toLowerCase();
    const updated = { ...regForm };

    // Process on first attempt and advance without requiring a 2nd confirmation
    if (step === 1) {
      // Full Name: save spoken name directly in native script and immediately advance to Step 2!
      updated.name = clean.replace(/[.,!?]/g, '').trim();
      setRegForm(updated);
      goToNextRegStep(2, updated);
      return;
    } else if (step === 7) {
      // Present Address: save spoken address and immediately advance to Step 8!
      updated.present_address = clean;
      setRegForm(updated);
      goToNextRegStep(8, updated);
      return;
    } else if (step === 8) {
      // Current Address / Same Address
      if (lower.includes('yes') || lower.includes('ಹೌದು') || lower.includes('हाँ') || lower.includes('same')) {
        updated.same_address = true;
        updated.current_address = updated.present_address;
        setRegForm(updated);
        goToNextRegStep(9, updated);
        return;
      } else if (lower.includes('no') || lower.includes('ಇಲ್ಲ') || lower.includes('नहीं') || lower.includes('different')) {
        updated.same_address = false;
        updated.current_address = clean;
        setRegForm(updated);
        goToNextRegStep(9, updated);
        return;
      } else {
        const failMsg = (lang === 'kn')
          ? `ದಯವಿಟ್ಟು ನಿಮ್ಮ ಊರಿನ ವಿಳಾಸ ಒಂದೇ ಆಗಿದೆಯೇ ಎಂದು ತಿಳಿಸಿ (ಹೌದು ಅಥವಾ ಇಲ್ಲ).`
          : ((lang === 'hi')
              ? `कृपया बताएं कि क्या आपका स्थायी पता समान है (हाँ या नहीं)।`
              : `Please answer if your native address is the same as present address (Yes or No).`);
        speakAndListen(failMsg, lang, (retry) => handleRegisterVoiceInput(retry, 8));
        return;
      }
    } else if (step === 11) {
      // DigiLocker: Yes/No
      if (lower.includes('yes') || lower.includes('ಹೌದು') || lower.includes('हाँ')) {
        updated.has_digilocker = true;
        setRegForm(updated);
        setCurrentScreen('register_review');
        return;
      } else if (lower.includes('no') || lower.includes('ಇಲ್ಲ') || lower.includes('नहीं')) {
        updated.has_digilocker = false;
        setRegForm(updated);
        setCurrentScreen('register_review');
        return;
      } else {
        const failMsg = (lang === 'kn')
          ? `ದಯವಿಟ್ಟು ನಿಮ್ಮ ಬಳಿ ಡಿಜಿಲಾಕರ್ ಇದೆಯೇ ಎಂದು ತಿಳಿಸಿ (ಹೌದು ಅಥವಾ ಇಲ್ಲ).`
          : ((lang === 'hi')
              ? `कृपया बताएं कि क्या आपके पास डिजीलॉकर है (हाँ या नहीं)।`
              : `Please answer Yes or No for DigiLocker.`);
        speakAndListen(failMsg, lang, (retry) => handleRegisterVoiceInput(retry, 11));
        return;
      }
    }
  };

  const finalizeRegistration = async (formData = regForm) => {
    if (isSubmittingReg || isLoading) return;
    setIsSubmittingReg(true);
    setIsLoading(true);
    setRegError('');
    try {
      const payload = {
        ...formData,
        preferred_language: lang
      };
      console.log("[Registration] Submitting registration data:", payload);
      const res = await api.register(payload);
      if (res && res.success) {
        console.log("[Registration] Registration data saved successfully. Starting session...");
        setCurrentUser(res.user);
        setSessionToken(res.session_token);
        localStorage.setItem('haq_phone', res.user.phone);
        localStorage.setItem('haq_token', res.session_token);
        localStorage.setItem('haq_user', JSON.stringify(res.user));
        localStorage.setItem('haq_session_active', 'true');

        // Required console logs
        console.log("Navigating to dashboard...");
        setCurrentScreen('dashboard');
        console.log("Navigation call completed");

        // Load fresh dashboard data & speak full summary aloud for newly registered citizen!
        await loadDashboardData(res.user.phone, res.session_token, true);
      } else {
        const errorMsg = (res && res.message) || 'Registration failed. Please check your details.';
        console.error("[Registration] Registration failed:", errorMsg);
        setRegError(errorMsg);
      }
    } catch (e) {
      console.error("[Registration] Network error during registration:", e);
      setRegError('Network error during registration. Please try again.');
    } finally {
      setIsLoading(false);
      setIsSubmittingReg(false);
    }
  };

  // =====================================================================
  // Login with Demo OTP Flow (Section 2)
  // =====================================================================
  const handleRequestOtp = async () => {
    const cleanPhone = (loginPhone || '').replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      setAuthError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setAuthError('');
    setIsLoading(true);
    try {
      const res = await api.generateOtp(cleanPhone);
      if (res && res.success) {
        setDemoOtpBanner(res.demo_otp);
        setOtpCooldown(res.cooldown_seconds || 30);
        setOtpAttemptsLeft(5);
        const otpPrompt = (res.banner_message_kn && lang === 'kn') ? res.banner_message_kn : ((res.banner_message_hi && lang === 'hi') ? res.banner_message_hi : res.banner_message);
        speakAndListen(otpPrompt, lang, null, { listenAfter: false });
      } else if (res && res.cooldown) {
        setAuthError(res.message);
      } else {
        setDemoOtpBanner(null);
        setAuthError(res.message || 'This phone number is not registered. Please tap Register below to sign up.');
      }
    } catch (e) {
      setDemoOtpBanner(null);
      setAuthError('This phone number is not registered. Please tap Register below to sign up.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue = loginOtp) => {
    if (!otpValue || otpValue.trim().length !== 6) {
      setAuthError('Please enter the 6-digit OTP.');
      return;
    }
    setAuthError('');
    setIsLoading(true);
    try {
      const res = await api.verifyOtp(loginPhone.replace(/\D/g, ''), otpValue.trim());
      if (res && res.success) {
        if (!res.user_exists) {
          // Phone verified but not registered yet
          setRegForm((prev) => ({ ...prev, phone: loginPhone.replace(/\D/g, '') }));
          startRegisterFlow();
        } else {
          setCurrentUser(res.user);
          setSessionToken(res.session_token);
          localStorage.setItem('haq_phone', res.user.phone);
          localStorage.setItem('haq_token', res.session_token);
          localStorage.setItem('haq_user', JSON.stringify(res.user));
          localStorage.setItem('haq_session_active', 'true');
          setCurrentScreen('dashboard');
          await loadDashboardData(res.user.phone, res.session_token, true);
        }
      } else {
        setAuthError(res.message || 'Incorrect OTP.');
        if (res.attempts_left !== undefined) {
          setOtpAttemptsLeft(res.attempts_left);
        }
      }
    } catch (e) {
      setAuthError('Error verifying OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    stopAudio();
    setCurrentUser(null);
    setSessionToken(null);
    localStorage.removeItem('haq_phone');
    localStorage.removeItem('haq_token');
    localStorage.removeItem('haq_user');
    localStorage.removeItem('haq_session_active');
    setCurrentScreen('login');
    setLoginStep('phone_input');
    setDemoOtpBanner(null);
    setLoginPhone('');
    setLoginOtp('');
    setAuthError('');
    setSpeechParseError('');
  };

  // =====================================================================
  // Schemes For You — Full Scan Handling (Section 6)
  // =====================================================================
  const runFullScan = async (breakSearch = false) => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const scan = await api.scanAllSchemes(currentUser.phone, lang, currentUser, breakSearch);
      setScanResults(scan);
      setIsBreakSearchActive(Boolean(breakSearch));
      // Step 2: Cache converted structure in localStorage keyed by hash / profile
      try {
        const cachePayload = {
          timestamp: Date.now(),
          userPhone: currentUser.phone,
          results: scan
        };
        localStorage.setItem(`haq_live_schemes_${currentUser.phone}`, JSON.stringify(cachePayload));
      } catch (err) {}
      // Speak audio summary on scan load (Section 6)
      const summaryText = (scan.summary_kn && lang === 'kn') ? scan.summary_kn : ((scan.summary_hi && lang === 'hi') ? scan.summary_hi : scan.summary_en);
      speakAndListen(summaryText, lang, null, { listenAfter: false });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerMissingFields = (scheme) => {
    setMissingFieldsModal({
      scheme,
      missing_fields: scheme.missing_fields,
      current_index: 0,
      answers: {}
    });

    // Ask first missing field
    const firstField = scheme.missing_fields[0];
    const q = constructQuestionText(firstField);
    speakAndListen(q, lang, (ans) => processMissingFieldVoiceAnswer(ans, 0, scheme));
  };

  const constructQuestionText = (fieldName, targetLang = lang) => {
    const qObj = {
      annual_income: {
        en: "What is your total annual family income in rupees?",
        kn: "ನಿಮ್ಮ ಕುಟುಂಬದ ಒಟ್ಟು ವಾರ್ಷಿಕ ಆದಾಯ ಎಷ್ಟು?",
        hi: "आपके परिवार की कुल वार्षिक आय कितनी है?"
      },
      family_size: {
        en: "How many members are there in your family?",
        kn: "ನಿಮ್ಮ ಕುಟುಂಬದಲ್ಲಿ ಎಷ್ಟು ಜನರಿದ್ದಾರೆ?",
        hi: "आपके परिवार में कितने सदस्य हैं?"
      },
      occupation: {
        en: "What work or daily wage job do you do?",
        kn: "ನೀವು ಯಾವ ಕೆಲಸ ಅಥವಾ ಉದ್ಯೋಗ ಮಾಡುತ್ತಿದ್ದೀರಿ?",
        hi: "आप क्या काम या दैनिक मजदूरी करते हैं?"
      },
      has_labour_card: {
        en: "Do you hold an active Karnataka Labour Card? Say Yes or No.",
        kn: "ನಿಮ್ಮ ಬಳಿ ಲೇಬರ್ ಕಾರ್ಡ್ ಇದೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ತಿಳಿಸಿ.",
        hi: "क्या आपके पास लेबर कार्ड है? हाँ या नहीं कहें।"
      },
      has_school_going_child: {
        en: "Do you have a child currently studying in school? Say Yes or No.",
        kn: "ನಿಮ್ಮ ಮಗು ಶಾಲೆಯಲ್ಲಿ ಓದುತ್ತಿದ್ದಾರೆಯೇ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ತಿಳಿಸಿ.",
        hi: "क्या आपका बच्चा स्कूल में पढ़ रहा है? हाँ या नहीं कहें।"
      },
      age: {
        en: "What is your current age according to your official documents?",
        kn: "ದಾಖಲೆಗಳ ಪ್ರಕಾರ ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?",
        hi: "आपके दस्तावेजों के अनुसार आपकी आयु क्या है?"
      },
      state_resident: {
        en: "Do you live and work in Karnataka?",
        kn: "ನೀವು ಕರ್ನಾಟಕದಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದೀರಾ?",
        hi: "क्या आप कर्नाटक में रहते हैं?"
      }
    };
    return (qObj[fieldName] && qObj[fieldName][targetLang]) || (qObj[fieldName] && qObj[fieldName][lang]) || qObj[fieldName]?.en || `Please provide details for ${fieldName}`;
  };

  const processMissingFieldVoiceAnswer = async (answer, index, scheme) => {
    const fieldName = scheme.missing_fields[index];
    let val = answer.trim();

    // Type casting & validation
    if (fieldName === 'annual_income' || fieldName === 'age' || fieldName === 'family_size') {
      const digits = answer.replace(/\D/g, '');
      if (digits) {
        val = parseInt(digits, 10);
      } else {
        const failMsg = lang === 'kn'
          ? `ಸಂಖ್ಯೆ ಅರ್ಥವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಸಂಖ್ಯೆಯನ್ನು ಸ್ಪಷ್ಟವಾಗಿ ತಿಳಿಸಿ.`
          : (lang === 'hi'
              ? `संख्या समझ नहीं आई। कृपया संख्या स्पष्ट बताएं।`
              : `Could not understand the number. Please try again or type the number.`);
        speakAndListen(failMsg, lang, (retry) => processMissingFieldVoiceAnswer(retry, index, scheme));
        return;
      }
    } else if (fieldName.startsWith('has_') || fieldName === 'state_resident') {
      const lower = answer.toLowerCase().trim();
      const isYes = lower.includes('yes') || lower.includes('ಹೌದು') || lower.includes('हाँ') || lower.includes('ha') || lower.includes('haa') || lower.includes('ho');
      const isNo = lower.includes('no') || lower.includes('ಇಲ್ಲ') || lower.includes('नहीं') || lower.includes('illa') || lower.includes('nahi');
      if (!isYes && !isNo) {
        const failMsg = lang === 'kn'
          ? `ದಯವಿಟ್ಟು 'ಹೌದು' ಅಥವಾ 'ಇಲ್ಲ' ಎಂದು ಹೇಳಿ.`
          : (lang === 'hi'
              ? `कृपया 'हाँ' या 'नहीं' कहें।`
              : `Please say Yes or No.`);
        speakAndListen(failMsg, lang, (retry) => processMissingFieldVoiceAnswer(retry, index, scheme));
        return;
      }
      val = isYes;
    }

    // Save persistently via saveUserField (Section 8)
    if (currentUser) {
      await api.saveUserField(currentUser.phone, fieldName, val);
      currentUser[fieldName] = val;
      addConversationBubble('assistant', `✓ Recorded ${fieldName.replace(/_/g, ' ')}: ${val}`);
    }

    const nextIndex = index + 1;
    if (nextIndex < scheme.missing_fields.length) {
      setMissingFieldsModal((prev) => ({
        ...prev,
        current_index: nextIndex,
        answers: { ...prev.answers, [fieldName]: val }
      }));
      const nextField = scheme.missing_fields[nextIndex];
      const nextQ = constructQuestionText(nextField);
      speakAndListen(nextQ, lang, (nextAns) => processMissingFieldVoiceAnswer(nextAns, nextIndex, scheme));
    } else {
      // Completed all missing fields -> Close modal & re-scan immediately!
      setMissingFieldsModal(null);
      await runFullScan();
    }
  };

  // =====================================================================
  // Core Voice Flow — Scheme Application & Proxy (Section 3, 5, 7, 8)
  // =====================================================================
  const startSchemeApplication = (schemeId, proxyData = null, targetLang = lang) => {
    console.log(`[SchemeFlow] Starting application for scheme "${schemeId}" (proxy: ${!!proxyData}) in language: "${targetLang}"`);
    setActiveSchemeId(schemeId);
    setApplicantType(proxyData ? 'family_member' : 'self');
    setProxyDependent(proxyData);
    setSubmittedApp(null);
    setFlowStep('questioning');
    setCurrentScreen('scheme_flow');
    checkSchemeMissingFields(schemeId, proxyData, targetLang);
  };

  const checkSchemeMissingFields = async (schemeId, proxyData = null, targetLang = lang) => {
    // Check known user fields from profile to NEVER re-ask (Section 8)
    const allSchemes = (schemes && schemes.length) ? schemes : DEFAULT_SCHEMES;
    const scheme = allSchemes.find((s) => s.id === schemeId) || allSchemes[0];
    if (!scheme) return;

    const targetProfile = proxyData ? { ...(currentUser || {}), ...proxyData } : (currentUser || {});
    const required = scheme.required_fields || [];
    const missing = required.filter((f) => targetProfile[f] === undefined || targetProfile[f] === null || targetProfile[f] === '');

    console.log(`[SchemeFlow] Scheme "${schemeId}" required fields:`, required, "Missing fields:", missing);

    if (missing.length > 0) {
      const firstMissing = missing[0];
      const prompt = constructQuestionText(firstMissing, targetLang);
      setCurrentQuestion({ field: firstMissing, text: prompt });
      setSchemeTypedAnswer('');

      console.log(`[SchemeFlow] Next step: speaking prompt for field: "${firstMissing}". Prompt: "${prompt}"`);

      const numericFields = ['annual_income', 'monthly_income', 'income', 'age', 'family_size', 'phone', 'aadhaar_number', 'pan_number'];
      const isTypedField = numericFields.includes(firstMissing) || firstMissing === 'occupation';

      try {
        if (isTypedField) {
          // FIX 2 & FIX 3: Speak question aloud, but do NOT open the microphone. Wait for typed input!
          speakAndListen(prompt, targetLang, null, { listenAfter: false });
        } else {
          // Voice-driven question (e.g. has_labour_card, has_school_going_child, etc.)
          speakAndListen(prompt, targetLang, (ans) => handleSchemeFieldAnswer(ans, firstMissing, schemeId, proxyData));
        }
      } catch (ttsErr) {
        console.warn(`[SchemeFlow] Speech synthesis failed silently for field "${firstMissing}":`, ttsErr);
      }
    } else {
      // All fields already known -> run deterministic Rules Engine directly!
      console.log(`[SchemeFlow] All required fields already provided for "${schemeId}". Moving to eligibility.`);
      const allKnownPrompt = targetLang === 'kn'
        ? "ನಿಮ್ಮ ಎಲ್ಲಾ ವಿವರಗಳು ಈಗಾಗಲೇ ಲಭ್ಯವಿವೆ. ನಿಮ್ಮ ಅರ್ಹತೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ..."
        : (targetLang === 'hi'
            ? "आपके सभी विवरण पहले से उपलब्ध हैं। आपकी पात्रता की जाँच की जा रही है..."
            : "All your details are already available. Checking your eligibility now...");
      try {
        speakAndListen(allKnownPrompt, targetLang, null, { listenAfter: false });
      } catch (ttsErr) {
        console.warn("[SchemeFlow] Speech synthesis failed:", ttsErr);
      }
      setFlowStep('checking_eligibility');
      evaluateEligibility(schemeId, targetProfile);
    }
  };

  const handleSchemeFieldAnswer = async (answer, fieldName, schemeId, proxyData) => {
    // If it's a numeric field or occupation typed by user, persist directly
    const numericFields = ['annual_income', 'monthly_income', 'income', 'age', 'family_size', 'phone', 'aadhaar_number', 'pan_number'];
    if (numericFields.includes(fieldName)) {
      const digits = String(answer).replace(/\D/g, '');
      const parsedVal = digits ? parseInt(digits, 10) : 0;
      if (currentUser) {
        await api.saveUserField(currentUser.phone, fieldName, parsedVal);
        currentUser[fieldName] = parsedVal;
        addConversationBubble('assistant', `✓ Recorded ${fieldName.replace(/_/g, ' ')}: ${parsedVal}`);
      }
      setSpeechParseError('');
      checkSchemeMissingFields(schemeId, proxyData);
      return;
    }

    if (fieldName === 'occupation') {
      const occVal = String(answer).trim();
      if (currentUser) {
        await api.saveUserField(currentUser.phone, 'occupation', occVal);
        currentUser['occupation'] = occVal;
        addConversationBubble('assistant', `✓ Recorded occupation: ${occVal}`);
      }
      setSpeechParseError('');
      checkSchemeMissingFields(schemeId, proxyData);
      return;
    }

    // Call backend voice intent processor to validate & extract
    const res = await api.processVoiceIntent({
      text: answer,
      phone: currentUser ? currentUser.phone : '9876543210',
      current_field: fieldName,
      target_scheme_id: schemeId,
      language: lang
    });

    // PARSE FAILURE GUARD (BUG 1: show what was heard and prompt clearly)
    if (res && res.is_parse_failure) {
      const failMsg = (lang === 'kn' && res.failure_message_kn)
        ? res.failure_message_kn
        : ((lang === 'hi' && res.failure_message_hi)
            ? res.failure_message_hi
            : (res.failure_message_en || res.failure_message || `Could not understand. Please try again or type your answer.`));
      setSpeechParseError(failMsg);
      speakAndListen(failMsg, lang, (retryAnswer) => {
        handleSchemeFieldAnswer(retryAnswer, fieldName, schemeId, proxyData);
      });
      return;
    }
    setSpeechParseError('');

    // STRICT OUT-OF-SCOPE GUARD (Section 5)
    if (res && res.is_out_of_scope) {
      speakAndListen(res.refusal_message, lang, (retryAnswer) => {
        handleSchemeFieldAnswer(retryAnswer, fieldName, schemeId, proxyData);
      });
      return;
    }

    // Clarification asked
    if (res && res.is_clarification && res.clarification) {
      setClarification(res.clarification);
      const reaskPrompt = `${res.clarification.text}. ${currentQuestion.text}`;
      speakAndListen(reaskPrompt, lang, (retryAnswer) => {
        handleSchemeFieldAnswer(retryAnswer, fieldName, schemeId, proxyData);
      });
      return;
    }

    // Save field persistently
    if (res && res.parsed_intent && res.parsed_intent.extracted_fields) {
      for (const [k, v] of Object.entries(res.parsed_intent.extracted_fields)) {
        if (currentUser) {
          await api.saveUserField(currentUser.phone, k, v);
          currentUser[k] = v;
          addConversationBubble('assistant', `✓ Recorded ${k.replace(/_/g, ' ')}: ${v}`);
        }
      }
    }

    // Check remaining missing fields
    checkSchemeMissingFields(schemeId, proxyData);
  };

  const evaluateEligibility = async (schemeId, targetProfile) => {
    setIsLoading(true);
    setFlowStep('checking_eligibility');
    setEligibilityError(null);
    console.log(`[EligibilityCheck] >>> Invoking rules-engine eligibility check for scheme: "${schemeId}"`, {
      phone: currentUser ? currentUser.phone : '9876543210',
      targetProfile,
      language: lang
    });
    try {
      const res = await api.evaluateEligibility({
        scheme_id: schemeId,
        phone: currentUser ? currentUser.phone : '9876543210',
        user_data: targetProfile,
        language: lang
      });
      console.log(`[EligibilityCheck] <<< Received eligibility check result for "${schemeId}":`, res);
      if (res && res.results && res.results.length > 0) {
        const result = res.results[0];
        setEligibilityResult(result);
        setFlowStep('eligibility');

        const voicePrompt = result.eligible
          ? (t.voice_eligibility_prompt_eligible || "You are eligible for {scheme}. Would you like to apply now?").replace('{scheme}', result.scheme_name_kn && lang === 'kn' ? result.scheme_name_kn : ((result.scheme_name_hi && lang === 'hi') ? result.scheme_name_hi : result.scheme_name_en))
          : (t.voice_eligibility_prompt_ineligible || "You do not qualify for {scheme}.").replace('{scheme}', result.scheme_name_en);

        speakAndListen(`${result.warm_explanation} ${voicePrompt}`, lang, (decision) => {
          const lower = (decision || '').toLowerCase();
          if (lower.includes('apply') || lower.includes('yes') || lower.includes('ಅರ್ಜಿ') || lower.includes('ಹೌದು') || lower.includes('हाँ') || lower.includes('consent') || lower.includes('ಮುಂದೆ')) {
            startConsentFlow(result);
          } else {
            setCurrentScreen('dashboard');
          }
        });
      } else {
        throw new Error('Rules engine did not return an evaluation result.');
      }
    } catch (e) {
      console.error(`[EligibilityCheck] !!! Eligibility evaluation failed for "${schemeId}":`, e);
      setEligibilityError(e.message || 'Unable to check eligibility at this moment.');
      setFlowStep('checking_eligibility');
    } finally {
      setIsLoading(false);
    }
  };

  const startConsentFlow = (result) => {
    setFlowStep('consent');
    setActiveDocIndex(0);
    setConsents({});
    askNextDocumentConsent(0, result, {});
  };

  const askNextDocumentConsent = (docIdx, result, currentConsents = consents) => {
    const docs = result.required_documents || [];
    if (docIdx >= docs.length) {
      // All document consents collected -> Proceed to prefill & review!
      proceedToApplicationReview(result.scheme_id, currentConsents);
      return;
    }

    const docType = docs[docIdx];
    const docTitles = {
      aadhaar_card: { en: "Aadhaar Card", kn: "ಆಧಾರ್ ಕಾರ್ಡ್", hi: "आधार कार्ड" },
      income_certificate: { en: "Income Certificate", kn: "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ", hi: "आय प्रमाण पत्र" },
      address_proof: { en: "Address Proof", kn: "ವಿಳಾಸದ ಪುರಾವೆ", hi: "पते का प्रमाण" },
      labour_card: { en: "Labour Card", kn: "ಕಾರ್ಮಿಕ ಕಾರ್ಡ್", hi: "लेबर कार्ड" },
      child_school_id: { en: "Child School ID", kn: "ಮಕ್ಕಳ ಶಾಲಾ ಗುರುತಿನ ಚೀಟಿ", hi: "बच्चे का स्कूल आईडी" },
      bank_account_details: { en: "Bank Account Details", kn: "ಬ್ಯಾಂಕ್ ಖಾತೆ ವಿವರ", hi: "बैंक खाता विवरण" }
    };
    const titleObj = docTitles[docType] || { en: docType, kn: docType, hi: docType };
    const docName = titleObj[lang] || titleObj.en;
    const schemeName = (result.scheme_name_kn && lang === 'kn') ? result.scheme_name_kn : ((result.scheme_name_hi && lang === 'hi') ? result.scheme_name_hi : result.scheme_name_en);

    // Dependent proxy label if applicable (Section 7)
    const personLabel = proxyDependent ? `${proxyDependent.name} (${proxyDependent.relationship})` : (currentUser ? currentUser.name : 'You');
    const prompt = (t.voice_consent_prompt || "We need access to your {doc_name} for {scheme_name}. Allow access?")
      .replace('{doc_name}', `${docName} (${personLabel})`)
      .replace('{scheme_name}', schemeName);

    speakAndListen(prompt, lang, (consentSpeech) => {
      const lower = (consentSpeech || '').toLowerCase();
      if (lower.includes('allow') || lower.includes('yes') || lower.includes('ಅನುಮತಿಸಿ') || lower.includes('ಹೌದು') || lower.includes('हाँ') || lower.includes('अनुमति')) {
        recordConsentDecision(docType, 'ALLOWED', docIdx, result, currentConsents);
      } else {
        recordConsentDecision(docType, 'DENIED', docIdx, result, currentConsents);
      }
    });
  };

  const recordConsentDecision = async (docType, status, docIdx, result, currentConsents = consents) => {
    const nextConsents = { ...currentConsents, [docType]: status };
    setConsents(nextConsents);
    try {
      await api.logConsent({
        doc_type: docType,
        doc_title_en: docType.replace(/_/g, ' ').toUpperCase(),
        doc_title_kn: docType,
        doc_title_hi: docType,
        scheme_id: result.scheme_id,
        scheme_name_en: result.scheme_name_en,
        scheme_name_kn: result.scheme_name_kn,
        scheme_name_hi: result.scheme_name_hi,
        purpose_en: `Required for ${result.scheme_name_en} application processing`,
        purpose_kn: `${result.scheme_name_kn} ಯೋಜನೆಗೆ ಅಗತ್ಯವಿದೆ`,
        purpose_hi: `${result.scheme_name_hi} योजना के लिए आवश्यक`,
        status,
        phone: currentUser ? currentUser.phone : '9876543210',
        applicant_type: applicantType,
        dependent_name: proxyDependent ? proxyDependent.name : null
      });
    } catch (e) {
      console.warn('Consent log failed:', e);
    }

    const nextIdx = docIdx + 1;
    setActiveDocIndex(nextIdx);
    askNextDocumentConsent(nextIdx, result, nextConsents);
  };

  const getDepartmentInfo = (schemeId) => {
    const id = (schemeId || '').toLowerCase();
    if (id.includes('ration') || id.includes('anna') || id.includes('bpl')) {
      return {
        dept_en: 'Department of Food, Civil Supplies and Consumer Affairs',
        dept_kn: 'ಆಹಾರ, ನಾಗರಿಕ ಸರಬರಾಜು ಮತ್ತು ಗ್ರಾಹಕರ ವ್ಯವಹಾರಗಳ ಇಲಾಖೆ',
        dept_hi: 'खाद्य, नागरिक आपूर्ति एवं उपभोक्ता मामले विभाग',
        state_en: 'Government of Karnataka',
        state_kn: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
        state_hi: 'कर्नाटक सरकार',
        form_title_en: 'Application for Priority Household (BPL) Ration Card under National Food Security Act',
        form_title_kn: 'ರಾಷ್ಟ್ರೀಯ ಆಹಾರ ಭದ್ರತಾ ಕಾಯ್ದೆಯಡಿ ಆದ್ಯತಾ ಕುಟುಂಬ (ಬಿಪಿಎಲ್) ಪಡಿತರ ಚೀಟಿಗಾಗಿ ಅರ್ಜಿ',
        form_title_hi: 'राष्ट्रीय खाद्य सुरक्षा अधिनियम के तहत प्राथमिकता वाले परिवार (बीपीएल) राशन कार्ड के लिए आवेदन',
        form_no: 'FORM NO. 1A / NFSA-PPH / 2026'
      };
    }
    if (id.includes('labour') || id.includes('karmika') || id.includes('bocw')) {
      return {
        dept_en: 'Karnataka Building & Other Construction Workers Welfare Board',
        dept_kn: 'ಕರ್ನಾಟಕ ಕಟ್ಟಡ ಮತ್ತು ಇತರ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕರ ಕಲ್ಯಾಣ ಮಂಡಳಿ',
        dept_hi: 'कर्नाटक भवन एवं अन्य सन्निर्माण कर्मकार कल्याण बोर्ड',
        state_en: 'Government of Karnataka',
        state_kn: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
        state_hi: 'कर्नाटक सरकार',
        form_title_en: 'Application for Registration & Welfare Grant under BOCW Act',
        form_title_kn: 'ಕಟ್ಟಡ ನಿರ್ಮಾಣ ಕಾರ್ಮಿಕರ ನೋಂದಣಿ ಮತ್ತು ಕಲ್ಯಾಣ ಸೌಲಭ್ಯಗಳಿಗಾಗಿ ಅರ್ಜಿ',
        form_title_hi: 'बीओसीडब्ल्यू अधिनियम के तहत श्रमिक पंजीकरण और कल्याण लाभ हेतु आवेदन',
        form_no: 'FORM NO. V / KBOCWWB / 2026'
      };
    }
    if (id.includes('kisan') || id.includes('farmer') || id.includes('krishi')) {
      return {
        dept_en: 'Ministry of Agriculture and Farmers Welfare',
        dept_kn: 'ಕೃಷಿ ಮತ್ತು ರೈತರ ಕಲ್ಯಾಣ ಸಚಿವಾಲಯ',
        dept_hi: 'कृषि एवं किसान कल्याण मंत्रालय',
        state_en: 'Government of India',
        state_kn: 'ಭಾರತ ಸರ್ಕಾರ',
        state_hi: 'भारत सरकार',
        form_title_en: 'Application for Income Support under PM-KISAN Samman Nidhi',
        form_title_kn: 'ಪಿಎಂ-ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ ಯೋಜನೆಯಡಿ ಆದಾಯ ಬೆಂಬಲಕ್ಕಾಗಿ ಅರ್ಜಿ',
        form_title_hi: 'प्रधानमंत्री किसान सम्मान निधि योजनांतर्गत आर्थिक सहायता हेतु आवेदन',
        form_no: 'FORM NO. PM-KISAN / REG / 2026'
      };
    }
    if (id.includes('ayushman') || id.includes('arogya') || id.includes('health')) {
      return {
        dept_en: 'Department of Health & Family Welfare',
        dept_kn: 'ಆರೋಗ್ಯ ಮತ್ತು ಕುಟುಂಬ ಕಲ್ಯಾಣ ಇಲಾಖೆ',
        dept_hi: 'स्वास्थ्य एवं परिवार कल्याण विभाग',
        state_en: 'Government of Karnataka',
        state_kn: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
        state_hi: 'कर्नाटक सरकार',
        form_title_en: 'Application for Ayushman Bharat - Arogya Karnataka (AB-ArK) Healthcare Card',
        form_title_kn: 'ಆಯುಷ್ಮಾನ್ ಭಾರತ್ - ಆರೋಗ್ಯ ಕರ್ನಾಟಕ ಆರೋಗ್ಯ ಕಾರ್ಡ್‌ಗಾಗಿ ಅರ್ಜಿ',
        form_title_hi: 'आयुष्मान भारत - आरोग्य कर्नाटक स्वास्थ्य कार्ड हेतु आवेदन',
        form_no: 'FORM NO. AB-ARK / HLTH / 2026'
      };
    }
    if (id.includes('lakshmi') || id.includes('stree') || id.includes('women')) {
      return {
        dept_en: 'Department of Women & Child Development',
        dept_kn: 'ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಅಭಿವೃದ್ಧಿ ಇಲಾಖೆ',
        dept_hi: 'महिला एवं बाल विकास विभाग',
        state_en: 'Government of Karnataka',
        state_kn: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
        state_hi: 'कर्नाटक सरकार',
        form_title_en: 'Application for Direct Benefit Transfer under Gruha Lakshmi Guarantee Scheme',
        form_title_kn: 'ಗೃಹಲಕ್ಷ್ಮಿ ಖಾತರಿ ಯೋಜನೆಯಡಿ ನೇರ ನಗದು ವರ್ಗಾವಣೆಗಾಗಿ ಅರ್ಜಿ',
        form_title_hi: 'गृह लक्ष्मी गारंटी योजना के तहत प्रत्यक्ष लाभ अंतरण हेतु आवेदन',
        form_no: 'FORM NO. GL-2026 / WCD'
      };
    }
    const allSchemes = (schemes && schemes.length) ? schemes : DEFAULT_SCHEMES;
    const sc = allSchemes.find(s => s.id === schemeId) || {};
    const title = sc.name_en || schemeId.replace(/_/g, ' ').toUpperCase();
    return {
      dept_en: 'Directorate of Social Welfare & Public Empowerment',
      dept_kn: 'ಸಮಾಜ ಕಲ್ಯಾಣ ಮತ್ತು ಸಾರ್ವಜನಿಕ ಸಬಲೀಕರಣ ನಿರ್ದೇಶನಾಲಯ',
      dept_hi: 'समाज कल्याण एवं जन सशक्तिकरण निदेशालय',
      state_en: 'Government of Karnataka',
      state_kn: 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ',
      state_hi: 'कर्नाटक सरकार',
      form_title_en: `Official Application Form for ${title}`,
      form_title_kn: `${sc.name_kn || title} ಅಧಿಕೃತ ಅರ್ಜಿ ನಮೂನೆ`,
      form_title_hi: `${sc.name_hi || title} आधिकारिक आवेदन पत्र`,
      form_no: `FORM NO. SW-APP / ${schemeId.slice(0, 6).toUpperCase()} / 2026`
    };
  };

  const proceedToApplicationReview = async (schemeId, activeConsents = consents) => {
    setIsLoading(true);
    setIsSubmittingApplication(false);
    setDeclarationAgreed(false);
    try {
      const allowedDocs = Object.keys(activeConsents || {}).filter((d) => activeConsents[d] === 'ALLOWED');
      let form = null;
      try {
        form = await api.prefillForm(schemeId, allowedDocs, currentUser ? currentUser.phone : '9876543210');
      } catch (err) {
        console.warn('[ReviewScreen] api.prefillForm failed, generating client fallback form:', err);
      }

      if (!form || !form.prefilled_fields || form.prefilled_fields.length === 0) {
        const applicantName = proxyDependent ? proxyDependent.name : (currentUser ? currentUser.name : 'Self');
        const allSchemes = (schemes && schemes.length) ? schemes : DEFAULT_SCHEMES;
        const schemeObj = allSchemes.find((s) => s.id === schemeId) || {};
        form = {
          scheme_id: schemeId,
          form_title_en: schemeObj.name_en || schemeId,
          form_title_kn: schemeObj.name_kn || schemeId,
          form_title_hi: schemeObj.name_hi || schemeId,
          prefilled_fields: [
            { field_id: 'applicant_name', label_en: 'Applicant Name', label_kn: 'ಅರ್ಜಿದಾರರ ಹೆಸರು', label_hi: 'आवेदक का नाम', value: applicantName, source_label_en: 'Profile', source_label_kn: 'ಪ್ರೊಫೈಲ್', source_label_hi: 'प्रोफ़ाइल' },
            { field_id: 'phone', label_en: 'Mobile Number', label_kn: 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ', label_hi: 'मोबाइल नंबर', value: currentUser ? currentUser.phone : '9876543210', source_label_en: 'Profile', source_label_kn: 'ಪ್ರೊಫೈಲ್', source_label_hi: 'प्रोफ़ाइल' },
            { field_id: 'annual_income', label_en: 'Annual Income', label_kn: 'ವಾರ್ಷಿಕ ಆದಾಯ', label_hi: 'वार्षिक आय', value: currentUser && currentUser.annual_income ? `₹${currentUser.annual_income.toLocaleString()}` : 'Not provided', source_label_en: 'Self Declaration', source_label_kn: 'ಸ್ವಯಂ ಘೋಷಣೆ', source_label_hi: 'स्वयं घोषणा' },
            { field_id: 'address', label_en: 'Present Address', label_kn: 'ಪ್ರಸ್ತುತ ವಿಳಾಸ', label_hi: 'वर्तमान पता', value: currentUser ? (currentUser.present_address || 'Not provided') : 'Not provided', source_label_en: 'Aadhaar Card', source_label_kn: 'ಆಧಾರ್ ಕಾರ್ಡ್', source_label_hi: 'आधार कार्ड' },
            { field_id: 'state', label_en: 'State', label_kn: 'ರಾಜ್ಯ', label_hi: 'राज्य', value: currentUser ? (currentUser.state || 'Karnataka') : 'Karnataka', source_label_en: 'Profile', source_label_kn: 'ಪ್ರೊಫೈಲ್', source_label_hi: 'प्रोफ़ाइल' }
          ]
        };
      }
      setPrefilledForm(form);
      setFlowStep('review');

      // Spoken summary of prefilled application (Section 8 review before submit)
      const reviewPrompt = (t.voice_review_prompt || "Here is your official application form. Please review your details and tick the declaration. To submit, say 'Confirm'.")
        .replace('{scheme}', form.form_title_kn && lang === 'kn' ? form.form_title_kn : form.form_title_en)
        .replace('{name}', proxyDependent ? proxyDependent.name : (currentUser ? currentUser.name : ''))
        .replace('{income}', currentUser ? `₹${currentUser.annual_income?.toLocaleString()}` : '')
        .replace('{address}', currentUser ? currentUser.present_address : '');

      speakAndListen(reviewPrompt, lang, (submitAnswer) => {
        const lower = (submitAnswer || '').toLowerCase();
        if (lower.includes('confirm') || lower.includes('submit') || lower.includes('yes') || lower.includes('ಖಚಿತ') || lower.includes('ಸಲ್ಲಿಸಿ') || lower.includes('हाँ') || lower.includes('पुष्टि')) {
          setDeclarationAgreed(true);
          finalizeApplicationSubmission(schemeId);
        }
      });
    } catch (e) {
      console.error('[ReviewScreen] proceedToApplicationReview error:', e);
      setFlowStep('review');
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeApplicationSubmission = async (schemeId) => {
    if (isSubmittingApplication) return;
    setIsSubmittingApplication(true);
    setIsLoading(true);
    try {
      const res = await api.submitForm(
        schemeId,
        prefilledForm,
        lang,
        currentUser ? currentUser.phone : '9876543210',
        applicantType,
        proxyDependent ? proxyDependent.name : (currentUser ? currentUser.name : 'Self')
      );
      if (res && res.status === 'SUBMITTED') {
        const refId = res.reference_id || `REF-${(res.acknowledgement_id || '').replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase()}`;
        const enrichedApp = {
          ...res,
          reference_id: refId,
          application_status: 'Submitted (Prototype)',
          status: 'Submitted (Prototype)',
          applicant_name: proxyDependent ? proxyDependent.name : (currentUser ? currentUser.name : 'Self'),
          applicant_type: applicantType || 'self',
          submitted_at: res.submitted_at || new Date().toISOString()
        };
        setSubmittedApp(enrichedApp);
        setFlowStep('submitted');
        
        // Immediately update state and per-user cache
        const activePhone = currentUser ? currentUser.phone : '9876543210';
        const updated = reconcileUserApplications([enrichedApp], activePhone);
        setUserApplications(updated);

        // Refresh dashboard data from server
        if (currentUser) {
          await loadDashboardData(currentUser.phone, sessionToken, false);
        }

        const ackMsg = (res.submission_message_kn && lang === 'kn') ? res.submission_message_kn : ((res.submission_message_hi && lang === 'hi') ? res.submission_message_hi : res.submission_message_en);
        speakAndListen(ackMsg, lang, (followUp) => {
          setCurrentScreen('dashboard');
          setActiveTab('applications');
        });

        // Ensure user lands back on Dashboard under My Applications within 3.5 seconds
        setTimeout(() => {
          setCurrentScreen('dashboard');
          setActiveTab('applications');
        }, 3500);
      }
    } catch (e) {
      console.error(e);
      alert('Application submission failed. Please try again.');
    } finally {
      setIsSubmittingApplication(false);
      setIsLoading(false);
    }
  };

  // =====================================================================
  // Universal Voice Router (Section 4 & 5)
  // =====================================================================
  const handleUniversalVoiceRouter = async (speech, targetLang) => {
    // Process intent
    const res = await api.processVoiceIntent({
      text: speech,
      phone: currentUser ? currentUser.phone : '9876543210',
      language: targetLang
    });

    // CODE-LEVEL OUT-OF-SCOPE GUARD (Section 5)
    if (res && res.is_out_of_scope) {
      speakAndListen(res.refusal_message, targetLang, null, { listenAfter: true });
      return;
    }

    // Check proxy intent
    if (res && res.applicant_type === 'family_member') {
      const rel = res.relationship || 'family_member';
      const prompt = (t.proxy_question_name || "What is your family member's full name?");
      speakAndListen(prompt, targetLang, (depName) => {
        const proxyObj = {
          name: depName.replace(/[.,]/g, '').trim(),
          relationship: rel,
          age: 65,
          state_resident: true
        };
        // Add to dependents array
        if (currentUser) {
          api.addDependent({ phone: currentUser.phone, ...proxyObj });
        }
        startSchemeApplication(res.target_scheme_id || 'ration_card', proxyObj);
      });
      return;
    }

    // Direct scheme requested
    if (res && res.target_scheme_id && res.target_scheme_id !== 'all') {
      console.log(`[VoiceRouter] Scheme intent detected: "${res.target_scheme_id}" for input: "${speech}" in language: "${targetLang}"`);
      startSchemeApplication(res.target_scheme_id, null, targetLang);
    } else if (res && res.target_scheme_id === 'all') {
      setCurrentScreen('dashboard');
      setActiveTab('schemes');
      runFullScan();
    }
  };

  // =====================================================================
  // Home Navigation Handler (Desktop Click + Mobile Touch)
  // =====================================================================
  const lastNavTimeRef = useRef(0);
  const handleNavigateHome = (e) => {
    const now = Date.now();
    if (now - lastNavTimeRef.current < 300) {
      return;
    }
    lastNavTimeRef.current = now;
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    console.log('[Navigation] Navigating to Home...');
    stopAudio();
    setMissingFieldsModal(null);
    setSpeechParseError('');

    const storedPhone = typeof localStorage !== 'undefined' ? localStorage.getItem('haq_phone') : null;
    let userObj = currentUser;
    if (!userObj && storedPhone && typeof localStorage !== 'undefined') {
      try {
        const u = localStorage.getItem('haq_user');
        if (u) {
          userObj = JSON.parse(u);
          setCurrentUser(userObj);
        }
      } catch (err) {}
      loadDashboardData(storedPhone, localStorage.getItem('haq_token'), false);
    }

    if (userObj) {
      setCurrentScreen('dashboard');
      setActiveTab('schemes');
      setTimeout(() => {
        try { runFullScan(); } catch (err) {}
      }, 50);
    } else {
      setCurrentScreen('login');
      setLoginStep('phone_input');
    }
    console.log('[Navigation] Home navigation executed successfully');
  };

  // =====================================================================
  // Render Helpers
  // =====================================================================
  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="top-header">
        <div className="header-inner">
          <div
            id="brand_home"
            className="brand"
            onClick={handleNavigateHome}
            onTouchEnd={handleNavigateHome}
            role="button"
            tabIndex={0}
            aria-label="Home"
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleNavigateHome(e); }}
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-icon">🏛️</div>
            <div className="brand-text">
              <h1>
                {t.app_title}
                <span className="brand-badge">PROTOTYPE</span>
              </h1>
              <p>{t.tagline}</p>
            </div>
          </div>

          <div className="header-controls">
            {/* Home Navigation Button */}
            <button
              id="btn_home"
              className="nav-home-btn"
              onClick={handleNavigateHome}
              onTouchEnd={handleNavigateHome}
              aria-label="Home"
              title="Home"
            >
              🏠 {lang === 'kn' ? 'ಮುಖಪುಟ' : (lang === 'hi' ? 'होम' : 'Home')}
            </button>

            {/* Trilingual Switcher (Section 4) */}
            <select
              value={lang}
              onChange={(e) => toggleLanguage(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid #f59e0b',
                background: '#064e3b',
                color: 'white',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              <option value="kn">ಕನ್ನಡ (Kannada)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="en">English</option>
            </select>

            {currentUser && (
              <button
                id="btn_logout"
                onClick={handleLogout}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                {t.logout_btn}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Voice Status Bar (Section 4 - All 4 Voice States: Ready, Listening, Speaking, Processing) */}
      <div className={`voice-status-bar ${isProcessingVoice ? 'processing' : (isSpeaking ? 'speaking' : (isListening ? 'listening' : 'idle'))}`}>
        <div className="voice-status-left">
          <div className="voice-status-indicator-box">
            {isProcessingVoice && <span className="voice-spinner"></span>}
            {!isProcessingVoice && <span className="voice-indicator-dot"></span>}
            {isSpeaking && (
              <span className="voice-wave-bars">
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
                <span className="wave-bar"></span>
              </span>
            )}
          </div>
          <span className="voice-status-label">
            {isProcessingVoice
              ? (lang === 'kn' ? 'ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ... (Processing...)' : (lang === 'hi' ? 'प्रक्रिया जारी है... (Processing...)' : 'Processing your voice request...'))
              : (isSpeaking
                  ? t.voice_bar_speaking
                  : (isListening
                      ? t.voice_bar_listening
                      : t.voice_bar_idle))}
          </span>
        </div>
        <div className="voice-status-actions">
          {(isSpeaking || isListening) && (
            <button className="voice-action-pill stop" onClick={stopAudio} title="Stop Audio">
              ⏹ {t.voice_bar_stop}
            </button>
          )}
          {!isSpeaking && !isListening && !isProcessingVoice && (
            <button className="voice-action-pill mic" onClick={() => speakAndListen('', lang)} title="Tap to Speak">
              🎙️ {t.voice_tap_to_reply}
            </button>
          )}
        </div>
      </div>

      <main style={{ padding: '20px' }}>
        {/* ===================================================================== */}
        {/* SCREEN 1: LOGIN WITH TRILINGUAL LANGUAGE SELECTION (Section 2 & FIX 2) */}
        {/* ===================================================================== */}
        {currentScreen === 'login' && loginStep === 'lang_select' && (
          <div style={{ maxWidth: '520px', margin: '30px auto', padding: '10px' }}>
            <div className="step-card" style={{ textAlign: 'center', padding: '32px 24px' }}>
              <div style={{ fontSize: '38px', marginBottom: '10px' }}>🌐</div>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', marginBottom: '8px', lineHeight: 1.3 }}>
                Choose Your Language<br />
                <span style={{ fontSize: '20px', color: '#047857' }}>ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ</span> • <span style={{ fontSize: '18px', color: '#b45309' }}>अपनी भाषा चुनें</span>
              </h2>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '22px' }}>
                Tap your language or say: <strong>"English"</strong>, <strong>"हिंदी"</strong>, or <strong>"ಕನ್ನಡ"</strong>
              </p>

              {/* Status Banner */}
              <div style={{
                background: isListening ? '#ecfdf5' : '#f8fafc',
                border: isListening ? '2px solid #10b981' : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '12px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '13px',
                color: isListening ? '#047857' : '#64748b'
              }}>
                <span style={{ fontSize: '18px' }}>{isListening ? '🎙️' : '🔊'}</span>
                <span>{isListening ? 'Listening for your language... Speak now ("English", "हिंदी", "ಕನ್ನಡ")' : 'Assistant speaking trilingual question...'}</span>
              </div>

              {/* 3 Large, clearly labeled buttons shown at the same time */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* English Button */}
                <button
                  id="btn_lang_en"
                  type="button"
                  onClick={() => handleSelectLanguageChoice('en')}
                  style={{
                    background: lang === 'en' ? '#ecfdf5' : 'white',
                    color: '#0f172a',
                    border: '2px solid #059669',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '22px', fontWeight: 800 }}>English</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Indian English</div>
                  </div>
                  <span style={{ fontSize: '22px' }}>🎙️</span>
                </button>

                {/* Hindi Button */}
                <button
                  id="btn_lang_hi"
                  type="button"
                  onClick={() => handleSelectLanguageChoice('hi')}
                  style={{
                    background: lang === 'hi' ? '#ecfdf5' : 'white',
                    color: '#0f172a',
                    border: '2px solid #059669',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>हिंदी</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Hindi</div>
                  </div>
                  <span style={{ fontSize: '22px' }}>🎙️</span>
                </button>

                {/* Kannada Button */}
                <button
                  id="btn_lang_kn"
                  type="button"
                  onClick={() => handleSelectLanguageChoice('kn')}
                  style={{
                    background: lang === 'kn' ? '#ecfdf5' : 'white',
                    color: '#0f172a',
                    border: '2px solid #059669',
                    padding: '16px 20px',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '24px', fontWeight: 800 }}>ಕನ್ನಡ</div>
                    <div style={{ fontSize: '13px', color: '#64748b' }}>Kannada • ಕರ್ನಾಟಕ</div>
                  </div>
                  <span style={{ fontSize: '22px' }}>🎙️</span>
                </button>
              </div>

              <div style={{ marginTop: '22px' }}>
                <button
                  type="button"
                  onClick={triggerTrilingualLanguagePrompt}
                  style={{ background: 'none', border: 'none', color: '#059669', fontSize: '13px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  🔊 Replay Question / ಧ್ವನಿ ಮರುಪ್ಲೇ ಮಾಡಿ / प्रश्न फिर से सुनें
                </button>
              </div>
            </div>
          </div>
        )}

        {currentScreen === 'login' && loginStep === 'phone_input' && (
          <div style={{ maxWidth: '480px', margin: '30px auto' }}>
            <div className="step-card">
              {/* BUG 1: Tap to Begin audio prompt (satisfies browser gesture requirement) */}
              <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '12px 14px', marginBottom: '16px', textAlign: 'center' }}>
                <button
                  id="btn_tap_to_begin"
                  type="button"
                  onClick={() => {
                    setHasStartedAudio(true);
                    triggerTrilingualLanguagePrompt();
                  }}
                  style={{
                    width: '100%',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-sm)'
                  }}
                >
                  <span>🔊</span>
                  <span>Tap to begin (ಪ್ರಾರಂಭಿಸಲು ಸ್ಪರ್ಶಿಸಿ / शुरू करने के लिए टैप करें)</span>
                </button>
                <div style={{ fontSize: '11px', color: '#065f46', marginTop: '6px' }}>
                  Plays trilingual voice guide in English, Hindi & Kannada
                </div>
              </div>

              {/* Trilingual Choice Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <button
                  id="btn_lang_kn"
                  type="button"
                  onClick={() => handleSelectLanguageChoice('kn')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: lang === 'kn' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: lang === 'kn' ? '#ecfdf5' : 'white',
                    fontWeight: 700,
                    color: lang === 'kn' ? '#047857' : '#475569',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  ಕನ್ನಡ
                </button>
                <button
                  id="btn_lang_hi"
                  type="button"
                  onClick={() => handleSelectLanguageChoice('hi')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: lang === 'hi' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: lang === 'hi' ? '#ecfdf5' : 'white',
                    fontWeight: 700,
                    color: lang === 'hi' ? '#047857' : '#475569',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  हिंदी
                </button>
                <button
                  id="btn_lang_en"
                  type="button"
                  onClick={() => handleSelectLanguageChoice('en')}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: lang === 'en' ? '2px solid #059669' : '1px solid #cbd5e1',
                    background: lang === 'en' ? '#ecfdf5' : 'white',
                    fontWeight: 700,
                    color: lang === 'en' ? '#047857' : '#475569',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  English
                </button>
              </div>

              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>{t.login_title}</h2>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>{t.login_subtitle}</p>

              {authError && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', border: '1px solid #fecaca' }}>
                  <div style={{ marginBottom: '8px' }}>⚠️ {authError}</div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={startRegisterFlow}
                      style={{ background: '#059669', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      📝 Create Account / Register
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginPhone('9876543210');
                        setAuthError('');
                      }}
                      style={{ background: '#f1f5f9', color: '#334155', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      👤 Use Demo Account (9876543210)
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 1: Phone Number Input (Shown First, OTP Hidden) */}
              {!demoOtpBanner && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px' }}>{t.phone_label}</label>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginPhone('9876543210');
                          setAuthError('');
                        }}
                        style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        👤 Auto-Fill Demo (9876543210)
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="login_phone_input"
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={10}
                        placeholder={t.phone_placeholder}
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRequestOtp();
                          }
                        }}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '15px'
                        }}
                      />
                      <button
                        id="btn_send_otp"
                        onClick={handleRequestOtp}
                        disabled={otpCooldown > 0 || isLoading}
                        style={{
                          background: '#059669',
                          color: 'white',
                          border: 'none',
                          padding: '0 18px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          cursor: otpCooldown > 0 ? 'not-allowed' : 'pointer',
                          opacity: otpCooldown > 0 ? 0.7 : 1
                        }}
                      >
                        {otpCooldown > 0 ? `${otpCooldown}s` : t.send_otp_btn}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Demo Mode OTP Banner & OTP Input (Revealed Only After Valid Phone Submitted) */}
              {demoOtpBanner && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                      📱 {loginPhone}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setDemoOtpBanner(null);
                        setLoginOtp('');
                        setAuthError('');
                      }}
                      style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '12px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                    >
                      ✏️ {lang === 'kn' ? 'ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ' : (lang === 'hi' ? 'नंबर बदलें' : 'Change Phone')}
                    </button>
                  </div>

                  <div className="demo-otp-banner">
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#b45309' }}>Demo OTP Mode</div>
                      <div style={{ fontSize: '13px', color: '#92400e' }}>Enter this 6-digit code:</div>
                    </div>
                    <div className="otp-code">{demoOtpBanner}</div>
                    <button
                      onClick={() => {
                        setLoginOtp(demoOtpBanner);
                        handleVerifyOtp(demoOtpBanner);
                      }}
                      style={{
                        background: '#d97706',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Auto Fill & Login
                    </button>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', marginBottom: '6px' }}>{t.otp_label}</label>
                    <input
                      id="login_otp_input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      placeholder="123456"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleVerifyOtp();
                        }
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '18px',
                        letterSpacing: '4px',
                        textAlign: 'center'
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                      <span>{t.otp_attempts_left.replace('{attempts}', otpAttemptsLeft)}</span>
                      <button
                        onClick={handleRequestOtp}
                        disabled={otpCooldown > 0}
                        style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 600 }}
                      >
                        {otpCooldown > 0 ? t.otp_resend_in.replace('{sec}', otpCooldown) : t.otp_resend}
                      </button>
                    </div>

                    <button
                      onClick={() => handleVerifyOtp()}
                      disabled={isLoading}
                      style={{
                        width: '100%',
                        marginTop: '16px',
                        background: '#059669',
                        color: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        fontWeight: 700,
                        fontSize: '15px',
                        cursor: 'pointer'
                      }}
                    >
                      {t.otp_verify_btn}
                    </button>
                  </div>
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <button
                  onClick={startRegisterFlow}
                  style={{ background: 'none', border: 'none', color: '#0369a1', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
                >
                  {t.register_nav_btn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 2: 11-FIELD VOICE REGISTRATION (Section 2 & 4) */}
        {/* ===================================================================== */}
        {currentScreen === 'register' && (
          <div style={{ maxWidth: '600px', margin: '20px auto' }}>
            <div className="wizard-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#059669' }}>
                  {t.step_indicator.replace('{current}', regStep).replace('{total}', 11)}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Haq Saathi One-Time Profile</span>
              </div>
              <div className="wizard-progress-bar">
                <div className="wizard-progress-fill" style={{ width: `${(regStep / 11) * 100}%` }}></div>
              </div>
            </div>

            <div className="step-card active-field">
              <p style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '16px' }}>
                {getRegStepPrompt(regStep)}
              </p>

              {regStep === 1 && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      id="reg_name_input"
                      type="text"
                      placeholder={lang === 'kn' ? 'ಪೂರ್ಣ ಹೆಸರು (ಉದಾ: ರಮೇಶ್ ನಾಯ್ಕ್)' : (lang === 'hi' ? 'पूरा नाम (उदा: रमेश नायक)' : 'Full Name (e.g. Ramesh Naik)')}
                      value={regForm.name}
                      onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                    />
                    <button
                      id="name_mic_btn"
                      type="button"
                      onClick={() => triggerRegFieldVoice(1, 'name')}
                      title="Speak Full Name"
                      style={{
                        background: isListening ? '#dc2626' : '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      🎙️ {isListening ? (t.voice_listening || '...') : (t.reg_speak_btn || 'Speak')}
                    </button>
                  </div>
                  {regForm.name && (
                    <div style={{ fontSize: '12px', color: '#047857', marginTop: '6px', fontWeight: 600 }}>
                      ✓ {t.reg_field_hint || 'Text entered. You can edit above or click Next.'}
                    </div>
                  )}
                </div>
              )}

              {regStep === 2 && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      id="reg_phone_input"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={10}
                      placeholder="10-digit Mobile Number"
                      value={regForm.phone}
                      onChange={(e) => setRegForm({ ...regForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    ⌨️ Keyboard typing only • Voice input disabled for numeric fields
                  </div>
                </div>
              )}

              {regStep === 3 && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      id="reg_aadhaar_input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={12}
                      placeholder="12-digit Aadhaar Number"
                      value={regForm.aadhaar_number}
                      onChange={(e) => setRegForm({ ...regForm, aadhaar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    ⌨️ Keyboard typing only • Masked everywhere after entry: XXXX XXXX {regForm.aadhaar_number?.slice(-4) || '1234'}
                  </div>
                </div>
              )}

              {regStep === 4 && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      id="reg_income_input"
                      type="number"
                      inputMode="numeric"
                      placeholder="Annual Family Income (₹)"
                      value={regForm.annual_income || ''}
                      onChange={(e) => setRegForm({ ...regForm, annual_income: parseInt(e.target.value, 10) || 0 })}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                    ⌨️ Keyboard typing only • Enter amount in rupees (e.g. 120000)
                  </div>
                </div>
              )}

              {regStep === 5 && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                      id="reg_ration_input"
                      type="text"
                      placeholder="Ration Card Number (Optional)"
                      disabled={regForm.no_ration_card}
                      value={regForm.ration_card_number}
                      onChange={(e) => setRegForm({ ...regForm, ration_card_number: e.target.value })}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                    />
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={regForm.no_ration_card}
                      onChange={(e) => setRegForm({ ...regForm, no_ration_card: e.target.checked, ration_card_number: e.target.checked ? 'None' : '' })}
                    />
                    {t.field_ration_none}
                  </label>
                </div>
              )}

              {regStep === 6 && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      id="reg_pan_input"
                      type="text"
                      maxLength={10}
                      placeholder="PAN Card (Format: ABCDE1234F)"
                      value={regForm.pan_number}
                      onChange={(e) => setRegForm({ ...regForm, pan_number: e.target.value.toUpperCase() })}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>⌨️ Keyboard typing only • Optional • Masked as XXXXX1234X</div>
                </div>
              )}

              {regStep === 7 && (
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                    <textarea
                      id="reg_present_address_input"
                      placeholder={lang === 'kn' ? 'ಕರ್ನಾಟಕದಲ್ಲಿ ಪ್ರಸ್ತುತ ವಿಳಾಸ' : (lang === 'hi' ? 'कर्नाटक में आपका वर्तमान पता' : 'Present Address in Bengaluru / Karnataka')}
                      value={regForm.present_address}
                      onChange={(e) => setRegForm({ ...regForm, present_address: e.target.value })}
                      style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minHeight: '80px' }}
                    />
                    <button
                      id="present_address_mic_btn"
                      type="button"
                      onClick={() => triggerRegFieldVoice(7, 'present_address')}
                      title="Speak Present Address"
                      style={{
                        background: isListening ? '#dc2626' : '#059669',
                        color: 'white',
                        border: 'none',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      🎙️ {isListening ? '...' : (t.reg_speak_btn || 'Speak')}
                    </button>
                  </div>
                  {regForm.present_address && (
                    <div style={{ fontSize: '12px', color: '#047857', marginTop: '6px', fontWeight: 600 }}>
                      ✓ {t.reg_field_hint || 'Text entered. You can edit above or click Next.'}
                    </div>
                  )}
                </div>
              )}

              {regStep === 8 && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '12px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={regForm.same_address}
                      onChange={(e) => setRegForm({ ...regForm, same_address: e.target.checked, current_address: e.target.checked ? regForm.present_address : '' })}
                    />
                    {t.field_same_addr}
                  </label>
                  {!regForm.same_address && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <textarea
                        id="reg_current_address_input"
                        placeholder={lang === 'kn' ? 'ಖಾಯಂ / ಊರಿನ ವಿಳಾಸ' : (lang === 'hi' ? 'स्थायी / पैतृक गाँव का पता' : 'Native Place / Permanent Address')}
                        value={regForm.current_address}
                        onChange={(e) => setRegForm({ ...regForm, current_address: e.target.value })}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', minHeight: '70px' }}
                      />
                      <button
                        id="current_address_mic_btn"
                        type="button"
                        onClick={() => triggerRegFieldVoice(8, 'current_address')}
                        style={{
                          background: isListening ? '#dc2626' : '#059669',
                          color: 'white',
                          border: 'none',
                          padding: '12px 16px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        🎙️ {isListening ? '...' : (t.reg_speak_btn || 'Speak')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {regStep === 9 && (
                <div>
                  <div style={{ marginBottom: '10px' }}>
                    <input
                      id="reg_occupation_input"
                      type="text"
                      placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಉದ್ಯೋಗ ಟೈಪ್ ಮಾಡಿ (ಉದಾ: ಕಟ್ಟಡ ಕಾರ್ಮಿಕ)' : (lang === 'hi' ? 'अपना व्यवसाय टाइप करें (उदा: निर्माण मजदूर)' : 'Type your occupation (e.g. Construction Worker)')}
                      value={regForm.occupation}
                      onChange={(e) => setRegForm({ ...regForm, occupation: e.target.value })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                    />
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    ⌨️ Plain text typing only • Tap a suggestion chip or type your own:
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {['Construction Worker', 'Daily Wage Labourer', 'Domestic Worker', 'Street Vendor', 'Carpenter', 'Driver', 'Agricultural Worker'].map((occ) => (
                        <button
                          key={occ}
                          type="button"
                          onClick={() => setRegForm({ ...regForm, occupation: occ })}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: regForm.occupation === occ ? '#ecfdf5' : '#f8fafc',
                            color: regForm.occupation === occ ? '#059669' : '#334155',
                            fontSize: '12px',
                            cursor: 'pointer',
                            fontWeight: regForm.occupation === occ ? 700 : 500
                          }}
                        >
                          {occ}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {regStep === 10 && (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <input
                      type="file"
                      id="passport_photo_input"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          if (file.size > 2 * 1024 * 1024) {
                            alert("Photo must be less than 2MB.");
                            return;
                          }
                          const reader = new FileReader();
                          reader.onload = (uploadEvent) => {
                            setRegForm({ ...regForm, photo_url: uploadEvent.target.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      style={{ padding: '8px', border: '1px solid #cbd5e1', borderRadius: '8px', width: '100%', background: '#f8fafc' }}
                    />
                  </div>

                  {/* Quick sample photo selector for testing & convenience */}
                  <div style={{ margin: '10px 0', fontSize: '12px', color: '#64748b' }}>
                    Or select a sample photo:
                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const sample = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140'><rect width='120' height='140' fill='%23059669'/><circle cx='60' cy='50' r='30' fill='%23ffffff'/><circle cx='60' cy='120' r='45' fill='%23ffffff'/><text x='60' y='58' font-size='22' text-anchor='middle' fill='%23059669' font-weight='bold'>PHOTO</text></svg>";
                          setRegForm({ ...regForm, photo_url: sample });
                        }}
                        style={{ padding: '4px 10px', fontSize: '11px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        📷 Sample Photo 1
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const sample2 = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 140'><rect width='120' height='140' fill='%23d97706'/><circle cx='60' cy='50' r='30' fill='%23ffffff'/><circle cx='60' cy='120' r='45' fill='%23ffffff'/><text x='60' y='58' font-size='22' text-anchor='middle' fill='%23d97706' font-weight='bold'>PHOTO</text></svg>";
                          setRegForm({ ...regForm, photo_url: sample2 });
                        }}
                        style={{ padding: '4px 10px', fontSize: '11px', background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        📷 Sample Photo 2
                      </button>
                    </div>
                  </div>

                  {/* Visible Preview Thumbnail immediately upon selection */}
                  {regForm.photo_url ? (
                    <div id="photo_preview_container" style={{ marginTop: '14px', padding: '14px', border: '2px solid #059669', borderRadius: '12px', background: '#ecfdf5', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <img
                        id="reg_photo_preview"
                        src={regForm.photo_url}
                        alt="Passport Photo Preview"
                        style={{ width: '90px', height: '110px', objectFit: 'cover', borderRadius: '8px', border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}
                      />
                      <div>
                        <div style={{ color: '#047857', fontWeight: 700, fontSize: '14px' }}>✓ Photo Preview Confirmed</div>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>This passport photo will be linked to your Haq Saathi account and displayed on your Dashboard.</div>
                        <button
                          type="button"
                          onClick={() => setRegForm({ ...regForm, photo_url: '' })}
                          style={{ marginTop: '8px', background: 'none', border: 'none', color: '#dc2626', fontSize: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                        >
                          Remove / Choose another
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b', fontStyle: 'italic' }}>
                      Preview thumbnail will appear here immediately once selected.
                    </div>
                  )}
                </div>
              )}

              {regStep === 11 && (
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', marginBottom: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={regForm.has_digilocker}
                      onChange={(e) => setRegForm({ ...regForm, has_digilocker: e.target.checked })}
                    />
                    {t.field_digilocker_yes}
                  </label>
                  {regForm.has_digilocker && (
                    <input
                      type="text"
                      placeholder={t.field_digilocker_id}
                      value={regForm.digilocker_id}
                      onChange={(e) => setRegForm({ ...regForm, digilocker_id: e.target.value })}
                      style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                    />
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
                {regStep > 1 ? (
                  <button
                    id="reg_prev_btn"
                    onClick={() => {
                      const prev = regStep - 1;
                      setRegStep(prev);
                      speakAndListen(getRegStepPrompt(prev), lang);
                    }}
                    style={{ padding: '8px 16px', background: '#e2e8f0', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {t.reg_prev_btn}
                  </button>
                ) : <div></div>}

                <button
                  id="reg_next_btn"
                  onClick={() => {
                    if (regStep < 11) {
                      goToNextRegStep(regStep + 1);
                    } else {
                      setCurrentScreen('register_review');
                    }
                  }}
                  style={{ padding: '10px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                >
                  {regStep === 11 ? t.reg_review_btn : t.reg_next_btn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 3: MANDATORY PRE-REGISTRATION REVIEW (Section 2 & 8) */}
        {/* ===================================================================== */}
        {currentScreen === 'register_review' && (
          <div style={{ maxWidth: '650px', margin: '20px auto' }}>
            <div className="step-card">
              <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '6px' }}>{t.reg_review_title}</h2>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>{t.reg_review_subtitle}</p>

              {regError && (
                <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', border: '1px solid #fecaca' }}>
                  {regError}
                </div>
              )}

              <table className="review-table">
                <tbody>
                  <tr>
                    <th>{t.field_full_name}</th>
                    <td><strong>{regForm.name}</strong></td>
                    <td><button className="review-edit-btn" onClick={() => { setCurrentScreen('register'); setRegStep(1); }}>{t.reg_edit_btn}</button></td>
                  </tr>
                  <tr>
                    <th>{t.field_phone}</th>
                    <td>{regForm.phone}</td>
                    <td><button className="review-edit-btn" onClick={() => { setCurrentScreen('register'); setRegStep(2); }}>{t.reg_edit_btn}</button></td>
                  </tr>
                  <tr>
                    <th>{t.field_aadhaar}</th>
                    <td><code>XXXX XXXX {regForm.aadhaar_number?.slice(-4) || '1234'}</code></td>
                    <td><button className="review-edit-btn" onClick={() => { setCurrentScreen('register'); setRegStep(3); }}>{t.reg_edit_btn}</button></td>
                  </tr>
                  <tr>
                    <th>{t.field_income}</th>
                    <td>₹{parseInt(regForm.annual_income, 10)?.toLocaleString()}</td>
                    <td><button className="review-edit-btn" onClick={() => { setCurrentScreen('register'); setRegStep(4); }}>{t.reg_edit_btn}</button></td>
                  </tr>
                  <tr>
                    <th>{t.field_ration}</th>
                    <td>{regForm.no_ration_card ? 'None' : (regForm.ration_card_number || 'None')}</td>
                    <td><button className="review-edit-btn" onClick={() => { setCurrentScreen('register'); setRegStep(5); }}>{t.reg_edit_btn}</button></td>
                  </tr>
                  <tr>
                    <th>{t.field_pan}</th>
                    <td>{regForm.pan_number ? `XXXXX${regForm.pan_number.slice(5)}` : 'None'}</td>
                    <td><button className="review-edit-btn" onClick={() => { setCurrentScreen('register'); setRegStep(6); }}>{t.reg_edit_btn}</button></td>
                  </tr>
                  <tr>
                    <th>{t.field_present_addr}</th>
                    <td>{regForm.present_address}</td>
                    <td><button className="review-edit-btn" onClick={() => { setCurrentScreen('register'); setRegStep(7); }}>{t.reg_edit_btn}</button></td>
                  </tr>
                  <tr>
                    <th>{t.field_occupation}</th>
                    <td>{regForm.occupation}</td>
                    <td><button className="review-edit-btn" onClick={() => { setCurrentScreen('register'); setRegStep(9); }}>{t.reg_edit_btn}</button></td>
                  </tr>
                  <tr>
                    <th>Passport Photo</th>
                    <td>
                      {regForm.photo_url ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <img
                            id="review_photo_preview"
                            src={regForm.photo_url}
                            alt="Passport Photo Preview"
                            style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                          />
                          <span style={{ fontSize: '12px', color: '#047857', fontWeight: 600 }}>✓ Attached</span>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>None (Default avatar will be used)</span>
                      )}
                    </td>
                    <td><button className="review-edit-btn" onClick={() => { setCurrentScreen('register'); setRegStep(10); }}>{t.reg_edit_btn}</button></td>
                  </tr>
                  <tr>
                    <th>{t.field_digilocker}</th>
                    <td>{regForm.has_digilocker ? 'Yes (Linked)' : 'No'}</td>
                    <td><button className="review-edit-btn" onClick={() => { setCurrentScreen('register'); setRegStep(11); }}>{t.reg_edit_btn}</button></td>
                  </tr>
                </tbody>
              </table>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button
                  id="btn_finalize_registration"
                  onClick={() => finalizeRegistration()}
                  disabled={isLoading || isSubmittingReg}
                  style={{
                    flex: 1,
                    padding: '14px',
                    background: (isLoading || isSubmittingReg) ? '#94a3b8' : '#059669',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 700,
                    fontSize: '15px',
                    cursor: (isLoading || isSubmittingReg) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isSubmittingReg ? '⏳ Saving & Navigating...' : t.reg_submit_btn}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 4: USER DASHBOARD (Section 2 & 6) */}
        {/* ===================================================================== */}
        {currentScreen === 'dashboard' && currentUser && (
          <div>
            {/* Dashboard Welcome Header */}
            <div style={{ background: 'white', borderRadius: '14px', padding: '18px 22px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {currentUser.photo_url ? (
                  <img src={currentUser.photo_url} alt="Profile" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#059669', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                    {currentUser.name?.[0]}
                  </div>
                )}
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                    {t.dash_welcome.replace('{name}', currentUser.name)}
                  </h2>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    {currentUser.occupation_display || currentUser.occupation} • Aadhaar: <code>{currentUser.aadhaar_masked || 'XXXX XXXX 1234'}</code>
                  </p>
                </div>
              </div>

              <button
                onClick={() => startSchemeApplication('ration_card')}
                style={{
                  background: '#059669',
                  color: 'white',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🎙️ {t.dash_start_app}
              </button>
            </div>

            {/* Dashboard Tabs Bar */}
            <div className="dashboard-tabs">
              <button
                id="dash_tab_home"
                className={`dash-tab-btn ${activeTab === 'schemes' ? 'active' : ''}`}
                onClick={handleNavigateHome}
                onTouchEnd={handleNavigateHome}
                aria-label="Home"
              >
                🏠 {lang === 'kn' ? 'ಮುಖಪುಟ' : (lang === 'hi' ? 'होम' : 'Home')}
              </button>
              <button
                className={`dash-tab-btn ${activeTab === 'schemes' ? 'active' : ''}`}
                onClick={() => { setActiveTab('schemes'); runFullScan(); }}
              >
                📊 {t.tab_schemes}
              </button>
              <button
                className={`dash-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                👤 {t.tab_profile}
              </button>
              <button
                id="dash_tab_applications"
                className={`dash-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
                onClick={async () => {
                  setActiveTab('applications');
                  if (currentUser && currentUser.phone) {
                    const token = localStorage.getItem('haq_token');
                    const freshData = await api.getDashboard(currentUser.phone, token, lang);
                    const incoming = (freshData && (freshData.applications || (freshData.user && freshData.user.applications))) || [];
                    const reconciled = reconcileUserApplications(incoming, currentUser.phone);
                    setUserApplications(reconciled);
                  }
                }}
              >
                📑 {t.tab_applications} ({userApplications.length})
              </button>
              <button
                className={`dash-tab-btn ${activeTab === 'documents' ? 'active' : ''}`}
                onClick={() => setActiveTab('documents')}
              >
                🔒 {t.tab_documents}
              </button>
              <button
                className={`dash-tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                ⏱️ {t.tab_activity}
              </button>
            </div>

            {/* TAB 1: SCHEMES FOR YOU (Section 6 & Steps 1-4) */}
            {activeTab === 'schemes' && (
              <div>
                {/* Live Discovery vs Fallback Banner */}
                {scanResults && (scanResults.fallback_triggered || scanResults.source_type === 'demo_reference') ? (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>⚠️</span>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#92400e', display: 'block' }}>
                            Demo reference schemes
                          </strong>
                          <span style={{ fontSize: '12px', color: '#b45309' }}>
                            Live search was unavailable — showing demo reference schemes.
                          </span>
                        </div>
                      </div>
                      <span style={{ background: '#f59e0b', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', letterSpacing: '0.5px' }}>
                        DEMO FALLBACK
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '8px', padding: '12px 14px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>🔍</span>
                        <div>
                          <strong style={{ fontSize: '14px', color: '#065f46', display: 'block' }}>
                            Live Scheme Discovery Active
                          </strong>
                          <span style={{ fontSize: '12px', color: '#047857' }}>
                            Found via live search — verify current details on the official scheme page.
                          </span>
                        </div>
                      </div>
                      <span style={{ background: '#10b981', color: 'white', fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '12px', letterSpacing: '0.5px' }}>
                        LIVE WEB SEARCH
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Deterministic scan evaluated across real state & central welfare entitlements.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      id="btn_test_break_search"
                      onClick={() => runFullScan(!isBreakSearchActive)}
                      style={{
                        background: isBreakSearchActive ? '#fee2e2' : '#fef3c7',
                        border: `1px solid ${isBreakSearchActive ? '#fca5a5' : '#fcd34d'}`,
                        color: isBreakSearchActive ? '#991b1b' : '#92400e',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      title="Test Scenario 3: Simulate breaking web search to verify honest fallback"
                    >
                      {isBreakSearchActive ? '🔄 Restore Live Search' : '⚡ Break Search (Test Fallback)'}
                    </button>
                    <button
                      onClick={() => runFullScan(isBreakSearchActive)}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      🔄 {t.recheck_scan_btn}
                    </button>
                  </div>
                </div>

                {/* Submitted Applications Quick Section on Dashboard Home (Requirement 4) */}
                {userApplications && userApplications.length > 0 && (
                  <div id="dashboard_submitted_apps_summary" style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📋</span> Submitted Applications ({userApplications.length})
                      </h3>
                      <button
                        onClick={() => setActiveTab('applications')}
                        style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
                      >
                        View All Applications →
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {userApplications.slice(0, 2).map(renderApplicationCard)}
                    </div>
                  </div>
                )}

                {/* Group 1: Eligible (Green) */}
                {scanResults?.eligible && scanResults.eligible.length > 0 && (
                  <div>
                    <h3 className="scan-group-title eligible">
                      <span>🟢</span> {t.section_eligible_title} ({scanResults.eligible.length})
                    </h3>
                    {scanResults.eligible.map((s) => (
                      <div key={s.scheme_id} className="scan-card eligible">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#047857', margin: 0 }}>
                                {(lang === 'kn' && s.scheme_name_kn) ? s.scheme_name_kn : ((lang === 'hi' && s.scheme_name_hi) ? s.scheme_name_hi : s.scheme_name_en)}
                              </h4>
                              {s.category && (
                                <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', textTransform: 'capitalize' }}>
                                  {s.category}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '13px', color: '#334155', marginTop: '6px', marginBottom: '6px' }}>
                              {(lang === 'kn' && s.benefit_kn) ? s.benefit_kn : ((lang === 'hi' && s.benefit_hi) ? s.benefit_hi : s.benefit_en)}
                            </p>
                            <p style={{ fontSize: '12px', color: '#047857', fontWeight: 600, marginTop: '4px', marginBottom: '4px' }}>
                              ✓ {(lang === 'kn' && s.raw_explanation_kn) ? s.raw_explanation_kn : ((lang === 'hi' && s.raw_explanation_hi) ? s.raw_explanation_hi : s.raw_explanation_en)}
                            </p>

                            {/* Step 4: Source URL & Verification Attribution */}
                            {s.source_url && (
                              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                                <a
                                  href={s.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '12px', color: '#0284c7', textDecoration: 'underline', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <span>🌐</span> Source: {s.source_url.replace('https://', '')}
                                </a>
                                <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                                  {s.live_search_note || 'Found via live search — verify current details on the official scheme page.'}
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => startSchemeApplication(s.scheme_id)}
                            style={{
                              background: '#059669',
                              color: 'white',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              marginLeft: '12px'
                            }}
                          >
                            {t.apply_scheme_btn}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Group 2: Needs More Information (Amber) */}
                {scanResults?.needs_more_info && scanResults.needs_more_info.length > 0 && (
                  <div>
                    <h3 className="scan-group-title needs-info">
                      <span>🟡</span> {t.section_needs_info_title} ({scanResults.needs_more_info.length})
                    </h3>
                    {scanResults.needs_more_info.map((s) => (
                      <div key={s.scheme_id} className="scan-card needs-info">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#b45309', margin: 0 }}>
                                {(lang === 'kn' && s.scheme_name_kn) ? s.scheme_name_kn : ((lang === 'hi' && s.scheme_name_hi) ? s.scheme_name_hi : s.scheme_name_en)}
                              </h4>
                              {s.category && (
                                <span style={{ background: '#fef3c7', color: '#b45309', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', textTransform: 'capitalize' }}>
                                  {s.category}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '13px', color: '#334155', marginTop: '6px', marginBottom: '6px' }}>
                              {(lang === 'kn' && s.benefit_kn) ? s.benefit_kn : ((lang === 'hi' && s.benefit_hi) ? s.benefit_hi : s.benefit_en)}
                            </p>
                            <div style={{ marginTop: '6px', fontSize: '12px', color: '#92400e' }}>
                              <strong>{t.missing_fields_label}</strong> {s.missing_fields.map((f) => f.replace(/_/g, ' ')).join(', ')}
                            </div>

                            {/* Step 4: Source URL & Verification Attribution */}
                            {s.source_url && (
                              <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                                <a
                                  href={s.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ fontSize: '12px', color: '#0284c7', textDecoration: 'underline', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <span>🌐</span> Source: {s.source_url.replace('https://', '')}
                                </a>
                                <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                                  {s.live_search_note || 'Found via live search — verify current details on the official scheme page.'}
                                </span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => handleAnswerMissingFields(s)}
                            style={{
                              background: '#d97706',
                              color: 'white',
                              border: 'none',
                              padding: '8px 14px',
                              borderRadius: '8px',
                              fontWeight: 700,
                              fontSize: '13px',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap',
                              marginLeft: '12px'
                            }}
                          >
                            🎙️ {t.answer_missing_btn}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Group 3: Not Eligible (Red/Grey) */}
                {scanResults?.not_eligible && scanResults.not_eligible.length > 0 && (
                  <div>
                    <h3 className="scan-group-title not-eligible">
                      <span>⚪</span> {t.section_not_eligible_title} ({scanResults.not_eligible.length})
                    </h3>
                    {scanResults.not_eligible.map((s) => (
                      <div key={s.scheme_id} className="scan-card not-eligible">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#475569', margin: 0 }}>
                            {(lang === 'kn' && s.scheme_name_kn) ? s.scheme_name_kn : ((lang === 'hi' && s.scheme_name_hi) ? s.scheme_name_hi : s.scheme_name_en)}
                          </h4>
                          {s.category && (
                            <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '10px', textTransform: 'capitalize' }}>
                              {s.category}
                            </span>
                          )}
                        </div>
                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', marginBottom: '4px' }}>
                          {(lang === 'kn' && s.raw_explanation_kn) ? s.raw_explanation_kn : ((lang === 'hi' && s.raw_explanation_hi) ? s.raw_explanation_hi : s.raw_explanation_en)}
                        </p>

                        {/* Step 4: Source URL & Verification Attribution */}
                        {s.source_url && (
                          <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                            <a
                              href={s.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ fontSize: '12px', color: '#0284c7', textDecoration: 'underline', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <span>🌐</span> Source: {s.source_url.replace('https://', '')}
                            </a>
                            <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                              {s.live_search_note || 'Found via live search — verify current details on the official scheme page.'}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: PROFILE SUMMARY */}
            {activeTab === 'profile' && (
              <div className="step-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' }}>
                  {currentUser.photo_url ? (
                    <img
                      id="dashboard_profile_photo"
                      src={currentUser.photo_url}
                      alt={currentUser.name}
                      style={{
                        width: '84px',
                        height: '100px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '2px solid #059669',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}
                    />
                  ) : (
                    <div
                      id="dashboard_profile_avatar"
                      style={{
                        width: '84px',
                        height: '100px',
                        borderRadius: '10px',
                        background: '#f1f5f9',
                        border: '2px dashed #cbd5e1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#64748b'
                      }}
                    >
                      <span style={{ fontSize: '32px' }}>👤</span>
                      <span style={{ fontSize: '11px', marginTop: '4px' }}>No Photo</span>
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>{currentUser.name}</h3>
                    <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                      {currentUser.occupation_display || currentUser.occupation}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <span style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600 }}>
                        ✓ Haq Saathi Citizen Profile
                      </span>
                    </div>
                  </div>
                </div>

                <table className="review-table">
                  <tbody>
                    <tr>
                      <th>Profile Photo</th>
                      <td>
                        {currentUser.photo_url ? (
                          <span style={{ color: '#047857', fontWeight: 600 }}>✓ Attached Passport Photo</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Default avatar</span>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <th>Full Name</th>
                      <td><strong>{currentUser.name}</strong></td>
                    </tr>
                    <tr>
                      <th>Mobile Number</th>
                      <td>{currentUser.phone}</td>
                    </tr>
                    <tr>
                      <th>Aadhaar Number</th>
                      <td><code>{currentUser.aadhaar_masked || 'XXXX XXXX 1234'}</code></td>
                    </tr>
                    <tr>
                      <th>Annual Income</th>
                      <td>₹{currentUser.annual_income?.toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Occupation</th>
                      <td>{currentUser.occupation_display || currentUser.occupation}</td>
                    </tr>
                    <tr>
                      <th>Present Address</th>
                      <td>{currentUser.present_address}</td>
                    </tr>
                    <tr>
                      <th>Labour Card Active</th>
                      <td>{currentUser.has_labour_card ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr>
                      <th>Family Members (Dependents)</th>
                      <td>{(currentUser.dependents || []).length} registered dependents</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: MY APPLICATIONS */}
            {activeTab === 'applications' && (
              <div id="user_applications_container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>
                    📑 {t.tab_applications} ({userApplications.length})
                  </h3>
                  {currentUser && (
                    <button
                      onClick={async () => {
                        const token = localStorage.getItem('haq_token');
                        const freshData = await api.getDashboard(currentUser.phone, token, lang);
                        const incoming = (freshData && (freshData.applications || (freshData.user && freshData.user.applications))) || [];
                        const reconciled = reconcileUserApplications(incoming, currentUser.phone);
                        setUserApplications(reconciled);
                      }}
                      style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      🔄 Refresh
                    </button>
                  )}
                </div>

                {userApplications.length === 0 ? (
                  <div className="step-card" style={{ textAlign: 'center', color: '#64748b', padding: '36px 16px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📑</div>
                    <p style={{ fontWeight: 600, color: '#334155' }}>No applications submitted yet.</p>
                    <p style={{ fontSize: '13px', marginTop: '4px' }}>Tap "Schemes For You" to apply for an eligible government scheme!</p>
                  </div>
                ) : (
                  <div className="applications-list" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {userApplications.map(renderApplicationCard)}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: MY DOCUMENTS (DigiLocker Consent Vault) */}
            {activeTab === 'documents' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>{t.tab_documents}</h3>
                <div className="step-card">
                  <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                    You have complete sovereignty over your documents. Toggle access on or off at any time.
                  </p>
                  {Object.entries(vaultDocs).map(([docKey, permStatus]) => (
                    <div key={docKey} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <strong style={{ fontSize: '14px' }}>{docKey.replace(/_/g, ' ').toUpperCase()}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>DigiLocker Verified Credential</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: permStatus === 'ALLOWED' ? '#ecfdf5' : '#fef2f2',
                          color: permStatus === 'ALLOWED' ? '#047857' : '#b91c1c'
                        }}>
                          {permStatus}
                        </span>
                        <button
                          onClick={async () => {
                            const newStatus = permStatus === 'ALLOWED' ? 'REVOKED' : 'ALLOWED';
                            await api.toggleDocument(currentUser.phone, docKey, newStatus);
                            setVaultDocs((prev) => ({ ...prev, [docKey]: newStatus }));
                          }}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            background: 'white',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {permStatus === 'ALLOWED' ? 'Revoke' : 'Re-Allow'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: RECENT ACTIVITY (User-Filtered Audit Timeline) */}
            {activeTab === 'activity' && (
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px' }}>{t.tab_activity}</h3>
                <div className="step-card">
                  {userAuditLogs.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '13px' }}>No audit actions recorded for your account yet.</p>
                  ) : (
                    userAuditLogs.map((log) => (
                      <div key={log.id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '11px' }}>
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                          <span style={{ fontWeight: 700, color: log.status === 'ALLOWED' ? '#047857' : (log.status === 'REVOKED' ? '#b45309' : '#b91c1c') }}>
                            {log.status}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, marginTop: '2px' }}>
                          {log.document_title_en} — {log.scheme_name_en}
                        </div>
                        {log.dependent_name && (
                          <div style={{ color: '#0369a1', fontSize: '11px' }}>On behalf of: {log.dependent_name}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Unauthenticated Dashboard Fallback */}
        {currentScreen === 'dashboard' && !currentUser && (
          <div style={{ maxWidth: '520px', margin: '40px auto', textAlign: 'center', background: 'white', padding: '30px', borderRadius: '14px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔒</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              {lang === 'kn' ? 'ದಯವಿಟ್ಟು ಮೊದಲು ಲಾಗಿನ್ ಮಾಡಿ' : (lang === 'hi' ? 'कृपया पहले लॉगिन करें' : 'Please Login First')}
            </h3>
            <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '20px' }}>
              {lang === 'kn' ? 'ನಿಮ್ಮ ಸೌಲಭ್ಯಗಳನ್ನು ವೀಕ್ಷಿಸಲು ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಪ್ರವೇಶಿಸಿ' : (lang === 'hi' ? 'अपनी योजनाओं को देखने के लिए मोबाइल नंबर से प्रवेश करें' : 'Log in with your phone number to access schemes and entitlements.')}
            </p>
            <button
              id="btn_fallback_login"
              onClick={handleNavigateHome}
              onTouchEnd={handleNavigateHome}
              style={{ background: '#059669', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
            >
              {lang === 'kn' ? 'ಲಾಗಿನ್ ಪುಟಕ್ಕೆ ಹೋಗಿ' : (lang === 'hi' ? 'लॉगिन करें' : 'Go to Login')}
            </button>
          </div>
        )}

        {/* ===================================================================== */}
        {/* SCREEN 5: CORE VOICE SCHEME APPLICATION FLOW (Section 3, 5, 7, 8) */}
        {/* ===================================================================== */}
        {currentScreen === 'scheme_flow' && (
          <div style={{ maxWidth: '650px', margin: '20px auto' }}>
            {/* Back button */}
            <button
              id="btn_scheme_flow_back"
              onClick={handleNavigateHome}
              onTouchEnd={handleNavigateHome}
              style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 700, cursor: 'pointer', marginBottom: '12px' }}
            >
              ← Back to Dashboard
            </button>

            {/* Proxy header badge */}
            {applicantType === 'family_member' && proxyDependent && (
              <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', border: '1px solid #bae6fd', fontSize: '13px', fontWeight: 600 }}>
                👨‍👩‍👧 {t.proxy_badge} <strong>{proxyDependent.name}</strong> ({proxyDependent.relationship})
              </div>
            )}

            {/* Scheme Title & Details Card */}
            {(() => {
              const allSchemes = (schemes && schemes.length) ? schemes : DEFAULT_SCHEMES;
              const currentSchemeObj = allSchemes.find(s => s.id === activeSchemeId) || allSchemes[0];
              const schemeTitle = (lang === 'kn' && currentSchemeObj.name_kn) ? currentSchemeObj.name_kn : ((lang === 'hi' && currentSchemeObj.name_hi) ? currentSchemeObj.name_hi : currentSchemeObj.name_en);
              const schemeBenefit = (lang === 'kn' && currentSchemeObj.benefit_kn) ? currentSchemeObj.benefit_kn : ((lang === 'hi' && currentSchemeObj.benefit_hi) ? currentSchemeObj.benefit_hi : currentSchemeObj.benefit_en);
              const targetProfile = proxyDependent ? { ...(currentUser || {}), ...proxyDependent } : (currentUser || {});
              const required = currentSchemeObj.required_fields || [];

              return (
                <div>
                  <div style={{ background: 'white', borderRadius: '12px', padding: '18px 22px', marginBottom: '16px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#059669', background: '#ecfdf5', padding: '4px 8px', borderRadius: '6px' }}>
                        🏛️ {currentSchemeObj.id?.toUpperCase()}
                      </span>
                      {applicantType === 'family_member' && proxyDependent && (
                        <span style={{ fontSize: '12px', color: '#0369a1', background: '#e0f2fe', padding: '4px 10px', borderRadius: '6px', fontWeight: 600 }}>
                          👨‍👩‍👧 {t.proxy_badge} {proxyDependent.name} ({proxyDependent.relationship})
                        </span>
                      )}
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 700, marginTop: '8px', color: '#065f46' }}>{schemeTitle}</h2>
                    <p style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>{schemeBenefit}</p>
                  </div>

                  {/* BUG 3: Application Requirements Checklist (Known details first, clearly marked pre-filled) */}
                  <div id="scheme_requirements_checklist" style={{ background: 'white', borderRadius: '12px', padding: '18px 22px', marginBottom: '20px', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📋</span> {lang === 'kn' ? 'ಅರ್ಜಿಯ ಅಗತ್ಯ ವಿವರಗಳು ಮತ್ತು ಸ್ಥಿತಿ' : (lang === 'hi' ? 'आवेदन की आवश्यक जानकारी एवं स्थिति' : 'Application Requirements & Profile Details')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {required.map((field) => {
                        const val = targetProfile[field];
                        const isKnown = val !== undefined && val !== null && val !== '';
                        const fieldLabels = {
                          annual_income: { en: "Annual Family Income", kn: "ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯ", hi: "वार्षिक पारिवारिक आय" },
                          family_size: { en: "Family Members Count", kn: "ಕುಟುಂಬದ ಸದಸ್ಯರ ಸಂಖ್ಯೆ", hi: "परिवार के सदस्यों की संख्या" },
                          state_resident: { en: "Karnataka Resident", kn: "ಕರ್ನಾಟಕ ನಿವಾಸಿ", hi: "कर्नाटक निवासी" },
                          occupation: { en: "Occupation / Trade", kn: "ಉದ್ಯೋಗ / ಕಾಯಕ", hi: "व्यवसाय / कार्य" },
                          has_labour_card: { en: "Karnataka Labour Card", kn: "ಕಾರ್ಮಿಕ ಕಾರ್ಡ್", hi: "ಕರ್ನಾಟಕ ಲೇಬರ್ ಕಾರ್ಡ್" },
                          has_school_going_child: { en: "School-Going Child", kn: "ಶಾಲಾ ಮಗು", hi: "स्कूली बच्चा" },
                          age: { en: "Applicant Age", kn: "ಅರ್ಜಿದಾರರ ವಯಸ್ಸು", hi: "आवेदक की आयु" }
                        };
                        const labelObj = fieldLabels[field] || { en: field.replace(/_/g, ' '), kn: field, hi: field };
                        const fieldTitle = labelObj[lang] || labelObj.en;

                        let displayVal = '—';
                        if (isKnown) {
                          if (field === 'annual_income' || field === 'monthly_income') {
                            displayVal = `₹${parseInt(val, 10).toLocaleString()}`;
                          } else if (field === 'state_resident' || field === 'has_labour_card' || field === 'has_school_going_child') {
                            displayVal = val ? (lang === 'kn' ? 'ಹೌದು (Yes)' : (lang === 'hi' ? 'हाँ (Yes)' : 'Yes')) : (lang === 'kn' ? 'ಇಲ್ಲ (No)' : (lang === 'hi' ? 'नहीं (No)' : 'No'));
                          } else if (field === 'family_size') {
                            displayVal = `${val} ${lang === 'kn' ? 'ಜನ' : (lang === 'hi' ? 'सदस्य' : 'members')}`;
                          } else if (field === 'age') {
                            displayVal = `${val} ${lang === 'kn' ? 'ವರ್ಷ' : (lang === 'hi' ? 'वर्ष' : 'years')}`;
                          } else {
                            displayVal = String(val);
                          }
                        }

                        return (
                          <div
                            key={field}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '10px 14px',
                              borderRadius: '8px',
                              background: isKnown ? '#f0fdf4' : '#fffbeb',
                              border: `1px solid ${isKnown ? '#bbf7d0' : '#fde68a'}`
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                                {fieldTitle}
                              </div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: isKnown ? '#15803d' : '#b45309', marginTop: '2px' }}>
                                {isKnown ? displayVal : (lang === 'kn' ? 'ಮಾಹಿತಿ ಅಗತ್ಯವಿದೆ' : (lang === 'hi' ? 'जानकारी आवश्यक है' : 'Still Needed'))}
                              </div>
                            </div>
                            <div>
                              {isKnown ? (
                                <span style={{ fontSize: '11px', background: '#dcfce7', color: '#166534', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                  ✓ {lang === 'kn' ? 'ನೋಂದಣಿಯಿಂದ ಭರ್ತಿಯಾಗಿದೆ' : (lang === 'hi' ? 'पंजीकरण से भरा हुआ' : 'Pre-filled from Profile')}
                                </span>
                              ) : (
                                <span style={{ fontSize: '11px', background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
                                  ⚠️ {lang === 'kn' ? 'ಉತ್ತರಿಸಿ' : (lang === 'hi' ? 'उत्तर दें' : 'Still Needed')}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Flow Step: Missing Questioning */}
            {flowStep === 'questioning' && currentQuestion && (
              <div className="step-card active-field">
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>{t.step_question_title}</h3>
                <p style={{ fontSize: '16px', color: '#0f172a', marginBottom: '16px' }}>{currentQuestion.text}</p>

                {speechParseError && (
                  <div id="voice_parse_error" style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', marginBottom: '14px', fontSize: '13px', fontWeight: 600 }}>
                    ⚠️ {speechParseError}
                  </div>
                )}

                {/* FIX 2: Numeric Fields (Income, Age, Family Size, Phone, Aadhaar, PAN) — Typing Only, No Mic */}
                {['annual_income', 'monthly_income', 'income', 'age', 'family_size', 'phone', 'aadhaar_number', 'pan_number'].includes(currentQuestion.field) && (
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="scheme_numeric_input"
                        type="number"
                        inputMode="numeric"
                        placeholder={lang === 'kn' ? 'ಸಂಖ್ಯೆಯನ್ನು ಇಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ' : (lang === 'hi' ? 'संख्या यहाँ टाइप करें' : 'Type number here')}
                        value={schemeTypedAnswer}
                        onChange={(e) => setSchemeTypedAnswer(e.target.value)}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '16px' }}
                      />
                      <button
                        id="scheme_numeric_submit_btn"
                        type="button"
                        onClick={() => {
                          if (schemeTypedAnswer.trim()) {
                            handleSchemeFieldAnswer(schemeTypedAnswer.trim(), currentQuestion.field, activeSchemeId, proxyDependent);
                            setSchemeTypedAnswer('');
                          }
                        }}
                        style={{ background: '#059669', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Submit →
                      </button>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                      ⌨️ Keyboard typing only • Voice input disabled for numeric values
                    </div>
                  </div>
                )}

                {/* FIX 3: Occupation Field — Plain Text Input & Suggestion Chips, No Mic */}
                {currentQuestion.field === 'occupation' && (
                  <div style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        id="scheme_occupation_input"
                        type="text"
                        placeholder={lang === 'kn' ? 'ನಿಮ್ಮ ಉದ್ಯೋಗ ಟೈಪ್ ಮಾಡಿ' : (lang === 'hi' ? 'अपना व्यवसाय टाइप करें' : 'Type your occupation')}
                        value={schemeTypedAnswer}
                        onChange={(e) => setSchemeTypedAnswer(e.target.value)}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '15px' }}
                      />
                      <button
                        id="scheme_occupation_submit_btn"
                        type="button"
                        onClick={() => {
                          if (schemeTypedAnswer.trim()) {
                            handleSchemeFieldAnswer(schemeTypedAnswer.trim(), currentQuestion.field, activeSchemeId, proxyDependent);
                            setSchemeTypedAnswer('');
                          }
                        }}
                        style={{ background: '#059669', color: 'white', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Submit →
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '10px' }}>
                      {['Construction Worker', 'Daily Wage Labourer', 'Domestic Worker', 'Street Vendor', 'Carpenter', 'Driver'].map((occ) => (
                        <button
                          key={occ}
                          type="button"
                          onClick={() => {
                            handleSchemeFieldAnswer(occ, currentQuestion.field, activeSchemeId, proxyDependent);
                            setSchemeTypedAnswer('');
                          }}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', color: '#059669', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                        >
                          {occ}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                      ⌨️ Plain text typing only • Tap a suggestion chip or type your trade
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => {
                      const term = currentQuestion.field;
                      const c = I18N[lang] ? clarify_term_helper(term, lang) : "This is an official scheme requirement.";
                      speakAndListen(c, lang);
                    }}
                    style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #f59e0b', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {t.explain_term}
                  </button>
                  {!['annual_income', 'monthly_income', 'income', 'age', 'family_size', 'phone', 'aadhaar_number', 'pan_number', 'occupation'].includes(currentQuestion.field) && (
                    <button
                      onClick={() => speakAndListen(currentQuestion.text, lang, (ans) => handleSchemeFieldAnswer(ans, currentQuestion.field, activeSchemeId, proxyDependent))}
                      style={{ background: '#059669', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      🎙️ Re-Ask Question
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Flow Step: Checking Eligibility / Rules Engine Running */}
            {(flowStep === 'checking_eligibility' || (flowStep === 'questioning' && !currentQuestion)) && (
              <div id="checking_eligibility_card" className="step-card" style={{ textAlign: 'center', padding: '36px 20px', maxWidth: '640px', margin: '0 auto' }}>
                {!eligibilityError ? (
                  <div>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                      ⚖️
                    </div>
                    <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                      {lang === 'kn' ? 'ನಿಮ್ಮ ಅರ್ಹತೆಯನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ...' : (lang === 'hi' ? 'आपकी पात्रता की जाँच की जा रही है...' : 'Checking your eligibility now...')}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '18px' }}>
                      {lang === 'kn' ? 'ನಮ್ಮ ನಿಯಮಗಳ ಎಂಜಿನ್ ನಿಮ್ಮ ಪ್ರೊಫೈಲ್ ಡೇಟಾವನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದೆ...' : (lang === 'hi' ? 'हमारा नियम इंजन आपकी प्रोफ़ाइल डेटा की जाँच कर रहा है...' : 'Evaluating official scheme criteria and rules against your verified profile...')}
                    </p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#059669', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '6px 14px', borderRadius: '20px', fontWeight: 700 }}>
                      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#059669' }} />
                      {lang === 'kn' ? 'ದಯವಿಟ್ಟು ನಿರೀಕ್ಷಿಸಿ...' : (lang === 'hi' ? 'कृपया प्रतीक्षा करें...' : 'Please wait a moment...')}
                    </div>
                  </div>
                ) : (
                  <div id="eligibility_error_card" style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '24px' }}>
                    <div style={{ fontSize: '36px', marginBottom: '10px' }}>⚠️</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>
                      {lang === 'kn' ? 'ಅರ್ಹತೆ ಪರಿಶೀಲನೆ ವಿಫಲವಾಗಿದೆ' : (lang === 'hi' ? 'पात्रता जाँच विफल' : 'Eligibility Check Failed')}
                    </h3>
                    <p style={{ fontSize: '14px', color: '#7f1d1d', marginBottom: '20px' }}>
                      {eligibilityError}
                    </p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button
                        id="btn_retry_eligibility"
                        onClick={() => {
                          const targetProfile = proxyDependent ? { ...(currentUser || {}), ...proxyDependent } : (currentUser || {});
                          evaluateEligibility(activeSchemeId, targetProfile);
                        }}
                        style={{ padding: '12px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        🔄 {lang === 'kn' ? 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ' : (lang === 'hi' ? 'पुनः प्रयास करें' : 'Retry Eligibility Check')}
                      </button>
                      <button
                        onClick={() => setCurrentScreen('dashboard')}
                        style={{ padding: '12px 20px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        ← {lang === 'kn' ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : (lang === 'hi' ? 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಹಿಂತಿರುಗಿ' : 'Return to Dashboard')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Flow Step: Eligibility Result */}
            {flowStep === 'eligibility' && eligibilityResult && (
              <div className="step-card">
                <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 800, background: eligibilityResult.eligible ? '#ecfdf5' : '#fef2f2', color: eligibilityResult.eligible ? '#047857' : '#b91c1c', marginBottom: '10px' }}>
                  {eligibilityResult.eligible ? t.status_eligible : t.status_not_eligible}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700 }}>
                  {(lang === 'kn' && eligibilityResult.scheme_name_kn) ? eligibilityResult.scheme_name_kn : ((lang === 'hi' && eligibilityResult.scheme_name_hi) ? eligibilityResult.scheme_name_hi : eligibilityResult.scheme_name_en)}
                </h3>
                <p style={{ fontSize: '14px', color: '#334155', margin: '14px 0' }}>{eligibilityResult.warm_explanation}</p>

                {eligibilityResult.eligible ? (
                  <button
                    onClick={() => startConsentFlow(eligibilityResult)}
                    style={{ width: '100%', background: '#059669', color: 'white', padding: '14px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '15px', cursor: 'pointer' }}
                  >
                    Proceed to DigiLocker Consent Vault →
                  </button>
                ) : (
                  <button
                    onClick={() => setCurrentScreen('dashboard')}
                    style={{ width: '100%', background: '#64748b', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Explore Other Schemes
                  </button>
                )}
              </div>
            )}

            {/* Flow Step: Consent Vault */}
            {flowStep === 'consent' && eligibilityResult && (
              <div className="step-card active-field">
                <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '6px' }}>{t.consent_title}</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>{t.consent_subtitle}</p>

                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                    Document {activeDocIndex + 1} of {(eligibilityResult.required_documents || []).length}
                  </div>
                  <h4 style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>
                    {(eligibilityResult.required_documents || [])[activeDocIndex]?.replace(/_/g, ' ').toUpperCase()}
                  </h4>
                  <p style={{ fontSize: '13px', color: '#475569', marginTop: '6px' }}>
                    Legal Purpose: To verify eligibility and pre-fill your official application form.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    onClick={() => recordConsentDecision((eligibilityResult.required_documents || [])[activeDocIndex], 'ALLOWED', activeDocIndex, eligibilityResult)}
                    style={{ flex: 1, padding: '12px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✓ {t.allow_btn}
                  </button>
                  <button
                    onClick={() => recordConsentDecision((eligibilityResult.required_documents || [])[activeDocIndex], 'DENIED', activeDocIndex, eligibilityResult)}
                    style={{ flex: 1, padding: '12px', background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca', borderRadius: '8px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ✕ {t.deny_btn}
                  </button>
                </div>
              </div>
            )}

            {/* Flow Step: Official Government Application Form Review (Section 8) */}
            {flowStep === 'review' && (
              <div id="application_review_card" className="step-card" style={{ display: 'block', visibility: 'visible', opacity: 1, padding: '20px', maxWidth: '820px', margin: '0 auto' }}>
                {/* Prototype Disclaimer Badge */}
                <div style={{ background: '#fef3c7', border: '1px solid #fde68a', color: '#92400e', padding: '10px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span>ℹ️</span>
                  <span>Prototype — formatted to match the official application, submission is simulated for this hackathon demo</span>
                </div>

                {(() => {
                  const deptInfo = getDepartmentInfo(activeSchemeId);
                  const applicantName = proxyDependent ? proxyDependent.name : (currentUser ? currentUser.name : 'Self');
                  const phoneVal = currentUser ? currentUser.phone : '9876543210';
                  const incomeVal = currentUser && currentUser.annual_income ? `₹${currentUser.annual_income.toLocaleString()}` : '₹1,40,000';
                  const addressVal = currentUser && currentUser.present_address ? currentUser.present_address : '#42, 3rd Cross, Peenya Industrial Area, Bengaluru, Karnataka - 560058';
                  const stateVal = currentUser && currentUser.state ? currentUser.state : 'Karnataka';
                  const occVal = currentUser && currentUser.occupation ? currentUser.occupation.replace(/_/g, ' ').toUpperCase() : 'CONSTRUCTION WORKER';
                  const famVal = currentUser && currentUser.family_size ? `${currentUser.family_size} Members` : '4 Members';

                  const allowedDocsList = Object.keys(consents || {}).filter((k) => consents[k] === 'ALLOWED');
                  if (allowedDocsList.length === 0) {
                    allowedDocsList.push('aadhaar_card', 'income_certificate', 'address_proof');
                  }

                  console.log('[ReviewScreen] Rendering official government form:', {
                    flowStep,
                    activeSchemeId,
                    deptInfo,
                    applicantName,
                    declarationAgreed,
                    isSubmittingApplication
                  });

                  return (
                    <div style={{ border: '2px solid #1e3a8a', borderRadius: '12px', background: '#ffffff', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                      {/* Government Letterhead Header */}
                      <div style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)', borderBottom: '2px solid #1e3a8a', padding: '24px 20px', textAlign: 'center' }}>
                        <div style={{ fontSize: '40px', marginBottom: '4px' }}>🏛️</div>
                        <div style={{ fontSize: '13px', fontWeight: 800, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#1e3a8a' }}>
                          {deptInfo.state_en} • {deptInfo.state_kn}
                        </div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginTop: '4px' }}>
                          {lang === 'kn' ? deptInfo.dept_kn : (lang === 'hi' ? deptInfo.dept_hi : deptInfo.dept_en)}
                        </div>
                        <div style={{ width: '80px', height: '3px', background: '#d97706', margin: '10px auto' }} />
                        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', margin: '6px 0 4px 0' }}>
                          {lang === 'kn' ? deptInfo.form_title_kn : (lang === 'hi' ? deptInfo.form_title_hi : deptInfo.form_title_en)}
                        </h2>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', letterSpacing: '0.5px' }}>
                          {deptInfo.form_no} • DIGITAL PORTAL FILING
                        </div>
                      </div>

                      {/* Official Form Sections */}
                      <div style={{ padding: '20px' }}>
                        {/* Section 1: Applicant Particulars */}
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ background: '#1e3a8a', color: '#ffffff', padding: '6px 12px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', borderRadius: '4px' }}>
                            1. Applicant Identification & Particulars
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '12px' }}>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', background: '#fafafa' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Full Name of Applicant</span>
                              <strong style={{ fontSize: '15px', color: '#0f172a' }}>{applicantName}</strong>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', background: '#fafafa' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Registered Mobile Number</span>
                              <strong style={{ fontSize: '15px', color: '#0f172a' }}>+91 {phoneVal}</strong>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', background: '#fafafa' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Applicant Category</span>
                              <strong style={{ fontSize: '15px', color: '#0f172a' }}>{proxyDependent ? `Dependent (${proxyDependent.relationship})` : 'Self (Head of Household)'}</strong>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', background: '#fafafa' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Age & Verification Status</span>
                              <strong style={{ fontSize: '15px', color: '#047857' }}>{currentUser && currentUser.age ? `${currentUser.age} Yrs` : '38 Yrs'} • UIDAI Verified ✓</strong>
                            </div>
                          </div>
                        </div>

                        {/* Section 2: Residency & Address */}
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ background: '#1e3a8a', color: '#ffffff', padding: '6px 12px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', borderRadius: '4px' }}>
                            2. Residency & Jurisdiction
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '12px' }}>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', background: '#fafafa', gridColumn: 'span 2' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Present Address</span>
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{addressVal}</strong>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', background: '#fafafa' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>State / Domicile</span>
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{stateVal} (Verified Resident ✓)</strong>
                            </div>
                          </div>
                        </div>

                        {/* Section 3: Socio-Economic Profile */}
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ background: '#1e3a8a', color: '#ffffff', padding: '6px 12px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', borderRadius: '4px' }}>
                            3. Socio-Economic Profile & Welfare Eligibility
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', marginTop: '12px' }}>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', background: '#fafafa' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Primary Occupation</span>
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{occVal}</strong>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', background: '#fafafa' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Total Annual Family Income</span>
                              <strong style={{ fontSize: '15px', color: '#047857' }}>{incomeVal}</strong>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', background: '#fafafa' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Family Size</span>
                              <strong style={{ fontSize: '14px', color: '#0f172a' }}>{famVal}</strong>
                            </div>
                            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 12px', background: '#fafafa' }}>
                              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'block' }}>Welfare Criteria Met</span>
                              <strong style={{ fontSize: '14px', color: '#047857' }}>Eligible under Scheme Rules ✓</strong>
                            </div>
                          </div>
                        </div>

                        {/* Section 4: Verified Identity & Attached Documents */}
                        <div style={{ marginBottom: '20px' }}>
                          <div style={{ background: '#1e3a8a', color: '#ffffff', padding: '6px 12px', fontSize: '12px', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase', borderRadius: '4px' }}>
                            4. Verified Electronic Documents Attached via DigiLocker Vault
                          </div>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                            {allowedDocsList.map((doc) => (
                              <div key={doc} style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>✓</span>
                                <span>{doc.replace(/_/g, ' ').toUpperCase()} (DIGILOCKER VERIFIED)</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Section 5: Applicant Declaration (Mandatory) */}
                        <div id="applicant_declaration_section" style={{ background: '#f8fafc', border: '2px solid #cbd5e1', borderRadius: '8px', padding: '16px', marginTop: '20px' }}>
                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
                            <input
                              id="declaration_checkbox"
                              type="checkbox"
                              checked={declarationAgreed}
                              onChange={(e) => setDeclarationAgreed(e.target.checked)}
                              style={{ width: '22px', height: '22px', marginTop: '2px', cursor: 'pointer', accentColor: '#1e3a8a' }}
                            />
                            <span style={{ fontSize: '13px', lineHeight: '1.5', color: '#1e293b' }}>
                              <strong>{lang === 'kn' ? 'ಘೋಷಣೆ:' : (lang === 'hi' ? 'घोषणा:' : 'Declaration:')}</strong>{' '}
                              {lang === 'kn'
                                ? 'ಮೇಲೆ ನೀಡಲಾದ ಎಲ್ಲಾ ಮಾಹಿತಿಯು ನನ್ನ ಜ್ಞಾನ ಮತ್ತು ನಂಬಿಕೆಗೆ ತಕ್ಕಂತೆ ಸತ್ಯವಾಗಿದೆ ಎಂದು ನಾನು ಘೋಷಿಸುತ್ತೇನೆ. ಯಾವುದೇ ತಪ್ಪು ಮಾಹಿತಿ ಕಂಡುಬಂದರೆ ಈ ಅರ್ಜಿಯನ್ನು ತಿರಸ್ಕರಿಸಬಹುದು ಎಂಬುದನ್ನು ನಾನು ಒಪ್ಪಿಕೊಳ್ಳುತ್ತೇನೆ.'
                                : (lang === 'hi'
                                    ? 'मैं एतद्द्वारा घोषित करता/करती हूँ कि ऊपर दी गई जानकारी मेरी सर्वोत्तम जानकारी और विश्वास के अनुसार सत्य है। किसी भी असत्य विवरण पर यह आवेदन निरस्त किया जा सकता है।'
                                    : 'I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. I understand that any false statement or suppression of facts may lead to rejection of this application under applicable welfare guidelines.')}
                            </span>
                          </label>
                        </div>

                        {/* Official Submit Action */}
                        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button
                            id="btn_confirm_submit_application"
                            onClick={() => {
                              if (!declarationAgreed) return;
                              finalizeApplicationSubmission(activeSchemeId);
                            }}
                            disabled={!declarationAgreed || isSubmittingApplication}
                            style={{
                              width: '100%',
                              minHeight: '52px',
                              padding: '14px 24px',
                              background: (!declarationAgreed || isSubmittingApplication) ? '#9ca3af' : '#1e3a8a',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: 800,
                              fontSize: '17px',
                              letterSpacing: '0.4px',
                              cursor: (!declarationAgreed || isSubmittingApplication) ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '10px',
                              boxShadow: (!declarationAgreed || isSubmittingApplication) ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                          >
                            {isSubmittingApplication ? (
                              <span>⏳ {lang === 'kn' ? 'ಅರ್ಜಿಯನ್ನು ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...' : (lang === 'hi' ? 'आवेदन जमा किया जा रहा है...' : 'Submitting Official Application...')}</span>
                            ) : (
                              <span>🏛️ {lang === 'kn' ? 'ಅರ್ಜಿಯನ್ನು ಸಲ್ಲಿಸಿ (ಪ್ರೊಟೊಟೈಪ್)' : (lang === 'hi' ? 'आवेदन जमा करें (प्रोटोटाइप)' : 'SUBMIT APPLICATION (PROTOTYPE)')}</span>
                            )}
                          </button>
                          {!declarationAgreed && (
                            <div style={{ textAlign: 'center', fontSize: '12px', color: '#b91c1c', fontWeight: 600 }}>
                              ⚠️ {lang === 'kn' ? 'ದಯವಿಟ್ಟು ಮುಂದುವರಿಯಲು ಮೇಲಿನ ಘೋಷಣಾ ಪೆಟ್ಟಿಗೆಯನ್ನು ಗುರುತಿಸಿ' : (lang === 'hi' ? 'कृपया आगे बढ़ने के लिए ऊपर घोषणा चेकबॉक्स पर टिक करें' : 'Please tick the declaration checkbox above to enable submission')}
                            </div>
                          )}
                          <p style={{ textAlign: 'center', fontSize: '12px', color: '#64748b', margin: 0 }}>
                            🎙️ {lang === 'kn' ? 'ಅಥವಾ ಮೈಕ್‌ನಲ್ಲಿ "ಸಲ್ಲಿಸಿ" ಅಥವಾ "ಖಚಿತಪಡಿಸಿ" ಎಂದು ಹೇಳಿ' : (lang === 'hi' ? 'या माइक में "हाँ जमा करें" या "पुष्टि करें" बोलें' : 'Or say "Yes, submit" or "I confirm" into your microphone')}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Bottom honest disclaimer */}
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#94a3b8', marginTop: '16px' }}>
                  Prototype — formatted to match the official application, submission is simulated for this hackathon demo
                </div>
              </div>
            )}

            {/* Flow Step: Submission Success (Requirement 2: Confirmation screen) */}
            {flowStep === 'submitted' && submittedApp && (
              <div id="application_confirmation_card" className="step-card confirmation-card" style={{ textAlign: 'center', padding: '36px 20px', maxWidth: '640px', margin: '0 auto' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                <h3 id="confirmation_title" style={{ fontSize: '24px', fontWeight: 800, color: '#047857', marginBottom: '8px' }}>
                  Application Submitted Successfully ✅
                </h3>
                <p style={{ fontSize: '14px', color: '#475569', marginBottom: '20px' }}>
                  {submittedApp.submission_message}
                </p>

                <div style={{ background: '#f8fafc', padding: '18px 24px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                  <div id="confirmation_ref_id" style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    Reference ID: <span style={{ color: '#0369a1', fontFamily: 'monospace', fontSize: '18px', fontWeight: 800 }}>"{submittedApp.reference_id || submittedApp.acknowledgement_id}"</span>
                  </div>
                  <div id="confirmation_status" style={{ fontSize: '15px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Status: <span className="status-badge status-applied">"Applied"</span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Date: <strong>{formatAppDate(submittedApp.submitted_at)}</strong>
                  </div>
                  {submittedApp.acknowledgement_id && (
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                      Acknowledgement ID: <code>{submittedApp.acknowledgement_id}</code>
                    </div>
                  )}
                </div>

                {/* Status Stepper Pipeline */}
                <div style={{ marginBottom: '26px' }}>
                  {renderStatusStepper(submittedApp.application_status || submittedApp.status || 'Applied')}
                </div>

                {/* Confirmation Action Buttons: 🖨️ Print Bill & View in Dashboard */}
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button
                    id="btn_print_bill"
                    onClick={() => handleOpenPrintBill(submittedApp)}
                    style={{
                      background: '#0284c7',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '15px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 4px rgba(2, 132, 199, 0.25)'
                    }}
                  >
                    🖨️ Print Bill
                  </button>

                  <button
                    id="btn_view_dashboard_app"
                    onClick={() => {
                      setCurrentScreen('dashboard');
                      setActiveTab('applications');
                    }}
                    style={{
                      background: '#059669',
                      color: 'white',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: '15px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    View in Dashboard Applications →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}


      </main>

      {/* Footer Prototype Notice (Section 9) */}
      <footer className="prototype-footer-banner">
        🔒 <strong>Haq Saathi Hackathon Prototype:</strong> Uses mock DigiLocker documents and demo SMS OTPs.
        No real government database is altered. User holds complete consent sovereignty to revoke document access anytime.
      </footer>

      {/* Bottom Nav Bar for Mobile */}
      <nav className="bottom-nav" aria-label="Mobile Navigation">
        <button
          id="bottom_nav_home"
          className={`bottom-nav-item ${(currentScreen === 'dashboard' && activeTab === 'schemes') || currentScreen === 'login' ? 'active' : ''}`}
          onClick={handleNavigateHome}
          onTouchEnd={handleNavigateHome}
          aria-label="Home"
        >
          <span className="bottom-nav-icon">🏠</span>
          <span>{lang === 'kn' ? 'ಮುಖಪುಟ' : (lang === 'hi' ? 'होम' : 'Home')}</span>
        </button>
        {currentUser && (
          <>
            <button
              id="bottom_nav_schemes"
              className={`bottom-nav-item ${currentScreen === 'dashboard' && activeTab === 'schemes' ? 'active' : ''}`}
              onClick={() => { stopAudio(); setCurrentScreen('dashboard'); setActiveTab('schemes'); runFullScan(); }}
              onTouchEnd={() => { stopAudio(); setCurrentScreen('dashboard'); setActiveTab('schemes'); runFullScan(); }}
            >
              <span className="bottom-nav-icon">📊</span>
              <span>{t.tab_schemes}</span>
            </button>
            <button
              id="bottom_nav_profile"
              className={`bottom-nav-item ${currentScreen === 'dashboard' && activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => { stopAudio(); setCurrentScreen('dashboard'); setActiveTab('profile'); }}
              onTouchEnd={() => { stopAudio(); setCurrentScreen('dashboard'); setActiveTab('profile'); }}
            >
              <span className="bottom-nav-icon">👤</span>
              <span>{t.tab_profile}</span>
            </button>
            <button
              id="bottom_nav_applications"
              className={`bottom-nav-item ${currentScreen === 'dashboard' && activeTab === 'applications' ? 'active' : ''}`}
              onClick={async () => {
                stopAudio();
                setCurrentScreen('dashboard');
                setActiveTab('applications');
                if (currentUser && currentUser.phone) {
                  const token = localStorage.getItem('haq_token');
                  const freshData = await api.getDashboard(currentUser.phone, token, lang);
                  const incoming = (freshData && (freshData.applications || (freshData.user && freshData.user.applications))) || [];
                  const reconciled = reconcileUserApplications(incoming, currentUser.phone);
                  setUserApplications(reconciled);
                }
              }}
              onTouchEnd={async () => {
                stopAudio();
                setCurrentScreen('dashboard');
                setActiveTab('applications');
                if (currentUser && currentUser.phone) {
                  const token = localStorage.getItem('haq_token');
                  const freshData = await api.getDashboard(currentUser.phone, token, lang);
                  const incoming = (freshData && (freshData.applications || (freshData.user && freshData.user.applications))) || [];
                  const reconciled = reconcileUserApplications(incoming, currentUser.phone);
                  setUserApplications(reconciled);
                }
              }}
            >
              <span className="bottom-nav-icon">📑</span>
              <span>{t.tab_applications}</span>
            </button>
            <button
              id="bottom_nav_documents"
              className={`bottom-nav-item ${currentScreen === 'dashboard' && activeTab === 'documents' ? 'active' : ''}`}
              onClick={() => { stopAudio(); setCurrentScreen('dashboard'); setActiveTab('documents'); }}
              onTouchEnd={() => { stopAudio(); setCurrentScreen('dashboard'); setActiveTab('documents'); }}
            >
              <span className="bottom-nav-icon">🔒</span>
              <span>{t.tab_documents}</span>
            </button>
          </>
        )}
      </nav>

        {/* ================================================================= */}
        {/* Requirement 3: Print Bill Receipt Modal (A4 Print-Friendly)      */}
        {/* ================================================================= */}
        {printReceiptApp && (
          <div className="receipt-modal-backdrop" onClick={(e) => { if (e.target.className === 'receipt-modal-backdrop') setPrintReceiptApp(null); }}>
            <div className="receipt-modal-container">
              {/* Modal Control Actions (Hidden when printing on A4) */}
              <div className="receipt-modal-controls no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>🖨️</span>
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#1e293b' }}>
                    Application Bill & Receipt Preview
                  </h4>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    id="btn_trigger_print"
                    onClick={() => window.print()}
                    style={{ background: '#0284c7', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 2px 4px rgba(2,132,199,0.3)' }}
                  >
                    🖨️ Print / Save as PDF
                  </button>
                  <button
                    id="btn_close_receipt_modal"
                    onClick={() => setPrintReceiptApp(null)}
                    style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '8px 14px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                  >
                    ✕ Close
                  </button>
                </div>
              </div>

              {/* The Formal A4 Print-Friendly Bill Document */}
              <div id="printable_bill_receipt" className="bill-receipt-paper">
                {/* Government Header */}
                <div className="bill-receipt-header" style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '36px' }}>🏛️</span>
                    <div>
                      <div style={{ fontSize: '19px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0f172a' }}>
                        GOVERNMENT OF KARNATAKA
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                        Department of Social Welfare & Entitlements • Haq Saathi Portal
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#047857', background: '#ecfdf5', padding: '6px 12px', borderRadius: '4px', display: 'inline-block', marginTop: '6px' }}>
                    OFFICIAL ACKNOWLEDGEMENT BILL & ENTITLEMENT RECEIPT
                  </div>
                </div>

                {/* Primary Meta Bar */}
                <div className="bill-meta-bar" style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', padding: '12px 16px', borderRadius: '6px', marginBottom: '16px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Reference ID</span>
                    <strong style={{ fontSize: '16px', color: '#0369a1', fontFamily: 'monospace' }}>
                      "{printReceiptApp.reference_id || `REF-${(printReceiptApp.acknowledgement_id || printReceiptApp.app_id || '').replace(/[^A-Za-z0-9]/g, '').slice(-8).toUpperCase()}`}"
                    </strong>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Application Date</span>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      {formatAppDate(printReceiptApp.submitted_at)}
                    </strong>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', display: 'block', fontWeight: 600 }}>Current Status</span>
                    <strong style={{ fontSize: '14px', color: '#047857', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      "{printReceiptApp.application_status || printReceiptApp.status || 'Applied'}" ✅
                    </strong>
                  </div>
                </div>

                {/* Section 1: Applicant and Application Details Table */}
                <table className="bill-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <thead>
                    <tr>
                      <th colSpan="2" style={{ background: '#f1f5f9', textAlign: 'left', padding: '8px 12px', fontSize: '13px', fontWeight: 700, border: '1px solid #cbd5e1' }}>
                        1. APPLICANT & APPLICATION DETAILS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ width: '38%', padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#475569', fontSize: '12px' }}>
                        Applicant Name
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                        {printReceiptApp.applicant_name || (currentUser ? currentUser.name : 'Self')}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#475569', fontSize: '12px' }}>
                        Beneficiary Category / Role
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '13px' }}>
                        {printReceiptApp.applicant_type === 'family_member' ? 'Family Member (Proxy Dependent Application)' : 'Self (Primary Citizen Beneficiary)'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#475569', fontSize: '12px' }}>
                        Application Scheme Title
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 700, color: '#047857', fontSize: '13px' }}>
                        {printReceiptApp.scheme_title || printReceiptApp.scheme_name || (printReceiptApp.scheme_id ? printReceiptApp.scheme_id.replace(/_/g, ' ').toUpperCase() : 'Welfare Entitlement Scheme')}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#475569', fontSize: '12px' }}>
                        Scheme ID / Code
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '12px', fontFamily: 'monospace' }}>
                        {printReceiptApp.scheme_id || 'KAR-WELFARE'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#475569', fontSize: '12px' }}>
                        Registered Mobile Number
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '13px', fontFamily: 'monospace' }}>
                        +91 {currentUser ? currentUser.phone : '9876543210'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#475569', fontSize: '12px' }}>
                        Acknowledgement ID
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '12px', fontFamily: 'monospace' }}>
                        {printReceiptApp.acknowledgement_id || printReceiptApp.app_id || 'N/A'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#475569', fontSize: '12px' }}>
                        Residence Address (Karnataka)
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', color: '#334155', fontSize: '12px' }}>
                        {currentUser ? currentUser.present_address : 'Bangalore Urban, Karnataka'}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Section 2: Financial Fee and Payment Schedule Table */}
                <table className="bill-table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <thead>
                    <tr>
                      <th colSpan="3" style={{ background: '#f1f5f9', textAlign: 'left', padding: '8px 12px', fontSize: '13px', fontWeight: 700, border: '1px solid #cbd5e1' }}>
                        2. APPLICABLE AMOUNT, FEES & PAYMENT DETAILS
                      </th>
                    </tr>
                    <tr style={{ background: '#fafafa', fontSize: '12px', color: '#475569' }}>
                      <th style={{ padding: '6px 12px', border: '1px solid #cbd5e1', textAlign: 'left' }}>Item / Description</th>
                      <th style={{ padding: '6px 12px', border: '1px solid #cbd5e1', textAlign: 'center', width: '28%' }}>Tariff / Schedule</th>
                      <th style={{ padding: '6px 12px', border: '1px solid #cbd5e1', textAlign: 'right', width: '24%' }}>Amount (INR)</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '12px' }}>
                    <tr>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>
                        Statutory Application Processing Fee
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                        Government Exempt
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'right', fontFamily: 'monospace' }}>
                        ₹0.00
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>
                        DigiLocker Verification & Document Access Fee
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                        Direct Sovereign Grant
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'right', fontFamily: 'monospace' }}>
                        ₹0.00
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1' }}>
                        Voice Entitlement Navigation & Portal Service
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#64748b' }}>
                        Public Good Service (Free)
                      </td>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', textAlign: 'right', fontFamily: 'monospace' }}>
                        ₹0.00
                      </td>
                    </tr>
                    <tr style={{ background: '#f0fdf4', fontWeight: 700 }}>
                      <td style={{ padding: '10px 12px', border: '1px solid #cbd5e1', fontSize: '13px' }}>
                        NET AMOUNT PAYABLE BY APPLICANT
                      </td>
                      <td style={{ padding: '10px 12px', border: '1px solid #cbd5e1', textAlign: 'center', color: '#047857' }}>
                        100% Subsidized / Free
                      </td>
                      <td style={{ padding: '10px 12px', border: '1px solid #cbd5e1', textAlign: 'right', fontSize: '14px', fontFamily: 'monospace', color: '#047857' }}>
                        ₹0.00 (Nil)
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 12px', border: '1px solid #cbd5e1', fontWeight: 600, color: '#475569' }}>
                        Payment Status & Details
                      </td>
                      <td colSpan="2" style={{ padding: '8px 12px', border: '1px solid #cbd5e1', color: '#0f172a' }}>
                        Direct Entitlement Grant • No Fee Required • 100% Subsidized under Karnataka Welfare Rules
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Section 3: Legal & Verification Footnote */}
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '10px 14px', fontSize: '11px', color: '#64748b', lineHeight: 1.5, marginBottom: '14px' }}>
                  <div><strong>Legal Notice:</strong> This is a digitally generated application receipt and bill from the Haq Saathi Entitlement Portal. No physical signature is required.</div>
                  <div><strong>Consent & Audit:</strong> Single-purpose verifiable consent was recorded prior to submission. Ref: <code>{printReceiptApp.reference_id || 'HS-VALID'}-DIGI-VERIFY</code>.</div>
                  <div><strong>Grievance / Tracking:</strong> For application inquiries, quote Reference ID <strong>{printReceiptApp.reference_id}</strong> at any Karnataka Seva Sindhu Kendra.</div>
                </div>

                {/* Barcode & Print Date Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed #cbd5e1', paddingTop: '10px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.15em', color: '#475569' }}>
                    |||| | ||| ||||| | || |||| | ||| ||||| |||
                    <div style={{ fontSize: '10px', letterSpacing: 'normal' }}>{printReceiptApp.reference_id}</div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '11px', color: '#94a3b8' }}>
                    Printed on: {new Date().toLocaleString('en-GB')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* Requirement 4 & 5: Application Details & Dynamic Status Tracking  */}
        {/* ================================================================= */}
        {detailsModalApp && (
          <div className="receipt-modal-backdrop" onClick={(e) => { if (e.target.className === 'receipt-modal-backdrop') setDetailsModalApp(null); }}>
            <div className="receipt-modal-container" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '22px' }}>📑</span>
                  <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                    Application Details
                  </h4>
                </div>
                <button
                  id="btn_close_details_modal"
                  onClick={() => setDetailsModalApp(null)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
                >
                  ✕
                </button>
              </div>

              {/* Title & Ref ID */}
              <div style={{ background: '#f8fafc', padding: '14px 18px', borderRadius: '10px', marginBottom: '18px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                  {detailsModalApp.scheme_title || detailsModalApp.scheme_name || (detailsModalApp.scheme_id ? detailsModalApp.scheme_id.replace(/_/g, ' ').toUpperCase() : 'Welfare Application')}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '13px', color: '#475569' }}>
                  <div>Reference ID: <strong style={{ color: '#0369a1', fontFamily: 'monospace' }}>"{detailsModalApp.reference_id || detailsModalApp.app_id}"</strong></div>
                  <div>Date: <strong>{formatAppDate(detailsModalApp.submitted_at)}</strong></div>
                </div>
              </div>

              {/* Dynamic Status Tracking Stage (Requirement 5) */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>Current Tracking Stage</span>
                  {renderStatusBadge(detailsModalApp.status)}
                </div>
                {renderStatusStepper(detailsModalApp.status)}
              </div>

              {/* Dynamic Stage Transition Controls */}
              <div style={{ background: '#f1f5f9', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  ⚙️ Move Status Stage (Status Tracking):
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    className="status-stage-btn"
                    onClick={() => handleUpdateStatus(detailsModalApp.reference_id || detailsModalApp.app_id, 'Applied')}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #a7f3d0', background: detailsModalApp.status === 'Applied' ? '#059669' : 'white', color: detailsModalApp.status === 'Applied' ? 'white' : '#065f46', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                  >
                    1. Applied
                  </button>
                  <button
                    className="status-stage-btn"
                    onClick={() => handleUpdateStatus(detailsModalApp.reference_id || detailsModalApp.app_id, 'Under Review')}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fde68a', background: detailsModalApp.status === 'Under Review' ? '#d97706' : 'white', color: detailsModalApp.status === 'Under Review' ? 'white' : '#92400e', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                  >
                    2. Under Review
                  </button>
                  <button
                    className="status-stage-btn"
                    onClick={() => handleUpdateStatus(detailsModalApp.reference_id || detailsModalApp.app_id, 'Approved')}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #86efac', background: detailsModalApp.status === 'Approved' ? '#16a34a' : 'white', color: detailsModalApp.status === 'Approved' ? 'white' : '#166534', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                  >
                    3. Approved
                  </button>
                  <button
                    className="status-stage-btn"
                    onClick={() => handleUpdateStatus(detailsModalApp.reference_id || detailsModalApp.app_id, 'Rejected')}
                    style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #fca5a5', background: detailsModalApp.status === 'Rejected' ? '#dc2626' : 'white', color: detailsModalApp.status === 'Rejected' ? 'white' : '#991b1b', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                  >
                    ✕ Rejected
                  </button>
                </div>
              </div>

              {/* Applicant Particulars Grid */}
              <div style={{ marginBottom: '20px' }}>
                <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                  Applicant Particulars
                </h5>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '13px' }}>
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Applicant Name</span>
                    <strong>{detailsModalApp.applicant_name || (currentUser ? currentUser.name : 'Self')}</strong>
                  </div>
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Beneficiary Type</span>
                    <strong>{detailsModalApp.applicant_type || 'self'}</strong>
                  </div>
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Scheme ID</span>
                    <code>{detailsModalApp.scheme_id}</code>
                  </div>
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                    <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>Acknowledgement ID</span>
                    <code>{detailsModalApp.app_id || detailsModalApp.acknowledgement_id || 'N/A'}</code>
                  </div>
                </div>
              </div>

              {/* Submitted Form Fields if available */}
              {detailsModalApp.details && Object.keys(detailsModalApp.details).length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h5 style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                    Application Form Data
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '13px' }}>
                    {Object.entries(detailsModalApp.details).map(([k, v]) => (
                      <div key={k} style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        <span style={{ color: '#64748b', fontSize: '11px', display: 'block' }}>{k.replace(/_/g, ' ').toUpperCase()}</span>
                        <strong>{typeof v === 'object' ? JSON.stringify(v) : String(v)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '14px' }}>
                <button
                  id="btn_details_print_bill"
                  onClick={() => {
                    const toPrint = detailsModalApp;
                    setDetailsModalApp(null);
                    handleOpenPrintBill(toPrint);
                  }}
                  style={{ background: '#0284c7', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  🖨️ Print Bill
                </button>
                <button
                  onClick={() => setDetailsModalApp(null)}
                  style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', padding: '10px 18px', borderRadius: '6px', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}

function clarify_term_helper(term, lang) {
  const map = {
    annual_income: {
      en: "Annual income is the total money earned in one year by all family members together.",
      kn: "ವಾರ್ಷಿಕ ಆದಾಯ ಎಂದರೆ ನಿಮ್ಮ ಇಡೀ ಕುಟುಂಬವು ಒಂದು ವರ್ಷದಲ್ಲಿ ಗಳಿಸುವ ಒಟ್ಟು ಹಣ.",
      hi: "वार्षिक आय का अर्थ है कि आपका पूरा परिवार एक वर्ष में कितना पैसा कमाता है।"
    },
    has_labour_card: {
      en: "A Labour Card is an official welfare card for construction workers.",
      kn: "ಕಾರ್ಮಿಕ ಕಾರ್ಡ್ ಎಂದರೆ ಕಟ್ಟಡ ಕಾರ್ಮಿಕರಿಗೆ ಸರ್ಕಾರ ನೀಡುವ ಅಧಿಕೃತ ಗುರುತಿನ ಚೀಟಿ.",
      hi: "लेबर कार्ड निर्माण श्रमिकों के लिए एक आधिकारिक कल्याण कार्ड है।"
    }
  };
  return (map[term] && map[term][lang]) || map[term]?.en || "Official welfare requirement";
}

// Top-Level Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("React ErrorBoundary caught error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#dc2626', fontFamily: 'sans-serif' }}>
          <h2>⚠️ Something went wrong</h2>
          <p>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '20px', padding: '10px 20px', background: '#059669', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
          >
            Restart Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Render React App
const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <ErrorBoundary>
      <HaqSaathiApp />
    </ErrorBoundary>
  );
}
