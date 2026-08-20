/* ============================================
   PROFESSIONAL INTERVIEW ENGINE
   ============================================ */

class InterviewEngine {
  constructor() {
    // Interview Configuration
    this.interviewType = null;
    this.totalQuestions = 10;
    this.currentQuestion = 0;
    this.selectedInterviewer = null;
    this.selectedPersonality = null;
    this.isRecording = false;
    this.userResponses = [];
    this.startTime = null;
    
    // Audio Configuration
    this.audioContext = null;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    // Voice cache
    this.availableVoices = [];

    speechSynthesis.onvoiceschanged = () => {

        this.availableVoices = speechSynthesis.getVoices();

        console.log("Voices Loaded:");
        console.table(
            this.availableVoices.map(v => ({
                name: v.name,
                lang: v.lang
            }))
        );

    };
    
    // Screen References
    this.screens = {
      setup: document.getElementById('setupScreen'),
      selection: document.getElementById('interviewerSelectionScreen'),
      interview: document.getElementById('interviewScreen'),
      results: document.getElementById('resultsScreen')
    };
    
    // Button References
    this.buttons = {
      startInterview: document.getElementById('startInterviewBtn'),
      continueInterview: document.getElementById('continueInterviewBtn'),
      stopRecording: document.getElementById('stopRecordingBtn'),
      skipQuestion: document.getElementById('skipQuestionBtn'),
      endInterview: document.getElementById('endInterviewBtn'),
      downloadReport: document.getElementById('downloadReportBtn'),
      retryInterview: document.getElementById('retryInterviewBtn')
    };
    
    // Input References
    this.inputs = {
      interviewType: document.getElementById('interviewType'),
      questionCount: document.getElementById('questionCount'),
      questionCountDisplay: document.getElementById('questionCountDisplay'),
      durationEstimate: document.getElementById('durationEstimate'),
      userCamera: document.getElementById('userCamera'),
      currentQuestionNum: document.getElementById('currentQuestionNum'),
      totalQuestionsNum: document.getElementById('totalQuestionsNum'),
      questionText: document.getElementById('questionText'),
      interviewerImageDisplay: document.getElementById('interviewerImageDisplay'),
      interviewerLabel: document.getElementById('interviewerLabel'),
      interviewerStatus: document.getElementById('interviewerStatus'),
      userTimer: document.getElementById('userTimer'),
      recordingIndicator: document.getElementById('recordingIndicator'),
      processingMessage: document.getElementById('processingMessage'),
      feedbackToast: document.getElementById('feedbackToast'),
      feedbackScore: document.getElementById('feedbackScore'),
      feedbackText: document.getElementById('feedbackText')
    };
    
    // Personality Configuration
    this.personalities = {
      A: {
        name: 'Young HR - Friendly',
        type: 'friendly',
        speechRate: 1.0,
        pitch: 1.2,
        greeting: "Hi! Thanks for taking the time to interview with me today. I'm excited to learn more about you. Let's start with an easy one: Tell me a bit about yourself and your background."
      },
      B: {
        name: 'Senior HR - Professional',
        type: 'serious',
        speechRate: 0.92,
        pitch: 1.0,
        greeting: "Good morning. I am conducting today's interview. Please introduce yourself clearly and concisely, highlighting your key qualifications and experience."
      }
    };
    
    // Interview Questions Database
    this.questionBanks = {
      hr: [
        "Tell me about yourself and your professional background.",
        "What are your greatest strengths?",
        "What is your biggest weakness and how are you working to improve it?",
        "Why are you interested in this position?",
        "What do you know about our company?",
        "How do you handle conflict with colleagues?",
        "Describe a challenging project you worked on.",
        "What are your career goals for the next 5 years?",
        "How do you stay organized and prioritize tasks?",
        "Give an example of when you showed leadership."
      ],
      technical: [
        "Explain the difference between SQL and NoSQL databases.",
        "What is object-oriented programming and its benefits?",
        "Describe the software development lifecycle.",
        "What is the difference between synchronous and asynchronous programming?",
        "How would you optimize a slow database query?",
        "Explain what a REST API is and its principles.",
        "What is version control and why is it important?",
        "Describe the difference between stack and queue data structures.",
        "How do you approach debugging complex code issues?",
        "What is continuous integration and continuous deployment?"
      ],
      dsa: [
        "Write a function to reverse a string.",
        "What is the time complexity of binary search?",
        "How would you find the middle element of a linked list?",
        "Explain the difference between breadth-first and depth-first search.",
        "How would you check if two strings are anagrams?",
        "What is dynamic programming and when would you use it?",
        "How would you implement a hash table from scratch?",
        "Explain the quicksort algorithm and its complexity.",
        "How would you merge two sorted arrays?",
        "What is a balanced binary search tree?"
      ],
      behavioral: [
        "Tell me about a time you failed and what you learned.",
        "Describe a situation where you had to work with a difficult team member.",
        "Give an example of when you had to learn something new quickly.",
        "Tell me about your proudest professional achievement.",
        "How do you handle stress and pressure at work?",
        "Describe a time you had to make a difficult decision.",
        "Tell me about your experience with collaborative projects.",
        "How do you approach feedback and criticism?",
        "Describe a time you took initiative beyond your job description.",
        "Tell me about your experience working in a diverse team."
      ],
      'role-based': [
        "What attracts you to this specific role?",
        "How would you approach your first 30 days in this position?",
        "What relevant experience do you have for this role?",
        "How do you stay current with industry trends and developments?",
        "Describe how you would handle a typical day in this position.",
        "What tools and technologies are you proficient in?",
        "How would you measure success in this role?",
        "Tell me about your experience with similar responsibilities.",
        "How would you contribute to our team's goals?",
        "What questions do you have about this role and our company?"
      ]
    };
    
    this.init();
  }
  
