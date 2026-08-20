// ========== VOICE MANAGER ==========
// Handles Text-to-Speech (TTS) and Speech-to-Text (STT) functionality
// Provides unified interface for voice operations with settings management

class VoiceManager {
  constructor(options = {}) {
    this.synthesis = window.speechSynthesis;
    this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new this.SpeechRecognition();
    
    // Settings
    this.settings = {
      voiceGender: options.voiceGender || 'female', // male, female
      speakingRate: options.speakingRate || 0.9,
      speakingPitch: options.speakingPitch || 1.0,
      volume: options.volume || 1.0,
      language: options.language || 'en-US',
    };

    // State
    this.isSpeaking = false;
    this.isListening = false;
    this.silenceTimeout = null;
    this.silenceThreshold = 10000; // 10 seconds
    this.lastSoundTime = Date.now();

    // Callbacks
    this.onListeningStart = options.onListeningStart || (() => {});
    this.onListeningEnd = options.onListeningEnd || (() => {});
    this.onTranscript = options.onTranscript || (() => {});
    this.onSilence = options.onSilence || (() => {});
    this.onError = options.onError || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    this.setupRecognition();
    this.getAvailableVoices();
  }

  // Setup speech recognition
  setupRecognition() {
    if (!this.SpeechRecognition) {
      console.warn('Speech Recognition not supported');
      return;
    }

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.settings.language;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.lastSoundTime = Date.now();
      this.onStatusChange('Listening...');
      this.onListeningStart();
      this.setupSilenceDetection();
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
          this.lastSoundTime = Date.now(); // Reset silence timer
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        this.onTranscript({
          final: true,
          text: finalTranscript.trim(),
        });
      }

      if (interimTranscript) {
        this.onTranscript({
          final: false,
          text: interimTranscript,
        });
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.clearSilenceDetection();
      this.onStatusChange('Stopped listening');
      this.onListeningEnd();
    };

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      this.onError(`Recognition error: ${event.error}`);
      this.onStatusChange(`Error: ${event.error}`);
    };
  }

  // Setup silence detection
  setupSilenceDetection() {
    this.clearSilenceDetection();

    this.silenceTimeout = setInterval(() => {
      const timeSilent = Date.now() - this.lastSoundTime;

      if (timeSilent > this.silenceThreshold) {
        this.onSilence();
        this.onStatusChange('No sound detected - Are you thinking?');
      }
    }, 1000);
  }

  // Clear silence detection
  clearSilenceDetection() {
    if (this.silenceTimeout) {
      clearInterval(this.silenceTimeout);
      this.silenceTimeout = null;
    }
  }

  // Start listening
  startListening() {
    if (this.isListening) return;

    try {
      this.recognition.start();
    } catch (err) {
      console.error('Error starting recognition:', err);
      this.onError('Failed to start listening');
    }
  }

  // Stop listening
  stopListening() {
    if (!this.isListening) return;

    try {
      this.recognition.stop();
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  }

  // Get available voices
  getAvailableVoices() {
    if (!this.synthesis) return [];

    const voices = this.synthesis.getVoices();
    return voices;
  }

  // Select voice by gender
  selectVoiceByGender(gender = 'female') {
    const voices = this.getAvailableVoices();
    const selectedVoice = voices.find(v => 
      v.name.toLowerCase().includes(gender.toLowerCase()) || 
      v.lang.includes('en')
    );
    return selectedVoice || voices[0] || null;
  }

  // Speak text (TTS)
  async speak(text, options = {}) {
    if (!text || !this.synthesis) return;

    // Cancel any ongoing speech
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Set properties
    utterance.rate = options.rate || this.settings.speakingRate;
    utterance.pitch = options.pitch || this.settings.speakingPitch;
    utterance.volume = options.volume || this.settings.volume;
    utterance.lang = options.language || this.settings.language;

    // Set voice based on gender preference
    const voice = this.selectVoiceByGender(this.settings.voiceGender);
    if (voice) {
      utterance.voice = voice;
    }

    return new Promise((resolve, reject) => {
      utterance.onstart = () => {
        this.isSpeaking = true;
        this.onStatusChange('Speaking...');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.onStatusChange('Done speaking');
        resolve(true);
      };

      utterance.onerror = (err) => {
        this.isSpeaking = false;
        this.onStatusChange('Speaking error');
        console.error('Speech synthesis error:', err);
        reject(err);
      };

      this.synthesis.speak(utterance);
    });
  }

  // Stop speaking
  stopSpeaking() {
    if (!this.isSpeaking) return;

    this.synthesis.cancel();
    this.isSpeaking = false;
    this.onStatusChange('Stopped speaking');
  }

  // Update settings
  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };

    if (newSettings.language) {
      this.recognition.lang = newSettings.language;
    }
  }

  // Get current settings
  getSettings() {
    return { ...this.settings };
  }

  // Check if speech recognition is supported
  isSupported() {
    return !!this.SpeechRecognition;
  }

  // Check if speech synthesis is supported
  isSynthesisSupported() {
    return !!this.synthesis;
  }

  // Cleanup
  destroy() {
    this.stopListening();
    this.stopSpeaking();
    this.clearSilenceDetection();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VoiceManager;
}
