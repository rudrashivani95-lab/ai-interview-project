// ========== VOICE INTERVIEW ENGINE ==========
// Full AI voice interview system with adaptive questions, continuous listening,
// real-time transcription, and comprehensive summary reporting

document.addEventListener('DOMContentLoaded', async () => {
  // ========== STATE MANAGEMENT ==========
  let interviewState = {
    interviewId: null,
    type: 'HR',
    questions: [],
    answers: [],
    currentQuestionIndex: 0,
    startTime: Date.now(),
    isActive: true,
    sessionMemory: [], // Store all interactions
    askedQuestions: [], // Track asked questions to prevent repetition
    questionsExhausted: false, // Flag when all questions used in this session
  };

  // Restore from session storage
  const stored = sessionStorage.getItem('voiceInterviewState');
  if (stored) {
    interviewState = JSON.parse(stored);
  }

  // Load persisted asked questions from localStorage (for multi-session continuity)
  const persistedAskedQuestions = localStorage.getItem(`askedQuestions_${interviewState.interviewId}`);
  if (persistedAskedQuestions) {
    try {
      interviewState.askedQuestions = JSON.parse(persistedAskedQuestions);
    } catch (e) {
      console.warn('Could not parse persisted asked questions:', e);
    }
  }

  // ========== DOM ELEMENTS ==========
  const questionContainer = document.getElementById('questionContainer');
  const questionNum = document.getElementById('questionNum');
  const totalQuestions = document.getElementById('totalQuestions');
  const answerInput = document.getElementById('answerInput');
  const speakQuestionBtn = document.getElementById('speakQuestionBtn');
  const recordAnswerBtn = document.getElementById('recordAnswerBtn');
  const stopRecordingBtn = document.getElementById('stopRecordingBtn');
  const submitAnswerBtn = document.getElementById('submitAnswerBtn');
  const clearAnswerBtn = document.getElementById('clearAnswerBtn');
  const skipQuestionBtn = document.getElementById('skipQuestionBtn');
  const endInterviewBtn = document.getElementById('endInterviewBtn');
  const recordingIndicator = document.getElementById('recordingIndicator');
  const answeredList = document.getElementById('answeredList');
  const interviewTypeEl = document.getElementById('interviewType');
  const loadingOverlay = document.getElementById('loadingOverlay');
  const summaryModal = new bootstrap.Modal(document.getElementById('summaryModal'));

  // Status indicator
  const statusIndicator = document.createElement('div');
  statusIndicator.id = 'statusIndicator';
  statusIndicator.className = 'status-indicator';
  statusIndicator.innerHTML = '<span id="statusText">Ready</span>';
  document.body.appendChild(statusIndicator);

  // ========== VOICE MANAGER SETUP ==========
  const voiceManager = new VoiceManager({
    voiceGender: localStorage.getItem('voiceGender') || 'female',
    speakingRate: parseFloat(localStorage.getItem('speakingRate') || '0.9'),
    onListeningStart: () => {
      recordingIndicator.style.display = 'block';
      updateStatus('Listening...', 'listening');
    },
    onListeningEnd: () => {
      recordingIndicator.style.display = 'none';
      updateStatus('Processing...', 'processing');
    },
    onTranscript: (result) => {
      if (result.final) {
        answerInput.value = result.text;
        console.log('Final transcript:', result.text);
      } else {
        answerInput.placeholder = `Interim: ${result.text}`;
      }
    },
    onSilence: () => {
      if (interviewState.isActive && voiceManager.isListening) {
        // Ask follow-up during silence
        voiceManager.speak('Are you thinking? Please continue with your answer, or I can ask you another question.');
      }
    },
    onStatusChange: (status) => {
      updateStatus(status);
    },
    onError: (error) => {
      console.error('Voice error:', error);
      updateStatus(`Error: ${error}`, 'error');
    }
  });

  // ========== UTILITY FUNCTIONS ==========
  function updateStatus(message, type = 'default') {
    statusIndicator.textContent = message;
    statusIndicator.className = `status-indicator status-${type}`;
    console.log(`[Status] ${message}`);
  }

  function saveState() {
    sessionStorage.setItem('voiceInterviewState', JSON.stringify(interviewState));
  }

  function saveToLocalStorage() {
    localStorage.setItem('interviewAnswers', JSON.stringify(interviewState.answers));
    localStorage.setItem('interviewSessions', JSON.stringify(interviewState.sessionMemory));
    
    // Persist asked questions with interview ID for multi-session tracking
    if (interviewState.interviewId) {
      localStorage.setItem(
        `askedQuestions_${interviewState.interviewId}`,
        JSON.stringify(interviewState.askedQuestions)
      );
    }
  }

  // Track a question as asked to prevent repetition
  function markQuestionAsAsked(question) {
    if (!question) {
      console.warn('[Question Tracking] Question is null/undefined, skipping');
      return;
    }
    
    const questionId = question.questionId || question.id;
    const questionText = question.questionText || question.text;
    
    if (!questionId || !questionText) {
      console.warn('[Question Tracking] Question missing ID or text:', question);
      return;
    }
    
    // Create a unique identifier for this question
    const questionKey = `${questionId}|${questionText}`;
    
    // Only add if not already tracked
    if (!Array.isArray(interviewState.askedQuestions)) {
      console.warn('[Question Tracking] askedQuestions is not an array, initializing');
      interviewState.askedQuestions = [];
    }
    
    if (!interviewState.askedQuestions.includes(questionKey)) {
      interviewState.askedQuestions.push(questionKey);
      saveToLocalStorage();
      console.log(`[Question Tracking] Marked as asked: ${questionText.substring(0, 50)}...`);
    }
  }

  // Check if a question has already been asked
  function hasQuestionBeenAsked(question) {
    if (!question) return false;
    
    const questionId = question.questionId || question.id;
    const questionText = question.questionText || question.text;
    
    if (questionId && questionText) {
      const questionKey = `${questionId}|${questionText}`;
      return interviewState.askedQuestions.includes(questionKey);
    }
    
    return false;
  }

  // ========== INTERVIEW INITIALIZATION ==========
  async function initializeInterview() {
    try {
      const stored = JSON.parse(localStorage.getItem('currentInterview') || 'null');
      if (!stored) {
        alert('No interview type selected. Please go back and select an interview type.');
        window.location.href = 'interviewType.html';
        return;
      }

      interviewState.type = stored.type;
      interviewState.interviewId = stored.interviewId;
      interviewTypeEl.textContent = interviewState.type;

      // Fetch initial questions
      const { ok, data } = await window.apiPost(`/api/interviews/start`, {
        type: interviewState.type,
        count: 1
      });

      if (!ok || !data || !data.questions || data.questions.length === 0) {
        console.error('[Init] Failed to load questions:', data);
        alert('Failed to load interview questions');
        return;
      }

      // Validate question structure
      const question = data.questions[0];
      if (!question || (!question.questionId && !question.id) || (!question.questionText && !question.text)) {
        console.error('[Init] Invalid question structure:', question);
        alert('Invalid question data received from server');
        return;
      }

      interviewState.questions = data.questions;
      interviewState.interviewId = data.interviewId;
      totalQuestions.textContent = 'Unlimited';

      saveState();
      
      // Mark initial question as asked BEFORE displaying
      if (interviewState.questions.length > 0 && interviewState.questions[0]) {
        markQuestionAsAsked(interviewState.questions[0]);
      }
      
      displayQuestion();

      // Auto-speak first question after 500ms
      setTimeout(() => {
        if (voiceManager.isSynthesisSupported()) {
          speakQuestion();
        }
      }, 500);

    } catch (error) {
      console.error('Initialization error:', error);
      alert('Error initializing interview: ' + error.message);
    }
  }

  // ========== QUESTION MANAGEMENT ==========
  function displayQuestion() {
    if (interviewState.currentQuestionIndex < interviewState.questions.length) {
      const q = interviewState.questions[interviewState.currentQuestionIndex];
      
      if (!q) {
        console.error('[Question Display] Question object is null/undefined');
        fetchNextQuestion();
        return;
      }
      
      // Check if this question has already been asked
      if (hasQuestionBeenAsked(q)) {
        console.warn(`[Question Deduplication] Question already asked, fetching next...`);
        // Skip to next question
        fetchNextQuestion();
        return;
      }
      
      // Mark this question as asked
      markQuestionAsAsked(q);
      
      questionNum.textContent = interviewState.currentQuestionIndex + 1;
      questionContainer.innerHTML = `<p class="question-text">${q.questionText || q.text || 'No question available'}</p>`;

      // Update progress
      const answeredCount = interviewState.answers.length;
      const percent = Math.min(100, Math.round((answeredCount / Math.max(1, answeredCount + 5)) * 100));
      document.getElementById('progressPercent').textContent = percent + '%';

      recordAnswerBtn.style.display = 'block';
      stopRecordingBtn.style.display = 'none';
      answerInput.value = '';
      answerInput.placeholder = 'Your answer will appear here...';

      updateStatus('Question loaded. Click "Start Recording" or "Hear Question"');
    }

    updateAnsweredList();
  }

  function updateAnsweredList() {
    if (interviewState.answers.length === 0) {
      answeredList.innerHTML = '<p class="text-muted small">No questions answered yet</p>';
      return;
    }

    answeredList.innerHTML = interviewState.answers.map((ans, idx) => `
      <div class="answered-item">
        <span class="checkmark">✓</span>
        <span>Q${idx + 1}: ${ans.score || 0}/100</span>
      </div>
    `).join('');
  }

  // ========== VOICE CONTROLS ==========
  async function speakQuestion() {
    if (interviewState.currentQuestionIndex >= interviewState.questions.length) {
      voiceManager.speak('All questions completed. You can now end the interview.');
      return;
    }

    const q = interviewState.questions[interviewState.currentQuestionIndex];
    const questionText = q.questionText || q.text || 'No question';

    try {
      updateStatus('Speaking question...', 'speaking');
      await voiceManager.speak(questionText);
      updateStatus('Question complete. Ready to listen.', 'ready');
    } catch (err) {
      console.error('Speech synthesis error:', err);
      updateStatus('Could not speak question', 'error');
    }
  }

  function startRecording() {
    if (!voiceManager.isSupported()) {
      alert('Speech recognition not supported. Please type your answer instead.');
      answerInput.focus();
      return;
    }

    recordAnswerBtn.style.display = 'none';
    stopRecordingBtn.style.display = 'block';
    answerInput.value = '';
    voiceManager.startListening();
  }

  function stopRecording() {
    voiceManager.stopListening();
    recordAnswerBtn.style.display = 'block';
    stopRecordingBtn.style.display = 'none';
  }

  // ========== ANSWER SUBMISSION ==========
  async function submitAnswer() {
    const answerText = answerInput.value.trim();
    if (!answerText) {
      alert('Please provide an answer before submitting.');
      return;
    }

    stopRecording();
    loadingOverlay.style.display = 'flex';
    updateStatus('Processing your answer...', 'processing');

    try {
      const q = interviewState.questions[interviewState.currentQuestionIndex];

      // Submit answer to backend
      const { ok, data } = await window.apiPost(`/api/interviews/${interviewState.interviewId}/answer`, {
        questionId: q.questionId || interviewState.currentQuestionIndex,
        text: answerText,
      });

      loadingOverlay.style.display = 'none';

      if (!ok) {
        alert(data?.message || 'Failed to submit answer');
        updateStatus('Error submitting answer', 'error');
        return;
      }

      // Store answer
      interviewState.answers.push({
        questionIndex: interviewState.currentQuestionIndex,
        question: q.questionText || q.text,
        answer: answerText,
        timestamp: new Date().toISOString(),
        score: data.answer?.evaluation?.overall || 0,
        feedback: data.answer?.evaluation?.feedback || '',
      });

      interviewState.sessionMemory.push({
        type: 'answer',
        content: answerText,
        score: data.answer?.evaluation?.overall || 0,
        timestamp: Date.now()
      });

      saveState();
      saveToLocalStorage();

      // Show feedback and load next question
      updateStatus(`Score: ${data.answer?.evaluation?.overall || 0}/100. Loading next question...`, 'success');

      // Auto-speak next question after 1 second
      setTimeout(() => {
        answerInput.value = '';
        // Use local question bank for next question (more responsive)
        fetchNextQuestion();
      }, 1000);

      updateStatus('Answer submitted. Preparing next question...', 'ready');

    } catch (error) {
      loadingOverlay.style.display = 'none';
      console.error('Submission error:', error);
      alert('Error submitting answer: ' + error.message);
      updateStatus('Error: ' + error.message, 'error');
    }
  }

  // ========== ADAPTIVE QUESTION FETCHING ==========
  /**
   * PRIMARY METHOD: Fetch next question
   * Strategy:
   * 1. Try to get next unique question from local question bank
   * 2. If no more questions locally, fallback to backend for AI-generated follow-up
   * 3. Track all questions to prevent repetition
   */
  async function fetchNextQuestion() {
    try {
      updateStatus('Getting next question...', 'processing');

      // Get interview type/category for question bank
      const interviewCategory = getQuestionCategory(interviewState.type);
      
      // Extract just the question IDs from the tracked questions
      const askedQuestionIds = interviewState.askedQuestions.map(q => q.split('|')[0]);
      
      console.log(`[Question Fetching] Category: ${interviewCategory}, Already Asked: ${askedQuestionIds.length}`);

      // ===== STEP 1: Try local question bank first =====
      const nextLocalQuestion = getNextQuestion(interviewCategory, askedQuestionIds);
      
      if (nextLocalQuestion) {
        console.log('[Question Fetching] ✓ Got question from local bank:', nextLocalQuestion.questionText.substring(0, 50) + '...');
        
        interviewState.questions = [{
          questionId: nextLocalQuestion.questionId,
          questionText: nextLocalQuestion.questionText
        }];
        interviewState.currentQuestionIndex = 0;

        // Mark as asked BEFORE displaying
        markQuestionAsAsked(interviewState.questions[0]);
        
        displayQuestion();
        updateStatus('Question loaded from local bank', 'ready');

        // Auto-speak new question
        if (voiceManager.isSynthesisSupported()) {
          setTimeout(() => speakQuestion(), 300);
        }
        
        return; // SUCCESS: Question retrieved locally
      }

      // ===== STEP 2: All local questions exhausted, try backend =====
      console.warn('[Question Fetching] ⚠️ Local question bank exhausted, requesting follow-up from backend');
      
      const lastAnswer = interviewState.answers[interviewState.answers.length - 1]?.answer || '';

      const { ok, data } = await window.apiPost(`/api/interviews/${interviewState.interviewId}/next-question`, {
        answerText: lastAnswer,
        askedQuestionIds: askedQuestionIds,
        category: interviewCategory,
        questionsBankExhausted: true
      });

      if (ok && data && data.questionText) {
        const followUpQuestion = {
          questionId: data.questionId || `followup_${Date.now()}`,
          questionText: data.questionText,
          isFollowUp: true
        };
        
        console.log('[Question Fetching] ✓ Got follow-up question from backend:', data.questionText.substring(0, 50) + '...');
        
        interviewState.questions = [followUpQuestion];
        interviewState.currentQuestionIndex = 0;

        // Mark as asked BEFORE displaying
        markQuestionAsAsked(followUpQuestion);
        
        displayQuestion();
        updateStatus('Follow-up question loaded', 'ready');

        // Auto-speak follow-up question
        if (voiceManager.isSynthesisSupported()) {
          setTimeout(() => speakQuestion(), 300);
        }
      } else {
        // ===== STEP 3: No more questions available at all =====
        console.error('[Question Fetching] ✗ No questions available from either source');
        interviewState.questionsExhausted = true;
        updateStatus('All questions completed! You can end the interview.', 'info');
        
        voiceManager.speak('Congratulations! You have completed all available questions. You can now end the interview.');
      }

    } catch (error) {
      console.error('Error fetching next question:', error);
      updateStatus('Error loading next question: ' + error.message, 'error');
      interviewState.questionsExhausted = true;
    }
  }

  /**
   * Map interview type to question bank category
   */
  function getQuestionCategory(interviewType) {
    const typeMap = {
      'HR': 'general',
      'BEHAVIORAL': 'general',
      'TECHNICAL': 'dsa',
      'DSA': 'dsa',
      'ROLE_BASED': 'rolebased',
      'RESUME_BASED': 'resumebased',
      'GENERAL': 'general',
    };
    
    const category = typeMap[interviewType?.toUpperCase()] || 'general';
    console.log(`[Interview Type] ${interviewType} -> Category: ${category}`);
    return category;
  }

  // ========== SKIP QUESTION ==========
  function skipQuestion() {
    if (confirm('Skip this question? It will be marked as skipped.')) {
      const currentQ = interviewState.questions[interviewState.currentQuestionIndex];
      
      // Record the skip
      interviewState.answers.push({
        questionIndex: interviewState.currentQuestionIndex,
        question: currentQ?.questionText || currentQ?.text,
        answer: '[SKIPPED]',
        timestamp: new Date().toISOString(),
        score: 0,
        feedback: 'Question was skipped'
      });

      // Mark skipped question as asked (so it won't repeat)
      markQuestionAsAsked(currentQ);
      
      saveState();
      saveToLocalStorage();
      
      console.log('[Skip] Marked as skipped, fetching next question immediately...');
      
      // Immediately get next question (no delay, instant response to user)
      fetchNextQuestion();
    }
  }

  // ========== END INTERVIEW ==========
  async function endInterview() {
    if (interviewState.answers.length === 0) {
      if (!confirm('You haven\'t answered any questions. End anyway?')) {
        return;
      }
    }

    interviewState.isActive = false;
    saveState();

    loadingOverlay.style.display = 'flex';
    updateStatus('Generating interview summary...', 'processing');

    try {
      // Get summary from backend
      const { ok, data } = await window.apiPost(`/api/interviews/${interviewState.interviewId}/summary`, {
        answers: interviewState.answers
      });

      loadingOverlay.style.display = 'none';

      if (ok && data.summary) {
        displaySummary(data.summary);
      } else {
        // Generate local summary as fallback
        displaySummary(generateLocalSummary());
      }

      summaryModal.show();

      // Save to history
      localStorage.setItem('lastInterviewSummary', JSON.stringify(data.summary || generateLocalSummary()));
      
      // Clear persisted asked questions for this interview when completed
      if (interviewState.interviewId) {
        localStorage.removeItem(`askedQuestions_${interviewState.interviewId}`);
      }

    } catch (error) {
      loadingOverlay.style.display = 'none';
      console.error('Summary error:', error);

      // Show local summary anyway
      displaySummary(generateLocalSummary());
      summaryModal.show();

      updateStatus('Interview ended', 'info');
      
      // Clear persisted asked questions even on error
      if (interviewState.interviewId) {
        localStorage.removeItem(`askedQuestions_${interviewState.interviewId}`);
      }
    }
  }

  // ========== SUMMARY DISPLAY ==========
  function displaySummary(summary) {
    // Score
    const score = summary.overallScore || calculateScore();
    document.getElementById('summaryScore').textContent = score;

    // Answers
    const answersHtml = interviewState.answers.map((ans, idx) => `
      <div class="summary-answer mb-3">
        <strong>Q${idx + 1}: ${ans.question}</strong><br>
        ${ans.answer === '[SKIPPED]' ? '<em class="text-muted">Skipped</em>' : `<p>${ans.answer}</p>`}
        <small class="text-success">Score: ${ans.score}/100</small>
      </div>
    `).join('');
    document.getElementById('summaryAnswers').innerHTML = answersHtml || '<p>No answers submitted</p>';

    // Strengths & Weaknesses
    const strengths = (summary.strengths || []).join('<br>• ');
    const weaknesses = (summary.weaknesses || []).join('<br>• ');

    document.getElementById('summaryImprovements').innerHTML = `
      <div class="mb-3">
        <h6>💪 Strengths</h6>
        <p>• ${strengths || 'Keep practicing!'}</p>
      </div>
      <div>
        <h6>📈 Areas to Improve</h6>
        <p>• ${weaknesses || 'Continue practicing!'}</p>
      </div>
    `;

    // Recommendations
    const recHtml = (summary.recommendations || [])
      .map(rec => `<li>${rec}</li>`)
      .join('');
    document.getElementById('summaryRecommendations').innerHTML = recHtml || '<li>Practice regularly</li>';
  }

  function calculateScore() {
    if (interviewState.answers.length === 0) return 0;
    const total = interviewState.answers.reduce((sum, a) => sum + (a.score || 0), 0);
    return Math.round(total / interviewState.answers.length);
  }

  function generateLocalSummary() {
    const score = calculateScore();
    return {
      overallScore: score,
      totalQuestions: interviewState.answers.length,
      strengths: [
        'Clear communication',
        'Problem-solving approach',
        'Structured thinking'
      ],
      weaknesses: [
        'Provide more specific examples',
        'Practice technical depth',
        'Work on confidence'
      ],
      recommendations: [
        'Schedule weekly mock interviews',
        'Record and review your responses',
        'Practice common interview questions',
        'Improve specific technical skills',
        'Work on time management'
      ]
    };
  }

  // ========== VOICE SETTINGS ==========
  function setupVoiceSettings() {
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'btn btn-outline-secondary btn-sm';
    settingsBtn.id = 'voiceSettingsBtn';
    settingsBtn.innerHTML = '<i class="fas fa-sliders-h"></i> Voice Settings';

    settingsBtn.addEventListener('click', () => {
      const gender = prompt('Voice gender (male/female):', voiceManager.settings.voiceGender);
      const speed = prompt('Speaking speed (0.5 - 2.0):', voiceManager.settings.speakingRate);

      if (gender) {
        voiceManager.updateSettings({ voiceGender: gender });
        localStorage.setItem('voiceGender', gender);
      }

      if (speed) {
        const rate = parseFloat(speed);
        if (rate >= 0.5 && rate <= 2.0) {
          voiceManager.updateSettings({ speakingRate: rate });
          localStorage.setItem('speakingRate', rate);
        }
      }
    });

    document.querySelector('.page-header').appendChild(settingsBtn);
  }

  // ========== EVENT LISTENERS ==========
  speakQuestionBtn.addEventListener('click', speakQuestion);
  recordAnswerBtn.addEventListener('click', startRecording);
  stopRecordingBtn.addEventListener('click', stopRecording);
  submitAnswerBtn.addEventListener('click', submitAnswer);
  clearAnswerBtn.addEventListener('click', () => {
    answerInput.value = '';
    recordingIndicator.style.display = 'none';
  });
  skipQuestionBtn.addEventListener('click', skipQuestion);
  endInterviewBtn.addEventListener('click', endInterview);

  document.getElementById('retryInterviewBtn').addEventListener('click', () => {
    sessionStorage.removeItem('voiceInterviewState');
    localStorage.removeItem('currentInterview');
    location.reload();
  });

  // ========== INITIALIZATION ==========
  setupVoiceSettings();
  initializeInterview();

  // Auto-save state periodically
  setInterval(saveState, 5000);

  // Handle page unload
  window.addEventListener('beforeunload', (e) => {
    if (interviewState.isActive && interviewState.answers.length > 0) {
      e.preventDefault();
      e.returnValue = 'Your interview progress will be saved.';
    }
    saveState();
    saveToLocalStorage();
  });
});
