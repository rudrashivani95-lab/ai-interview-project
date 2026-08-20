// ========== Virtual Interview API Routes ==========
// Handles all virtual interview operations: start, submit answers, get results, download reports

const express = require('express');
const router = express.Router();
const InterviewRecord = require('../models/InterviewRecord');
const FeedbackAnalyzer = require('../feedbackAnalyzer');
const PDFDocument = require('pdfkit');

const analyzer = new FeedbackAnalyzer();

/**
 * POST /api/virtual-interviews/start
 * Initialize a new virtual interview session
 */
router.post('/start', async (req, res) => {
  try {
    const { userId, interviewType, questionCount } = req.body;

    if (!userId || !interviewType) {
      return res.status(400).json({ error: 'userId and interviewType are required' });
    }

    const interviewId = `vi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new interview record
    const interviewRecord = new InterviewRecord({
      userId,
      interviewId,
      interviewType,
      totalQuestions: questionCount || 10,
      status: 'in-progress'
    });

    await interviewRecord.save();

    // Get initial question
    const firstQuestion = await getQuestionForInterview(interviewType, 0);

    res.json({
      success: true,
      interviewId,
      interviewType,
      totalQuestions: questionCount || 10,
      questionNumber: 1,
      question: firstQuestion,
      startTime: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Virtual Interview Start Error]:', error);
    res.status(500).json({ error: 'Failed to start interview', message: error.message });
  }
});

/**
 * POST /api/virtual-interviews/:interviewId/submit-answer
 * Submit an answer and get feedback
 */
router.post('/:interviewId/submit-answer', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { questionNumber, question, answer, answerDuration } = req.body;

    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({ error: 'Answer cannot be empty' });
    }

    // Find interview record
    const interviewRecord = await InterviewRecord.findOne({ interviewId });
    if (!interviewRecord) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Analyze answer using FeedbackAnalyzer
    const category = interviewRecord.interviewType;
    const feedback = await analyzer.analyzeAnswer(question, answer, category);

    // Store answer in transcript
    interviewRecord.transcript.push({
      questionNumber,
      question,
      questionCategory: category,
      answer,
      answerDuration,
      timestamp: new Date(),
      isSkipped: false,
      feedback: {
        rating: feedback.rating,
        score: feedback.score,
        text: feedback.feedback,
        improvedAnswer: feedback.improved_answer
      }
    });

    interviewRecord.questionsAnswered++;

    // Update communication score (based on answer length and clarity)
    const answerLength = answer.split(' ').length;
    const communicationScore = Math.min(100, 50 + (answerLength / 2) + feedback.score * 0.5);
    interviewRecord.scores.communication = Math.round(communicationScore);

    // Update technical score if applicable
    if (category === 'technical' || category === 'dsa') {
      interviewRecord.scores.technical = feedback.score;
    }

    // Update clarity and relevance scores
    interviewRecord.scores.clarity = Math.round((feedback.metrics?.clarityScore || 0));
    interviewRecord.scores.relevance = Math.round((feedback.metrics?.relevanceScore || 0) * 100);

    // Update confidence score (simulate based on speech patterns)
    const confidenceScore = Math.min(100, 50 + (answerDuration / 10) + (answerLength / 5));
    interviewRecord.scores.confidence = Math.round(confidenceScore);

    // Recalculate overall score
    interviewRecord.calculateOverallScore();

    await interviewRecord.save();

    // Get next question
    const nextQuestionNum = questionNumber + 1;
    let nextQuestion = null;
    let isComplete = false;

    if (nextQuestionNum <= interviewRecord.totalQuestions) {
      nextQuestion = await getQuestionForInterview(category, nextQuestionNum - 1);
    } else {
      isComplete = true;
    }

    res.json({
      success: true,
      feedback: {
        rating: feedback.rating,
        score: feedback.score,
        text: feedback.feedback,
        improvedAnswer: feedback.improved_answer
      },
      nextQuestion: nextQuestion || null,
      isComplete,
      currentScore: interviewRecord.scores.overall,
      questionsAnswered: interviewRecord.questionsAnswered,
      questionsRemaining: Math.max(0, interviewRecord.totalQuestions - nextQuestionNum + 1)
    });
  } catch (error) {
    console.error('[Submit Answer Error]:', error);
    res.status(500).json({ error: 'Failed to submit answer', message: error.message });
  }
});

/**
 * POST /api/virtual-interviews/:interviewId/skip-question
 * Skip current question and move to next
 */
router.post('/:interviewId/skip-question', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { questionNumber } = req.body;

    const interviewRecord = await InterviewRecord.findOne({ interviewId });
    if (!interviewRecord) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    interviewRecord.questionsSkipped++;

    const nextQuestionNum = questionNumber + 1;
    let nextQuestion = null;
    let isComplete = false;

    if (nextQuestionNum <= interviewRecord.totalQuestions) {
      nextQuestion = await getQuestionForInterview(interviewRecord.interviewType, nextQuestionNum - 1);
    } else {
      isComplete = true;
    }

    await interviewRecord.save();

    res.json({
      success: true,
      nextQuestion: nextQuestion || null,
      isComplete,
      questionsSkipped: interviewRecord.questionsSkipped
    });
  } catch (error) {
    console.error('[Skip Question Error]:', error);
    res.status(500).json({ error: 'Failed to skip question', message: error.message });
  }
});

/**
 * POST /api/virtual-interviews/:interviewId/complete
 * Complete interview and generate results
 */
router.post('/:interviewId/complete', async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { duration } = req.body;

    const interviewRecord = await InterviewRecord.findOne({ interviewId });
    if (!interviewRecord) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    interviewRecord.endTime = new Date();
    interviewRecord.duration = duration;
    interviewRecord.status = 'completed';

    // Generate feedback summary
    const strengths = [];
    const improvements = [];
    const recommendations = [];

    interviewRecord.transcript.forEach(item => {
      if (item.feedback && !item.isSkipped) {
        if (item.feedback.rating === 'Excellent' || item.feedback.rating === 'Good') {
          strengths.push(item.feedback.text.split('\n')[0]);
        } else {
          improvements.push(item.feedback.text);
        }
      }
    });

    // Add recommendations based on scores
    if (interviewRecord.scores.communication < 70) {
      recommendations.push('Practice articulating your thoughts more clearly');
    }
    if (interviewRecord.scores.confidence < 70) {
      recommendations.push('Build confidence by doing mock interviews regularly');
    }
    if (interviewRecord.scores.technical < 70 && interviewRecord.interviewType === 'technical') {
      recommendations.push('Review technical concepts and practice coding problems');
    }
    if (interviewRecord.scores.clarity < 70) {
      recommendations.push('Work on speaking pace and enunciation');
    }

    recommendations.push('Record yourself answering questions to track improvements');
    recommendations.push('Practice with a timer to manage response time better');

    interviewRecord.feedbackSummary = {
      strengths: [...new Set(strengths)].slice(0, 5),
      improvements: [...new Set(improvements)].slice(0, 5),
      recommendations: [...new Set(recommendations)].slice(0, 6)
    };

    await interviewRecord.save();

    res.json({
      success: true,
      interviewRecord: interviewRecord.getPerformanceSummary(),
      scores: interviewRecord.scores,
      feedback: interviewRecord.feedbackSummary
    });
  } catch (error) {
    console.error('[Complete Interview Error]:', error);
    res.status(500).json({ error: 'Failed to complete interview', message: error.message });
  }
});

/**
 * GET /api/virtual-interviews/:interviewId
 * Get interview record details
 */
router.get('/:interviewId', async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interviewRecord = await InterviewRecord.findOne({ interviewId })
      .populate('userId', 'email name');

    if (!interviewRecord) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    res.json({
      success: true,
      interview: interviewRecord.getPerformanceSummary(),
      fullRecord: interviewRecord
    });
  } catch (error) {
    console.error('[Get Interview Error]:', error);
    res.status(500).json({ error: 'Failed to fetch interview', message: error.message });
  }
});

/**
 * GET /api/virtual-interviews/user/:userId
 * Get all interviews for a user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, skip = 0 } = req.query;

    const interviews = await InterviewRecord.find({ userId })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await InterviewRecord.countDocuments({ userId });

    const summaries = interviews.map(interview => interview.getPerformanceSummary());

    res.json({
      success: true,
      interviews: summaries,
      total,
      limit: parseInt(limit),
      skip: parseInt(skip)
    });
  } catch (error) {
    console.error('[Get User Interviews Error]:', error);
    res.status(500).json({ error: 'Failed to fetch interviews', message: error.message });
  }
});

/**
 * GET /api/virtual-interviews/:interviewId/download-report
 * Download interview report as PDF
 */
router.get('/:interviewId/download-report', async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interviewRecord = await InterviewRecord.findOne({ interviewId })
      .populate('userId', 'name email');

    if (!interviewRecord) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    // Create PDF
    const doc = new PDFDocument();
    const filename = `interview_${interviewId}_${Date.now()}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text('Virtual Interview Report', { align: 'center' });
    doc.moveDown();

    // Interview Details
    doc.fontSize(12).font('Helvetica-Bold').text('Interview Details', { underline: true });
    doc.font('Helvetica').fontSize(10);
    doc.text(`Interview Type: ${interviewRecord.interviewType.toUpperCase()}`);
    doc.text(`Date: ${interviewRecord.startTime.toLocaleDateString()}`);
    doc.text(`Duration: ${interviewRecord.formattedDuration}`);
    doc.text(`Questions Answered: ${interviewRecord.questionsAnswered}/${interviewRecord.totalQuestions}`);
    doc.moveDown();

    // Scores
    doc.fontSize(12).font('Helvetica-Bold').text('Performance Scores', { underline: true });
    doc.font('Helvetica').fontSize(10);
    doc.text(`Overall Score: ${interviewRecord.scores.overall}/100`, { continued: true });
    doc.font('Helvetica-Bold').text(` (${getScoreGrade(interviewRecord.scores.overall)})`);
    doc.text(`Communication: ${interviewRecord.scores.communication}/100`);
    doc.text(`Confidence: ${interviewRecord.scores.confidence}/100`);
    doc.text(`Clarity: ${interviewRecord.scores.clarity}/100`);
    if (interviewRecord.scores.technical > 0) {
      doc.text(`Technical Knowledge: ${interviewRecord.scores.technical}/100`);
    }
    doc.moveDown();

    // Strengths
    if (interviewRecord.feedbackSummary.strengths.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Strengths', { underline: true });
      doc.font('Helvetica').fontSize(10);
      interviewRecord.feedbackSummary.strengths.forEach(strength => {
        doc.text(`• ${strength}`);
      });
      doc.moveDown();
    }

    // Improvements
    if (interviewRecord.feedbackSummary.improvements.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Areas for Improvement', { underline: true });
      doc.font('Helvetica').fontSize(10);
      interviewRecord.feedbackSummary.improvements.forEach(improvement => {
        doc.text(`• ${improvement}`);
      });
      doc.moveDown();
    }

    // Recommendations
    if (interviewRecord.feedbackSummary.recommendations.length > 0) {
      doc.fontSize(12).font('Helvetica-Bold').text('Recommendations', { underline: true });
      doc.font('Helvetica').fontSize(10);
      interviewRecord.feedbackSummary.recommendations.forEach(recommendation => {
        doc.text(`• ${recommendation}`);
      });
    }

    doc.end();
  } catch (error) {
    console.error('[Download Report Error]:', error);
    res.status(500).json({ error: 'Failed to generate report', message: error.message });
  }
});