  init() {
    console.log('✓ InterviewEngine initializing...');
    this.attachEventListeners();
    this.setupQuestionCounter();
    console.log('✓ InterviewEngine fully initialized');
  }
  
  attachEventListeners() {
    console.log('Attaching event listeners...');
    
    // Setup Screen
    if (this.buttons.startInterview) {
      this.buttons.startInterview.addEventListener('click', () => this.handleStartInterview());
    }
    if (this.inputs.questionCount) {
      this.inputs.questionCount.addEventListener('input', (e) => this.updateDurationEstimate(e.target.value));
    }
    
    // Interviewer Selection
    if (this.buttons.continueInterview) {
      this.buttons.continueInterview.addEventListener('click', () => this.handleContinueSelection());
    }
    document.querySelectorAll('.interviewer-card').forEach(card => {
      card.addEventListener('click', () => this.selectInterviewer(card));
    });
    
    // Interview Controls
    if (this.buttons.stopRecording) {
      this.buttons.stopRecording.addEventListener('click', () => this.stopRecording());
    }
    if (this.buttons.skipQuestion) {
      this.buttons.skipQuestion.addEventListener('click', () => this.skipQuestion());
    }
    if (this.buttons.endInterview) {
      this.buttons.endInterview.addEventListener('click', () => this.endInterview());
    }
    
    // Results Screen
    if (this.buttons.downloadReport) {
      this.buttons.downloadReport.addEventListener('click', () => this.downloadReport());
    }
    if (this.buttons.retryInterview) {
      this.buttons.retryInterview.addEventListener('click', () => this.retryInterview());
    }
    
    console.log('✓ All event listeners attached successfully');
  }
  
  setupQuestionCounter() {
    if (this.inputs.questionCount) {
      this.inputs.questionCount.addEventListener('input', (e) => {
        this.totalQuestions = parseInt(e.target.value);
        if (this.inputs.questionCountDisplay) {
          this.inputs.questionCountDisplay.textContent = this.totalQuestions;
        }
      });
    }
  }
  
  updateDurationEstimate(questionCount) {
    const count = parseInt(questionCount);
    const estimate = Math.ceil(count * 1.5);
    if (this.inputs.durationEstimate) {
      this.inputs.durationEstimate.textContent = `~${estimate} minutes`;
    }
  }
  
  handleStartInterview() {
    this.interviewType = this.inputs.interviewType.value;
    
    if (!this.interviewType) {
      alert('Please select an interview type to continue.');
      return;
    }
    
    this.totalQuestions = parseInt(this.inputs.questionCount.value);
    this.transitionToScreen('selection');
  }
  
