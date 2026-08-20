// ============================================================
// PREPMATE AI - ENHANCED VOICE MANAGER
// ============================================================
// Handles:
// 1. Text-to-Speech (AI question)
// 2. Speech-to-Text (user answer)
// 3. Microphone permission
// 4. Voice selection
// 5. Speech queue
// 6. Recording state
// ============================================================

class EnhancedVoiceManager {

  constructor(options = {}) {

    // --------------------------------------------------------
    // Browser APIs
    // --------------------------------------------------------

    this.synthesis =
      window.speechSynthesis || null;

    this.SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      null;

    this.recognition = null;


    // --------------------------------------------------------
    // Speech Queue
    // --------------------------------------------------------

    this.speechQueue = [];

    this.isCurrentlySpeaking = false;

    this.currentUtterance = null;


    // --------------------------------------------------------
    // Settings
    // --------------------------------------------------------

    this.settings = {

      voiceGender:
        options.voiceGender || "female",

      speakingRate:
        options.speakingRate || 0.9,

      speakingPitch:
        options.speakingPitch || 1.0,

      volume:
        options.volume || 1.0,

      // Indian English
      language:
        options.language || "en-US"
    };


    // --------------------------------------------------------
    // State
    // --------------------------------------------------------

    this.isSpeaking = false;

    this.isListening = false;

    this.selectedVoice = null;

    this.silenceTimeout = null;

    this.silenceThreshold = 30000;

    this.lastSoundTime = Date.now();


    // --------------------------------------------------------
    // Callbacks
    // --------------------------------------------------------

    this.onListeningStart =
      options.onListeningStart ||
      function () {};

    this.onListeningEnd =
      options.onListeningEnd ||
      function () {};

    this.onTranscript =
      options.onTranscript ||
      function () {};

    this.onSilence =
      options.onSilence ||
      function () {};

    this.onError =
      options.onError ||
      function () {};

    this.onStatusChange =
      options.onStatusChange ||
      function () {};

    this.onSpeakingStart =
      options.onSpeakingStart ||
      function () {};

    this.onSpeakingEnd =
      options.onSpeakingEnd ||
      function () {};


    // --------------------------------------------------------
    // Initialize
    // --------------------------------------------------------

    this.initializeSpeechRecognition();

    this.getAvailableVoices();
  }


  // ==========================================================
  // SPEECH RECOGNITION INITIALIZATION
  // ==========================================================

  initializeSpeechRecognition() {

    if (!this.SpeechRecognition) {

      console.warn(
        "Speech Recognition is not supported in this browser."
      );

      return;
    }


    try {

      this.recognition =
        new this.SpeechRecognition();

    } catch (error) {

      console.error(
        "Could not create SpeechRecognition:",
        error
      );

      this.recognition = null;

      return;
    }


    // --------------------------------------------------------
    // Recognition settings
    // --------------------------------------------------------

    this.recognition.continuous = true;

    this.recognition.interimResults = true;

    this.recognition.lang = this.settings.language;

    this.recognition.maxAlternatives = 1;


    // ========================================================
    // ON START
    // ========================================================

    this.recognition.onstart = () => {

      console.log(
        "🎤 Speech recognition STARTED"
      );

      this.isListening = true;

      this.lastSoundTime = Date.now();

      this.onStatusChange(
        "Listening... Speak now."
      );

      this.onListeningStart();

      this.setupSilenceDetection();
    };


    // ========================================================
    // ON RESULT
    // ========================================================

    this.recognition.onresult = (event) => {

      console.log(
        "🎤 Speech result received"
      );


      let finalTranscript = "";

      let interimTranscript = "";


      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        const result =
          event.results[i];

        const transcript =
          result[0].transcript;


        console.log(
          "Transcript:",
          transcript,
          "Final:",
          result.isFinal
        );


        if (result.isFinal) {

          finalTranscript +=
            transcript + " ";

          this.lastSoundTime =
            Date.now();

        } else {

          interimTranscript +=
            transcript;
        }
      }


      // ------------------------------------------------------
      // FINAL TRANSCRIPT
      // ------------------------------------------------------

      if (
        finalTranscript.trim() !== ""
      ) {

        this.onTranscript({

          final: true,

          text:
            finalTranscript.trim(),

          confidence:
            this.getConfidence(event)

        });
      }


      // ------------------------------------------------------
      // INTERIM TRANSCRIPT
      // ------------------------------------------------------

      if (
        interimTranscript.trim() !== ""
      ) {

        this.onTranscript({

          final: false,

          text:
            interimTranscript.trim()

        });
      }
    };


