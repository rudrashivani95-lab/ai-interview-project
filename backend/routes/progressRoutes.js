// Progress dashboard routes: return past scores, weak topics, and performance graph data
const express = require('express');
const auth = require('../middleware/auth');
const Interview = require('../models/Interview');
const Resume = require('../models/Resume');

const router = express.Router();

// Get progress summary for a user
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    // Basic security: allow only own user's data
    if (req.user.id !== userId) return res.status(403).json({ message: 'Forbidden' });

    // Past interview scores (timestamped)
    const interviews = await Interview.find({ user: userId }).sort({ createdAt: 1 });
    const pastScores = interviews.map(i => ({ date: i.createdAt, score: i.overallScore, type: i.type }));

    // Weak topics: simplistic extraction from questions/answers where scores are low
    const weakTopicsMap = {};
    interviews.forEach(i => {
      i.answers.forEach(a => {
        if ((a.evaluation?.overall || 0) < 60) {
          // pick keywords from corresponding question text as weak topics
          const q = i.questions.find(q => q.questionId === a.questionId);
          if (q) weakTopicsMap[q.text] = (weakTopicsMap[q.text] || 0) + 1;
        }
      });
    });
    const weakTopics = Object.keys(weakTopicsMap).map(k => ({ topic: k, count: weakTopicsMap[k] }));

    // Resume history and best/worst ATS score
    const resumes = await Resume.find({ user: userId }).sort({ createdAt: 1 });
    const resumeScores = resumes.map(r => ({ date: r.createdAt, atsScore: r.atsScore || 0 }));

    // Performance graph data: combine interview and resume trends
    const performanceGraph = {
      interviews: pastScores,
      resumes: resumeScores,
    };

    res.json({ pastScores, weakTopics, performanceGraph });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