  selectInterviewer(card) {
    // Remove previous selection
    document.querySelectorAll('.interviewer-card').forEach(c => c.classList.remove('selected'));
    
    // Add selection to clicked card
    card.classList.add('selected');
    
    // Update selected interviewer
    this.selectedInterviewer = card.getAttribute('data-interviewer');
  }
  
  handleContinueSelection() {
    if (!this.selectedInterviewer) {
      alert('Please select an interviewer to continue.');
      return;
    }
    
    // Assign personality (50/50 random)
    this.selectedPersonality = Math.random() < 0.5 ? 'A' : 'B';
    
    // Store interviewer info
    const interviewerInfo = {
      type: this.selectedInterviewer,
      personality: this.selectedPersonality,
      personalityDetails: this.personalities[this.selectedPersonality]
    };
    
    console.log('Selected Interviewer:', interviewerInfo);
    
    this.transitionToScreen('interview');
    this.initializeInterview();
  }
  
  transitionToScreen(screenName) {
    // Hide all screens
    Object.values(this.screens).forEach(screen => {
      screen.classList.remove('screen-active');
    });
    
    // Show target screen
    this.screens[screenName].classList.add('screen-active');
  }
  
  initializeInterview() {
    console.log('Starting interview with interviewer:', this.selectedInterviewer, 'personality:', this.selectedPersonality);
    this.startTime = Date.now();
    this.currentQuestion = 0;
    this.userResponses = [];
    this.inputs.totalQuestionsNum.textContent = this.totalQuestions;
    
    // Display interviewer image
    this.displayInterviewerImage();
    
    // Load first question
    this.loadNextQuestion();
    
    // Start camera
    this.startCamera();
    
    // Speak greeting with personality
    this.speakGreeting();
    
    // Start timer
    this.startTimer();
  }
  
 displayInterviewerImage() {

    const container = this.inputs.interviewerImageDisplay;

    if (!container) return;

    container.innerHTML = "";

    let gender = this.selectedInterviewer;

    if (gender === "random") {
        gender = Math.random() < 0.5 ? "male" : "female";
        this.selectedInterviewer = gender;
    }

    const videoFile =
        gender === "male"
            ? "Videos/male.mp4"
            : "Videos/female.mp4";

    container.innerHTML = `
        <video
            id="aiInterviewer"
            autoplay
            loop
            muted
            playsinline
            style="width:100%;height:100%;object-fit:cover;border-radius:12px;">
            <source src="${videoFile}" type="video/mp4">
        </video>
    `;

    if (this.inputs.interviewerLabel) {
        this.inputs.interviewerLabel.textContent =
            gender === "male"
                ? "Male Interviewer"
                : "Female Interviewer";
    }

}
  
  // Video interviewer is now used instead of SVG avatars
  // This method is kept for backward compatibility
  generateSVGAvatar(gender) {
    console.log('SVG avatar generation skipped - using video interviewer');
    return null;
  }
  
  speakGreeting() {
    const personality = this.personalities[this.selectedPersonality];
    const greeting = personality.greeting;
    
    this.speak(greeting, {
      rate: personality.speechRate,
      pitch: personality.pitch
    });
  }
  
