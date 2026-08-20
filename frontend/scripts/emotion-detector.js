/**
 * Emotion Detector
 * Analyzes user responses for emotion and confidence level
 * Guides avatar reactions and follow-up questions
 */

class EmotionDetector {
  constructor() {
    this.emotionKeywords = {
      confident: ['certainly', 'definitely', 'absolutely', 'obviously', 'clearly', 'strong', 'excellent', 'successful'],
      uncertain: ['maybe', 'probably', 'might', 'could', 'unsure', 'not sure', 'hesitant', 'think'],
      nervous: ['um', 'uh', 'err', 'like', 'you know', 'basically', 'stuttered'],
      negative: ['failed', 'struggle', 'difficult', 'hard', 'problem', 'issue', 'worst', 'bad'],
      positive: ['achieved', 'succeeded', 'great', 'excellent', 'proud', 'best', 'amazing', 'wonderful'],
      technical: ['algorithm', 'database', 'API', 'framework', 'library', 'module', 'system', 'architecture']
    };

    this.emotionScores = {
      confidence: 0.5,
      clarity: 0.5,
      relevance: 0.5,
      emotion: 'neutral'
    };
  }

  analyze(text, question, questionType = 'technical') {
    const cleanText = text.toLowerCase();

    // Calculate scores
    const confidenceScore = this.calculateConfidence(cleanText);
    const clarityScore = this.calculateClarity(cleanText);
    const relevanceScore = this.calculateRelevance(cleanText, question, questionType);
    const emotion = this.detectDominantEmotion(cleanText);

    return {
      confidence: Math.round(confidenceScore * 100),
      clarity: Math.round(clarityScore * 100),
      relevance: Math.round(relevanceScore * 100),
      emotion,
      recommendedResponse: this.getRecommendedResponse(emotion, confidenceScore),
      avatarEmotion: this.mapToAvatarEmotion(emotion)
    };
  }

  calculateConfidence(text) {
    let score = 0.5;

    // Count confident keywords
    const confidentKeywords = this.emotionKeywords.confident;
    const confidentMatches = confidentKeywords.filter(k => text.includes(k)).length;
    score += confidentMatches * 0.05;

    // Penalize uncertain keywords
    const uncertainKeywords = this.emotionKeywords.uncertain;
    const uncertainMatches = uncertainKeywords.filter(k => text.includes(k)).length;
    score -= uncertainMatches * 0.03;

    // Check for filler words (signs of nervousness)
    const nervousKeywords = this.emotionKeywords.nervous;
    const nervousMatches = nervousKeywords.filter(k => text.includes(k)).length;
    score -= nervousMatches * 0.02;

    return Math.max(0, Math.min(1, score));
  }

  calculateClarity(text) {
    let score = 0.5;

    // Check sentence length and structure
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / (sentences.length || 1);

    // Ideal sentence length is 10-20 words
    if (avgSentenceLength >= 8 && avgSentenceLength <= 25) {
      score += 0.2;
    }

    // Penalize for excessive filler words
    const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually'];
    const fillerCount = fillerWords.filter(word => text.includes(word)).length;
    score -= fillerCount * 0.05;

    // Check for technical terminology (shows clarity of thought)
    const technicalTerms = this.emotionKeywords.technical;
    const technicalMatches = technicalTerms.filter(t => text.includes(t)).length;
    score += technicalMatches * 0.03;

    return Math.max(0, Math.min(1, score));
  }

  calculateRelevance(text, question, questionType) {
    let score = 0.5;

    // Check if response addresses the question
    const questionWords = question.toLowerCase().split(' ').filter(w => w.length > 3);
    const responseWords = text.split(' ');

    let matching = 0;
    questionWords.forEach(qword => {
      if (responseWords.some(rword => rword.includes(qword))) {
        matching++;
      }
    });

    const relevanceRatio = matching / Math.max(1, questionWords.length);
    score = 0.3 + relevanceRatio * 0.7;

    // Boost for specific examples
    if (text.includes('example') || text.includes('experience') || text.includes('did')) {
      score += 0.1;
    }

    // For technical questions, check for technical terminology
    if (questionType === 'technical') {
      const technicalMatches = this.emotionKeywords.technical.filter(t => text.includes(t)).length;
      score += Math.min(0.2, technicalMatches * 0.05);
    }

    return Math.max(0, Math.min(1, score));
  }

  detectDominantEmotion(text) {
    const emotions = {};

    // Count keyword matches for each emotion
    for (const [emotion, keywords] of Object.entries(this.emotionKeywords)) {
      emotions[emotion] = keywords.filter(k => text.includes(k)).length;
    }

    // Find dominant emotion
    let dominant = 'neutral';
    let maxCount = 0;

    for (const [emotion, count] of Object.entries(emotions)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = emotion;
      }
    }

    return dominant || 'neutral';
  }

  getRecommendedResponse(emotion, confidenceScore) {
    const responses = {
      confident: 'Follow up with a deeper technical question',
      uncertain: 'Provide encouragement and clarification',
      nervous: 'Slow down pace and be encouraging',
      negative: 'Show empathy and ask for learning outcomes',
      positive: 'Acknowledge achievement and probe deeper',
      technical: 'Ask for practical implementation details'
    };

    return responses[emotion] || responses.neutral;
  }

  mapToAvatarEmotion(emotion) {
    const mapping = {
      confident: 'nod-approving',
      uncertain: 'encouraging-nod',
      nervous: 'reassuring-smile',
      negative: 'empathetic-nod',
      positive: 'approving-smile',
      technical: 'attentive-nod',
      neutral: 'neutral'
    };

    return mapping[emotion] || 'neutral';
  }

  // Analyze audio characteristics
  analyzeAudioQuality(frequencyData, duration) {
    const quality = {
      pace: this.calculateSpeakingPace(duration),
      volume: this.calculateAverageVolume(frequencyData),
      clarity: this.calculateFrequencyBalance(frequencyData)
    };

    return quality;
  }

  calculateSpeakingPace(duration) {
    // Typical speaking pace is 120-150 words per minute
    // Assuming average word duration of 0.5 seconds
    const expectedDuration = 60 / 150 * 50; // for a 50-word answer
    const pace = Math.min(1.0, Math.max(0.5, expectedDuration / duration));
    return Math.round(pace * 100);
  }

  calculateAverageVolume(frequencyData) {
    if (!frequencyData || frequencyData.length === 0) return 50;
    const average = frequencyData.reduce((a, b) => a + b) / frequencyData.length;
    return Math.round((average / 255) * 100);
  }

  calculateFrequencyBalance(frequencyData) {
    if (!frequencyData || frequencyData.length < 10) return 50;

    const low = frequencyData.slice(0, frequencyData.length / 3);
    const mid = frequencyData.slice(frequencyData.length / 3, (frequencyData.length * 2) / 3);
    const high = frequencyData.slice((frequencyData.length * 2) / 3);

    const avgLow = low.reduce((a, b) => a + b) / low.length;
    const avgMid = mid.reduce((a, b) => a + b) / mid.length;
    const avgHigh = high.reduce((a, b) => a + b) / high.length;

    // Good balance is when mid frequencies are stronger
    const balance = (avgMid > avgLow && avgMid > avgHigh) ? 100 : 50;
    return balance;
  }
}

const emotionDetector = new EmotionDetector();
