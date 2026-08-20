// Mock AI utilities - placeholder LLM functions returning deterministic mock outputs
// These functions simulate async calls to an LLM or other AI services.

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function generateResumeFromProfile(profile) {
  await delay(200); // simulate latency
  // simple mock: combine fields into a resume text and extract keywords
  const text = `Name: ${profile.name}\nTitle: ${profile.title || 'Software Engineer'}\nSummary: ${profile.summary || 'Experienced professional with strong technical skills.'}\nExperience: ${profile.experience || 'Worked on multiple projects.'}`;
  const keywords = (profile.skills || ['JavaScript', 'Node.js', 'Algorithms']).slice(0, 20);
  return { text, keywords, aiGenerated: true };
}

async function generateInterviewQuestions({ type = 'technical', count = 5, role = 'General' }) {
  await delay(150);
  // return a set of mock questions based on type
  const baseQuestions = [];
  for (let i = 1; i <= count; i++) {
    baseQuestions.push({
      questionId: `q_${Date.now()}_${i}`,
      text: `${type.toUpperCase()} Question ${i} for ${role}: Explain a concept or solve a short problem.`,
      expectedKeywords: ['solution', 'trade-offs', 'complexity'],
    });
  }
  return baseQuestions;
}

async function evaluateAnswerMock(answerText) {
  await delay(120);
  // Crude mock scoring: length contributes, presence of keywords contributes
  const lengthScore = Math.min(40, Math.floor(answerText.split(' ').length / 2));
  const keywordScore = (/(solution|trade-off|performance|complexity|scalability)/i.test(answerText) ? 40 : 10);
  const fluencyScore = /[\.\!\?]$/.test(answerText.trim()) ? 20 : 10;
  const total = Math.min(100, lengthScore + keywordScore + fluencyScore);
  // breakdown for technical, communication, confidence
  return {
    technical: Math.round(total * 0.6),
    communication: Math.round(total * 0.3),
    confidence: Math.round(total * 0.1),
    overall: total,
    feedback: 'This is mock feedback. Mention trade-offs and complexity for higher score.',
  };
}

async function scoreResumeMock(resumeText, keywords = []) {
  await delay(100);
  // ATS-like scoring: count keyword matches, grammar heuristic
  const textLower = resumeText.toLowerCase();
  let matches = 0;
  for (const kw of keywords) {
    if (typeof kw === 'string' && textLower.includes(kw.toLowerCase())) matches++;
  }
  const keywordMatchScore = Math.min(50, Math.round((matches / Math.max(1, keywords.length)) * 50));
  const grammarScore = Math.min(30, 30 - Math.max(0, (resumeText.split(/[.!?]/).filter(s=>s.trim().length===0).length)));
  const lengthScore = Math.min(20, Math.round(Math.min(1, resumeText.split(' ').length / 300) * 20));
  const total = keywordMatchScore + grammarScore + lengthScore;
  return {
    atsScore: total,
    keywordMatchScore,
    grammarScore,
    lengthScore,
    feedback: 'Mock resume analysis: include role-specific keywords and clear bullet points.'
  };
}

// Generate adaptive follow-up question based on answer and context
async function generateAdaptiveQuestion(category, difficulty, keywords, sessionId, askedQuestionIds = []) {
  await delay(150);
  
  const followUpMap = {
    'HR': {
      'basic': 'Tell me about your greatest achievement.',
      'intermediate': 'How do you handle conflicts with team members?',
      'advanced': 'Describe a time you led a team through a challenging project.'
    },
    'Technical': {
      'basic': 'Explain the difference between arrays and linked lists.',
      'intermediate': 'How would you optimize this algorithm? Discuss time and space complexity.',
      'advanced': 'Design a scalable system for handling millions of concurrent requests.'
    },
    'DSA': {
      'basic': 'Write a function to reverse an array.',
      'intermediate': 'Solve a problem using recursion and explain the time complexity.',
      'advanced': 'Design an efficient algorithm with optimal time and space complexity.'
    },
    'behavioral': {
      'basic': 'Tell me about yourself.',
      'intermediate': 'Describe a situation where you had to adapt to change.',
      'advanced': 'Share an example of how you handled failure and learned from it.'
    }
  };

  const questions = followUpMap[category] || followUpMap['HR'];
  const questionText = questions[difficulty] || questions['basic'];
  
  // Generate unique question ID that won't conflict with already-asked questions
  let questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // If this question ID was already asked, append difficulty level to make it unique
  while (askedQuestionIds && askedQuestionIds.includes(questionId)) {
    questionId = `q_${Date.now()}_${difficulty}_${Math.random().toString(36).substr(2, 9)}`;
  }

  return {
    questionId: questionId,
    questionText: questionText,
    category: category,
    difficulty: difficulty,
  };
}

// Generate comprehensive feedback based on answers
function generateFeedback(answers, interviewType) {
  const strengths = [];
  const weaknesses = [];
  
  // Analyze answers
  let totalWords = 0;
  let totalScore = 0;
  let scoreCount = 0;

  answers.forEach(ans => {
    if (ans.text) {
      totalWords += ans.text.split(' ').length;
    }
    if (ans.evaluation?.overall) {
      totalScore += ans.evaluation.overall;
      scoreCount++;
    }
  });

  const avgScore = scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0;
  const avgWordCount = answers.length > 0 ? Math.round(totalWords / answers.length) : 0;

  // Determine strengths
  if (avgScore >= 70) {
    strengths.push('Strong understanding of concepts');
  }
  if (avgWordCount > 50) {
    strengths.push('Provides detailed answers with examples');
  }
  if (avgWordCount > 20) {
    strengths.push('Communicates ideas clearly');
  }

  // Determine weaknesses
  if (avgScore < 50) {
    weaknesses.push('Need to improve answer quality');
  }
  if (avgWordCount < 30) {
    weaknesses.push('Provide more detailed explanations');
  }
  if (answers.some(a => a.text === '[SKIPPED]')) {
    weaknesses.push('Avoid skipping questions during interviews');
  }

  return {
    strengths: strengths.length > 0 ? strengths : ['Positive attitude', 'Willingness to learn'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['Continue practicing to improve'],
    feedback: `Overall Score: ${avgScore}/100. ${strengths.join('. ')}. ${weaknesses.length > 0 ? 'Focus on: ' + weaknesses.join(', ') + '.' : ''}`
  };
}

module.exports = {
  generateResumeFromProfile,
  generateInterviewQuestions,
  evaluateAnswerMock,
  scoreResumeMock,
  generateAdaptiveQuestion,
  generateFeedback,
};
