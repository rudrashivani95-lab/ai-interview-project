/* ============================================
   AI AVATAR INTERVIEW ENGINE
   Real-time Interview with D-ID/HeyGen Avatar
   ============================================ */

class AvatarInterviewEngine {
  constructor() {
    console.log('🚀 Initializing Avatar Interview Engine...');
    
    // Configuration
    this.config = {
      apiBaseUrl: 'http://localhost:3000/api',
      maxRecordingTime: 120, // 2 minutes max per answer
      silenceThreshold: 1500, // ms of silence to stop recording
      questionTypes: ['hr', 'technical', 'behavioral', 'role-based']
    };

    // Interview State
    this.state = {
      currentScreen: 'setup',
      interviewStarted: false,
      interviewType: null,
      jobRole: null,
      avatarStyle: 'professional',
      totalQuestions: 5,
      currentQuestionIndex: 0,
      isAnswering: false,
      isProcessing: false,
      interviewStartTime: null,
      elapsedSeconds: 0
    };

    // Interview Data
    this.interview = {
      questions: [],
      answers: [],
      scores: [],
      startTime: null,
      endTime: null
    };

    // Audio/Video
    this.media = {
      stream: null,
      recorder: null,
      audioChunks: [],
      isRecording: false,
      recordingStartTime: null,
      recordingDuration: 0
    };

    // DOM Elements
    this.dom = {
      // Screens
      setupScreen: document.getElementById('setupScreen'),
      interviewScreen: document.getElementById('interviewScreen'),
      resultsScreen: document.getElementById('resultsScreen'),
      
      // Setup Form
      interviewType: document.getElementById('interviewType'),
      jobRole: document.getElementById('jobRole'),
      avatarStyle: document.getElementById('avatarStyle'),
      questionCount: document.getElementById('questionCount'),
      questionCountDisplay: document.getElementById('questionCountDisplay'),
      estimatedTime: document.getElementById('estimatedTime'),
      checkPermissionsBtn: document.getElementById('checkPermissionsBtn'),
      startInterviewBtn: document.getElementById('startInterviewBtn'),
      
      // Interview Session
      avatarVideo: document.getElementById('avatarVideo'),
      avatarPlaceholder: document.getElementById('avatarPlaceholder'),
      avatarStatusText: document.getElementById('avatarStatusText'),
      currentQuestion: document.getElementById('currentQuestion'),
      totalQuestions: document.getElementById('totalQuestions'),
      interviewTimer: document.getElementById('interviewTimer'),
      questionText: document.getElementById('questionText'),
      transcriptBox: document.getElementById('transcriptBox'),
      clearTranscriptBtn: document.getElementById('clearTranscriptBtn'),
      userCamera: document.getElementById('userCamera'),
      recordingBadge: document.getElementById('recordingBadge'),
      cameraStatus: document.getElementById('cameraStatus'),
      startRecordingBtn: document.getElementById('startRecordingBtn'),
      stopRecordingBtn: document.getElementById('stopRecordingBtn'),
      skipQuestionBtn: document.getElementById('skipQuestionBtn'),
      repeatQuestionBtn: document.getElementById('repeatQuestionBtn'),
      endInterviewBtn: document.getElementById('endInterviewBtn'),
      recordingTime: document.getElementById('recordingTime'),
      interviewStatus: document.getElementById('interviewStatus'),
      feedbackArea: document.getElementById('feedbackArea'),
      currentScore: document.getElementById('currentScore'),
      feedbackMessage: document.getElementById('feedbackMessage'),
      clarityScore: document.getElementById('clarityScore'),
      completenessScore: document.getElementById('completenessScore'),
      confidenceScore: document.getElementById('confidenceScore'),
      
      // Results
      overallScore: document.getElementById('overallScore'),
      scoreInterpretation: document.getElementById('scoreInterpretation'),
      communicationBar: document.getElementById('communicationBar'),
      clarityBar: document.getElementById('clarityBar'),
      confidenceBar: document.getElementById('confidenceBar'),
      technicalBar: document.getElementById('technicalBar'),
      communicationScore: document.getElementById('communicationScore'),
      clarityScoreDisplay: document.getElementById('clarityScoreDisplay'),
      confidenceScoreDisplay: document.getElementById('confidenceScoreDisplay'),
      technicalScore: document.getElementById('technicalScore'),
      answersContainer: document.getElementById('answersContainer'),
      downloadReportBtn: document.getElementById('downloadReportBtn'),
      retryBtn: document.getElementById('retryBtn'),
      
      // Overlays
      errorModal: document.getElementById('errorModal'),
      errorMessage: document.getElementById('errorMessage'),
      closeErrorBtn: document.getElementById('closeErrorBtn'),
      dismissErrorBtn: document.getElementById('dismissErrorBtn'),
      loadingOverlay: document.getElementById('loadingOverlay'),
      loadingText: document.getElementById('loadingText')
    };

    // Initialize
    this.init();
  }

