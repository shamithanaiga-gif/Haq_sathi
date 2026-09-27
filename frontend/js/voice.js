// Haq Saathi - Centralized Web Speech API Voice Controller (STT + TTS Engine)
// Strictly trilingual: en-IN, kn-IN, hi-IN
// Resilient mobile support: Auto-detects missing native OS voices (e.g. Kannada on mobile)
// and seamlessly streams native audio via /api/tts fallback.

class VoiceController {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentLanguage = 'kn'; // Single source of truth: 'kn' | 'en' | 'hi'
    this.synth = (typeof window !== 'undefined' && window.speechSynthesis) ? window.speechSynthesis : null;
    this.voices = [];
    this.activeUtterance = null;
    this.audioPlayer = null;
    this.silenceTimer = null;
    this.listenTimeout = null;
    this.watchdogTimer = null;

    this.isMobile = (typeof navigator !== 'undefined') &&
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    this.onResultCallback = null;
    this.onInterimCallback = null;
    this.onStateChangeCallback = null;

    this.initSpeechRecognition();
    this.initVoices();
  }

  getSpeechCode(lang = this.currentLanguage) {
    if (lang === 'kn') return 'kn-IN';
    if (lang === 'hi') return 'hi-IN';
    return 'en-IN';
  }

  initSpeechRecognition() {
    const SpeechRec = (typeof window !== 'undefined') && (window.SpeechRecognition || window.webkitSpeechRecognition || null);
    if (SpeechRec) {
      try {
        this.recognition = new SpeechRec();
        // On mobile, single-shot dictation mode is required to prevent network dropouts
        this.recognition.continuous = !this.isMobile;
        this.recognition.interimResults = true;
        this.recognition.lang = this.getSpeechCode();

        this.recognition.onstart = () => {
          this.isListening = true;
          this.notifyStateChange();
        };

        this.recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (interimTranscript && this.onInterimCallback) {
            this.onInterimCallback(interimTranscript);
          }

          if (this.silenceTimer) {
            clearTimeout(this.silenceTimer);
            this.silenceTimer = null;
          }

          if (finalTranscript.trim()) {
            console.log(`[VoiceController] Final transcript received: "${finalTranscript.trim()}"`);
            if (this.onResultCallback) {
              const cb = this.onResultCallback;
              this.stopListening();
              cb(finalTranscript.trim());
            }
          } else if (interimTranscript.trim()) {
            const capturedInterim = interimTranscript.trim();
            this.silenceTimer = setTimeout(() => {
              if (this.onResultCallback) {
                console.log(`[VoiceController] Finalizing interim transcript: "${capturedInterim}"`);
                const cb = this.onResultCallback;
                this.stopListening();
                cb(capturedInterim);
              }
            }, 1000);
          }
        };

        this.recognition.onerror = (event) => {
          console.warn('[SpeechRec Error]:', event.error);
          this.isListening = false;
          this.notifyStateChange();
        };

        this.recognition.onend = () => {
          this.isListening = false;
          this.notifyStateChange();
        };
      } catch (err) {
        console.warn('SpeechRecognition initialization error:', err);
      }
    } else {
      console.warn('Web Speech API recognition not supported in this browser.');
    }
  }

  initVoices() {
    if (!this.synth) return;
    const loadVoices = () => {
      try {
        this.voices = this.synth.getVoices() || [];
      } catch (e) {
        this.voices = [];
      }
    };
    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Returns true if the device actually has an installed TTS voice matching the language.
   * On most mobile phones, Kannada (kn-IN) is NOT installed by default.
   */
  hasNativeVoice(lang = this.currentLanguage) {
    if (!this.synth || !this.voices || this.voices.length === 0) return false;
    const code = this.getSpeechCode(lang).toLowerCase();
    const prefix = lang.toLowerCase();
    return this.voices.some(v => {
      const vLang = (v.lang || '').toLowerCase();
      const vName = (v.name || '').toLowerCase();
      return vLang === code || vLang.startsWith(prefix) || vName.includes(prefix);
    });
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    const code = this.getSpeechCode(lang);
    if (this.recognition) {
      try {
        this.recognition.lang = code;
      } catch (e) {}
    }
    this.notifyStateChange();
  }

  /**
   * Resilient audio fallback streaming from /api/tts or direct Google TTS for mobile devices.
   */
  playAudioFallback(text, lang, onEnd) {
    this.stopSpeaking();
    this.isSpeaking = true;
    this.notifyStateChange();

    try {
      const cleanText = text.trim();
      const speechLang = lang === 'kn' ? 'kn' : (lang === 'hi' ? 'hi' : 'en');
      const base = (typeof API_BASE !== 'undefined') ? API_BASE : (typeof window !== 'undefined' ? window.location.origin : '');
      const ttsUrl = `${base}/api/tts?lang=${speechLang}&text=${encodeURIComponent(cleanText)}`;

      const audio = new Audio();
      this.audioPlayer = audio;
      audio.crossOrigin = 'anonymous';

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        this.isSpeaking = false;
        this.audioPlayer = null;
        this.notifyStateChange();
        if (onEnd) onEnd();
      };

      audio.onended = finish;
      audio.onerror = () => {
        console.warn('[VoiceController] Server TTS failed, trying direct Google TTS fallback...');
        const directUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${speechLang}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
        const fallbackAudio = new Audio(directUrl);
        this.audioPlayer = fallbackAudio;
        fallbackAudio.onended = finish;
        fallbackAudio.onerror = finish;
        fallbackAudio.play().catch(finish);
      };

      // Watchdog in case audio hangs
      const maxMs = Math.max(3000, (cleanText.length * 100) + 2000);
      const audioWatchdog = setTimeout(() => {
        if (!finished) {
          console.warn('[VoiceController] Audio fallback timeout reached');
          finish();
        }
      }, maxMs);

      const origFinish = finish;
      const wrappedFinish = () => {
        clearTimeout(audioWatchdog);
        origFinish();
      };
      audio.onended = wrappedFinish;

      audio.src = ttsUrl;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[VoiceController] HTML5 Audio autoplay restricted:', err);
          wrappedFinish();
        });
      }
    } catch (err) {
      console.warn('[VoiceController] playAudioFallback exception:', err);
      this.isSpeaking = false;
      this.notifyStateChange();
      if (onEnd) onEnd();
    }
  }

  /**
   * Centralized Speak-and-Listen method:
   * Uses native Web Speech API when voice is installed; automatically falls back
   * to high-fidelity audio stream when voice is missing on mobile (especially Kannada kn-IN).
   */
  speakAndListen(text, lang, onResult, options = {}) {
    this.stopSpeaking();
    this.stopListening();

    if (lang) {
      this.setLanguage(lang);
    }

    if (!text || text.trim() === '') {
      if (options.listenAfter !== false) {
        this.startListening(onResult, options);
      }
      return;
    }

    const speechResultHandler = (finalText) => {
      if (!finalText) return;
      if (onResult) {
        onResult(finalText.trim());
      }
    };

    const targetLang = lang || this.currentLanguage;

    // Check if device lacks native voice for target language (always true for Kannada on mobile)
    if (!this.hasNativeVoice(targetLang)) {
      console.log(`[VoiceController] No native TTS voice found on this device for '${targetLang}'. Using high-fidelity audio fallback.`);
      this.playAudioFallback(text, targetLang, () => {
        if (options.onSpeakEnd) {
          options.onSpeakEnd();
        }
        if (options.listenAfter !== false) {
          this.listenTimeout = setTimeout(() => {
            this.startListening(speechResultHandler, options);
          }, 60);
        }
      });
      return;
    }

    if (!this.synth) {
      if (options.listenAfter !== false) {
        this.startListening(onResult, options);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.activeUtterance = utterance;
    utterance.rate = options.rate || 0.95;
    utterance.pitch = options.pitch || 1.0;
    utterance.lang = this.getSpeechCode(targetLang);

    if (this.voices.length > 0) {
      const code = this.getSpeechCode(targetLang);
      const prefix = targetLang.toLowerCase();
      const matchVoice = this.voices.find(v => 
        (v.lang || '').toLowerCase() === code.toLowerCase() || 
        (v.lang || '').toLowerCase().startsWith(prefix) ||
        (v.name || '').toLowerCase().includes(prefix)
      );
      if (matchVoice) {
        utterance.voice = matchVoice;
      }
    }

    this.isSpeaking = true;
    this.notifyStateChange();

    let utteranceFinished = false;
    const cleanFinish = () => {
      if (utteranceFinished) return;
      utteranceFinished = true;
      if (this.watchdogTimer) {
        clearTimeout(this.watchdogTimer);
        this.watchdogTimer = null;
      }
      this.isSpeaking = false;
      this.activeUtterance = null;
      this.notifyStateChange();

      if (options.onSpeakEnd) {
        options.onSpeakEnd();
      }

      if (options.listenAfter !== false) {
        this.listenTimeout = setTimeout(() => {
          this.startListening(speechResultHandler, options);
        }, 50);
      }
    };

    utterance.onend = cleanFinish;
    utterance.onerror = (e) => {
      console.warn('TTS utterance error:', e);
      cleanFinish();
    };

    // Safety watchdog: prevent mobile browser TTS from hanging in isSpeaking=true forever
    const maxSpeechMs = Math.max(3000, (text.length * 90) + 1500);
    this.watchdogTimer = setTimeout(() => {
      if (this.isSpeaking && this.activeUtterance === utterance) {
        console.warn('[VoiceController] Utterance watchdog timeout, auto-advancing audio state');
        cleanFinish();
      }
    }, maxSpeechMs);

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('[VoiceController] Speech synthesis speak call failed:', err);
      cleanFinish();
    }
  }

  startListening(onResult, options = {}) {
    if (this.isSpeaking) {
      this.stopSpeaking();
    }
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    this.onResultCallback = onResult;
    this.onInterimCallback = options.onInterim || null;
    this.onStateChangeCallback = options.onStateChange || this.onStateChangeCallback;

    if (!this.recognition) {
      return;
    }

    if (this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }

    try {
      this.recognition.lang = this.getSpeechCode(this.currentLanguage);
      this.recognition.start();
    } catch (e) {
      if (e.name === 'InvalidStateError') {
        try {
          this.recognition.abort();
        } catch (err) {}
        setTimeout(() => {
          try {
            this.recognition.lang = this.getSpeechCode(this.currentLanguage);
            this.recognition.start();
          } catch (err2) {
            console.warn('[SpeechRec start retry error]:', err2);
          }
        }, 50);
      } else {
        console.warn('[SpeechRec start error]:', e);
        this.isListening = false;
        this.notifyStateChange();
      }
    }
  }

  stopListening() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
    if (this.listenTimeout) {
      clearTimeout(this.listenTimeout);
      this.listenTimeout = null;
    }
    this.onResultCallback = null;
    this.onInterimCallback = null;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.isListening = false;
    this.notifyStateChange();
  }

  speak(text, onEnd) {
    this.speakAndListen(text, this.currentLanguage, null, {
      listenAfter: false,
      onSpeakEnd: onEnd
    });
  }

  stopSpeaking() {
    if (this.listenTimeout) {
      clearTimeout(this.listenTimeout);
      this.listenTimeout = null;
    }
    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.audioPlayer) {
      try {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
      } catch (e) {}
      this.audioPlayer = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {}
    }
    this.isSpeaking = false;
    this.activeUtterance = null;
    this.notifyStateChange();
  }

  detectLanguageFromSpeech(text) {
    if (!text) return null;
    const clean = text.toLowerCase().trim();

    // Kannada checks:
    if (/ಕನ್ನಡ|kannada|kanada|kannad|canara|kannadam/i.test(clean)) {
      return 'kn';
    }
    // Hindi checks:
    if (/हिंदी|हिन्दी|hindi|hindee|hind/i.test(clean)) {
      return 'hi';
    }
    // English checks:
    if (/english|ಇಂಗ್ಲಿಷ್|इंग्लिश|अंग्रेजी|अंग्रेज़ी|angrezi|angreji/i.test(clean)) {
      return 'en';
    }
    return null;
  }

  speakTrilingualLanguagePrompt(onLanguageSelected) {
    const trilingualText = "Please choose your language. English, Hindi, or Kannada? कृपया अपनी भाषा चुनें। अंग्रेज़ी, हिंदी, या कन्नड़? ದಯವಿಟ್ಟು ನಿಮ್ಮ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ. ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ, ಅಥವಾ ಕನ್ನಡ?";
    
    this.speakAndListen(trilingualText, 'en', (spokenResult) => {
      const detected = this.detectLanguageFromSpeech(spokenResult);
      if (detected && onLanguageSelected) {
        onLanguageSelected(detected);
      } else {
        this.startListening((retryResult) => {
          const retryDetected = this.detectLanguageFromSpeech(retryResult);
          if (retryDetected && onLanguageSelected) {
            onLanguageSelected(retryDetected);
          }
        });
      }
    }, { listenAfter: true, rate: 0.95 });
  }

  notifyStateChange() {
    if (this.onStateChangeCallback) {
      this.onStateChangeCallback({
        isListening: this.isListening,
        isSpeaking: this.isSpeaking,
        language: this.currentLanguage
      });
    }
  }
}

window.voiceCtrl = new VoiceController();