 speak(text, options = {}) {

    if (!window.speechSynthesis) {
        console.warn("Speech synthesis not supported");
        return;
    }

    // Stop previous speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    const voices = window.speechSynthesis.getVoices();

    // Determine interviewer type
    let interviewerType = this.selectedInterviewer;

    if (typeof interviewerType === "object" && interviewerType !== null) {
        interviewerType = interviewerType.type;
    }

    console.log("Selected Interviewer:", interviewerType);

    // ---------------- FEMALE VOICE ----------------
    if (interviewerType === "female") {

        utterance.voice =
            voices.find(v => v.name === "Microsoft Zira - English (United States)") ||
            voices.find(v => v.name === "Google UK English Female") ||
            voices.find(v => v.name.toLowerCase().includes("zira")) ||
            voices.find(v => v.name.toLowerCase().includes("female")) ||
            voices[0];

    }

    // ---------------- MALE VOICE ----------------
    else {

        utterance.voice =
            voices.find(v => v.name === "Microsoft David - English (United States)") ||
            voices.find(v => v.name === "Microsoft Mark - English (United States)") ||
            voices.find(v => v.name === "Google UK English Male") ||
            voices.find(v => v.name.toLowerCase().includes("david")) ||
            voices.find(v => v.name.toLowerCase().includes("mark")) ||
            voices.find(v => v.name.toLowerCase().includes("male")) ||
            voices[0];

    }

    console.log("Using Voice:", utterance.voice ? utterance.voice.name : "Default");

    utterance.rate = options.rate || 1.0;
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = 1.0;

    utterance.onstart = () => {
        if (this.inputs.interviewerStatus) {
            this.inputs.interviewerStatus.textContent = "Speaking...";
            this.inputs.interviewerStatus.className = "status-text speaking";
        }
    };

    utterance.onend = () => {
        if (this.inputs.interviewerStatus) {
            this.inputs.interviewerStatus.textContent = "Listening...";
            this.inputs.interviewerStatus.className = "status-text listening";
        }
    };

    window.speechSynthesis.speak(utterance);
}
  
  loadNextQuestion() {
    if (this.currentQuestion >= this.totalQuestions) {
      this.completeInterview();
      return;
    }
    
    this.currentQuestion++;
    const questions = this.questionBanks[this.interviewType] || this.questionBanks.hr;
    const question = questions[(this.currentQuestion - 1) % questions.length];
    
    this.inputs.currentQuestionNum.textContent = this.currentQuestion;
    this.inputs.questionText.textContent = question;
    
    // Speak question with personality
    const personality = this.personalities[this.selectedPersonality];
    this.speak(question, {
      rate: personality.speechRate,
      pitch: personality.pitch
    });
  }
  
  async startCamera() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
      
      this.inputs.userCamera.srcObject = this.mediaStream;
      console.log('Camera started successfully');
      