  init() {
    console.log('⚙️  Setting up event listeners...');
    this.attachEventListeners();
    this.setupQuestionCounterListener();
    console.log('✅ Avatar Interview Engine initialized');
  }

  attachEventListeners() {
    // Setup Screen
    this.dom.checkPermissionsBtn?.addEventListener('click', () => this.checkPermissions());
    this.dom.startInterviewBtn?.addEventListener('click', () => this.startInterview());
    
    // Interview Screen
    this.dom.startRecordingBtn?.addEventListener('click', () => this.startRecording());
    this.dom.stopRecordingBtn?.addEventListener('click', () => this.stopRecording());
    this.dom.skipQuestionBtn?.addEventListener('click', () => this.skipQuestion());
    this.dom.repeatQuestionBtn?.addEventListener('click', () => this.repeatQuestion());
    this.dom.endInterviewBtn?.addEventListener('click', () => this.endInterview());
    this.dom.clearTranscriptBtn?.addEventListener('click', () => this.clearTranscript());
    
    // Results Screen
    this.dom.downloadReportBtn?.addEventListener('click', () => this.downloadReport());
    this.dom.retryBtn?.addEventListener('click', () => location.reload());
    
    // Error Modal
    this.dom.closeErrorBtn?.addEventListener('click', () => this.closeErrorModal());
    this.dom.dismissErrorBtn?.addEventListener('click', () => this.closeErrorModal());
  }

  setupQuestionCounterListener() {
    this.dom.questionCount?.addEventListener('input', (e) => {
      const count = parseInt(e.target.value);
      this.dom.questionCountDisplay.textContent = count;
      const estimatedMinutes = Math.ceil(count * 1.5);
      this.dom.estimatedTime.textContent = `~${estimatedMinutes} minutes`;
    });
  }

  // ============================================
  // SETUP & PERMISSIONS
  // ============================================

