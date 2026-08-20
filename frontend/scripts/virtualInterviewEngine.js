// ========== PROFESSIONAL VIRTUAL INTERVIEW ENGINE ==========
// Frontend logic with clean, professional UI and full functionality preservation
// Now includes interviewer selection feature

class VirtualInterviewEngine {
  constructor() {
    this.state = {
      currentScreen: 'setup',
      interviewId: null,
      interviewType: null,
      questionCount: 10,
      currentQuestionNumber: 0,
      questions: [],
      currentQuestion: null,
      answers: [],
      scores: {
        overall: 0,
        communication: 0,
        confidence: 0,
        technical: 0,
        clarity: 0,
        relevance: 0
      },
      recording: false,
      startTime: null,
      totalDuration: 0,
      userId: this.getUserId(),
      interviewerStatus: 'Ready',
      selectedInterviewer: null  // NEW: Store selected interviewer
    };

    this.mediaStream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.recognitionActive = false;
    this.currentAnswer = '';
    this.answerStartTime = null;
    this.timerInterval = null;
    this.interviewStartTime = null;

    // Initialize
    this.initializeElements();
    this.attachEventListeners();
    this.loadUserData();
  }

  // ========== INITIALIZATION ==========

  initializeElements() {
    // Screens
    this.setupScreen = document.getElementById('setupScreen');
    this.interviewerSelectionScreen = document.getElementById('interviewerSelectionScreen');
    this.interviewScreen = document.getElementById('interviewScreen');
    this.resultsScreen = document.getElementById('resultsScreen');

    // Setup Elements
    this.interviewTypeSelect = document.getElementById('interviewType');
    this.questionCountInput = document.getElementById('questionCount');
    this.questionCountDisplay = document.getElementById('questionCountDisplay');
    this.durationEstimate = document.getElementById('durationEstimate');
    this.startInterviewBtn = document.getElementById('startInterviewBtn');

    // Interviewer Selection Elements (NEW)
    this.interviewerCards = document.querySelectorAll('.interviewer-card');
    this.interviewerRadios = document.querySelectorAll('.interviewer-radio');
    this.continueInterviewBtn = document.getElementById('continueInterviewBtn');

    // Instructions Modal
    this.instructionsModal = document.getElementById('instructionsModal');
    this.beginNowBtn = document.getElementById('beginNowBtn');

    // Interview Screen
    this.userCamera = document.getElementById('userCamera');
    this.questionText = document.getElementById('questionText');
    this.currentQuestionNum = document.getElementById('currentQuestionNum');
    this.totalQuestionsNum = document.getElementById('totalQuestionsNum');
    this.interviewerStatus = document.getElementById('interviewerStatus');
    this.recordingIndicator = document.getElementById('recordingIndicator');
    this.userTimer = document.getElementById('userTimer');
    this.stopRecordingBtn = document.getElementById('stopRecordingBtn');
    this.skipQuestionBtn = document.getElementById('skipQuestionBtn');
    this.endInterviewBtn = document.getElementById('endInterviewBtn');
    this.processingMessage = document.getElementById('processingMessage');
    this.feedbackToast = document.getElementById('feedbackToast');
    this.feedbackScore = document.getElementById('feedbackScore');
    this.feedbackText = document.getElementById('feedbackText');
    this.visualizerContainer = document.getElementById('visualizerContainer');
    this.interviewerImageDisplay = document.getElementById('interviewerImageDisplay');
    this.interviewerLabel = document.getElementById('interviewerLabel');

    // Results Screen
    this.overallScore = document.getElementById('overallScore');
    this.communicationScoreFill = document.getElementById('communicationScoreFill');
    this.confidenceScoreFill = document.getElementById('confidenceScoreFill');
    this.technicalScoreFill = document.getElementById('technicalScoreFill');
    this.communicationScoreValue = document.getElementById('communicationScoreValue');
    this.confidenceScoreValue = document.getElementById('confidenceScoreValue');
    this.technicalScoreValue = document.getElementById('technicalScoreValue');
    this.feedbackSummary = document.getElementById('feedbackSummary');
    this.recommendationsList = document.getElementById('recommendationsList');
    this.downloadReportBtn = document.getElementById('downloadReportBtn');
    this.retryInterviewBtn = document.getElementById('retryInterviewBtn');
  }