      // Start recording
      this.startRecording();
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  }
  
  startRecording() {
    if (!this.mediaStream) return;
    
    this.mediaRecorder = new MediaRecorder(this.mediaStream);
    this.recordedChunks = [];
    
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };
    
    this.mediaRecorder.onstart = () => {
      this.isRecording = true;
      this.inputs.recordingIndicator.style.display = 'flex';
      this.buttons.stopRecording.style.display = 'inline-block';
    };
    
    this.mediaRecorder.onend = () => {
      this.isRecording = false;
      this.inputs.recordingIndicator.style.display = 'none';
    };
    
    this.mediaRecorder.start();
  }
  
  stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.buttons.stopRecording.style.display = 'none';
      this.processResponse();
    }
  }
  
  async processResponse() {
    this.inputs.processingMessage.style.display = 'flex';
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate mock feedback
    const score = Math.floor(Math.random() * 30 + 70); // 70-100
    const feedback = {
      score: score,
      text: 'Clear communication and good structure.',
      communication: Math.floor(Math.random() * 25 + 75),
      confidence: Math.floor(Math.random() * 25 + 70),
      technical: Math.floor(Math.random() * 25 + 65)
    };
    
    this.userResponses.push(feedback);
    
    // Show feedback
    this.inputs.feedbackScore.textContent = score;
    this.inputs.feedbackText.textContent = feedback.text;
    this.inputs.feedbackToast.style.display = 'flex';
    
    this.inputs.processingMessage.style.display = 'none';
    
    // Auto-advance to next question after 3 seconds
    setTimeout(() => {
      this.inputs.feedbackToast.style.display = 'none';
      this.loadNextQuestion();
    }, 3000);
  }
  
  skipQuestion() {
    this.userResponses.push({
      score: 0,
      text: 'Question skipped',
      communication: 0,
      confidence: 0,
      technical: 0
    });
    
    this.loadNextQuestion();
  }
  
  endInterview() {
    if (confirm('Are you sure you want to end the interview? This cannot be undone.')) {
      this.completeInterview();
    }
  }
  
  completeInterview() {
    // Stop recording and camera
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    
    // Calculate overall score
    const overallScore = Math.round(
      this.userResponses.reduce((sum, r) => sum + r.score, 0) / this.userResponses.length
    );
    
    const communicationScore = Math.round(
      this.userResponses.reduce((sum, r) => sum + r.communication, 0) / this.userResponses.length
    );
    
    const confidenceScore = Math.round(
      this.userResponses.reduce((sum, r) => sum + r.confidence, 0) / this.userResponses.length
    );
    
    const technicalScore = Math.round(
      this.userResponses.reduce((sum, r) => sum + r.technical, 0) / this.userResponses.length
    );
    
    // Display results
    this.displayResults({
      overallScore,
      communicationScore,
      confidenceScore,
      technicalScore,
      feedback: 'Excellent performance throughout the interview. Your responses were clear and well-structured.',
      recommendations: [
        'Consider providing more specific examples in technical discussions',
        'Work on maintaining a consistent speaking pace',
        'Engage more with follow-up questions',
        'Practice time management during longer questions'
      ]
    });
    
    this.transitionToScreen('results');
    
    // Save to backend (optional)
    this.saveInterviewResults({
      interviewType: this.interviewType,
      totalQuestions: this.totalQuestions,
      selectedInterviewer: this.selectedInterviewer,
      selectedPersonality: this.selectedPersonality,
      scores: {
        overall: overallScore,
        communication: communicationScore,
        confidence: confidenceScore,
        technical: technicalScore
      },
      timestamp: new Date().toISOString()
    });
  }
  
  displayResults(results) {

    // Overall Score
    document.getElementById('overallScore').textContent =
        results.overallScore || 0;

    // Individual Scores
    document.getElementById('communicationScoreValue').textContent =
        results.communicationScore || 0;

    document.getElementById('confidenceScoreValue').textContent =
        results.confidenceScore || 0;

    document.getElementById('technicalScoreValue').textContent =
        results.technicalScore || 0;

    // Progress Bars
    document.getElementById('communicationScoreFill').style.width =
        (results.communicationScore || 0) + "%";

    document.getElementById('confidenceScoreFill').style.width =
        (results.confidenceScore || 0) + "%";

    document.getElementById('technicalScoreFill').style.width =
        (results.technicalScore || 0) + "%";

    // Feedback
    document.getElementById('feedbackSummary').textContent =
        results.feedback ||
        "Interview completed successfully.";

    // Recommendations
    const recommendationsList =
        document.getElementById("recommendationsList");

    recommendationsList.innerHTML = "";

    if (
        results.recommendations &&
        results.recommendations.length > 0
    ) {

        results.recommendations.forEach(rec => {

            const li = document.createElement("li");
            li.textContent = rec;
            recommendationsList.appendChild(li);

        });

    } else {

        [
            "Improve communication.",
            "Practice mock interviews.",
            "Answer with more confidence.",
            "Give more real-life examples."
        ].forEach(rec => {

            const li = document.createElement("li");
            li.textContent = rec;
            recommendationsList.appendChild(li);

        });

    }

    console.log("Results displayed successfully.");

  }
  
  async saveInterviewResults(data) {

    try {

        console.log("[Save] Sending interview summary...");

        const response = await fetch(
            "http://127.0.0.1:3000/api/interviews/demo/summary",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: data.interviewType,
                    answers: this.userResponses.map((item, index) => ({
                        question: index + 1,
                        score: item.score,
                        communication: item.communication,
                        confidence: item.confidence,
                        technical: item.technical,
                        answer: "Answered"
                    }))
                })
            }
        );

        const result = await response.json();

        console.log("[Summary]", result);

        return result;

    } catch (error) {

        console.error("[Save Error]", error);

        return null;

    }

  }
  
  downloadReport() {
    const data = {
      interviewType: this.interviewType,
      interviewer: this.selectedInterviewer,
      personality: this.selectedPersonality,
      scores: this.userResponses,
      timestamp: new Date().toLocaleString()
    };
    
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2)));
    element.setAttribute('download', `interview-report-${Date.now()}.json`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
  
  retryInterview() {
    location.reload();
  }
  
  beginInterview() {
    this.transitionToScreen('interview');
    this.initializeInterview();
  }
  
  startTimer() {
    let seconds = 0;
    this.timerInterval = setInterval(() => {
      seconds++;
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      this.inputs.userTimer.textContent = `${minutes}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new InterviewEngine();
});