  async checkPermissions() {
    try {
      console.log('📹 Checking camera and microphone permissions...');
      this.showLoading(true, 'Checking permissions...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      
      // Close the stream
      stream.getTracks().forEach(track => track.stop());
      
      this.showLoading(false);
      this.showNotification('✅ Permissions granted! Camera and microphone are ready.');
    } catch (error) {
      this.showLoading(false);
      this.showError('Permission Denied', 'Please enable camera and microphone access to continue.');
      console.error('Permission error:', error);
    }
  }

  async startInterview() {
    try {
      // Validate form
      if (!this.dom.interviewType.value) {
        this.showError('Setup Error', 'Please select an interview type.');
        return;
      }

      // Store configuration
      this.state.interviewType = this.dom.interviewType.value;
      this.state.jobRole = this.dom.jobRole.value || 'General Position';
      this.state.avatarStyle = this.dom.avatarStyle.value;
      this.state.totalQuestions = parseInt(this.dom.questionCount.value);

      this.showLoading(true, 'Starting interview...');
      console.log('🎬 Starting interview:', this.state);

      // Request camera/microphone
      this.media.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });

      // Setup video element
      this.dom.userCamera.srcObject = this.media.stream;
      this.dom.cameraStatus.textContent = 'Camera On';

      // Initialize MediaRecorder
      this.media.recorder = new MediaRecorder(this.media.stream);
      this.media.recorder.ondataavailable = (e) => {
        this.media.audioChunks.push(e.data);
      };

      // Initialize interview
      this.state.interviewStarted = true;
      this.state.interviewStartTime = Date.now();
      this.interview.startTime = new Date();

      // Fetch questions from backend
      await this.fetchQuestions();

      // Transition to interview screen
      this.transitionScreen('interview');
      this.showLoading(false);

      // Start timer
      this.startTimer();

      // Load and play first question
      await this.loadQuestion(0);

    } catch (error) {
      this.showLoading(false);
      this.showError('Interview Start Error', error.message);
      console.error('Interview start error:', error);
    }
  }

  async fetchQuestions() {
    try {
      console.log('📝 Fetching interview questions...');
      
      const response = await fetch(`${this.config.apiBaseUrl}/interview/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: this.state.interviewType,
          count: this.state.totalQuestions,
          role: this.state.jobRole
        })
      });

      if (!response.ok) throw new Error('Failed to fetch questions');

      const data = await response.json();
      this.interview.questions = data.questions;
      this.dom.totalQuestions.textContent = this.interview.questions.length;
      
      console.log('✅ Questions loaded:', this.interview.questions.length);
    } catch (error) {
      console.error('Error fetching questions:', error);
      // Fallback: use mock questions
      this.interview.questions = this.getMockQuestions();
    }
  }

  getMockQuestions() {
    const questions = {
      hr: [
        "Tell me about yourself and your professional background.",
        "What are your greatest strengths?",
        "Why are you interested in this position?",
        "Where do you see yourself in 5 years?",
        "How do you handle stress and pressure at work?"
      ],
      technical: [
        "Explain the difference between SQL and NoSQL databases.",
        "What is object-oriented programming?",
        "How would you optimize a slow database query?",
        "What is the difference between asynchronous and synchronous programming?",
        "Describe the software development lifecycle you follow."
      ],
      behavioral: [
        "Tell me about a time you failed and what you learned.",
        "Describe a situation where you had to work with a difficult team member.",
        "Give an example of when you showed leadership.",
        "How do you handle conflict with colleagues?",
        "Tell me about your proudest professional achievement."
      ],
      'role-based': [
        "What specific experience do you have for this role?",
        "How would you approach your first 30 days in this position?",
        "What are your thoughts on our company's current market position?",
        "How would you contribute to our team's goals?",
        "What questions do you have about this role and company?"
      ]
    };
    return questions[this.state.interviewType] || questions.hr;
  }

  // ============================================
  // INTERVIEW FLOW
  // ============================================

  async loadQuestion(index) {
    try {
      this.state.currentQuestionIndex = index;
      this.dom.currentQuestion.textContent = index + 1;

      if (index >= this.interview.questions.length) {
        this.completeInterview();
        return;
      }

      const question = this.interview.questions[index];
      this.dom.questionText.textContent = question;

      // Add to transcript
      this.addTranscriptItem('Avatar', question, 'avatar-message');

      // Generate and play avatar video
      await this.generateAvatarResponse(question);

      // Enable recording
      this.updateUIForListening();

    } catch (error) {
      console.error('Error loading question:', error);
      this.showError('Question Load Error', error.message);
    }
  }

  async generateAvatarResponse(text) {
    try {
      this.updateAvatarStatus('generating');
      console.log('🎥 Generating avatar video for question...');

      const response = await fetch(`${this.config.apiBaseUrl}/avatar/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          style: this.state.avatarStyle,
          voiceType: this.state.avatarStyle
        })
      });

      if (!response.ok) throw new Error('Failed to generate avatar video');

      const data = await response.json();
      
      // Play avatar video
      this.dom.avatarVideo.src = data.videoUrl;
      this.dom.avatarPlaceholder.style.display = 'none';
      this.dom.avatarVideo.play();
      
      this.updateAvatarStatus('speaking');
      console.log('✅ Avatar video playing');

    } catch (error) {
      console.error('Avatar generation error:', error);
      this.updateAvatarStatus('ready');
      this.showNotification('Using fallback: Avatar generation unavailable');
    }
  }

  async startRecording() {
    try {
      if (!this.media.recorder) {
        throw new Error('Recorder not initialized');
      }

      console.log('🎙️  Starting to record answer...');

      this.media.audioChunks = [];
      this.media.isRecording = true;
      this.media.recordingStartTime = Date.now();

      this.media.recorder.start();

      // Update UI
      this.dom.startRecordingBtn.style.display = 'none';
      this.dom.stopRecordingBtn.style.display = 'flex';
      this.dom.recordingBadge.style.display = 'flex';
      this.updateInterviewStatus('Recording...', 'status-recording');
      this.state.isAnswering = true;

      // Start recording timer
      this.startRecordingTimer();

      // Auto-stop after max time
      setTimeout(() => {
        if (this.media.isRecording) {
          console.log('⏱️  Max recording time reached');
          this.stopRecording();
        }
      }, this.config.maxRecordingTime);

    } catch (error) {
      console.error('Recording error:', error);
      this.showError('Recording Error', error.message);
    }
  }

  async stopRecording() {
    try {
      if (!this.media.isRecording) return;

      console.log('⏹️  Stopping recording...');

      this.media.isRecording = false;
      this.media.recorder.stop();

      // Update UI
      this.dom.startRecordingBtn.style.display = 'flex';
      this.dom.stopRecordingBtn.style.display = 'none';
      this.dom.recordingBadge.style.display = 'none';

      // Wait for recorder to finish
      await new Promise(resolve => {
        const checkRecorder = setInterval(() => {
          if (this.media.audioChunks.length > 0) {
            clearInterval(checkRecorder);
            resolve();
          }
        }, 100);
      });

      // Process audio
      await this.processAudio();

    } catch (error) {
      console.error('Stop recording error:', error);
      this.showError('Recording Stop Error', error.message);
    }
  }

  async processAudio() {
    try {
      this.state.isProcessing = true;
      this.updateInterviewStatus('Processing...', 'status-processing');
      console.log('📊 Processing user audio...');

      // Create audio blob
      const audioBlob = new Blob(this.media.audioChunks, { type: 'audio/webm' });
      
      // Transcribe using Whisper
      const transcription = await this.transcribeAudio(audioBlob);
      console.log('📝 Transcription:', transcription);

      // Add to transcript
      this.addTranscriptItem('You', transcription, 'user-message');
      this.interview.answers.push(transcription);

      // Score the answer
      const score = await this.scoreAnswer(transcription);
      console.log('⭐ Score:', score);

      // Show feedback
      this.showFeedback(score);

      // Load next question
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait before next question
      await this.loadQuestion(this.state.currentQuestionIndex + 1);

    } catch (error) {
      console.error('Audio processing error:', error);
      this.showError('Processing Error', error.message);
    } finally {
      this.state.isProcessing = false;
    }
  }

  async transcribeAudio(audioBlob) {
    try {
      console.log('🔊 Transcribing audio with Whisper...');

      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');

      const response = await fetch(`${this.config.apiBaseUrl}/audio/transcribe`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();
      return data.text || 'Unable to transcribe';

    } catch (error) {
      console.error('Transcription error:', error);
      return '[Speech not recognized]';
    }
  }

  async scoreAnswer(answer) {
    try {
      console.log('🏆 Scoring answer...');

      const response = await fetch(`${this.config.apiBaseUrl}/interview/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: this.interview.questions[this.state.currentQuestionIndex],
          answer: answer,
          type: this.state.interviewType,
          questionIndex: this.state.currentQuestionIndex
        })
      });

      if (!response.ok) throw new Error('Scoring failed');

      const score = await response.json();
      this.interview.scores.push(score);
      return score;

    } catch (error) {
      console.error('Scoring error:', error);
      // Return default score
      return {
        overall: 75,
        clarity: 75,
        completeness: 75,
        confidence: 75,
        feedback: 'Good effort!'
      };
    }
  }

  showFeedback(score) {
    this.dom.feedbackArea.style.display = 'flex';
    this.dom.currentScore.textContent = Math.round(score.overall || 75);
    this.dom.clarityScore.textContent = `${Math.round(score.clarity || 75)}/100`;
    this.dom.completenessScore.textContent = `${Math.round(score.completeness || 75)}/100`;
    this.dom.confidenceScore.textContent = `${Math.round(score.confidence || 75)}/100`;
    this.dom.feedbackMessage.textContent = score.feedback || 'Good response!';

    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.dom.feedbackArea.style.display = 'none';
    }, 3000);
  }

  skipQuestion() {
    console.log('⏭️  Skipping question');
    this.interview.answers.push('(Skipped)');
    this.interview.scores.push({ overall: 0, clarity: 0, completeness: 0, confidence: 0 });
    this.loadQuestion(this.state.currentQuestionIndex + 1);
  }

  repeatQuestion() {
    console.log('🔄 Repeating question');
    const question = this.interview.questions[this.state.currentQuestionIndex];
    this.generateAvatarResponse(question);
  }

  endInterview() {
    if (confirm('Are you sure you want to end the interview?')) {
      this.completeInterview();
    }
  }

  async completeInterview() {
    try {
      console.log('✨ Completing interview...');
      this.state.interviewStarted = false;
      this.interview.endTime = new Date();

      // Stop media
      if (this.media.stream) {
        this.media.stream.getTracks().forEach(track => track.stop());
      }

      // Calculate final scores
      await this.calculateFinalScores();

      // Display results
      this.transitionScreen('results');

    } catch (error) {
      console.error('Completion error:', error);
      this.showError('Completion Error', error.message);
    }
  }

  async calculateFinalScores() {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/interview/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scores: this.interview.scores,
          type: this.state.interviewType,
          duration: (this.interview.endTime - this.interview.startTime) / 1000
        })
      });

      if (response.ok) {
        const results = await response.json();
        this.displayResults(results);
      }

    } catch (error) {
      console.error('Results calculation error:', error);
      this.displayLocalResults();
    }
  }

  displayResults(results) {
    const overallScore = results.overall || this.calculateAverageScore();
    this.dom.overallScore.textContent = Math.round(overallScore);
    
    // Interpretation
    let interpretation = 'Excellent Performance!';
    if (overallScore >= 80) interpretation = 'Excellent Performance!';
    else if (overallScore >= 70) interpretation = 'Good Performance';
    else if (overallScore >= 60) interpretation = 'Satisfactory Performance';
    else interpretation = 'Needs Improvement';
    
    this.dom.scoreInterpretation.textContent = interpretation;

    // Breakdown
    const scores = results.breakdown || {
      communication: overallScore,
      clarity: overallScore,
      confidence: overallScore,
      technical: overallScore
    };

    this.updateScoreBar('communicationBar', scores.communication);
    this.updateScoreBar('clarityBar', scores.clarity);
    this.updateScoreBar('confidenceBar', scores.confidence);
    this.updateScoreBar('technicalBar', scores.technical);

    this.dom.communicationScore.textContent = `${Math.round(scores.communication)}/100`;
    this.dom.clarityScoreDisplay.textContent = `${Math.round(scores.clarity)}/100`;
    this.dom.confidenceScoreDisplay.textContent = `${Math.round(scores.confidence)}/100`;
    this.dom.technicalScore.textContent = `${Math.round(scores.technical)}/100`;

    // Display answers
    this.displayAnswers();
  }

  displayLocalResults() {
    const averageScore = this.calculateAverageScore();
    this.dom.overallScore.textContent = Math.round(averageScore);
    this.dom.scoreInterpretation.textContent = 'Interview Complete';

    this.updateScoreBar('communicationBar', averageScore);
    this.updateScoreBar('clarityBar', averageScore);
    this.updateScoreBar('confidenceBar', averageScore);
    this.updateScoreBar('technicalBar', averageScore);

    this.displayAnswers();
  }

  displayAnswers() {
    this.dom.answersContainer.innerHTML = '';
    
    this.interview.questions.forEach((question, index) => {
      const answer = this.interview.answers[index] || '(No answer)';
      const score = this.interview.scores[index] || { overall: 0 };

      const card = document.createElement('div');
      card.className = 'answer-card';
      card.innerHTML = `
        <div class="answer-question">Question ${index + 1}</div>
        <div class="answer-text"><strong>${question}</strong></div>
        <div class="answer-text">Your Answer: ${answer}</div>
        <div class="answer-score">
          <span>Score:</span>
          <span class="score-badge">${Math.round(score.overall || 0)}/100</span>
        </div>
      `;
      this.dom.answersContainer.appendChild(card);
    });
  }

  calculateAverageScore() {
    if (this.interview.scores.length === 0) return 0;
    const total = this.interview.scores.reduce((sum, score) => sum + (score.overall || 0), 0);
    return total / this.interview.scores.length;
  }

  updateScoreBar(elementId, score) {
    const element = document.getElementById(elementId);
    if (element) {
      const percentage = (score / 100) * 100;
      element.style.width = percentage + '%';
    }
  }

  downloadReport() {
    const report = {
      type: this.state.interviewType,
      role: this.state.jobRole,
      date: new Date().toISOString(),
      duration: ((this.interview.endTime - this.interview.startTime) / 1000 / 60).toFixed(2) + ' minutes',
      overallScore: Math.round(this.dom.overallScore.textContent),
      questions: this.interview.questions,
      answers: this.interview.answers,
      scores: this.interview.scores
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

  // ============================================
  // UI UTILITIES
  // ============================================

  transitionScreen(screenName) {
    document.querySelectorAll('.screen-section').forEach(el => {
      el.classList.remove('screen-active');
    });
    
    const screen = document.getElementById(screenName + 'Screen');
    if (screen) screen.classList.add('screen-active');
    
    this.state.currentScreen = screenName;
    console.log('📺 Transitioned to:', screenName);
  }

  updateAvatarStatus(status) {
    const statusMap = {
      'ready': 'Ready',
      'generating': 'Generating...',
      'speaking': 'Speaking',
      'listening': 'Listening...',
      'processing': 'Processing...'
    };
    
    this.dom.avatarStatusText.textContent = statusMap[status] || status;
    this.dom.avatarStatusText.className = `status-badge ${status}`;
  }

  updateInterviewStatus(text, className = '') {
    this.dom.interviewStatus.textContent = text;
    this.dom.interviewStatus.className = 'value ' + className;
  }

  updateUIForListening() {
    this.updateInterviewStatus('Ready to answer', 'status-ready');
    this.dom.startRecordingBtn.style.display = 'flex';
    this.dom.stopRecordingBtn.style.display = 'none';
    this.state.isAnswering = false;
  }

  addTranscriptItem(speaker, text, className) {
    const item = document.createElement('div');
    item.className = `transcript-item ${className}`;
    item.innerHTML = `
      <span class="speaker">${speaker}:</span>
      <span class="text">${this.escapeHtml(text)}</span>
    `;
    this.dom.transcriptBox.appendChild(item);
    this.dom.transcriptBox.scrollTop = this.dom.transcriptBox.scrollHeight;
  }

  clearTranscript() {
    this.dom.transcriptBox.innerHTML = '';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showLoading(show, text = 'Loading...') {
    if (show) {
      this.dom.loadingText.textContent = text;
      this.dom.loadingOverlay.style.display = 'flex';
    } else {
      this.dom.loadingOverlay.style.display = 'none';
    }
  }

  showError(title, message) {
    this.dom.errorMessage.textContent = message;
    const header = this.dom.errorModal.querySelector('.modal-header h2');
    if (header) header.textContent = title;
    this.dom.errorModal.style.display = 'flex';
  }

  closeErrorModal() {
    this.dom.errorModal.style.display = 'none';
  }

  showNotification(message) {
    console.log('ℹ️ ', message);
    // Could implement toast notification here
  }

  startTimer() {
    setInterval(() => {
      this.state.elapsedSeconds++;
      const minutes = Math.floor(this.state.elapsedSeconds / 60);
      const seconds = this.state.elapsedSeconds % 60;
      this.dom.interviewTimer.textContent = 
        `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  startRecordingTimer() {
    const timerInterval = setInterval(() => {
      if (!this.media.isRecording) {
        clearInterval(timerInterval);
        return;
      }
      
      const elapsed = Math.floor((Date.now() - this.media.recordingStartTime) / 1000);
      const secs = elapsed % 60;
      this.dom.recordingTime.textContent = `0:${secs.toString().padStart(2, '0')}`;
    }, 100);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🌐 Page loaded, initializing Avatar Interview Engine...');
  window.interviewEngine = new AvatarInterviewEngine();
});
