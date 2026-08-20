// ============================================================
// PREPMATE AI - COMPREHENSIVE MOCK INTERVIEW SYSTEM
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {

  // ============================================================
  // STATE
  // ============================================================

  const interviewState = {
    interviewId: null,
    type: "hr",
    displayType: "HR",
    questions: [],
    answers: [],
    currentQuestion: null,
    currentQuestionIndex: 0,
    skippedQuestions: [],
    startTime: Date.now(),
    isActive: true
  };

  const MAX_QUESTIONS = 5;

  // ============================================================
  // DOM
  // ============================================================

  const questionContainer = document.getElementById("questionContainer");
  const questionNum = document.getElementById("questionNum");
  const totalQuestions = document.getElementById("totalQuestions");
  const progressPercent = document.getElementById("progressPercent");

  const answerInput = document.getElementById("answerInput");

  const speakQuestionBtn =
    document.getElementById("speakQuestionBtn");

  const recordAnswerBtn =
    document.getElementById("recordAnswerBtn");

  const stopRecordingBtn =
    document.getElementById("stopRecordingBtn");

  const submitAnswerBtn =
    document.getElementById("submitAnswerBtn");

  const clearAnswerBtn =
    document.getElementById("clearAnswerBtn");

  const repeatQuestionBtn =
    document.getElementById("repeatQuestionBtn");

  const skipQuestionBtn =
    document.getElementById("skipQuestionBtn");

  const endInterviewBtn =
    document.getElementById("endInterviewBtn");

  const recordingIndicator =
    document.getElementById("recordingIndicator");

  const answeredList =
    document.getElementById("answeredList");

  const loadingOverlay =
    document.getElementById("loadingOverlay");

  const interviewTypeEl =
    document.getElementById("interviewType");

  const interviewRoleEl =
    document.getElementById("interviewRole");

  const interviewDurationEl =
    document.getElementById("interviewDuration");

  const timeRemainingEl =
    document.getElementById("timeRemaining");

  // ============================================================
  // LOAD CURRENT INTERVIEW
  // ============================================================

  const storedInterview =
    JSON.parse(localStorage.getItem("currentInterview") || "null");

  const storedType =
    localStorage.getItem("interviewType") || "hr";

  const storedTypeLabel =
    localStorage.getItem("interviewTypeLabel") || "HR";

  interviewState.type = storedType;
  interviewState.displayType = storedTypeLabel;

  if (storedInterview) {
    interviewState.interviewId =
      storedInterview.interviewId ||
      storedInterview.id ||
      `local_${Date.now()}`;
  } else {
    interviewState.interviewId = `local_${Date.now()}`;
  }

  // ============================================================
  // QUESTION BANK
  // ============================================================

  const fallbackQuestions = {

    hr: [
      "Tell me about yourself.",
      "What are your greatest strengths?",
      "What is one weakness you are currently working on?",
      "Why should we hire you?",
      "Where do you see yourself in five years?",
      "Why are you interested in this position?",
      "Tell me about a challenge you faced and how you handled it.",
      "How do you handle pressure?",
      "Tell me about a time you worked successfully in a team.",
      "What motivates you?"
    ],

    technical: [
      "What is an API and how does a REST API work?",
      "What is the difference between SQL and NoSQL databases?",
      "Explain object-oriented programming.",
      "What is the difference between synchronous and asynchronous programming?",
      "What is JWT and how is it used?",
      "Explain the difference between HTTP and HTTPS.",
      "What is a database index?",
      "What is normalization?",
      "What is the difference between authentication and authorization?",
      "Explain the MVC architecture."
    ],

    dsa: [
      "What is the difference between an array and a linked list?",
      "Explain binary search and its time complexity.",
      "What is a stack and where is it used?",
      "What is a queue and where is it used?",
      "Explain Big O notation.",
      "What is a hash table?",
      "Explain BFS and DFS.",
      "What is recursion?",
      "Explain dynamic programming.",
      "What is the difference between merge sort and quicksort?"
    ],

    "role-based": [
      "Why are you interested in this role?",
      "What skills make you suitable for this role?",
      "What technologies are you comfortable working with?",
      "Describe a project relevant to this role.",
      "How would you solve a problem related to this role?",
      "What would you do if you were given a technology you had never used?",
      "How do you keep your technical skills updated?",
      "What challenges do you expect in this role?",
      "Why should we select you for this position?",
      "What are your career goals?"
    ],

    resume: [
      "Tell me about your most important project.",
      "What was your specific contribution to the project?",
      "Why did you choose the technologies used in the project?",
      "What was the biggest challenge you faced?",
      "How did you test your project?",
      "What did you learn from this project?",
      "How would you improve the project?",
      "What was your role in the team?",
      "How did you solve a difficult technical problem?",
      "What achievement on your resume are you most proud of?"
    ]
  };

  // ============================================================
  // GET QUESTION BANK
  // ============================================================
  
  function getBank(category) {

    if (
      typeof enhancedQuestionBank !== "undefined"
    ) {

      const map = {
        hr: enhancedQuestionBank.hr,
        technical: enhancedQuestionBank.technical,
        dsa: enhancedQuestionBank.dsa,
        behavioral: enhancedQuestionBank.behavioral,
        communication: enhancedQuestionBank.communication,
        resume: enhancedQuestionBank.resume
      };

      if (map[category] && map[category].length) {
        return map[category].map(q => ({
          id: q.id,
          text: q.text
        }));
      }
    }

    return fallbackQuestions[category] || fallbackQuestions.hr
      ? fallbackQuestions[category] || fallbackQuestions.hr
      : [];
  }

  // ============================================================
  // FULL MOCK QUESTION BANK
  // ============================================================

  function getMockQuestions() {

    const combined = [

      ...getBank("hr").slice(0, 2),

      ...getBank("technical").slice(0, 1),

      ...getBank("dsa").slice(0, 1),

      ...getBank("resume").slice(0, 1)

    ];

    return combined.map((q, index) => ({
      id: `mock_${index + 1}_${q.id}`,
      text: q.text
    }));
  }

  // ============================================================
  // ROLE BASED QUESTIONS
  // ============================================================

  function getRoleQuestions() {

    return getBank("role-based");
  }

  // ============================================================
  // PREPARE QUESTIONS
  // ============================================================

  function prepareQuestions() {

    let pool = [];

    switch (interviewState.type) {

      case "mock":
        pool = getMockQuestions();
        break;

      case "role-based":
        pool = getRoleQuestions();
        break;

      case "resume":
        pool = getBank("resume");
        break;

      case "technical":
        pool = getBank("technical");
        break;

      case "dsa":
        pool = getBank("dsa");
        break;

      case "hr":
      default:
        pool = getBank("hr");
        break;
    }

    // Shuffle questions
    pool = [...pool].sort(() => Math.random() - 0.5);

    // Exactly 5 questions
    interviewState.questions =
      pool.slice(0, MAX_QUESTIONS);

    totalQuestions.textContent =
      interviewState.questions.length;
  }

  // ============================================================
  // INITIALIZE
  // ============================================================

  function initializeInterview() {

    prepareQuestions();

    interviewTypeEl.textContent =
      interviewState.displayType;

    interviewDurationEl.textContent =
      "5 Questions";

    if (interviewRoleEl) {

      const savedRole =
        localStorage.getItem("targetRole") ||
        localStorage.getItem("resumeTitle") ||
        "General";

      interviewRoleEl.textContent =
        savedRole.replace("AI Resume - ", "");
    }

    displayQuestion();

    startTimer();
  }

  // ============================================================
  // DISPLAY QUESTION
  // ============================================================

  function displayQuestion() {

    if (
      interviewState.currentQuestionIndex >=
      interviewState.questions.length
    ) {

      finishInterview();
      return;
    }

    const question =
      interviewState.questions[
        interviewState.currentQuestionIndex
      ];

    interviewState.currentQuestion = question;

    const number =
      interviewState.currentQuestionIndex + 1;

    questionNum.textContent = number;

    questionContainer.innerHTML = `
      <div class="question-box">
        <div class="question-number">
          Question ${number}
        </div>

        <p class="question-text">
          ${escapeHtml(question.text)}
        </p>
      </div>
    `;

    answerInput.value = "";

    answerInput.placeholder =
      "Your answer will appear here when you speak...";

    progressPercent.textContent =
      Math.round(
        (number / interviewState.questions.length) * 100
      ) + "%";

    recordAnswerBtn.style.display = "inline-block";

    stopRecordingBtn.style.display = "none";

    submitAnswerBtn.disabled = false;

    updateAnsweredList();

    updateStatus(
      "Question ready. Click Hear Question or Start Recording.",
      "ready"
    );
  }

  // ============================================================
  // HTML ESCAPE
  // ============================================================

  function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
  }

  // ============================================================
  // TEXT TO SPEECH
  // ============================================================

  async function speakQuestion() {

    if (!interviewState.currentQuestion) return;

    try {

      updateStatus(
        "AI interviewer is speaking...",
        "speaking"
      );

      await voiceManager.speak(
        interviewState.currentQuestion.text,
        "high"
      );

      updateStatus(
        "Question complete. You can answer now.",
        "ready"
      );

    } catch (error) {

      console.error(error);

      updateStatus(
        "Unable to play question.",
        "error"
      );
    }
  }

  // ============================================================
  // VOICE MANAGER
  // ============================================================

  const voiceManager =
    typeof EnhancedVoiceManager !== "undefined"
      ? new EnhancedVoiceManager({

          voiceGender:
            localStorage.getItem("voiceGender") ||
            "female",

          speakingRate: 0.9,

          onListeningStart: () => {

            recordingIndicator.style.display =
              "block";

            recordAnswerBtn.style.display =
              "none";

            stopRecordingBtn.style.display =
              "inline-block";

            updateStatus(
              "Listening... Speak your answer.",
              "listening"
            );
          },

          onListeningEnd: () => {

            recordingIndicator.style.display =
              "none";

            recordAnswerBtn.style.display =
              "inline-block";

            stopRecordingBtn.style.display =
              "none";

            updateStatus(
              "Recording stopped.",
              "ready"
            );
          },

          onTranscript: result => {

            if (result.final) {

              const existingFinal =
                answerInput.dataset.finalText || "";

              const finalText =
                existingFinal
                  ? existingFinal + " " + result.text
                  : result.text;

              answerInput.dataset.finalText =
                finalText.trim();

              answerInput.value =
                finalText.trim();

            } else {

              const existingFinal =
                answerInput.dataset.finalText || "";

              answerInput.value =
                existingFinal
                  ? existingFinal + " " + result.text
                  : result.text;
            }

          },

          onError: error => {

            console.error(
              "Voice error:",
              error
            );

            updateStatus(
              "Voice error: " + error,
              "error"
            );
          }

        })
      : null;

  // ============================================================
  // START RECORDING
  // ============================================================

  // ============================================================
