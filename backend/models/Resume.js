// Resume model: stores resumes (manual or AI generated) for users
const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Resume' },
  content: { type: mongoose.Schema.Types.Mixed }, // Mixed type to store complex resume objects
  keywords: { type: [String], default: [] },
  aiGenerated: { type: Boolean, default: false },
  atsScore: { type: Number },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Resume', ResumeSchema);
