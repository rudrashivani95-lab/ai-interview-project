const express = require('express');
const Resume = require('../models/Resume');
const auth = require('../middleware/auth');

const router = express.Router();

// Create a manual resume for authenticated user
router.post('/', auth, async (req, res) => {
  try {
    const resumeData = req.body;
    console.log('[Resume Save] Received resume data:', Object.keys(resumeData));
    
    const resume = await Resume.create({
      user: req.user.id,
      title: resumeData.title || resumeData.fullName || 'My Resume',
      content: resumeData,
      keywords: resumeData.technicalSkills || '',
      aiGenerated: false
    });
    
    console.log('[Resume Save] Successfully saved resume ID:', resume._id);
    res.status(201).json({ 
      success: true,
      message: 'Resume saved successfully',
      resume: resume 
    });
  } catch (err) {
    console.error('[Resume Save] Error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error saving resume',
      error: err.message 
    });
  }
});

// List resumes
router.get('/', auth, async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(resumes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single resume
router.get('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Not found' });
    if (String(resume.user) !== req.user.id)
      return res.status(403).json({ message: 'Forbidden' });

    res.json(resume);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update resume
router.put('/:id', auth, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: 'Not found' });
    if (String(resume.user) !== req.user.id)
      return res.status(403).json({ message: 'Forbidden' });

    const { title, content, keywords } = req.body;
    if (title) resume.title = title;
    if (content) resume.content = content;
    if (keywords) resume.keywords = keywords;

    await resume.save();
    res.json(resume);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
