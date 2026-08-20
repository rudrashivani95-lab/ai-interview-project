// Routes for AI-driven interviews: start, submit answers, fetch interview
const express = require('express');
const auth = require('../middleware/auth');
const Interview = require('../models/Interview');
const { evaluateAnswerMock, generateAdaptiveQuestion, generateFeedback } = require('../utils/ai');
const { getRandomQuestion, generateResumeBasedQuestions, initializeSession, clearSession } = require('../utils/questionGenerator');

const router = express.Router();

// Helper: Generate context-aware follow-up questions
async function getNextContextualQuestion(interview, answerText, sessionId, askedQuestionIds = []) {
  try {
    // Generate follow-up based on answer content and previous answers
    const difficulty = calculateDifficulty(interview.answers.length);
    const category = interview.type;
    const contextKeywords = extractKeywordsFromAnswer(answerText);
    
    // Generate adaptive question with client-side asked question tracking
    const questionNum = interview.answers.length + 1;
    const followUp = generateAdaptiveQuestion(
      category, 
      difficulty, 
      contextKeywords, 
      sessionId,
      askedQuestionIds // Pass asked questions to prevent repetition
    );
    return followUp;
  } catch (err) {
    console.error('Error generating contextual question:', err);
    // Fallback to random question
    return getRandomQuestion(interview.type, sessionId);
  }
}

// Helper: Extract keywords from answer for context
function extractKeywordsFromAnswer(answerText) {
  const words = answerText.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  return words.slice(0, 5); // Top 5 keywords
}

// Helper: Calculate difficulty level based on question count
function calculateDifficulty(answeredCount) {
  if (answeredCount < 3) return 'basic';
  if (answeredCount < 6) return 'intermediate';
  return 'advanced';
}

// Start an interview session with randomized questions
router.post('/start', auth, async (req, res) => {
  try {
    const { type = 'general', count = 5, resumeText = '' } = req.body;
    const userId = String(req.user.id);
    
    console.log(`Interview start request - Type: ${type}, Count: ${count}, User: ${userId}`);

    // Validate type
    const validTypes = ['general', 'dsa', 'rolebased', 'resumebased', 'HR', 'Technical', 'behavioral'];
    if (!validTypes.includes(type)) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        success: false,
        message: `Invalid interview type: "${type}". Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const sessionId = `${userId}_${Date.now()}`; // Unique session ID per user per start

    // Initialize session tracking
    initializeSession(sessionId);

    let questions = [];

    // Generate questions based on interview type
    if (type === 'resumebased') {
      questions = generateResumeBasedQuestions(resumeText, sessionId);
    } else {
      // For other types, generate specified count
      for (let i = 0; i < count; i++) {
        const question = getRandomQuestion(type, sessionId);
        questions.push(question);
      }
    }

    // Create interview record
    const interview = await Interview.create({
      user: req.user.id,
      type,
      questions: questions.map(q => ({
        questionId: q.questionId,
        text: q.questionText,
        expectedKeywords: [], // Placeholder for future use
      })),
      answers: [],
      sessionId: sessionId, // Store session for later reference
    });

    res.setHeader('Content-Type', 'application/json');
    res.status(201).json({
      success: true,
      interviewId: interview._id,
      type: interview.type,
      questions: questions.map(q => ({
        questionId: q.questionId,
        questionText: q.questionText,
      })),
      totalQuestions: questions.length,
      sessionId: sessionId,
    });
  } catch (err) {
    console.error('Interview start error:', err.message);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message,
    });
  }
});

// Get next question in interview (adaptive)
router.post('/:id/next-question', auth, async (req, res) => {
  try {
    const { answerText = '', askedQuestionIds = [] } = req.body;
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }

    if (String(interview.user) !== req.user.id) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const sessionId = interview.sessionId;

    // Pass asked question IDs to the context function for better filtering
    const nextQuestion = await getNextContextualQuestion(
      interview, 
      answerText, 
      sessionId,
      askedQuestionIds // Pass client-side asked questions for deduplication
    );

    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      questionId: nextQuestion.questionId,
      questionText: nextQuestion.questionText,
      answerCount: interview.answers.length,
    });
  } catch (err) {
    console.error('Next question error:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Submit an answer to a question in an interview
router.post('/:id/answer', auth, async (req, res) => {
  try {
    const { text, questionId } = req.body;
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (String(interview.user) !== req.user.id) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const evalResult = await evaluateAnswerMock(text || '');
    const answer = { questionId, text, evaluation: evalResult };
    interview.answers.push(answer);

    // Recompute overall score (average of answers overall)
    const total = interview.answers.reduce((s, a) => s + (a.evaluation?.overall || 0), 0);
    interview.overallScore = interview.answers.length ? Math.round(total / interview.answers.length) : 0;
    await interview.save();
    
    // Generate next question based on this answer
    const nextQuestion = await getNextContextualQuestion(interview, text, interview.sessionId);
    
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      answer,
      overallScore: interview.overallScore,
      answerCount: interview.answers.length,
      nextQuestion: {
        questionId: nextQuestion.questionId,
        questionText: nextQuestion.questionText,
      }
    });
  } catch (err) {
    console.error('Answer submission error:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Get interview details
router.get('/:id', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    if (String(interview.user) !== req.user.id) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      interview,
    });
  } catch (err) {
    console.error('Get interview error:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// End interview and generate summary
router.post('/:id/summary', auth, async (req, res) => {
  try {
    const { answers: answersList = [] } = req.body;
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    
    if (String(interview.user) !== req.user.id) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // Calculate comprehensive feedback
    const totalScore = interview.overallScore;
    const feedback = generateFeedback(interview.answers, interview.type);
    
    const summary = {
      interviewId: interview._id,
      type: interview.type,
      totalQuestions: interview.answers.length,
      overallScore: totalScore,
      strengths: feedback.strengths || [
        'Clear communication',
        'Structured thinking',
        'Problem-solving approach'
      ],
      weaknesses: feedback.weaknesses || [
        'Could provide more examples',
        'Add more technical depth',
        'Practice time management'
      ],
      feedback: feedback.feedback || 'Good effort. Keep practicing to improve further.',
      improvements: [
        '1. Focus on providing specific examples from your experience',
        '2. Practice explaining complex concepts in simple terms',
        '3. Work on your pacing and confidence',
        '4. Research the company and role thoroughly',
        '5. Prepare behavioral stories using STAR method'
      ],
      recommendations: [
        'Schedule mock interviews weekly',
        'Record yourself and review',
        'Study common interview questions by category',
        'Improve technical depth if technical role',
        'Work on soft skills and communication'
      ],
      topics: extractTopics(interview.type),
      completedAt: new Date(),
    };

    // Mark interview as complete
    interview.completed = true;
    interview.summary = summary;
    await interview.save();

    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      summary
    });
  } catch (err) {
    console.error('Summary error:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Helper: Extract topics to practice
function extractTopics(interviewType) {
  const topicMap = {
    'HR': ['Behavioral Stories', 'Communication Skills', 'Team Collaboration', 'Conflict Resolution'],
    'Technical': ['System Design', 'Data Structures', 'Algorithms', 'Problem Solving'],
    'DSA': ['Arrays', 'Linked Lists', 'Trees', 'Graphs', 'Dynamic Programming'],
    'behavioral': ['STAR Method', 'Conflict Handling', 'Leadership', 'Adaptability'],
    'general': ['Communication', 'Problem Solving', 'Teamwork', 'Initiative']
  };
  
  return topicMap[interviewType] || topicMap['general'];
}

module.exports = router;
