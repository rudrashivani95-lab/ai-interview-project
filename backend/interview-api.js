// ========== COMPREHENSIVE INTERVIEW API ==========
// Handles answer evaluation, adaptive follow-ups, and summary generation

const express = require('express');
const router = express.Router();
const FeedbackAnalyzer = require('./feedbackAnalyzer');

// Initialize analyzer
const analyzer = new FeedbackAnalyzer();

// Mock AI evaluation - Replace with actual AI service (GPT-4, Cohere, etc.)
async function evaluateAnswer(question, answer, category) {
  /**
   * In production, integrate with:
   * - OpenAI GPT-4 for intelligent evaluation
   * - AWS Comprehend for sentiment/skills extraction
   * - Custom ML models for technical accuracy
   * 
   * For now, return mock scoring
   */

  try {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock evaluation logic
    const answerLength = answer.split(' ').length;
    const hasKeywords = checkKeywords(answer, question);
    const clarity = calculateClarity(answer);
    
    let score = 50;
    
    // Scoring logic
    if (answerLength < 20) score -= 20; // Too short
    else if (answerLength > 300) score -= 10; // Too long
    else if (answerLength > 100) score += 15; // Good length
    
    score += hasKeywords * 20; // Keywords boost
    score += clarity * 25; // Clarity boost
    score = Math.min(100, Math.max(0, score)); // Clamp 0-100

    // Generate feedback
    const feedback = generateFeedback(score, answerLength, hasKeywords, clarity);

    // Extract keywords for session memory
    const keywords = extractKeywords(answer, category);

    return {
      score: Math.round(score),
      feedback,
      keywords,
      strengths: identifyStrengths(answer, score),
      improvements: identifyImprovements(answer, score),
      followUpQuestion: generateFollowUp(question, answer)
    };
  } catch (error) {
    console.error('[Evaluation Error]:', error);
    return {
      score: 60,
      feedback: 'Your answer was recorded. Keep practicing!',
      keywords: [],
      strengths: ['Good attempt'],
      improvements: ['Provide more specific examples'],
      followUpQuestion: null
    };
  }
}

function checkKeywords(answer, question) {
  // Simple keyword matching - enhance with NLP in production
  const questionWords = new Set(question.toLowerCase().split(/\s+/));
  const answerWords = answer.toLowerCase().split(/\s+/);
  
  let matches = 0;
  for (let word of answerWords) {
    if (questionWords.has(word) && word.length > 4) matches++;
  }
  
  return matches > 2 ? 1 : 0;
}

function calculateClarity(answer) {
  // Simple clarity calculation based on sentence structure
  const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const avgLength = answer.split(' ').length / Math.max(1, sentences.length);
  
  if (avgLength > 20 && avgLength < 40) return 1;
  if (avgLength >= 10 && avgLength <= 50) return 0.7;
  return 0.3;
}

function generateFeedback(score, length, keywords, clarity) {
  if (score >= 80) return '✓ Excellent answer with great depth and clarity!';
  if (score >= 60) return '✓ Good answer! Consider adding more specific examples.';
  if (score >= 40) return '• Your answer shows understanding. Work on clarity and structure.';
  return '• Try to provide more detailed and structured responses.';
}

function extractKeywords(answer, category) {
  // Extract important concepts from answer
  const words = answer.toLowerCase().split(/\W+/).filter(w => w.length > 5);
  const keywords = [...new Set(words)].slice(0, 5); // Top 5 unique words
  return keywords;
}

function identifyStrengths(answer, score) {
  const strengths = [];
  
  if (answer.length > 100) strengths.push('Detailed response');
  if (answer.includes('example') || answer.includes('instance')) strengths.push('Uses examples');
  if (answer.includes('think') || answer.includes('believe')) strengths.push('Shows reasoning');
  if (answer.includes('because') || answer.includes('therefore')) strengths.push('Logical flow');
  if (score >= 70) strengths.push('Clear communication');
  
  return strengths.length > 0 ? strengths : ['Attempted answer'];
}

function identifyImprovements(answer, score) {
  const improvements = [];
  
  if (answer.length < 50) improvements.push('Provide more detail');
  if (!answer.includes('example')) improvements.push('Include specific examples');
  if (!answer.includes('because')) improvements.push('Explain your reasoning');
  if (score < 50) improvements.push('Work on structure and clarity');
  
  return improvements.length > 0 ? improvements : ['Continue practicing'];
}

function generateFollowUp(question, answer) {
  // Generate adaptive follow-up based on answer content
  const answerLength = answer.split(' ').length;
  
  if (answerLength < 30) {
    return 'Can you provide more details or an example?';
  }
  
  if (answer.includes('example')) {
    return 'How would you handle a different scenario?';
  }
  
  if (answer.includes('challenge') || answer.includes('difficult')) {
    return 'How did you overcome this challenge?';
  }
  
  return 'What would you do differently next time?';
}

// ========== API ENDPOINTS ==========

/**
 * POST /api/interviews/start
 * Start a new interview session
 */