    // ========================================================
    // ON END
    // ========================================================

    this.recognition.onend = () => {

      console.log(
        "🎤 Speech recognition ENDED"
      );

      this.isListening = false;

      this.clearSilenceDetection();

      this.onStatusChange(
        "Recording stopped."
      );

      this.onListeningEnd();
    };


    // ========================================================
    // ON ERROR
    // ========================================================

    this.recognition.onerror = (event) => {
    console.warn('Speech Recognition Error:', event.error);

    if (event.error === 'no-speech') {
        this.onStatusChange('Listening... Please speak clearly.');
        return;
    }

    if (event.error === 'aborted') {
        return;
    }

    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        this.onError('Microphone permission was denied. Please allow microphone access.');
        return;
    }

    this.onError(event.error);
};

    // ========================================================
    // ON AUDIO START
    // ========================================================

    this.recognition.onaudiostart = () => {

      console.log(
        "🎤 Microphone audio started"
      );

      this.lastSoundTime =
        Date.now();
    };


    // ========================================================
    // ON SOUND START
    // ========================================================

    this.recognition.onsoundstart = () => {

      console.log(
        "🔊 Sound detected"
      );

      this.lastSoundTime =
        Date.now();
    };


    // ========================================================
    // ON SPEECH START
    // ========================================================

    this.recognition.onspeechstart = () => {

      console.log(
        "🗣️ Speech detected"
      );

      this.lastSoundTime =
        Date.now();

      this.onStatusChange(
        "Speech detected..."
      );
    };


    // ========================================================
    // ON SPEECH END
    // ========================================================

    this.recognition.onspeechend = () => {

      console.log(
        "🗣️ Speech ended"
      );
    };
  }


  // ==========================================================
  // GET CONFIDENCE
  // ==========================================================

  getConfidence(event) {

    try {

      const lastResult =
        event.results[
          event.results.length - 1
        ];

      if (
        lastResult &&
        lastResult[0] &&
        typeof lastResult[0].confidence === "number"
      ) {

        return lastResult[0].confidence;
      }

    } catch (error) {

      console.warn(
        "Could not read confidence:",
        error
      );
    }

    return 0;
  }


  // ==========================================================
  // GET AVAILABLE VOICES
  // ==========================================================

  getAvailableVoices() {

    if (!this.synthesis) {

      console.warn(
        "Speech synthesis is not supported."
      );

      return;
    }


    const voices =
      this.synthesis.getVoices();


    if (
      voices &&
      voices.length > 0
    ) {

      this.selectVoice(voices);

    } else {

      this.synthesis.onvoiceschanged = () => {

        const updatedVoices =
          this.synthesis.getVoices();

        this.selectVoice(
          updatedVoices
        );
      };
    }
  }


  // ==========================================================
  // SELECT VOICE
  // ==========================================================

  selectVoice(voices) {

    if (
      !voices ||
      voices.length === 0
    ) {

      return;
    }


    let selectedVoice = null;


    // --------------------------------------------------------
    // First preference:
    // Indian English
    // --------------------------------------------------------

    selectedVoice =
      voices.find(
        voice =>
          voice.lang === "en-IN"
      );


    // --------------------------------------------------------
    // Second preference:
    // English natural voices
    // --------------------------------------------------------

    if (!selectedVoice) {

      selectedVoice =
        voices.find(
          voice =>
            voice.lang.startsWith("en") &&
            (
              voice.name
                .toLowerCase()
                .includes("natural") ||
              voice.name
                .toLowerCase()
                .includes("neural")
            )
        );
    }


    // --------------------------------------------------------
    // Third preference:
    // Preferred gender
    // --------------------------------------------------------

    if (!selectedVoice) {

      const gender =
        this.settings.voiceGender
          .toLowerCase();


      selectedVoice =
        voices.find(
          voice =>
            voice.lang.startsWith("en") &&
            voice.name
              .toLowerCase()
              .includes(gender)
        );
    }


    // --------------------------------------------------------
    // Fourth preference:
    // Any English voice
    // --------------------------------------------------------

    if (!selectedVoice) {

      selectedVoice =
        voices.find(
          voice =>
            voice.lang.startsWith("en")
        );
    }


    // --------------------------------------------------------
    // Final fallback
    // --------------------------------------------------------

    if (!selectedVoice) {

      selectedVoice =
        voices[0];
    }


    this.selectedVoice =
      selectedVoice;


    console.log(
      "Selected voice:",
      this.selectedVoice.name,
      this.selectedVoice.lang
    );
  }


  // ==========================================================
  // TEXT TO SPEECH
  // ==========================================================

  speak(
    text,
    priority = "normal"
  ) {

    return new Promise(
      (resolve, reject) => {

        if (
          !text ||
          text.trim() === ""
        ) {

          reject(
            new Error(
              "Cannot speak empty text."
            )
          );

          return;
        }


        if (!this.synthesis) {

          reject(
            new Error(
              "Text-to-speech is not supported."
            )
          );

          return;
        }


        const utterance =
          new SpeechSynthesisUtterance(
            text
          );


        if (this.selectedVoice) {

          utterance.voice =
            this.selectedVoice;
        }


        utterance.rate =
          this.settings.speakingRate;

        utterance.pitch =
          this.settings.speakingPitch;

        utterance.volume =
          this.settings.volume;

        utterance.lang =
          this.settings.language;


        const queueItem = {

          utterance: utterance,

          resolve: resolve,

          reject: reject,

          priority:
            priority === "high"
              ? 1
              : 0,

          timestamp:
            Date.now()
        };


        this.speechQueue.push(
          queueItem
        );


        // Sort priority
        this.speechQueue.sort(
          (a, b) => {

            if (
              a.priority !==
              b.priority
            ) {

              return (
                b.priority -
                a.priority
              );
            }

            return (
              a.timestamp -
              b.timestamp
            );
          }
        );


        // ----------------------------------------------------
        // SPEECH START
        // ----------------------------------------------------

        utterance.onstart = () => {

          console.log(
            "🔊 AI speaking..."
          );

          this.isSpeaking = true;

          this.isCurrentlySpeaking = true;

          this.currentUtterance =
            utterance;

          this.onSpeakingStart();

          this.onStatusChange(
            "Speaking..."
          );
        };


        // ----------------------------------------------------
        // SPEECH END
        // ----------------------------------------------------

        utterance.onend = () => {

          console.log(
            "🔊 AI finished speaking"
          );

          this.isSpeaking = false;

          this.currentUtterance =
            null;

          this.onSpeakingEnd();


          // Remove current item
          const index =
            this.speechQueue.indexOf(
              queueItem
            );

          if (index !== -1) {

            this.speechQueue.splice(
              index,
              1
            );
          }


          resolve(true);


          if (
            this.speechQueue.length >
            0
          ) {

            setTimeout(
              () => {
                this.playNextInQueue();
              },
              200
            );

          } else {

            this.isCurrentlySpeaking =
              false;
          }
        };


        // ----------------------------------------------------
        // SPEECH ERROR
        // ----------------------------------------------------

        utterance.onerror =
          (event) => {

            console.error(
              "Speech synthesis error:",
              event.error
            );


            this.isSpeaking = false;

            this.currentUtterance =
              null;


            const index =
              this.speechQueue.indexOf(
                queueItem
              );

            if (index !== -1) {

              this.speechQueue.splice(
                index,
                1
              );
            }


            reject(
              new Error(
                "Speech synthesis error: " +
                event.error
              )
            );


            this.onError(
              "Speech error: " +
              event.error
            );


            if (
              this.speechQueue.length >
              0
            ) {

              this.playNextInQueue();

            } else {

              this.isCurrentlySpeaking =
                false;
            }
          };


        // Start immediately if nothing is speaking
        if (
          !this.isCurrentlySpeaking
        ) {

          this.playNextInQueue();
        }
      }
    );
  }


  // ==========================================================
  // PLAY NEXT SPEECH
  // ==========================================================

  playNextInQueue() {

    if (
      !this.synthesis ||
      this.isCurrentlySpeaking ||
      this.speechQueue.length === 0
    ) {

      return;
    }


    const item =
      this.speechQueue[0];


    this.isCurrentlySpeaking =
      true;


    try {

      this.synthesis.cancel();

      this.synthesis.speak(
        item.utterance
      );

    } catch (error) {

      console.error(
        "Speech playback error:",
        error
      );

      this.isCurrentlySpeaking =
        false;
    }
  }


  // ==========================================================
  // STOP SPEAKING
  // ==========================================================

  stopSpeaking() {

    if (this.synthesis) {

      try {

        this.synthesis.cancel();

      } catch (error) {

        console.error(
          "Error stopping speech:",
          error
        );
      }
    }


    this.speechQueue = [];

    this.currentUtterance = null;

    this.isSpeaking = false;

    this.isCurrentlySpeaking = false;

    this.onSpeakingEnd();
  }


  // ==========================================================
  // SILENCE DETECTION
  // ==========================================================

  setupSilenceDetection() {

    this.clearSilenceDetection();


    this.silenceTimeout =
      setInterval(
        () => {

          if (!this.isListening) {

            return;
          }


          const silenceDuration =
            Date.now() -
            this.lastSoundTime;


          if (
            silenceDuration >
            this.silenceThreshold
          ) {

            console.log(
              "30 seconds of silence detected."
            );


            this.onSilence();


            this.onStatusChange(
              "No speech detected."
            );
          }

        },
        1000
      );
  }


  // ==========================================================
  // CLEAR SILENCE DETECTION
  // ==========================================================

  clearSilenceDetection() {

    if (
      this.silenceTimeout
    ) {

      clearInterval(
        this.silenceTimeout
      );

      this.silenceTimeout =
        null;
    }
  }


  // ==========================================================
  // START LISTENING
  // ==========================================================

  startListening() {

    if (!this.recognition) {

      this.onError(
        "Speech recognition is not supported in this browser."
      );

      return;
    }


    if (this.isListening) {

      console.log(
        "Already listening."
      );

      return;
    }


    // Stop AI speech first
    this.stopSpeaking();


    // Small delay prevents TTS and microphone conflict
    setTimeout(
      () => {

        try {

          console.log(
            "🎤 Calling recognition.start()..."
          );


          this.recognition.start();


        } catch (error) {

          console.error(
            "Speech recognition start error:",
            error
          );


          // Ignore duplicate start error
          if (
            error.name !==
            "InvalidStateError"
          ) {

            this.onError(
              "Could not start speech recognition: " +
              error.message
            );
          }
        }

      },
      500
    );
  }


  // ==========================================================
  // STOP LISTENING
  // ==========================================================

  stopListening() {

    if (!this.recognition) {

      return;
    }


    console.log(
      "🎤 Stopping speech recognition..."
    );


    try {

      this.recognition.stop();

    } catch (error) {

      console.warn(
        "Recognition stop error:",
        error
      );
    }


    this.isListening = false;

    this.clearSilenceDetection();
  }


  // ==========================================================
  // ABORT LISTENING
  // ==========================================================

  abort() {

    if (!this.recognition) {

      return;
    }


    console.log(
      "🎤 Aborting speech recognition..."
    );


    try {

      this.recognition.abort();

    } catch (error) {

      console.warn(
        "Recognition abort error:",
        error
      );
    }


    this.isListening = false;

    this.clearSilenceDetection();
  }


  // ==========================================================
  // UPDATE SETTINGS
  // ==========================================================

  updateSettings(
    newSettings = {}
  ) {

    this.settings = {
      ...this.settings,
      ...newSettings
    };


    if (
      newSettings.language &&
      this.recognition
    ) {

      this.recognition.lang =
        newSettings.language;
    }


    if (
      newSettings.voiceGender
    ) {

      this.getAvailableVoices();
    }
  }


  // ==========================================================
  // CHECK TTS SUPPORT
  // ==========================================================

  isSynthesisSupported() {

    return !!this.synthesis;
  }


  // ==========================================================
  // CHECK SPEECH RECOGNITION SUPPORT
  // ==========================================================

  isRecognitionSupported() {

    return !!this.SpeechRecognition &&
           !!this.recognition;
  }


  // ==========================================================
  // CHECK MICROPHONE
  // ==========================================================

  async checkMicrophone() {

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {

      return {
        supported: false,
        message:
          "Microphone API is not supported."
      };
    }


    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true
        });


      const tracks =
        stream.getAudioTracks();


      console.log(
        "🎤 Microphone permission granted."
      );

      console.log(
        "🎤 Microphone tracks:",
        tracks
      );


      // Stop test stream
      tracks.forEach(
        track => track.stop()
      );


      return {
        supported: true,
        permission: true,
        message:
          "Microphone is available."
      };


    } catch (error) {

      console.error(
        "Microphone check failed:",
        error
      );


      return {
        supported: false,
        permission: false,
        error: error.name,
        message:
          error.message
      };
    }
  }
}


// ============================================================
// MAKE AVAILABLE GLOBALLY
// ============================================================

window.EnhancedVoiceManager =
  EnhancedVoiceManager;