// START / STOP RECORDING
// ============================================================

async function startRecording() {

  console.log("START RECORDING CLICKED");

  if (!voiceManager) {
    alert("Voice manager is not initialized.");
    return;
  }

  if (!voiceManager.isRecognitionSupported()) {
    alert("Speech recognition is not supported. Please use Google Chrome.");
    return;
  }

  try {

    // First explicitly request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true
    });

    console.log("Microphone permission granted");
    console.log("Microphone tracks:", stream.getAudioTracks());

    // We only need the permission check.
    // SpeechRecognition will use the microphone separately.
    stream.getTracks().forEach(track => track.stop());

    // Clear previous answer
    answerInput.value = "";
    delete answerInput.dataset.finalText;
    delete answerInput.dataset.interim;

    recordingIndicator.style.display = "block";
    recordAnswerBtn.style.display = "none";
    stopRecordingBtn.style.display = "inline-block";

    updateStatus(
      "Listening... Speak your answer now.",
      "listening"
    );

    console.log("Starting Speech Recognition...");

    voiceManager.startListening();

  } catch (error) {

    console.error("MICROPHONE ERROR:", error);

    recordingIndicator.style.display = "none";
    recordAnswerBtn.style.display = "inline-block";
    stopRecordingBtn.style.display = "none";

    if (error.name === "NotAllowedError") {

      alert(
        "Microphone permission was denied. Please allow microphone access for this website and try again."
      );

    } else if (error.name === "NotFoundError") {

      alert(
        "No microphone was found. Please connect or enable a microphone."
      );

    } else {

      alert(
        "Microphone error: " + error.message
      );
    }
  }
}