  attachEventListeners() {
    this.questionCountInput.addEventListener('change', () => this.updateDurationEstimate());
    this.questionCountInput.addEventListener('input', () => this.updateDurationEstimate());
    this.startInterviewBtn.addEventListener('click', () => this.handleStartInterview());
    
    // Interviewer Selection Event Listeners (NEW)
    this.interviewerCards.forEach(card => {
      card.addEventListener('click', (e) => this.handleInterviewerCardClick(e));
    });
    this.continueInterviewBtn.addEventListener('click', () => this.handleContinueInterview());
    
    this.beginNowBtn.addEventListener('click', () => this.handleBeginNow());
    this.stopRecordingBtn.addEventListener('click', () => this.handleStopRecording());
    this.skipQuestionBtn.addEventListener('click', () => this.handleSkipQuestion());
    this.endInterviewBtn.addEventListener('click', () => this.endInterview());
    this.downloadReportBtn.addEventListener('click', () => this.downloadReport());
    this.retryInterviewBtn.addEventListener('click', () => this.handleRetryInterview());
  }

  loadUserData() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      this.state.userId = user.id || null;
    } catch (e) {
      console.log('No user data found');
    }
  }

  getUserId() {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id || 'guest_' + Date.now();
    } catch {
      return 'guest_' + Date.now();
    }
  }

  // ========== UI STATE MANAGEMENT ==========

  showScreen(screenName) {
    // Hide all screens
    this.setupScreen.style.display = 'none';
    this.interviewerSelectionScreen.style.display = 'none';
    this.interviewScreen.style.display = 'none';
    this.resultsScreen.style.display = 'none';

    // Remove active class
    this.setupScreen.classList.remove('screen-active');
    this.interviewerSelectionScreen.classList.remove('screen-active');
    this.interviewScreen.classList.remove('screen-active');
    this.resultsScreen.classList.remove('screen-active');

    // Show requested screen
    switch (screenName) {
      case 'setup':
        this.setupScreen.style.display = 'block';
        this.setupScreen.classList.add('screen-active');
        break;
      case 'interviewerSelection':
        this.interviewerSelectionScreen.style.display = 'block';
        this.interviewerSelectionScreen.classList.add('screen-active');
        break;
      case 'interview':
        this.interviewScreen.style.display = 'block';
        this.interviewScreen.classList.add('screen-active');
        break;
      case 'results':
        this.resultsScreen.style.display = 'block';
        this.resultsScreen.classList.add('screen-active');
        break;
    }
    this.state.currentScreen = screenName;
  }

  updateDurationEstimate() {
    const count = parseInt(this.questionCountInput.value) || 10;
    this.questionCountDisplay.textContent = count;
    const minutes = Math.ceil((count * 1.5) / 1);
    this.durationEstimate.textContent = `~${minutes} minutes`;
    this.state.questionCount = count;
  }

  updateInterviewerStatus(status) {
    this.state.interviewerStatus = status;
    this.interviewerStatus.textContent = status;
  }

  // ========== INTERVIEWER SELECTION (NEW) ==========

  handleInterviewerCardClick(event) {
    // Find the card element
    const card = event.currentTarget;
    const interviewerValue = card.getAttribute('data-interviewer');

    // Remove selected class from all cards
    this.interviewerCards.forEach(c => {
      c.classList.remove('selected');
      const radio = c.querySelector('.interviewer-radio');
      radio.checked = false;
    });

    // Add selected class to clicked card
    card.classList.add('selected');
    const radio = card.querySelector('.interviewer-radio');
    radio.checked = true;

    // Store selection
    this.state.selectedInterviewer = interviewerValue;
  }

  handleContinueInterview() {
    // Validate selection
    if (!this.state.selectedInterviewer) {
      alert('Please select an interviewer to continue');
      return;
    }

    // If random, assign one now
    if (this.state.selectedInterviewer === 'random') {
      this.state.selectedInterviewer = Math.random() > 0.5 ? 'male' : 'female';
      console.log('✓ Randomly assigned interviewer:', this.state.selectedInterviewer);
    }

    console.log('✓ Selected interviewer:', this.state.selectedInterviewer);

    // Load interviewer image and show instructions
    this.loadInterviewerImage();
    
    // Show instructions modal
    const modal = new bootstrap.Modal(this.instructionsModal);
    modal.show();
  }

  loadInterviewerImage() {

    if (!this.interviewerImageDisplay) {
        console.error("Interviewer image display container not found");
        return;
    }

    let videoFile = "Videos/female.mp4";

    if (this.state.selectedInterviewer === "male") {
        videoFile = "Videos/male.mp4";
    }

    if (this.state.selectedInterviewer === "female") {
        videoFile = "Videos/female.mp4";
    }

    if (this.state.selectedInterviewer === "random") {
        videoFile =
            Math.random() > 0.5
                ? "Videos/male.mp4"
                : "Videos/female.mp4";
    }

    this.interviewerImageDisplay.innerHTML = `
        <video
            id="aiInterviewer"
            autoplay
            loop
            muted
            playsinline
            style="width:100%;height:100%;border-radius:12px;object-fit:cover;"
        >
            <source src="${videoFile}" type="video/mp4">
        </video>
    `;

    if (this.interviewerLabel) {

        const genderLabel =
            this.state.selectedInterviewer === "male"
                ? "Male"
                : "Female";

        this.interviewerLabel.textContent =
            "Interviewer - " + genderLabel;

    }

  }

  // ========== SETUP & PERMISSIONS ==========

  handleStartInterview() {
    const interviewType = this.interviewTypeSelect.value;

    if (!interviewType) {
      alert('Please select an interview type');
      return;
    }

    this.state.interviewType = interviewType;
    this.state.questionCount = parseInt(this.questionCountInput.value) || 10;

    // Show interviewer selection screen
    this.showScreen('interviewerSelection');
  }

  handleBeginNow() {
    this.requestCameraPermission();
  }

  async requestCameraPermission() {
    try {
      this.updateInterviewerStatus('Requesting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      this.mediaStream = stream;
      this.userCamera.srcObject = stream;
      console.log('✓ Camera permission granted');
      
      this.requestMicrophonePermission();
    } catch (error) {
      console.error('Camera permission denied:', error);
      this.updateInterviewerStatus('Camera denied');
      alert('Please allow camera access to continue');
    }
  }

  async requestMicrophonePermission() {
    try {
      this.updateInterviewerStatus('Requesting microphone...');
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false
      });
      stream.getTracks().forEach(track => track.stop());
      console.log('✓ Microphone permission granted');
      
      // Hide modal and start interview
      bootstrap.Modal.getInstance(this.instructionsModal).hide();
      this.startInterview();
    } catch (error) {
      console.error('Microphone permission denied:', error);
      this.updateInterviewerStatus('Microphone denied');
      alert('Please allow microphone access to continue');
    }
  }

  // ========== INTERVIEW FLOW ==========

  async startInterview() {
    try {
      this.updateInterviewerStatus('Initializing interview...');
      this.showScreen('interview');
      this.interviewStartTime = Date.now();

      // Initialize speech recognition
      this.initializeSpeechRecognition();

      // Start timer
      this.startInterviewTimer();

      // Call backend to start interview
      const response = await fetch(`${window.API_BASE || 'http://127.0.0.1:3000'}/api/virtual-interviews/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: this.state.userId,
          interviewType: this.state.interviewType,
          questionCount: this.state.questionCount,
          selectedInterviewer: this.state.selectedInterviewer  // NEW: Send selected interviewer
        })
      });

      if (!response.ok) throw new Error('Failed to start interview');

      const data = await response.json();
      this.state.interviewId = data.interviewId;
      this.state.currentQuestionNumber = 1;

      this.totalQuestionsNum.textContent = data.totalQuestions;
      this.currentQuestionNum.textContent = '1';

      // Load first question
      this.loadQuestion(data.question, 1, data.totalQuestions);
      this.updateInterviewerStatus('Ready');
    } catch (error) {
      console.error('[Interview Start Error]:', error);
      this.updateInterviewerStatus('Error');
      alert('Failed to start interview. Please try again.');
      this.showScreen('setup');
    }
  }

  loadQuestion(question, questionNum, totalQuestions) {
    this.state.currentQuestion = question;
    this.state.currentQuestionNumber = questionNum;

    // Update display
    this.currentQuestionNum.textContent = questionNum;
    this.totalQuestionsNum.textContent = totalQuestions;
    this.questionText.textContent = question;

    // Show visualizer
    this.visualizerContainer.style.display = 'flex';
    this.updateInterviewerStatus('Listening...');

    // Speak the question
    this.speakQuestion(question);

    // After brief delay, start listening for answer
    setTimeout(() => {
      this.startRecordingAnswer();
    }, 1000);
  }

  speakQuestion(question) {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        this.updateInterviewerStatus('Listening...');
      };

      speechSynthesis.speak(utterance);
    }
  }

  startRecordingAnswer() {
    this.state.recording = true;
    this.recordingIndicator.style.display = 'flex';
    this.stopRecordingBtn.style.display = 'inline-block';
    this.answerStartTime = Date.now();
    this.currentAnswer = '';

    this.updateInterviewerStatus('Listening...');

    // Start speech recognition
    this.initializeSpeechRecognition();
    if (this.recognition) {
      this.recognitionActive = true;
      this.recognition.start();
    }
  }

  initializeSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.language = 'en-US';

    this.recognition.onstart = () => {
      this.recognitionActive = true;
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          this.currentAnswer += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
    };

    this.recognition.onerror = (event) => {
      console.log('Speech recognition error:', event.error);
      if (this.state.recording) {
        this.recognitionActive = false;
      }
    };

    this.recognition.onend = () => {
      this.recognitionActive = false;
    };
  }

  handleStopRecording() {
    if (!this.state.recording) return;

    this.state.recording = false;
    this.recordingIndicator.style.display = 'none';
    this.stopRecordingBtn.style.display = 'none';

    // Stop speech recognition
    if (this.recognition && this.recognitionActive) {
      this.recognition.stop();
      this.recognitionActive = false;
    }

    // Stop any speech synthesis
    speechSynthesis.cancel();

    const answerDuration = Math.floor((Date.now() - this.answerStartTime) / 1000);

    if (!this.currentAnswer.trim()) {
      alert('Please say something before submitting');
      this.startRecordingAnswer();
      return;
    }

    this.submitAnswer(
      this.state.currentQuestionNumber,
      this.state.currentQuestion,
      this.currentAnswer.trim(),
      answerDuration
    );
  }

  async submitAnswer(questionNum, question, answer, duration) {
    try {
      this.updateInterviewerStatus('Processing...');
      this.visualizerContainer.style.display = 'none';
      this.processingMessage.style.display = 'flex';

      const response = await fetch(
        `${window.API_BASE || 'http://127.0.0.1:3000'}/api/virtual-interviews/${this.state.interviewId}/submit-answer`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            questionNumber: questionNum,
            question: question,
            answer: answer,
            answerDuration: duration
          })
        }
      );

      if (!response.ok) throw new Error('Failed to submit answer');

      const data = await response.json();

      // Show feedback
      this.showFeedback(data.feedback);

      // Store scores
      if (data.updatedScores) {
        this.state.scores = data.updatedScores;
      }

      this.processingMessage.style.display = 'none';

      // Load next question or finish
      if (data.isComplete) {
        this.completeInterview();
      } else {
        // Delay before loading next question
        setTimeout(() => {
          this.loadQuestion(data.nextQuestion, questionNum + 1, data.totalQuestions);
        }, 2000);
      }
    } catch (error) {
      console.error('[Submit Answer Error]:', error);
      this.processingMessage.style.display = 'none';
      this.updateInterviewerStatus('Error');
      alert('Failed to process answer. Please try again.');
    }
  }

  showFeedback(feedback) {
    this.feedbackScore.textContent = `Score: ${feedback.score}/100`;
    this.feedbackText.textContent = feedback.text;
    this.feedbackToast.style.display = 'block';

    // Auto-hide after 4 seconds
    setTimeout(() => {
      this.feedbackToast.style.display = 'none';
    }, 4000);
  }

  handleSkipQuestion() {
    if (!this.state.recording) {
      // Skip not available
      alert('Please answer the question first');
      return;
    }

    // Stop recording
    if (this.recognition && this.recognitionActive) {
      this.recognition.stop();
      this.recognitionActive = false;
    }

    this.skipQuestion();
  }

  async skipQuestion() {
    try {
      this.updateInterviewerStatus('Skipping...');
      this.visualizerContainer.style.display = 'none';
      this.recordingIndicator.style.display = 'none';
      this.stopRecordingBtn.style.display = 'none';
      this.state.recording = false;

      const response = await fetch(
        `${window.API_BASE || 'http://127.0.0.1:3000'}/api/virtual-interviews/${this.state.interviewId}/skip-question`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionNumber: this.state.currentQuestionNumber })
        }
      );

      if (!response.ok) throw new Error('Failed to skip question');

      const data = await response.json();

      if (data.isComplete) {
        this.completeInterview();
      } else {
        setTimeout(() => {
          this.loadQuestion(data.nextQuestion, this.state.currentQuestionNumber + 1, data.totalQuestions);
        }, 1000);
      }
    } catch (error) {
      console.error('[Skip Error]:', error);
      this.updateInterviewerStatus('Error');
    }
  }

  // ========== INTERVIEW COMPLETION ==========

  async completeInterview() {
    try {
      this.updateInterviewerStatus('Completing...');
      clearInterval(this.timerInterval);

      const totalDuration = Math.floor((Date.now() - this.interviewStartTime) / 1000);

      const response = await fetch(
        `${window.API_BASE || 'http://127.0.0.1:3000'}/api/virtual-interviews/${this.state.interviewId}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            duration: totalDuration,
            selectedInterviewer: this.state.selectedInterviewer  // NEW: Send selected interviewer
          })
        }
      );

      if (!response.ok) throw new Error('Failed to complete interview');

      const data = await response.json();

      // Update state with final scores
      this.state.scores = data.scores;

      this.displayResults(data);
    } catch (error) {
      console.error('[Complete Error]:', error);
      this.updateInterviewerStatus('Error');
    }
  }

  endInterview() {
    if (confirm('Are you sure you want to end the interview?')) {
      if (this.recognition && this.recognitionActive) {
        this.recognition.stop();
      }
      clearInterval(this.timerInterval);
      this.completeInterview();
    }
  }

  // ========== RESULTS ==========

  displayResults(data) {
    const scores = data.scores;

    // Animate overall score
    this.animateNumber(this.overallScore, scores.overall || 0, 500);

    // Animate breakdown scores
    this.animateScoreFill(this.communicationScoreFill, scores.communication || 0);
    this.animateScoreFill(this.confidenceScoreFill, scores.confidence || 0);
    this.animateScoreFill(this.technicalScoreFill, scores.technical || 0);

    this.communicationScoreValue.textContent = Math.round(scores.communication || 0);
    this.confidenceScoreValue.textContent = Math.round(scores.confidence || 0);
    this.technicalScoreValue.textContent = Math.round(scores.technical || 0);

    // Feedback
    if (data.feedback) {
      this.feedbackSummary.innerHTML = `
        <p><strong>Strengths:</strong> ${(data.feedback.strengths || []).join(', ') || 'Continue practicing'}</p>
        <p><strong>Areas to Improve:</strong> ${(data.feedback.improvements || []).join(', ') || 'Good performance'}</p>
      `;

      if (data.feedback.recommendations && data.feedback.recommendations.length > 0) {
        this.recommendationsList.innerHTML = data.feedback.recommendations
          .slice(0, 5)
          .map(rec => `<li>${rec}</li>`)
          .join('');
      }
    }

    // Show results screen
    this.showScreen('results');
    this.updateInterviewerStatus('Interview Complete');
  }

  animateNumber(element, target, duration = 1000) {
    let current = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = Math.round(target);
        clearInterval(timer);
      } else {
        element.textContent = Math.round(current);
      }
    }, 16);
  }

  animateScoreFill(element, target) {
    element.style.animation = 'none';
    setTimeout(() => {
      element.style.width = target + '%';
      element.style.animation = `scoreAnimation 0.8s ease-out forwards`;
    }, 10);
  }

  async downloadReport() {
    try {
      window.location.href = `${window.API_BASE || 'http://127.0.0.1:3000'}/api/virtual-interviews/${this.state.interviewId}/download-report`;
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download report');
    }
  }

  handleRetryInterview() {
    this.resetState();
    this.showScreen('setup');
  }

  resetState() {
    this.state = {
      ...this.state,
      currentScreen: 'setup',
      interviewId: null,
      interviewType: null,
      questionCount: 10,
      currentQuestionNumber: 0,
      questions: [],
      currentQuestion: null,
      answers: [],
      scores: {
        overall: 0,
        communication: 0,
        confidence: 0,
        technical: 0,
        clarity: 0,
        relevance: 0
      },
      recording: false,
      startTime: null,
      selectedInterviewer: null  // NEW: Reset selected interviewer
    };

    this.currentAnswer = '';
    this.feedbackToast.style.display = 'none';
    this.recordingIndicator.style.display = 'none';
    this.stopRecordingBtn.style.display = 'none';
    this.userTimer.textContent = '0:00';

    // Clear interviewer selection cards
    this.interviewerCards.forEach(c => {
      c.classList.remove('selected');
      const radio = c.querySelector('.interviewer-radio');
      radio.checked = false;
    });

    if (this.recognition && this.recognitionActive) {
      this.recognition.stop();
    }
    clearInterval(this.timerInterval);
  }

  // ========== UTILITIES ==========

  startInterviewTimer() {
    let seconds = 0;
    this.timerInterval = setInterval(() => {
      seconds++;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      this.userTimer.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.virtualInterview = new VirtualInterviewEngine();
  });
} else {
  window.virtualInterview = new VirtualInterviewEngine();
}
