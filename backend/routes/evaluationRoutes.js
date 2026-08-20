// Routes for evaluating resumes and interviews (returns technical, communication, confidence, overall)
const express = require('express');
const auth = require('../middleware/auth');
const { scoreResumeMock, evaluateAnswerMock } = require('../utils/ai');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');

const router = express.Router();

// Evaluate a resume (pass resume text and optional keywords)
router.post('/resume', auth, async (req, res) => {
  try {
    const { resumeText, keywords = [] } = req.body;
    const result = await scoreResumeMock(resumeText || '', keywords);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Evaluate an interview by aggregating stored answers
router.get('/interview/:id', auth, async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });
    if (String(interview.user) !== req.user.id) return res.status(403).json({ message: 'Forbidden' });

    const answers = interview.answers || [];
    if (!answers.length) return res.json({ message: 'No answers yet', overall: 0 });

    const agg = answers.reduce((acc, a) => {
      acc.technical += a.evaluation.technical || 0;
      acc.communication += a.evaluation.communication || 0;
      acc.confidence += a.evaluation.confidence || 0;
      acc.overall += a.evaluation.overall || 0;
      return acc;
    }, { technical: 0, communication: 0, confidence: 0, overall: 0 });

    const n = answers.length;
    const result = {
      technical: Math.round(agg.technical / n),
      communication: Math.round(agg.communication / n),
      confidence: Math.round(agg.confidence / n),
      overall: Math.round(agg.overall / n),
    };
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Quick endpoint to run mock evaluation on an arbitrary answer text
router.post('/answer', auth, async (req, res) => {
  try {
    const { text } = req.body;
    const result = await evaluateAnswerMock(text || '');
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
