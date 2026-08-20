// ========== Virtual Interview Record Model ==========
// Mongoose schema for storing virtual interview records in MongoDB

const mongoose = require('mongoose');

const interviewRecordSchema = new mongoose.Schema(
  {
    // User Information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Interview Details
    interviewId: {
      type: String,
      unique: true,
      required: true
    },
    interviewType: {
      type: String,
      enum: ['hr', 'technical', 'dsa', 'behavioral', 'role-based'],
      required: true,
      index: true
    },
    
    // Interview Metadata
    startTime: {
      type: Date,
      default: Date.now
    },
    endTime: {
      type: Date
    },
    duration: {
      type: Number, // In seconds
      default: 0
    },
    totalQuestions: {
      type: Number,
      default: 10
    },
    questionsAnswered: {
      type: Number,
      default: 0
    },
    questionsSkipped: {
      type: Number,
      default: 0
    },
    
    // Scores
    scores: {
      overall: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      communication: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      confidence: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      technical: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      clarity: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      relevance: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      }
    },
    
    // Transcript (Q&A pairs)
    transcript: [
      {
        questionNumber: Number,
        question: String,
        questionCategory: String,
        answer: String,
        answerDuration: Number, // In seconds
        timestamp: Date,
        isSkipped: Boolean,
        feedback: {
          rating: String, // Excellent, Good, Average, Poor
          score: Number,
          text: String,
          improvedAnswer: String
        }
      }
    ],
    
    // Overall Feedback
    feedbackSummary: {
      strengths: [String],
      improvements: [String],
      recommendations: [String]
    },
    
    // Performance Metrics
    metrics: {
      averageAnswerDuration: Number,
      hesitationCount: Number,
      clarityScore: Number,
      relevanceScore: Number,
      technicalAccuracy: Number
    },
    
    // Status
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'cancelled'],
      default: 'in-progress'
    },
    
    // Additional Notes
    notes: String,
    
    // Video/Audio Recording Reference (if stored in cloud)
    recordingUrl: String,
    
    // AI Evaluation Data
    aiAnalysis: {
      speakingPace: String, // Fast, Normal, Slow
      toneOfVoice: String, // Confident, Neutral, Hesitant
      eyeContact: String, // Good, Average, Poor
      posture: String, // Good, Average, Poor
      overallPresentation: String
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'interviews_records'
  }
);

// Create indexes for better query performance
interviewRecordSchema.index({ userId: 1, createdAt: -1 });
interviewRecordSchema.index({ interviewType: 1 });
interviewRecordSchema.index({ 'scores.overall': -1 });

// Virtual for formatted duration
interviewRecordSchema.virtual('formattedDuration').get(function () {
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}m ${seconds}s`;
});

// Method to calculate overall score
interviewRecordSchema.methods.calculateOverallScore = function () {
  const { communication, confidence, technical, clarity, relevance } = this.scores;
  
  // Weight the scores
  const weights = {
    communication: 0.25,
    confidence: 0.20,
    clarity: 0.20,
    relevance: 0.20,
    technical: 0.15
  };
  
  this.scores.overall = Math.round(
    (communication * weights.communication) +
    (confidence * weights.confidence) +
    (clarity * weights.clarity) +
    (relevance * weights.relevance) +
    (technical * weights.technical)
  );
  
  return this.scores.overall;
};

// Method to get performance summary
interviewRecordSchema.methods.getPerformanceSummary = function () {
  return {
    interviewType: this.interviewType,
    date: this.startTime,
    duration: this.formattedDuration,
    overall: this.scores.overall,
    communication: this.scores.communication,
    confidence: this.scores.confidence,
    technical: this.scores.technical,
    questionsAnswered: this.questionsAnswered,
    questionsSkipped: this.questionsSkipped,
    strengths: this.feedbackSummary.strengths,
    improvements: this.feedbackSummary.improvements,
    recommendations: this.feedbackSummary.recommendations
  };
};

// Method to get top recommendations
interviewRecordSchema.methods.getTopRecommendations = function (limit = 5) {
  return this.feedbackSummary.recommendations.slice(0, limit);
};

// Create model
const InterviewRecord = mongoose.model('InterviewRecord', interviewRecordSchema);

module.exports = InterviewRecord;