router.post('/start', async (req, res) => {
  try {
    const { type, count, resumeText } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Interview type is required' });
    }

    const interviewId = `interview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    res.json({
      success: true,
      interviewId,
      type,
      count: count || 5,
      startTime: new Date().toISOString(),
      message: 'Interview session started'
    });

  } catch (error) {
    console.error('[Interview Start Error]:', error);
    res.status(500).json({ 
      error: 'Failed to start interview',
      message: error.message
    });
  }
});

/**
 * POST /api/interviews/:interviewId/answer
 * Submit and evaluate an answer
 */
router.post('/:interviewId/answer', async (req, res) => {
  try {
    const { questionId, questionText, answer } = req.body;
    
    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({ error: 'Answer cannot be empty' });
    }

    // Determine category from question ID
    const category = questionId.split('_')[0];

    // Use FeedbackAnalyzer for comprehensive feedback
    const feedback = await analyzer.analyzeAnswer(questionText, answer, category);

    res.json({
      success: true,
      score: feedback.score,
      rating: feedback.rating,
      feedback: feedback.feedback,
      improved_answer: feedback.improved_answer,
      metrics: feedback.metrics,
      original_answer: feedback.original_answer,
      keywords: [],
      strengths: [],
      improvements: []
    });

  } catch (error) {
    console.error('[Answer Evaluation Error]:', error);
    res.status(500).json({ 
      error: 'Failed to evaluate answer',
      success: false,
      score: 60,
      rating: 'Average',
      feedback: 'Answer recorded. Please continue with the next question.',
      improved_answer: 'Answer noted. Keep improving with detailed explanations and examples.',
      fallback: true
    });
  }
});

/**
 * POST /api/interviews/:interviewId/summary
 * Generate interview summary and recommendations
 */
router.post('/:interviewId/summary', async (req, res) => {
  try {
    const { answers, type } = req.body;

    if (!answers || answers.length === 0) {
      return res.json({
        summary: {
          overallScore: 0,
          totalAnswered: 0,
          totalSkipped: 0,
          strengths: [],
          weaknesses: ['No answers provided'],
          recommendations: ['Complete the interview to receive recommendations'],
          recommendedTopics: []
        }
      });
    }

    // Calculate overall score
    const validAnswers = answers.filter(a => a.answer !== '[SKIPPED]');
    const overallScore = validAnswers.length > 0
      ? Math.round(validAnswers.reduce((sum, a) => sum + (a.score || 0), 0) / validAnswers.length)
      : 0;

    // Aggregate strengths and weaknesses
    const allStrengths = [];
    const allImprovements = [];
    
    validAnswers.forEach(answer => {
      allStrengths.push(...(answer.strengths || []));
      allImprovements.push(...(answer.improvements || []));
    });

    // Get most common strengths/improvements
    const strengths = [...new Set(allStrengths)].slice(0, 5);
    const weaknesses = [...new Set(allImprovements)].slice(0, 5);

    // Generate recommendations
    const recommendations = generateRecommendations(overallScore, type, validAnswers.length);
    const recommendedTopics = generateStudyTopics(type, weaknesses);

    res.json({
      summary: {
        overallScore,
        totalAnswered: validAnswers.length,
        totalSkipped: answers.filter(a => a.answer === '[SKIPPED]').length,
        strengths: strengths.length > 0 ? strengths : ['Good effort'],
        weaknesses: weaknesses.length > 0 ? weaknesses : ['Keep practicing'],
        recommendations,
        recommendedTopics
      }
    });

  } catch (error) {
    console.error('[Summary Generation Error]:', error);
    res.status(500).json({
      error: 'Failed to generate summary',
      fallback: {
        summary: {
          overallScore: 60,
          strengths: ['Participated in interview'],
          weaknesses: ['Review responses for improvement'],
          recommendations: ['Practice with more interviews'],
          recommendedTopics: []
        }
      }
    });
  }
});

/**
 * GET /api/interviews/:interviewId
 * Retrieve interview status and progress
 */
router.get('/:interviewId', (req, res) => {
  try {
    // In production, fetch from database
    res.json({
      interviewId: req.params.interviewId,
      status: 'in-progress',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch interview' });
  }
});

/**
 * POST /api/interviews/:interviewId/analytics
 * Log interview analytics for improvement
 */
router.post('/:interviewId/analytics', (req, res) => {
  try {
    const { event, data } = req.body;
    console.log(`[Interview Analytics] ${event}:`, data);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log analytics' });
  }
});

// ========== HELPER FUNCTIONS ==========

function generateRecommendations(score, type, answersCount) {
  const recommendations = [];

  // Basic recommendations
  recommendations.push('Review your responses and note areas for improvement');
  
  if (score < 50) {
    recommendations.push('Practice with more mock interviews to build confidence');
    recommendations.push('Focus on structuring your answers clearly');
    recommendations.push('Record yourself and review the recordings');
  } else if (score < 70) {
    recommendations.push('Continue practicing technical concepts');
    recommendations.push('Work on providing more specific examples');
  } else {
    recommendations.push('Great job! Maintain this level of performance');
    recommendations.push('Take on more challenging interview scenarios');
  }

  if (answersCount < 5) {
    recommendations.push('Complete more questions to better assess your skills');
  }

  recommendations.push('Schedule follow-up interviews to track progress');

  return recommendations;
}

function generateStudyTopics(type, weaknesses) {
  const topics = [];
  
  const topicMap = {
    'HR': ['STAR Method', 'Behavioral Patterns', 'Leadership', 'Conflict Resolution'],
    'Technical': ['System Design', 'Data Structures', 'Algorithms', 'API Design'],
    'DSA': ['Arrays & Strings', 'Trees & Graphs', 'Dynamic Programming', 'Sorting & Searching'],
    'Behavioral': ['Teamwork', 'Adaptability', 'Problem-Solving', 'Communication'],
    'Communication': ['Presentation Skills', 'Active Listening', 'Public Speaking', 'Writing Skills'],
    'Resume': ['Resume Optimization', 'Cover Letters', 'Portfolio Projects', 'LinkedIn Profile']
  };

  topics.push(...(topicMap[type] || topicMap['Technical']));

  // Add topics based on identified weaknesses
  if (weaknesses.includes('Provide more detail')) {
    topics.push('Answer Structuring');
  }
  if (weaknesses.includes('Include specific examples')) {
    topics.push('STAR Technique');
  }

  return [...new Set(topics)].slice(0, 6);
}

module.exports = router;
