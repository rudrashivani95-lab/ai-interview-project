/**
 * Speech Manager
 * Handles speech recognition and audio processing
 */

class SpeechManager {
  constructor() {
    this.recognition = null;
    this.isListening = false;
    this.transcript = '';
    this.interimTranscript = '';
    this.init();
  }

  init() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[SpeechManager] Web Speech API not available');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.language = 'en-US';
    this.recognition.interimResults = true;
    this.recognition.continuous = false;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.transcript = '';
      this.interimTranscript = '';
    };

    this.recognition.onresult = (event) => {
      this.interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          this.transcript += transcript + ' ';
        } else {
          this.interimTranscript += transcript;
        }
      }

      if (this.onResult) {
        this.onResult(this.transcript + this.interimTranscript);
      }
    };

    this.recognition.onerror = (event) => {
      console.error('[SpeechManager] Error:', event.error);
      if (this.onError) {
        this.onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.onEnd) {
        this.onEnd(this.transcript);
      }
    };
  }

  start() {
    if (this.recognition && !this.isListening) {
      this.recognition.start();
    }
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  abort() {
    if (this.recognition) {
      this.recognition.abort();
      this.isListening = false;
    }
  }

  getTranscript() {
    return this.transcript.trim();
  }
}

// Initialize
const speechManager = new SpeechManager();