function stopRecording() {

  console.log("Stopping speech recognition...");

  if (voiceManager) {

    try {
      voiceManager.stopListening();
    } catch (error) {
      console.error(
        "Stop recording error:",
        error
      );
    }
  }

  recordingIndicator.style.display = "none";
  recordAnswerBtn.style.display = "inline-block";
  stopRecordingBtn.style.display = "none";

  updateStatus(
    "Recording stopped. Your answer is shown below.",
    "ready"
  );
}

  // ============================================================
  // EVALUATE ANSWER
  // ============================================================

  async function evaluateAnswer(answer) {

    // Try backend first
    try {

      const base =
        window.API_BASE ||
        "http://127.0.0.1:3000";

      const response =
        await fetch(
          `${base}/api/interviews/${interviewState.interviewId}/answer`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              questionId:
                interviewState.currentQuestion.id,

              questionText:
                interviewState.currentQuestion.text,

              answer: answer
            })
          }
        );

      if (response.ok) {

        const data =
          await response.json();

        return normalizeEvaluation(data);
      }

    } catch (error) {

      console.warn(
        "Backend evaluation unavailable:",
        error
      );
    }

    // Local evaluation fallback
    return localEvaluation(answer);
  }

  // ============================================================
  // NORMALIZE BACKEND RESPONSE
  // ============================================================

  function normalizeEvaluation(data) {

    return {

      score:
        Number(data.score) || 70,

      rating:
        data.rating || getRating(data.score),

      feedback:
        data.feedback ||
        "Your answer was recorded successfully.",

      strengths:
        data.strengths ||
        ["You attempted the question."],

      improvements:
        data.improvements ||
        ["Add more specific examples and details."],

      improved_answer:
        data.improved_answer ||
        "Try to give a clear, structured answer with a relevant example."
    };
  }

  // ============================================================
  // LOCAL AI-LIKE EVALUATION
  // ============================================================

  function localEvaluation(answer) {

    const words =
      answer.trim().split(/\s+/).length;

    let score = 45;

    if (words >= 10) score += 10;

    if (words >= 25) score += 10;

    if (words >= 50) score += 10;

    if (
      /because|example|experience|project|result|learned|improved/i
        .test(answer)
    ) {

      score += 10;
    }

    if (
      /first|second|finally|situation|task|action|result/i
        .test(answer)
    ) {

      score += 5;
    }

    score = Math.min(score, 95);

    return {

      score,

      rating: getRating(score),

      feedback:
        score >= 80
          ? "Strong answer with good detail and structure."
          : score >= 65
            ? "Good attempt. Add more specific examples and explain your contribution clearly."
            : "Your answer needs more detail. Try using a structured approach and include a real example.",

      strengths: [
        words >= 25
          ? "Provided a reasonably detailed response."
          : "Attempted the question.",

        /example|project|experience/i.test(answer)
          ? "Included relevant experience or examples."
          : "Response was relevant to the question."
      ],

      improvements: [
        "Use a clear and structured response.",
        "Include specific examples where possible.",
        "Explain the result or outcome of your actions."
      ],

      improved_answer:
        "A stronger answer should briefly explain the situation, what you were responsible for, the actions you took, and the final result."
    };
  }

  // ============================================================
  // RATING
  // ============================================================

  function getRating(score) {

    score = Number(score) || 0;

    if (score >= 85) return "Excellent";

    if (score >= 70) return "Good";

    if (score >= 50) return "Average";

    return "Needs Improvement";
  }

  // ============================================================
  // SUBMIT ANSWER
  // ============================================================

  async function submitAnswer() {

    const answer =
      answerInput.value.trim();

    if (!answer) {

      alert(
        "Please answer the question before submitting."
      );

      answerInput.focus();

      return;
    }

    stopRecording();

    loadingOverlay.style.display =
      "flex";

    submitAnswerBtn.disabled = true;

    updateStatus(
      "Evaluating your answer...",
      "processing"
    );

    try {

      const evaluation =
        await evaluateAnswer(answer);

      interviewState.answers.push({

        question:
          interviewState.currentQuestion.text,

        questionId:
          interviewState.currentQuestion.id,

        answer,

        score:
          evaluation.score,

        rating:
          evaluation.rating,

        feedback:
          evaluation.feedback,

        strengths:
          evaluation.strengths,

        improvements:
          evaluation.improvements,

        improved_answer:
          evaluation.improved_answer,

        timestamp:
          new Date().toISOString()
      });

      saveInterviewData();

      loadingOverlay.style.display =
        "none";

      showFeedback(evaluation);

      updateAnsweredList();

    } catch (error) {

      console.error(error);

      loadingOverlay.style.display =
        "none";

      alert(
        "Something went wrong while evaluating the answer."
      );

      submitAnswerBtn.disabled = false;
    }
  }

  // ============================================================
  // SHOW FEEDBACK
  // ============================================================

  function showFeedback(data) {

    const modal =
      document.createElement("div");

    modal.className =
      "feedback-modal";

    modal.innerHTML = `

      <div class="feedback-container">

        <div class="feedback-header">

          <h4>AI Answer Evaluation</h4>

          <button
            class="btn-close"
            id="closeFeedbackBtn">
          </button>

        </div>

        <div class="feedback-body">

          <div class="score-box">

            <div class="score-number">
              ${data.score}
            </div>

            <div>/100</div>

            <div class="rating">
              ${escapeHtml(data.rating)}
            </div>

          </div>

          <div class="feedback-section">

            <h6>AI Feedback</h6>

            <p>
              ${escapeHtml(data.feedback)}
            </p>

          </div>

          <div class="feedback-section">

            <h6>Strengths</h6>

            <ul>
              ${(data.strengths || [])
                .map(
                  x =>
                    `<li>${escapeHtml(x)}</li>`
                )
                .join("")}
            </ul>

          </div>

          <div class="feedback-section">

            <h6>Areas to Improve</h6>

            <ul>
              ${(data.improvements || [])
                .map(
                  x =>
                    `<li>${escapeHtml(x)}</li>`
                )
                .join("")}
            </ul>

          </div>

          <div class="feedback-section">

            <h6>Suggested Better Answer</h6>

            <div class="improved-answer">
              ${escapeHtml(
                data.improved_answer
              )}
            </div>

          </div>

          <button
            id="continueInterviewBtn"
            class="btn btn-primary w-100 mt-3">

            Continue to Next Question

          </button>

        </div>

      </div>
    `;

    document.body.appendChild(modal);

    document
      .getElementById("closeFeedbackBtn")
      .addEventListener(
        "click",
        () => continueToNext(modal)
      );

    document
      .getElementById("continueInterviewBtn")
      .addEventListener(
        "click",
        () => continueToNext(modal)
      );
  }

  // ============================================================
  // NEXT QUESTION
  // ============================================================

  function continueToNext(modal) {

    if (modal) modal.remove();

    interviewState.currentQuestionIndex++;

    submitAnswerBtn.disabled = false;

    if (
      interviewState.currentQuestionIndex >=
      interviewState.questions.length
    ) {

      finishInterview();

      return;
    }

    displayQuestion();

    updateStatus(
      "Next question ready.",
      "ready"
    );
  }

  // ============================================================
  // SKIP
  // ============================================================

  function skipQuestion() {

    if (!interviewState.currentQuestion)
      return;

    const confirmed =
      confirm(
        "Are you sure you want to skip this question?"
      );

    if (!confirmed) return;

    interviewState.skippedQuestions.push(
      interviewState.currentQuestion.id
    );

    interviewState.answers.push({

      question:
        interviewState.currentQuestion.text,

      questionId:
        interviewState.currentQuestion.id,

      answer: "[SKIPPED]",

      score: 0,

      rating: "Skipped",

      feedback:
        "Question skipped by the candidate.",

      timestamp:
        new Date().toISOString()
    });

    saveInterviewData();

    interviewState.currentQuestionIndex++;

    displayQuestion();
  }

  // ============================================================
  // REPEAT
  // ============================================================

  function repeatQuestion() {

    speakQuestion();
  }

  // ============================================================
  // CLEAR ANSWER
  // ============================================================

  function clearAnswer() {

  answerInput.value = "";

  delete answerInput.dataset.finalText;

  delete answerInput.dataset.interim;

  answerInput.focus();
}

  // ============================================================
  // ANSWERED LIST
  // ============================================================

  function updateAnsweredList() {

    if (!interviewState.answers.length) {

      answeredList.innerHTML =
        `<p class="text-muted small">
          No questions answered yet
        </p>`;

      return;
    }

    answeredList.innerHTML =
      interviewState.answers
        .map((answer, index) => `

          <div class="answered-item mb-2">

            <div>
              <strong>
                Q${index + 1}
              </strong>

              ${answer.answer === "[SKIPPED]"
                ? "Skipped"
                : "Answered"}

            </div>

            <span class="badge ${
              answer.score >= 80
                ? "bg-success"
                : answer.score >= 60
                  ? "bg-warning text-dark"
                  : "bg-danger"
            }">

              ${answer.score}/100

            </span>

          </div>

        `)
        .join("");
  }

  // ============================================================
  // FINAL REPORT
  // ============================================================

  function finishInterview() {

    stopRecording();

    interviewState.isActive = false;

    const validAnswers =
      interviewState.answers.filter(
        a => a.answer !== "[SKIPPED]"
      );

    const overallScore =
      validAnswers.length
        ? Math.round(
            validAnswers.reduce(
              (sum, a) =>
                sum + Number(a.score || 0),
              0
            ) / validAnswers.length
          )
        : 0;

    const strengths = [];

    const improvements = [];

    validAnswers.forEach(answer => {

      if (answer.strengths) {

        strengths.push(
          ...answer.strengths
        );
      }

      if (answer.improvements) {

        improvements.push(
          ...answer.improvements
        );
      }
    });

    const summary = {

      overallScore,

      totalAnswered:
        validAnswers.length,

      totalSkipped:
        interviewState.skippedQuestions.length,

      interviewType:
        interviewState.displayType,

      strengths:
        [...new Set(strengths)].slice(0, 5),

      weaknesses:
        [...new Set(improvements)].slice(0, 5),

      recommendations: [
        "Practice answering with a clear structure.",
        "Give specific examples from your projects or experience.",
        "Continue practicing mock interviews regularly.",
        "Review questions where your score was low."
      ],

      recommendedTopics:
        getRecommendedTopics(validAnswers)
    };

    saveFinalProgress(summary);

    displayFinalReport(summary);
  }

  // ============================================================
  // RECOMMENDED TOPICS
  // ============================================================

  function getRecommendedTopics(answers) {

    const topics = [];

    answers.forEach(answer => {

      if (Number(answer.score) < 70) {

        const question =
          answer.question.toLowerCase();

        if (
          question.includes("database") ||
          question.includes("api") ||
          question.includes("javascript")
        ) {

          topics.push("Technical Fundamentals");
        }

        if (
          question.includes("array") ||
          question.includes("algorithm") ||
          question.includes("binary") ||
          question.includes("data structure")
        ) {

          topics.push("Data Structures & Algorithms");
        }

        if (
          question.includes("team") ||
          question.includes("challenge") ||
          question.includes("strength")
        ) {

          topics.push("HR & Behavioral Questions");
        }

        if (
          question.includes("project") ||
          question.includes("resume")
        ) {

          topics.push("Project & Resume Preparation");
        }
      }
    });

    if (!topics.length) {

      topics.push(
        "Technical Fundamentals",
        "Communication Skills"
      );
    }

    return [...new Set(topics)];
  }

  // ============================================================
  // DISPLAY FINAL REPORT
  // ============================================================

  function displayFinalReport(summary) {

    recordAnswerBtn.style.display =
      "none";

    stopRecordingBtn.style.display =
      "none";

    submitAnswerBtn.style.display =
      "none";

    skipQuestionBtn.style.display =
      "none";

    repeatQuestionBtn.style.display =
      "none";

    speakQuestionBtn.style.display =
      "none";

    questionContainer.innerHTML = `

      <div class="final-report">

        <h3 class="mb-4">
          🎉 Interview Completed
        </h3>

        <div class="final-score">

          <div class="score-number">
            ${summary.overallScore}
          </div>

          <div class="score-label">
            Overall Score / 100
          </div>

        </div>

        <div class="row g-3 mt-4">

          <div class="col-md-4">

            <div class="report-card">

              <h6>Questions Answered</h6>

              <strong>
                ${summary.totalAnswered}
              </strong>

            </div>

          </div>

          <div class="col-md-4">

            <div class="report-card">

              <h6>Questions Skipped</h6>

              <strong>
                ${summary.totalSkipped}
              </strong>

            </div>

          </div>

          <div class="col-md-4">

            <div class="report-card">

              <h6>Interview Type</h6>

              <strong>
                ${escapeHtml(
                  summary.interviewType
                )}
              </strong>

            </div>

          </div>

        </div>

        <div class="report-section mt-4">

          <h5>💪 Strengths</h5>

          <ul>

            ${summary.strengths
              .map(
                x =>
                  `<li>${escapeHtml(x)}</li>`
              )
              .join("")}

          </ul>

        </div>

        <div class="report-section">

          <h5>📈 Areas to Improve</h5>

          <ul>

            ${summary.weaknesses
              .map(
                x =>
                  `<li>${escapeHtml(x)}</li>`
              )
              .join("")}

          </ul>

        </div>

        <div class="report-section">

          <h5>🎯 Recommended Topics</h5>

          <ul>

            ${summary.recommendedTopics
              .map(
                x =>
                  `<li>${escapeHtml(x)}</li>`
              )
              .join("")}

          </ul>

        </div>

        <div class="report-section">

          <h5>💡 Recommendations</h5>

          <ul>

            ${summary.recommendations
              .map(
                x =>
                  `<li>${escapeHtml(x)}</li>`
              )
              .join("")}

          </ul>

        </div>

        <div class="mt-4">

          <button
            class="btn btn-primary me-2"
            onclick="window.location.href='interviewType.html'">

            Take Another Interview

          </button>

          <button
            class="btn btn-outline-primary"
            onclick="window.location.href='progress.html'">

            View Progress

          </button>

        </div>

      </div>
    `;

    updateStatus(
      "Interview completed successfully.",
      "success"
    );
  }

  // ============================================================
  // SAVE INTERVIEW
  // ============================================================

  function saveInterviewData() {

    localStorage.setItem(
      "lastInterviewAnswers",
      JSON.stringify(
        interviewState.answers
      )
    );

    localStorage.setItem(
      "lastInterviewType",
      interviewState.displayType
    );

    localStorage.setItem(
      "lastInterviewDate",
      new Date().toISOString()
    );
  }

  // ============================================================
  // SAVE PROGRESS
  // ============================================================

  function saveFinalProgress(summary) {

    const history =
      JSON.parse(
        localStorage.getItem(
          "interviewHistory"
        ) || "[]"
      );

    history.push({

      id: interviewState.interviewId,

      type:
        interviewState.displayType,

      score:
        summary.overallScore,

      answered:
        summary.totalAnswered,

      skipped:
        summary.totalSkipped,

      date:
        new Date().toISOString(),

      weaknesses:
        summary.weaknesses,

      topics:
        summary.recommendedTopics
    });

    localStorage.setItem(
      "interviewHistory",
      JSON.stringify(history)
    );

    localStorage.setItem(
      "latestInterviewResult",
      JSON.stringify(summary)
    );

    saveInterviewData();
  }

  // ============================================================
  // STATUS
  // ============================================================

  function updateStatus(message, type = "default") {

    let status =
      document.getElementById(
        "statusText"
      );

    if (!status) {

      const container =
        document.createElement("div");

      container.id =
        "statusIndicator";

      container.className =
        "status-indicator";

      container.innerHTML =
        `<span id="statusText"></span>`;

      document.body.appendChild(
        container
      );

      status =
        document.getElementById(
          "statusText"
        );
    }

    status.textContent = message;

    const indicator =
      document.getElementById(
        "statusIndicator"
      );

    if (indicator) {

      indicator.className =
        `status-indicator status-${type}`;
    }
  }

  // ============================================================
  // TIMER
  // ============================================================

  let timerInterval = null;

  function startTimer() {

    const duration =
      15 * 60;

    const endTime =
      Date.now() + duration * 1000;

    timerInterval =
      setInterval(() => {

        const remaining =
          Math.max(
            0,
            endTime - Date.now()
          );

        const seconds =
          Math.floor(
            remaining / 1000
          );

        const minutes =
          Math.floor(seconds / 60);

        const secs =
          seconds % 60;

        if (timeRemainingEl) {

          timeRemainingEl.textContent =
            `${minutes}:${String(secs).padStart(2, "0")}`;
        }

        if (remaining <= 0) {

          clearInterval(
            timerInterval
          );

          finishInterview();
        }

      }, 1000);
  }

  // ============================================================
  // END INTERVIEW BUTTON
  // ============================================================

  function endInterview() {

    if (!interviewState.answers.length) {

      if (
        !confirm(
          "You haven't answered any questions. End interview?"
        )
      ) {

        return;
      }
    }

    finishInterview();
  }

  // ============================================================
  // EVENTS
  // ============================================================

  speakQuestionBtn?.addEventListener(
    "click",
    speakQuestion
  );

  recordAnswerBtn?.addEventListener(
    "click",
    startRecording
  );

  stopRecordingBtn?.addEventListener(
    "click",
    stopRecording
  );

  submitAnswerBtn?.addEventListener(
    "click",
    submitAnswer
  );

  clearAnswerBtn?.addEventListener(
    "click",
    clearAnswer
  );

  repeatQuestionBtn?.addEventListener(
    "click",
    repeatQuestion
  );

  skipQuestionBtn?.addEventListener(
    "click",
    skipQuestion
  );

  endInterviewBtn?.addEventListener(
    "click",
    endInterview
  );

  // ============================================================
  // START
  // ============================================================

  initializeInterview();

});