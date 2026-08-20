// Interview model: stores interview sessions, questions, answers, and scores
const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionId: String,
  text: String,
  evaluation: {
    technical: Number,
    communication: Number,
    confidence: Number,
    overall: Number,
    feedback: String,
  },
  createdAt: { type: Date, default: Date.now },
});

const QuestionSchema = new mongoose.Schema({
  questionId: String,
  text: String,
  expectedKeywords: [String],
});

const InterviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, default: 'technical' },
  role: { type: String, default: 'General' },
  sessionId: { type: String, default: null }, // Track question generation session
  questions: [QuestionSchema],
  answers: [AnswerSchema],
  overallScore: { type: Number, default: 0 },
  completed: { type: Boolean, default: false },
  summary: {
    interviewId: String,
    type: String,
    totalQuestions: Number,
    overallScore: Number,
    strengths: [String],
    weaknesses: [String],
    feedback: String,
    improvements: [String],
    recommendations: [String],
    topics: [String],
    completedAt: Date,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Interview', InterviewSchema);
