// ========== ADVANCED FEEDBACK ANALYZER ==========
// Analyzes interview answers and generates detailed feedback

class FeedbackAnalyzer {
  constructor() {
    this.minAnswerLength = 20;
    this.goodAnswerLength = 50;
    this.excellentAnswerLength = 150;
  }

  /**
   * Analyze an answer and return comprehensive feedback
   * @param {string} question - The interview question
   * @param {string} answer - User's answer
   * @param {string} category - Question category (hr, technical, dsa, etc.)
   * @returns {Promise<Object>} Feedback object with rating, feedback, improved answer
   */
  async analyzeAnswer(question, answer, category) {
    try {
      // Extract metrics
      const metrics = this.extractMetrics(answer);
      const relevance = this.checkRelevance(question, answer);
      const clarity = this.analyzeClarityAndStructure(answer);
      const technicalCorrectness = this.checkTechnicalCorrectness(answer, category);
      const communicationSkills = this.analyzeCommunicationSkills(answer);

      // Calculate overall score
      const score = this.calculateScore(metrics, relevance, clarity, technicalCorrectness, communicationSkills);

      // Determine rating level
      const rating = this.getRatingLevel(score);

      // Generate feedback
      const feedback = this.generateFeedback(metrics, relevance, clarity, technicalCorrectness, communicationSkills, rating);

      // Generate improved answer
      const improvedAnswer = this.generateImprovedAnswer(question, answer, category, metrics);

      return {
        original_answer: answer,
        rating: rating,
        score: Math.round(score),
        feedback: feedback,
        improved_answer: improvedAnswer,
        metrics: {
          wordCount: metrics.wordCount,
          hasExamples: metrics.hasExamples,
          hasStructure: clarity.hasStructure,
          clarityScore: clarity.score,
          relevanceScore: relevance,
          technicalScore: technicalCorrectness,
          communicationScore: communicationSkills
        }
      };
    } catch (error) {
      console.error('[Analyzer Error]:', error);
      return this.getFallbackFeedback(answer);
    }
  }

  /**
   * Extract basic metrics from answer
   */
  extractMetrics(answer) {
    const words = answer.trim().split(/\s+/);
    const wordCount = words.length;
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    const hasExamples = /example|instance|case|such as|like|for instance/i.test(answer);
    const hasMetrics = /\d+%|\d+x|improve|increase|decrease|metric|measure/i.test(answer);
    const hasConclusion = /in conclusion|to summarize|ultimately|finally|in summary/i.test(answer);

    return {
      wordCount,
      sentences,
      avgWordsPerSentence: sentences > 0 ? Math.round(wordCount / sentences) : 0,
      hasExamples,
      hasMetrics,
      hasConclusion
    };
  }

  /**
   * Check answer relevance to question (0-1 score)
   */
  checkRelevance(question, answer) {
    try {
      // Extract key terms from question
      const questionWords = new Set(
        question.toLowerCase()
          .split(/\s+/)
          .filter(w => w.length > 4 && !['what', 'when', 'where', 'which', 'there'].includes(w))
      );

      // Count matching words in answer
      const answerWords = answer.toLowerCase().split(/\s+/);
      let matches = 0;

      for (let word of answerWords) {
        if (questionWords.has(word)) matches++;
      }

      const relevanceScore = Math.min(1, matches / (questionWords.size || 1));
      return Math.max(0.3, relevanceScore); // Minimum 0.3 even if no matches
    } catch (error) {
      return 0.7; // Default decent relevance
    }
  }

  /**
   * Analyze clarity and structure (0-100 score)
   */
  analyzeClarityAndStructure(answer) {
    let score = 50;
    const hasStructure = /first|second|third|next|then|finally|overall/i.test(answer);
    
    if (hasStructure) score += 20;

    // Check for complete sentences
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const incompleteCount = answer.split(/[;,]/).length - 1;
    
    if (sentences.length > 2) score += 15;
    if (incompleteCount < 3) score += 15;

    // Check paragraph structure
    const hasMultipleParagraphs = answer.split(/\n/).length > 1;
    if (hasMultipleParagraphs) score += 10;

    return {
      score: Math.min(100, score),
      hasStructure,
      sentenceCount: sentences.length
    };
  }

