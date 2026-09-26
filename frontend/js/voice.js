// Haq Saathi - Centralized Web Speech API Voice Controller (STT + TTS Engine)
// Strictly trilingual: en-IN, kn-IN, hi-IN

class VoiceController {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.isSpeaking = false;
    this.currentLanguage = 'kn'; // Single source of truth: 'kn' | 'en' | 'hi'
    this.synth = window.speechSynthesis || null;
    this.voices = [];
    this.activeUtterance = null;
    this.silenceTimer = null;
    this.listenTimeout = null;

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
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition || null;
    if (SpeechRec) {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true; // Continuous listening for natural full sentence
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

        // Live interim transcript update
        if (interimTranscript && this.onInterimCallback) {
          this.onInterimCallback(interimTranscript);
        }

        // Reset silence timer on any speech detected
        if (this.silenceTimer) {
          clearTimeout(this.silenceTimer);
          this.silenceTimer = null;
        }

        // Final utterance captured or pause detected
        if (finalTranscript.trim()) {
          console.log(`[VoiceController] Final transcript received at ${new Date().toISOString()}: "${finalTranscript.trim()}"`);
          if (this.onResultCallback) {
            const cb = this.onResultCallback;
            this.stopListening();
            console.log(`[VoiceController] Handing transcript to conversation logic at ${new Date().toISOString()}: "${finalTranscript.trim()}"`);
            cb(finalTranscript.trim());
          }
        } else if (interimTranscript.trim()) {
          // 1.0s silence threshold (roughly 1.0-1.2s) for instant response without cutoffs
          const capturedInterim = interimTranscript.trim();
          this.silenceTimer = setTimeout(() => {
            if (this.onResultCallback) {
              console.log(`[VoiceController] Silence threshold reached (1.0s). Finalizing interim transcript at ${new Date().toISOString()}: "${capturedInterim}"`);
              const cb = this.onResultCallback;
              this.stopListening();
              console.log(`[VoiceController] Handing transcript to conversation logic at ${new Date().toISOString()}: "${capturedInterim}"`);
              cb(capturedInterim);
            }
          }, 1000);
        }
      };

      this.recognition.onerror = (event) => {
        console.warn('[SpeechRec Error]:', event.error);
        if (event.error === 'no-speech' || event.error === 'network') {
          // Non-fatal, keep ready
        }
        this.isListening = false;
        this.notifyStateChange();
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.notifyStateChange();
      };
    } else {
      console.warn('Web Speech API recognition not supported in this browser.');
    }
  }

  initVoices() {
    if (!this.synth) return;
    const loadVoices = () => {
      this.voices = this.synth.getVoices();
    };
    loadVoices();
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = loadVoices;
    }
  }

  /**
   * Updates language and immediately updates speech recognition & TTS voice
   * without needing a page refresh!
   */
  setLanguage(lang) {
    this.currentLanguage = lang;
    const code = this.getSpeechCode(lang);
    if (this.recognition) {
      this.recognition.lang = code;
    }
    this.notifyStateChange();
  }

  /**
   * Centralized Speak-and-Listen method (Section 4):
   * 1. Cancels active speech / listening to prevent echo
   * 2. Speaks the provided text in the target language (kn-IN, hi-IN, or en-IN)
   * 3. Once speaking is fully completed, buffers audio hardware and starts listening
   * 4. Passes recognized speech directly to onResult callback
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

    if (!this.synth) {
      if (options.listenAfter !== false) {
        this.startListening(onResult, options);
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    this.activeUtterance = utterance;
    utterance.rate = options.rate || 0.95; // Clearer pacing for migrant / low-literacy users
    utterance.pitch = options.pitch || 1.0;
    utterance.lang = this.getSpeechCode(this.currentLanguage);

    // Select best matching voice for currentLanguage
    if (this.voices.length > 0) {
      const code = this.getSpeechCode(this.currentLanguage);
      const prefix = this.currentLanguage; // 'kn', 'hi', or 'en'
      const matchVoice = this.voices.find(v => 
        v.lang === code || 
        v.lang.toLowerCase().startsWith(prefix) ||
        v.name.toLowerCase().includes(prefix)
      );
      if (matchVoice) {
        utterance.voice = matchVoice;
      }
    }

    this.isSpeaking = true;
    this.notifyStateChange();

    const speechResultHandler = (finalText) => {
      if (!finalText) return;
      if (onResult) {
        onResult(finalText.trim());
      }
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.activeUtterance = null;
      this.notifyStateChange();

      if (options.onSpeakEnd) {
        options.onSpeakEnd();
      }

      // Immediate start listening after TTS playback ends (minimal 30ms delay to clear audio buffer)
      if (options.listenAfter !== false) {
        this.listenTimeout = setTimeout(() => {
          this.startListening(speechResultHandler, options);
        }, 30);
      }
    };

    utterance.onerror = (e) => {
      console.warn('TTS utterance error:', e);
      this.isSpeaking = false;
      this.activeUtterance = null;
      this.notifyStateChange();

      if (options.listenAfter !== false && e.error !== 'canceled' && e.error !== 'interrupted') {
        this.listenTimeout = setTimeout(() => {
          this.startListening(speechResultHandler, options);
        }, 30);
      }
    };

    try {
      if (this.synth.paused) {
        this.synth.resume();
      }
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('[VoiceController] Speech synthesis speak call failed:', err);
      this.isSpeaking = false;
      this.notifyStateChange();
      if (options.listenAfter !== false) {
        this.startListening(onResult, options);
      }
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
        // Recognition already active or starting; restart cleanly
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
        }, 30);
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
        // If not detected immediately on first try, continue listening
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
