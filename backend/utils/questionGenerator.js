// Question Generator: Randomly selects unique questions from the question bank
const questionBank = require('./questionBank');

// Store used questions per session (in-memory; clear when session ends)
const sessionUsedQuestions = {};

/**
 * Initialize a new session and track used questions
 * @param {string} sessionId - Unique session identifier
 */
function initializeSession(sessionId) {
  if (!sessionUsedQuestions[sessionId]) {
    sessionUsedQuestions[sessionId] = new Set();
  }
}

/**
 * Get a random question from the specified category
 * Ensures no repetition within the same session
 * @param {string} type - Question category (general, dsa, rolebased, resumebased)
 * @param {string} sessionId - Unique session identifier for tracking
 * @returns {object} { questionId, questionText }
 */
function getRandomQuestion(type, sessionId) {
  // Validate type
  const validTypes = ['general', 'dsa', 'rolebased', 'resumebased'];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid question type: ${type}. Must be one of: ${validTypes.join(', ')}`);
  }

  // Initialize session if not exists
  initializeSession(sessionId);

  const questions = questionBank[type];
  if (!questions || questions.length === 0) {
    throw new Error(`No questions found for type: ${type}`);
  }

  // Get available questions (not yet used in this session)
  const usedSet = sessionUsedQuestions[sessionId];
  const availableQuestions = questions.filter(q => !usedSet.has(q.id));

  // If all questions used, reset the session
  if (availableQuestions.length === 0) {
    sessionUsedQuestions[sessionId].clear();
    return getRandomQuestion(type, sessionId); // Recursive call after reset
  }

  // Select random question from available
  const randomQuestion = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];

  // Mark as used
  sessionUsedQuestions[sessionId].add(randomQuestion.id);

  return {
    questionId: randomQuestion.id,
    questionText: randomQuestion.text,
  };
}

/**
 * Get multiple random questions for interview session
 * @param {string} type - Question category
 * @param {number} count - Number of questions to generate
 * @param {string} sessionId - Unique session identifier
 * @returns {array} Array of { questionId, questionText }
 */
function getRandomQuestions(type, count = 5, sessionId) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    questions.push(getRandomQuestion(type, sessionId));
  }
  return questions;
}

/**
 * Clear session data (call when user ends interview)
 * @param {string} sessionId - Session to clear
 */
function clearSession(sessionId) {
  delete sessionUsedQuestions[sessionId];
}

/**
 * Generate resume-based questions
 * If resumeText is provided, creates contextual questions
 * Otherwise falls back to generic resume questions
 * @param {string} resumeText - Resume content
 * @param {string} sessionId - Session identifier
 * @returns {array} Array of questions
 */
function generateResumeBasedQuestions(resumeText, sessionId) {
  initializeSession(sessionId);

  // If no resume text, use generic resume questions
  if (!resumeText || resumeText.trim().length === 0) {
    return getRandomQuestions('resumebased', 5, sessionId);
  }

  // Extract some context from resume (simplified)
  const resumeLines = resumeText.toLowerCase();
  const hasProjects = resumeLines.includes('project') || resumeLines.includes('built');
  const hasLeadership = resumeLines.includes('lead') || resumeLines.includes('managed');
  const hasTechnical = resumeLines.includes('tech') || resumeLines.includes('develop') || resumeLines.includes('engineer');

  // Generate contextual questions based on resume content
  const contextQuestions = [];

  if (hasProjects) {
    contextQuestions.push({
      questionId: 'ctx_proj_1',
      questionText: 'Can you walk us through one of the significant projects mentioned in your resume? What was your role and what did you accomplish?',
    });
    contextQuestions.push({
      questionId: 'ctx_proj_2',
      questionText: 'What was the most challenging aspect of the projects you\'ve worked on, and how did you address it?',
    });
  }

  if (hasLeadership) {
    contextQuestions.push({
      questionId: 'ctx_lead_1',
      questionText: 'Describe your leadership experience. How did you motivate your team and manage conflicts?',
    });
    contextQuestions.push({
      questionId: 'ctx_lead_2',
      questionText: 'Tell us about a time when you had to guide or mentor someone on your team.',
    });
  }

  if (hasTechnical) {
    contextQuestions.push({
      questionId: 'ctx_tech_1',
      questionText: 'What technical skills do you feel most confident about, and how have you applied them in real projects?',
    });
    contextQuestions.push({
      questionId: 'ctx_tech_2',
      questionText: 'How do you stay current with emerging technologies in your field?',
    });
  }

  // Fill remaining slots with generic resume questions
  while (contextQuestions.length < 5) {
    contextQuestions.push(getRandomQuestion('resumebased', sessionId));
  }

  return contextQuestions.slice(0, 10); // Return up to 10 questions
}

module.exports = {
  getRandomQuestion,
  getRandomQuestions,
  clearSession,
  generateResumeBasedQuestions,
  initializeSession,
};