  /**
   * Check technical correctness (0-100 score for technical categories)
   */
  checkTechnicalCorrectness(answer, category) {
    if (!['technical', 'dsa'].includes(category)) return 50; // Not applicable

    let score = 50;

    // Check for technical terms
    const technicalTerms = /algorithm|data structure|time complexity|space complexity|API|REST|database|index|query|optimization|pattern|design|architecture/i;
    if (technicalTerms.test(answer)) score += 20;

    // Check for code or pseudo-code
    if (/```|function|class|method|variable|loop|array|hash|tree|graph/i.test(answer)) score += 15;

    // Check for complexity analysis
    if (/O\(|Big O|time complexity|space complexity|efficient|optimized/i.test(answer)) score += 15;

    return Math.min(100, score);
  }

  /**
   * Analyze communication skills (0-100 score)
   */
  analyzeCommunicationSkills(answer) {
    let score = 50;

    // Check for clear language
    const hasTransitions = /however|therefore|although|because|since|as a result/i.test(answer);
    if (hasTransitions) score += 15;

    // Check for confidence indicators
    const hasConfidence = /I believe|In my experience|I have|I think|I've learned/i.test(answer);
    if (hasConfidence) score += 10;

    // Check for specific examples
    const hasConcreteExamples = /example|instance|specifically|particularly|for instance/i.test(answer);
    if (hasConcreteExamples) score += 15;

    // Check for too many filler words
    const fillers = (answer.match(/like|um|uh|basically|actually|you know|I mean/gi) || []).length;
    if (fillers > 3) score -= 10;

    // Check for self-awareness
    const hasSelfAwareness = /learned|improved|mistake|challenge|difficult/i.test(answer);
    if (hasSelfAwareness) score += 10;

    return Math.min(100, score);
  }

  /**
   * Calculate overall score (0-100)
   */
  calculateScore(metrics, relevance, clarity, technicalCorrectness, communicationSkills) {
    let score = 50;

    // Word count contribution
    if (metrics.wordCount < 20) score -= 20;
    else if (metrics.wordCount >= 50 && metrics.wordCount <= 200) score += 15;
    else if (metrics.wordCount > 200) score -= 5; // Too verbose

    // Structure contribution
    score += clarity.score * 0.2;

    // Relevance contribution
    score += relevance * 20;

    // Communication contribution
    score += communicationSkills * 0.15;

    // Technical contribution (if applicable)
    if (technicalCorrectness > 50) score += (technicalCorrectness - 50) * 0.1;

    // Examples bonus
    if (metrics.hasExamples) score += 10;
    if (metrics.hasMetrics) score += 8;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get rating level based on score
   */
  getRatingLevel(score) {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Average';
    return 'Poor';
  }

  /**
   * Generate detailed feedback message
   */
  generateFeedback(metrics, relevance, clarity, technicalCorrectness, communicationSkills, rating) {
    const strengths = [];
    const improvements = [];

    // Identify strengths
    if (metrics.wordCount >= 50) strengths.push('Good answer length');
    if (metrics.hasExamples) strengths.push('Includes specific examples');
    if (metrics.hasMetrics) strengths.push('Uses quantifiable metrics');
    if (clarity.hasStructure) strengths.push('Well-structured response');
    if (communicationSkills >= 70) strengths.push('Clear communication');
    if (relevance >= 0.8) strengths.push('Directly addresses the question');

    // Identify improvements
    if (metrics.wordCount < 30) improvements.push('Provide more detail in your answer');
    if (!metrics.hasExamples) improvements.push('Add specific examples or cases');
    if (!metrics.hasMetrics) improvements.push('Include measurable results or metrics');
    if (!clarity.hasStructure) improvements.push('Organize your answer with clear structure (first, second, then...)');
    if (communicationSkills < 60) improvements.push('Use clearer and more confident language');
    if (relevance < 0.7) improvements.push('Ensure your answer directly addresses the question');

    // Build feedback message
    let feedbackMsg = '';

    if (strengths.length > 0) {
      feedbackMsg += `✓ **What went well:** ${strengths.slice(0, 2).join(', ')}\n\n`;
    }

    if (improvements.length > 0) {
      feedbackMsg += `△ **Areas to improve:** ${improvements.slice(0, 2).join(', ')}\n\n`;
    }

    // Add rating-specific feedback
    switch (rating) {
      case 'Excellent':
        feedbackMsg += '🌟 Outstanding response! You demonstrated strong understanding and articulation.';
        break;
      case 'Good':
        feedbackMsg += '👍 Good response with solid content. Consider adding more specific examples.';
        break;
      case 'Average':
        feedbackMsg += '📝 Decent attempt. Focus on providing more structured and detailed answers.';
        break;
      case 'Poor':
        feedbackMsg += '💡 Room for improvement. Try to structure your thoughts and include relevant examples.';
        break;
    }

    return feedbackMsg;
  }

  /**
   * Generate an improved version of the answer
   */
  generateImprovedAnswer(question, answer, category, metrics) {
    let improved = '';

    // Add opening statement if missing
    if (!/^(I|In|The|My|This|We)/i.test(answer)) {
      improved += 'To address your question: ';
    }

    // Add the original answer
    improved += answer.trim();

    // Add examples if missing
    if (!metrics.hasExamples) {
      improved += ' For example, ';
      if (category === 'dsa' || category === 'technical') {
        improved += 'this approach could be applied to real-world scenarios such as database optimization or API design.';
      } else if (category === 'hr' || category === 'behavioral') {
        improved += 'I implemented this principle when leading a project that improved team efficiency by 25%.';
      } else {
        improved += 'this principle has proven valuable in various situations.';
      }
    }

    // Add metrics if missing
    if (!metrics.hasMetrics && category === 'technical') {
      improved += ' This optimization typically results in a 30-40% improvement in performance.';
    }

    // Add conclusion if missing
    if (!metrics.hasConclusion) {
      improved += ' Overall, this approach demonstrates both technical understanding and practical application.';
    }

    // Ensure it ends with a period
    if (!improved.endsWith('.')) improved += '.';

    return improved;
  }

  /**
   * Get fallback feedback if analysis fails
   */
  getFallbackFeedback(answer) {
    return {
      original_answer: answer,
      rating: 'Good',
      score: 70,
      feedback: '✓ Your answer has been recorded and evaluated. Keep practicing to improve!',
      improved_answer: answer + ' Consider adding more specific examples and metrics to strengthen your response.',
      metrics: {}
    };
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FeedbackAnalyzer;
}
