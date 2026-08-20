// Routes to generate AI resume and score it (mocked)
const express = require('express');
const auth = require('../middleware/auth');
const Resume = require('../models/Resume');
const { generateResumeFromProfile, scoreResumeMock } = require('../utils/ai');

const router = express.Router();

// Generate resume from profile via mock AI and save
router.post('/generate', auth, async (req, res) => {
  try {
    const profile = req.body; 
    const aiResult = await generateResumeFromProfile(profile);

    const score = await scoreResumeMock(aiResult.text, aiResult.keywords);

    const resume = await Resume.create({
      user: req.user.id,
      title: profile.title || 'AI Resume',
      content: aiResult.text,
      keywords: aiResult.keywords,
      aiGenerated: true,
      atsScore: score.atsScore
    });

    res.json({ resume, score });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
// Fix Resume with AI
router.post('/fix', async (req, res) => {
  try {

    const { resumeText, weakSentences } = req.body;

    if (!resumeText) {
      return res.status(400).json({
        message: 'Resume text is required'
      });
    }

    let improvedResume = resumeText;

    if (Array.isArray(weakSentences)) {

      weakSentences.forEach(item => {

        if (
          item &&
          item.sentence &&
          item.suggestion
        ) {

          improvedResume = improvedResume.replace(
            item.sentence,
            item.suggestion
          );

        }

      });

    }

    res.json({
      success: true,
      improvedResume
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: 'Failed to improve resume'
    });

  }
});

module.exports = router;
