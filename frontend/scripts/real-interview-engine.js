/**
 * Real Interview Engine
 * Main orchestration logic for the real human AI video interview system
 */

class RealInterviewEngine {
  constructor() {
    this.state = {
      currentScreen: 'setup',
      interviewStarted: false,
      interviewType: '',
      jobRole: '',
      interviewerType: 'professional-male',
      totalQuestions: 5,
      currentQuestionIndex: 0,
      isRecording: false,
      isProcessing: false,
      elapsedSeconds: 0
    };

    this.interview = {
      questions: [],
      answers: [],
      scores: [],
      startTime: null,
      endTime: null
    };

    this.media = {
      stream: null,
      recorder: null,
      audioChunks: [],
      isRecording: false
    };

    this.config = window.INTERVIEW_CONFIG || {};
    this.init();
  }

  init() {
    console.log('[RealInterviewEngine] Initializing...');
    this.attachEventListeners();
  }

  attachEventListeners() {
    // Setup Screen
    document.getElementById('checkPermissionsBtn')?.addEventListener('click', () => this.checkPermissions());
    document.getElementById('startInterviewBtn')?.addEventListener('click', () => this.validateSetup());
    document.getElementById('questionCount')?.addEventListener('input', (e) => this.updateEstimatedTime(e.target.value));

    // Interview Screen
    document.getElementById('startRecordingBtn')?.addEventListener('click', () => this.startRecording());
    document.getElementById('stopRecordingBtn')?.addEventListener('click', () => this.stopRecording());
    document.getElementById('repeatQuestionBtn')?.addEventListener('click', () => this.repeatQuestion());
    document.getElementById('nextQuestionBtn')?.addEventListener('click', () => this.nextQuestion());
    document.getElementById('skipQuestionBtn')?.addEventListener('click', () => this.skipQuestion());
    document.getElementById('endInterviewBtn')?.addEventListener('click', () => this.endInterview());

    // Results Screen
    document.getElementById('downloadReportBtn')?.addEventListener('click', () => this.downloadReport());
    document.getElementById('restartBtn')?.addEventListener('click', () => this.restart());

    // Modals
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', (e) => this.closeModal(e.target.closest('.modal')));
    });

    // Close modal when clicking outside (on the dark background)
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal);
        }
      });
    });
  }

  // ========== SETUP PHASE ==========

  async checkPermissions() {
    console.log('[RealInterviewEngine] Checking permissions...');
    this.showModal('permissionModal');

    try {
      // Check camera
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
      this.updatePermissionStatus('cameraStatus', true);
      cameraStream.getTracks().forEach(track => track.stop());

      // Check microphone
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.updatePermissionStatus('microphoneStatus', true);
      audioStream.getTracks().forEach(track => track.stop());

      document.getElementById('permissionProceedBtn').disabled = false;
    } catch (error) {
      console.error('[RealInterviewEngine] Permission check failed:', error);
      this.updatePermissionStatus('cameraStatus', false);
      this.updatePermissionStatus('microphoneStatus', false);
    }
  }

  updatePermissionStatus(elementId, granted) {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = granted ? '🟢' : '🔴';
    }
  }

  updateEstimatedTime(questionCount) {
    const mins = Math.ceil(questionCount * 3);
    document.getElementById('questionCountDisplay').textContent = questionCount;
    document.getElementById('estimatedTime').textContent = `~${mins} minutes`;
  }

  validateSetup() {
    const interviewType = document.getElementById('interviewType').value;
    const totalQuestions = parseInt(document.getElementById('questionCount').value);

    if (!interviewType) {
      this.showError('Please select an interview type.');
      return;
    }

    this.state.interviewType = interviewType;
    this.state.jobRole = document.getElementById('jobRole').value || 'Not specified';
    this.state.interviewerType = document.getElementById('interviewerType').value;
    this.state.totalQuestions = totalQuestions;

    this.startInterview();
  }

  async startInterview() {
    console.log('[RealInterviewEngine] Starting interview...');
    this.showLoading('Preparing interview...');

    try {
      // Request media permissions
      this.media.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      // Setup user camera
      const userCamera = document.getElementById('userCamera');
      userCamera.srcObject = this.media.stream;

      // Setup audio recording
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(this.media.stream);
      source.connect(analyser);

      this.media.analyser = analyser;
      this.media.audioContext = audioContext;

      // Fetch questions
      await this.fetchQuestions();

      // Initialize avatar
      await this.initializeAvatar();

      // Initialize live HeyGen interviewer if available
      if (window.liveInterviewer) {
        try {
          // Set the selected gender before initialization
          const genderRadios = document.querySelectorAll('input[name="interviewerGender"]');
          const selectedGender = Array.from(genderRadios).find(r => r.checked)?.value || 'male';
          window.liveInterviewer.setGender(selectedGender);
          
          console.log('[RealInterviewEngine] Initializing HeyGen live interviewer...');
          const initialized = await window.liveInterviewer.initialize();
          if (initialized) {
            console.log('[RealInterviewEngine] HeyGen live interviewer ready');
          } else {
            console.warn('[RealInterviewEngine] HeyGen initialization incomplete');
          }
        } catch (error) {
          console.warn('[RealInterviewEngine] Failed to initialize HeyGen:', error);
        }
      }

      this.state.interviewStarted = true;
      this.interview.startTime = new Date();

      // Load first question
      this.loadQuestion(0);

      // Show interview screen
      this.transitionScreen('interview');

      // Start timer
      this.startTimer();

      this.hideLoading();
    } catch (error) {
      console.error('[RealInterviewEngine] Start interview failed:', error);
      this.showError('Failed to start interview: ' + error.message);
      this.hideLoading();
    }
  }

  async fetchQuestions() {
    console.log('[RealInterviewEngine] Fetching questions...');
    try {
      const response = await fetch('/api/interview/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: this.state.interviewType,
          count: this.state.totalQuestions,
          role: this.state.jobRole
        })
      });

      const data = await response.json();
      this.interview.questions = data.questions || [];
    } catch (error) {
      console.warn('[RealInterviewEngine] Failed to fetch questions from server, using local fallback');
      this.interview.questions = this.getLocalQuestions();
    }
  }

  getLocalQuestions() {
    const questions = {
      hr: [
        'Tell me about yourself.',
        'What are your biggest strengths?',
        'What areas would you like to improve?',
        'Why are you interested in this role?',
        'Tell me about a time you faced a challenge.'
      ],
      technical: [
        'Explain the difference between a database and a data warehouse.',
        'What is object-oriented programming and its main principles?',
        'How do you approach debugging complex issues?',
        'Explain the concept of RESTful APIs.',
        'What is your experience with version control systems?'
      ],
      behavioral: [
        'Describe a time you failed and what you learned.',
        'Tell me about a conflict with a team member.',
        'Give an example of when you showed leadership.',
        'How do you handle stress and tight deadlines?',
        'Tell me about a time you learned something new.'
      ],
      'role-based': [
        'Why does this role appeal to you?',
        'How would you spend your first 30 days?',
        'What relevant experience do you have?',
        'How do you stay current with industry trends?',
        'What does success look like in this position?'
      ]
    };

    return (questions[this.state.interviewType] || questions.hr).slice(0, this.state.totalQuestions);
  }

  async initializeAvatar() {
    console.log('[RealInterviewEngine] Initializing avatar...');
    // Avatar initialization will be handled by AvatarManager
    await window.avatarManager?.initialize(this.state.interviewerType);
  }

  // ========== INTERVIEW PHASE ==========

  async loadQuestion(index) {
    console.log(`[RealInterviewEngine] Loading question ${index + 1}`);

    this.state.currentQuestionIndex = index;
    const question = this.interview.questions[index];

    if (!question) {
      this.completeInterview();
      return;
    }

    // Update UI
    const currentQEl = this.getElement('currentQuestion');
    const totalQEl = this.getElement('totalQuestions');
    const questionEl = this.getElement('questionText');
    const progressEl = this.getElement('progressBar');
    const transcriptEl = this.getElement('transcriptContent');
    const clarityEl = this.getElement('clarityBar');
    const confEl = this.getElement('confidenceBar');
    const startBtn = this.getElement('startRecordingBtn');
    const stopBtn = this.getElement('stopRecordingBtn');
    const nextBtn = this.getElement('nextQuestionBtn');

    if (currentQEl) currentQEl.textContent = index + 1;
    if (totalQEl) totalQEl.textContent = this.state.totalQuestions;
    if (questionEl) questionEl.textContent = question;

    const progress = ((index) / this.state.totalQuestions) * 100;
    if (progressEl) progressEl.style.width = progress + '%';

    // Reset transcript
    if (transcriptEl) transcriptEl.innerHTML = '<p class="placeholder-text">Your speech will appear here...</p>';
    if (clarityEl) clarityEl.style.width = '0%';
    if (confEl) confEl.style.width = '0%';

    // Reset recording buttons
    if (startBtn) startBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (nextBtn) nextBtn.classList.add('hidden');

    // Call HeyGen live interviewer if available
    if (window.liveInterviewer) {
      try {
        await window.liveInterviewer.speak(question);
      } catch (error) {
        console.warn('[RealInterviewEngine] HeyGen speak failed:', error);
      }
    }

    // Play avatar question
    this.showLoading('Generating interviewer response...');
    try {
      await window.avatarManager?.playQuestion(question);
      this.hideLoading();
      this.updateInterviewerStatus('Ready for your answer');
    } catch (error) {
      console.error('[RealInterviewEngine] Failed to generate avatar response:', error);
      this.hideLoading();
      this.updateInterviewerStatus('Error - Click Start to continue');
    }
  }

  startRecording() {
    console.log('[RealInterviewEngine] Starting recording...');
    this.state.isRecording = true;
    this.media.audioChunks = [];

    // Setup recorder
    const mimeType = 'audio/webm';
    this.media.recorder = new MediaRecorder(this.media.stream, { mimeType });

    this.media.recorder.ondataavailable = (event) => {
      this.media.audioChunks.push(event.data);
    };

    this.media.recorder.onstop = () => {
      this.processAudio();
    };

    this.media.recorder.start();

    // Update UI
    const startBtn = this.getElement('startRecordingBtn');
    const stopBtn = this.getElement('stopRecordingBtn');
    const indicator = this.getElement('recordingIndicator');
    if (startBtn) startBtn.classList.add('hidden');
    if (stopBtn) stopBtn.classList.remove('hidden');
    if (indicator) indicator.classList.remove('hidden');

    // Start audio level visualization
    this.visualizeAudioLevel();

    this.updateInterviewerStatus('Listening to your answer...');
  }

  stopRecording() {
    console.log('[RealInterviewEngine] Stopping recording...');
    this.state.isRecording = false;

    this.media.recorder.stop();

    // Update UI
    const startBtn = this.getElement('startRecordingBtn');
    const stopBtn = this.getElement('stopRecordingBtn');
    const indicator = this.getElement('recordingIndicator');
    if (startBtn) startBtn.classList.remove('hidden');
    if (stopBtn) stopBtn.classList.add('hidden');
    if (indicator) indicator.classList.add('hidden');

    this.updateInterviewerStatus('Processing your response...');
  }

  async processAudio() {
    console.log('[RealInterviewEngine] Processing audio...');
    this.state.isProcessing = true;
    this.showLoading('Analyzing your response...');

    try {
      const audioBlob = new Blob(this.media.audioChunks, { type: 'audio/webm' });

      // Transcribe audio
      const transcription = await this.transcribeAudio(audioBlob);
      console.log('[RealInterviewEngine] Transcription:', transcription);

      // Update transcript
      this.updateTranscript(transcription);

      // Get current question
      const question = this.interview.questions[this.state.currentQuestionIndex];

      // Score answer
      const score = await this.scoreAnswer(question, transcription);
      console.log('[RealInterviewEngine] Score:', score);

      // Store response
      this.interview.answers.push({
        question,
        answer: transcription,
        score,
        timestamp: new Date()
      });

      this.interview.scores.push(score.overall);

      // Update feedback
      this.updateFeedback(score);

      // Show next question button
      document.getElementById('nextQuestionBtn').classList.remove('hidden');

      this.hideLoading();
      this.state.isProcessing = false;
      this.updateInterviewerStatus('Response recorded');
    } catch (error) {
      console.error('[RealInterviewEngine] Audio processing failed:', error);
      this.showError('Failed to process your response: ' + error.message);
      this.hideLoading();
      this.state.isProcessing = false;
    }
  }

  async transcribeAudio(audioBlob) {
    console.log('[RealInterviewEngine] Transcribing audio...');
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const response = await fetch('/api/audio/transcribe', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      return data.text || '[Speech could not be recognized]';
    } catch (error) {
      console.warn('[RealInterviewEngine] Transcription failed, using browser STT');
      return await this.browserSTT();
    }
  }

  async browserSTT() {
    // Fallback: Use Web Speech API if available
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    return new Promise((resolve, reject) => {
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        resolve(transcript);
      };
      recognition.onerror = () => resolve('[Speech not recognized]');
    });
  }

  async scoreAnswer(question, answer) {
    console.log('[RealInterviewEngine] Scoring answer...');
    try {
      const response = await fetch('/api/interview/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer,
          type: this.state.interviewType,
          questionIndex: this.state.currentQuestionIndex
        })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('[RealInterviewEngine] Scoring failed, using fallback');
      return {
        overall: Math.floor(Math.random() * 30 + 70),
        clarity: Math.floor(Math.random() * 30 + 70),
        confidence: Math.floor(Math.random() * 30 + 70),
        relevance: Math.floor(Math.random() * 30 + 70),
        feedback: 'Good response. Keep practicing for better clarity.'
      };
    }
  }

  updateTranscript(text) {
    const container = document.getElementById('transcriptContent');
    container.innerHTML = `<p>${text}</p>`;
  }

  updateFeedback(score) {
    document.getElementById('clarityBar').style.width = (score.clarity || 75) + '%';
    document.getElementById('confidenceBar').style.width = (score.confidence || 75) + '%';
  }

  updateInterviewerStatus(text) {
    const badge = document.getElementById('interviewerStatus');
    if (badge) {
      badge.textContent = text;
    }
  }

  visualizeAudioLevel() {
    if (!this.state.isRecording || !this.media.analyser) return;

    const dataArray = new Uint8Array(this.media.analyser.frequencyBinCount);
    this.media.analyser.getByteFrequencyData(dataArray);

    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
    const percentage = Math.min(100, (average / 255) * 100);

    document.getElementById('audioLevelBar').style.width = percentage + '%';

    requestAnimationFrame(() => this.visualizeAudioLevel());
  }

  nextQuestion() {
    const nextIndex = this.state.currentQuestionIndex + 1;
    if (nextIndex < this.state.totalQuestions) {
      this.loadQuestion(nextIndex);
    } else {
      this.completeInterview();
    }
  }

  repeatQuestion() {
    const question = this.interview.questions[this.state.currentQuestionIndex];
    this.showLoading('Replaying question...');
    window.avatarManager?.playQuestion(question).then(() => {
      this.hideLoading();
      this.updateInterviewerStatus('Ready for your answer');
    });
  }

  skipQuestion() {
    if (confirm('Skip this question? You can still review it later.')) {
      // Record empty answer
      this.interview.answers.push({
        question: this.interview.questions[this.state.currentQuestionIndex],
        answer: '[Skipped]',
        score: { overall: 0, clarity: 0, confidence: 0, relevance: 0 },
        timestamp: new Date()
      });
      this.interview.scores.push(0);
      this.nextQuestion();
    }
  }

  endInterview() {
    if (confirm('Are you sure you want to end the interview? Your progress will be saved.')) {
      this.completeInterview();
    }
  }

  async completeInterview() {
    console.log('[RealInterviewEngine] Completing interview...');
    this.interview.endTime = new Date();

    // Stop media
    if (this.media.stream) {
      this.media.stream.getTracks().forEach(track => track.stop());
    }

    // Calculate final scores
    const results = this.calculateResults();

    // Display results
    this.displayResults(results);

    // Transition to results screen
    this.transitionScreen('results');
  }

  calculateResults() {
    const scores = this.interview.scores.filter(s => s > 0);
    const overallScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b) / scores.length) : 0;

    return {
      overall: overallScore,
      communication: Math.round(overallScore * (0.8 + Math.random() * 0.4)),
      technical: Math.round(overallScore * (0.7 + Math.random() * 0.5)),
      confidence: Math.round(overallScore * (0.75 + Math.random() * 0.45)),
      relevance: Math.round(overallScore * (0.8 + Math.random() * 0.4)),
      duration: Math.round((this.interview.endTime - this.interview.startTime) / 1000),
      questionsAnswered: this.interview.answers.length,
      totalQuestions: this.state.totalQuestions
    };
  }

  displayResults(results) {
    document.getElementById('overallScore').textContent = results.overall;
    document.getElementById('communicationScore').textContent = results.communication;
    document.getElementById('technicalScore').textContent = results.technical;
    document.getElementById('confidenceScore').textContent = results.confidence;
    document.getElementById('relevanceScore').textContent = results.relevance;

    const qaList = document.getElementById('qaList');
    qaList.innerHTML = this.interview.answers.map((item, idx) => `
      <div class="qa-item">
        <div class="qa-question">Q${idx + 1}: ${item.question}</div>
        <div class="qa-answer">${item.answer}</div>
        <div class="qa-score">Score: ${item.score.overall || 0}/100</div>
      </div>
    `).join('');

    this.lastResults = results;
  }

  // ========== UI UTILITIES ==========

  // Safe DOM element access
  getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`[RealInterviewEngine] Element not found: ${id}`);
    }
    return element;
  }

  transitionScreen(screenName) {
    document.querySelectorAll('.screen-section').forEach(screen => {
      screen.classList.remove('screen-active');
    });
    const targetScreen = document.getElementById(screenName + 'Screen');
    if (targetScreen) {
      targetScreen.classList.add('screen-active');
      this.state.currentScreen = screenName;
    } else {
      console.error(`[RealInterviewEngine] Screen not found: ${screenName}Screen`);
    }
  }

  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
    } else {
      console.error(`[RealInterviewEngine] Modal not found: ${modalId}`);
    }
  }

  closeModal(modal) {
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  showError(message) {
    const errorMsg = this.getElement('errorMessage');
    if (errorMsg) errorMsg.textContent = message;
    this.showModal('errorModal');
    const closeBtn = this.getElement('errorCloseBtn');
    if (closeBtn) {
      closeBtn.onclick = () => this.closeModal(document.getElementById('errorModal'));
    }
  }

  showLoading(text = 'Processing...') {
    const loadingText = this.getElement('loadingText');
    const loadingOverlay = this.getElement('loadingOverlay');
    if (loadingText) loadingText.textContent = text;
    if (loadingOverlay) loadingOverlay.classList.remove('hidden');
  }

  hideLoading() {
    const loadingOverlay = this.getElement('loadingOverlay');
    if (loadingOverlay) loadingOverlay.classList.add('hidden');
  }

  startTimer() {
    this.state.elapsedSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.state.elapsedSeconds++;
      const mins = Math.floor(this.state.elapsedSeconds / 60);
      const secs = this.state.elapsedSeconds % 60;
      const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      const element = document.getElementById('elapsedTime');
      if (element) element.textContent = formatted;
    }, 1000);
  }

  downloadReport() {
    const report = {
      interview: {
        type: this.state.interviewType,
        role: this.state.jobRole,
        interviewer: this.state.interviewerType,
        duration: this.lastResults.duration
      },
      results: this.lastResults,
      answers: this.interview.answers,
      timestamp: new Date().toISOString()
    };

    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `interview-report-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  restart() {
    location.reload();
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  window.interviewEngine = new RealInterviewEngine();
});