// ========== Helper Functions ==========

/**
 * Get a question from the question bank for an interview
 */
async function getQuestionForInterview(category, questionIndex) {
  // Import question bank
  const questions = {
    hr: [
      'Tell me about yourself and your professional background.',
      'What are your key strengths and how do they benefit your work?',
      'Describe a challenging situation you faced at work and how you handled it.',
      'Why are you interested in this position and our company?',
      'How do you handle stress and pressure in the workplace?',
      'Tell me about a time you failed and what you learned from it.',
      'How do you prioritize your work when you have multiple deadlines?',
      'Describe your ideal work environment and team dynamics.',
      'What are your career goals for the next 5 years?',
      'How do you stay updated with industry trends and developments?'
    ],
    technical: [
      'Explain the difference between synchronous and asynchronous programming.',
      'What is the time complexity of a binary search algorithm?',
      'Describe the MVC (Model-View-Controller) architecture pattern.',
      'How does HTTPS work and why is it important?',
      'Explain the concept of RESTful APIs.',
      'What is the difference between SQL and NoSQL databases?',
      'Describe object-oriented programming principles.',
      'What is the purpose of version control systems like Git?',
      'Explain caching and its importance in web applications.',
      'What is the difference between compilation and interpretation?'
    ],
    dsa: [
      'Write an algorithm to find the maximum element in an array.',
      'Explain how a binary search tree works.',
      'What is the time complexity of merge sort and why?',
      'Describe how a hash table works and handle collisions.',
      'Write pseudocode for a breadth-first search (BFS) algorithm.',
      'What is the difference between a stack and a queue?',
      'Explain dynamic programming with an example.',
      'How does quick sort work and what is its average time complexity?',
      'Describe the depth-first search (DFS) algorithm.',
      'What is memoization and how does it optimize recursive algorithms?'
    ],
    behavioral: [
      'Tell me about a time you worked in a team to achieve a goal.',
      'Describe a situation where you had to persuade someone to your viewpoint.',
      'Tell me about a time you received criticism and how you responded.',
      'Describe a situation where you had to adapt to change quickly.',
      'Tell me about your greatest professional achievement.',
      'How do you handle conflicts with colleagues or managers?',
      'Describe a time when you took initiative on a project.',
      'Tell me about a time you helped someone on your team.',
      'How do you handle working with difficult personalities?',
      'Describe a situation where you had to learn something new quickly.'
    ],
    'role-based': [
      'What specific experience do you have with this role\'s primary responsibilities?',
      'How would you approach your first 30 days in this position?',
      'What would success look like in this role after one year?',
      'How do your past experiences prepare you for this specific role?',
      'What tools and technologies are you proficient with?',
      'How would you measure your success in this position?',
      'Tell me about your understanding of our industry and competitors.',
      'How do you see this role evolving in the future?',
      'What excites you most about this opportunity?',
      'How would you contribute to our team\'s growth and success?'
    ]
  };

  const categoryQuestions = questions[category] || questions.hr;
  const question = categoryQuestions[questionIndex % categoryQuestions.length];

  return {
    questionNumber: questionIndex + 1,
    text: question,
    category: category,
    estimatedTime: 120 // 2 minutes per question
  };
}

/**
 * Convert numeric score to letter grade
 */
function getScoreGrade(score) {
  if (score >= 90) return 'A (Excellent)';
  if (score >= 80) return 'B (Good)';
  if (score >= 70) return 'C (Average)';
  if (score >= 60) return 'D (Fair)';
  return 'F (Needs Improvement)';
}

module.exports = router;
