// AI Interview (Text-based): Similar to voiceInterview but without speech API
async function authPost(path, body) { return window.apiPost(path, body); }

document.addEventListener('DOMContentLoaded', () => {
  const stored = JSON.parse(localStorage.getItem('currentInterview') || 'null');
  let interview = stored;
  let currentIndex = parseInt(localStorage.getItem('currentQuestionIndex') || '0');

  const questionContainer = document.getElementById('questionContainer');
  const answerInput = document.getElementById('answerInput');
  const answersList = document.getElementById('answersList');
  const interviewTypeEl = document.getElementById('interviewType');
  const interviewProgressEl = document.getElementById('interviewProgress');

  if (!interview) {
    return alert('No interview loaded. Start an interview from Interview Type page.');
  }

  interviewTypeEl.textContent = interview.type || 'Unknown';

  // Render current question
  function renderQuestion() {
    if (currentIndex < interview.questions.length) {
      const q = interview.questions[currentIndex];
      questionContainer.textContent = q.questionText || q.text || 'No question text available.';
      interviewProgressEl.textContent = `${currentIndex + 1} / ${interview.totalQuestions || interview.questions.length}`;
    } else {
      questionContainer.textContent = 'Interview complete! All questions answered.';
      interviewProgressEl.textContent = `${interview.totalQuestions || interview.questions.length} / ${interview.totalQuestions || interview.questions.length}`;
    }
    answerInput.value = '';
    answerInput.focus();
  }

  renderQuestion();

  function appendAnswerItem(text, evalResult) {
    const el = document.createElement('div');
    el.className = 'list-group-item';
    const score = evalResult?.overall || '--';
    el.innerHTML = `<strong>Q${currentIndex}:</strong> ${text.substring(0, 100)}...<br><small>Score: ${score}/100</small>`;
    answersList.insertBefore(el, answersList.firstChild);
  }

  // Submit answer
  document.getElementById('submitAnswerBtn').addEventListener('click', async () => {
    const text = answerInput.value.trim();
    if (!text) return alert('Please provide an answer before submitting');

    const q = interview.questions[currentIndex];
    const { ok, data } = await authPost(`/api/interviews/${interview.interviewId}/answer`, {
      text,
      questionId: q.questionId,
    });

    if (!ok) return alert(data.message || data.error || 'Failed to submit answer');

    appendAnswerItem(text, data.answer?.evaluation);
    currentIndex++;
    localStorage.setItem('currentQuestionIndex', String(currentIndex));
    
    // Auto-advance if not at end
    if (currentIndex < interview.totalQuestions) {
      renderQuestion();
    } else {
      document.getElementById('submitAnswerBtn').disabled = true;
      alert('You have answered all questions!');
      window.location.href = 'evaluation.html';
    }
  });

  // Next question button
  const nextBtn = document.getElementById('nextQuestionBtn');
  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      try {
        // Get next random question from backend
        const { ok, data } = await authPost(`/api/interviews/${interview.interviewId}/next-question`, {});

        if (!ok) {
          return alert(data.message || data.error || 'Failed to get next question');
        }

        // Add new question to interview
        interview.questions.push({
          questionId: data.questionId,
          questionText: data.questionText,
        });

        currentIndex++;
        localStorage.setItem('currentQuestionIndex', String(currentIndex));
        renderQuestion();
      } catch (err) {
        console.error('Error getting next question:', err);
        alert('Failed to get next question. Please try again.');
      }
    });
  }

  // End interview
  const endBtn = document.getElementById('endInterviewBtn');
  if (endBtn) {
    endBtn.addEventListener('click', () => {
      localStorage.setItem('currentInterview', JSON.stringify(interview));
      window.location.href = 'evaluation.html';
    });
  }
});
