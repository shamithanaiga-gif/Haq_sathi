// Haq Saathi - Full Backend API Client
// Priority: window.HAQ_SAATHI_API_BASE (e.g. Fly.io) -> window.location.origin (same-origin / Vercel rewrite)
const API_BASE = (typeof window !== 'undefined' && window.HAQ_SAATHI_API_BASE) ? window.HAQ_SAATHI_API_BASE : window.location.origin;


const api = {
  // Authentication & Accounts (Section 2)
  async generateOtp(phone) {
    const res = await fetch(`${API_BASE}/api/auth/otp/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    return await res.json();
  },

  async verifyOtp(phone, otp) {
    const res = await fetch(`${API_BASE}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    });
    return await res.json();
  },

  async register(payload) {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getDashboard(phone, sessionToken = null, language = null) {
    const headers = {};
    if (sessionToken) {
      headers['x-session-token'] = sessionToken;
    }
    const langParam = language ? `&lang=${encodeURIComponent(language)}` : '';
    const res = await fetch(`${API_BASE}/api/user/dashboard?phone=${encodeURIComponent(phone)}${langParam}`, {
      headers
    });
    return await res.json();
  },

  // Centralized user field persistence (Section 8)
  async saveUserField(phone, field, value) {
    const res = await fetch(`${API_BASE}/api/user/field`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, field, value })
    });
    return await res.json();
  },

  async getUserField(phone, field) {
    const res = await fetch(`${API_BASE}/api/user/field?phone=${encodeURIComponent(phone)}&field=${encodeURIComponent(field)}`);
    return await res.json();
  },

  // Proxy / Dependents (Section 7)
  async addDependent(payload) {
    const res = await fetch(`${API_BASE}/api/user/dependents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async toggleDocument(phone, docType, status) {
    const res = await fetch(`${API_BASE}/api/user/documents/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, doc_type: docType, status })
    });
    return await res.json();
  },

  // Full Eligibility Scan (Section 6)
  async scanAllSchemes(phone, language = 'kn', userData = null) {
    const res = await fetch(`${API_BASE}/api/schemes/scan-all`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, language, user_data: userData })
    });
    return await res.json();
  },

  // Core Schemes & Voice
  async getSchemes() {
    const res = await fetch(`${API_BASE}/api/schemes`);
    return await res.json();
  },

  async getProfile(phone = '9876543210') {
    const res = await fetch(`${API_BASE}/api/profile?phone=${encodeURIComponent(phone)}`);
    return await res.json();
  },

  async updateProfile(updates, phone = '9876543210') {
    const res = await fetch(`${API_BASE}/api/profile/update?phone=${encodeURIComponent(phone)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return await res.json();
  },

  async resetProfile() {
    const res = await fetch(`${API_BASE}/api/profile/reset`, {
      method: 'POST'
    });
    return await res.json();
  },

  async processVoiceIntent(payload) {
    const res = await fetch(`${API_BASE}/api/voice/process-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async evaluateEligibility(payload) {
    const res = await fetch(`${API_BASE}/api/eligibility/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getVaultDocs() {
    const res = await fetch(`${API_BASE}/api/vault/documents`);
    return await res.json();
  },

  async logConsent(payload) {
    const res = await fetch(`${API_BASE}/api/consent/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return await res.json();
  },

  async getAuditLog(phone = null) {
    const url = phone ? `${API_BASE}/api/consent/audit-log?phone=${encodeURIComponent(phone)}` : `${API_BASE}/api/consent/audit-log`;
    const res = await fetch(url);
    return await res.json();
  },

  async revokeConsent(auditId, phone = '9876543210') {
    const res = await fetch(`${API_BASE}/api/consent/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audit_id: auditId, phone })
    });
    return await res.json();
  },

  async prefillForm(schemeId, consentedDocs, phone = '9876543210') {
    const res = await fetch(`${API_BASE}/api/forms/prefill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheme_id: schemeId, consented_docs: consentedDocs, phone })
    });
    return await res.json();
  },

  async submitForm(schemeId, formData, language = 'kn', phone = '9876543210', applicantType = 'self', applicantName = null) {
    const res = await fetch(`${API_BASE}/api/forms/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scheme_id: schemeId,
        form_data: formData,
        language,
        phone,
        applicant_type: applicantType,
        applicant_name: applicantName
      })
    });
    return await res.json();
  },

  async updateApplicationStatus(phone, refOrAppId, status, notes = null) {
    const res = await fetch(`${API_BASE}/api/application/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        reference_id: refOrAppId,
        status,
        notes
      })
    });
    return await res.json();
  },

  async getApplicationStatus(phone, refOrAppId = null) {
    const url = refOrAppId ? `${API_BASE}/api/application/status?phone=${encodeURIComponent(phone)}&reference_id=${encodeURIComponent(refOrAppId)}` : `${API_BASE}/api/application/status?phone=${encodeURIComponent(phone)}`;
    const res = await fetch(url);
    return await res.json();
  }
};

window.api = api;
