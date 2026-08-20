/**
 * Avatar Interview Server
 * Dedicated backend for real human AI video interviewer
 * 
 * Supports:
 * - D-ID Live Avatar API
 * - HeyGen Real-Time Avatar API
 * - OpenAI Whisper (transcription)
 * - OpenAI GPT-4 (question generation, scoring, emotion-based responses)
 * 
 * Endpoints:
 * POST   /api/interview/questions    - Get interview questions
 * POST   /api/audio/transcribe       - Transcribe audio with Whisper
 * POST   /api/interview/score        - Score answer with GPT-4
 * POST   /api/avatar/generate        - Generate avatar video response
 * GET    /api/health                 - Health check
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const multer = require('multer');
const connectDB = require('./db');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================================================
// MIDDLEWARE
// =============================================================================

app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:3000',
    'https://rudrashivani95-lab.github.io',
    'https://ai-interview-project-74tfatk0b-rudrashivani95-labs-projects.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure multer for file uploads (audio files)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB limit
});

// =============================================================================
// CONFIGURATION
// =============================================================================

const config = {
  avatarProvider: process.env.AVATAR_PROVIDER || 'did', // 'did' or 'heygen'
  didApiKey: process.env.DID_API_KEY || '',
  heygenApiKey: process.env.HEYGEN_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  elevenLabsKey: process.env.ELEVENLABS_API_KEY || '',
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4EsNXjFF2xPl'
};

// ============================================
// QUESTION BANK
// ============================================

const questionBank = {
  hr: [
    "Tell me about yourself and your professional background.",
    "What are your greatest strengths?",
    "What is your biggest weakness and how are you working to improve it?",
    "Why are you interested in this position?",
    "What do you know about our company?",
    "How do you handle conflict with colleagues?",
    "Describe a challenging project you worked on.",
    "What are your career goals for the next 5 years?",
    "How do you stay organized and prioritize tasks?",
    "Give an example of when you showed leadership."
  ],
  technical: [
    "Explain the difference between SQL and NoSQL databases.",
    "What is object-oriented programming and its benefits?",
    "Describe the software development lifecycle.",
    "What is the difference between synchronous and asynchronous programming?",
    "How would you optimize a slow database query?",
    "Explain what a REST API is and its principles.",
    "What is version control and why is it important?",
    "Describe Docker and its use cases.",
    "How do you approach debugging complex code issues?",
    "What is continuous integration and continuous deployment?"
  ],
  behavioral: [
    "Tell me about a time you failed and what you learned.",
    "Describe a situation where you had to work with a difficult team member.",
    "Give an example of when you showed leadership.",
    "How do you handle stress and pressure at work?",
    "Describe a time you had to make a difficult decision.",
    "Tell me about your proudest professional achievement.",
    "How do you approach feedback and criticism?",
    "Describe a time you took initiative beyond your job description.",
    "Tell me about your experience working in a diverse team.",
    "How do you stay motivated when facing setbacks?"
  ],
  'role-based': [
    "What attracts you to this specific role?",
    "How would you approach your first 30 days in this position?",
    "What relevant experience do you have for this role?",
    "How do you stay current with industry trends and developments?",
    "Describe how you would handle a typical day in this position.",
    "What tools and technologies are you proficient in?",
    "How would you measure success in this role?",
    "Tell me about your experience with similar responsibilities.",
    "How would you contribute to our team's goals?",
    "What questions do you have about this role and our company?"
  ],
  dsa: [
    "What is a linked list and how would you implement it?",
    "Explain the difference between arrays and linked lists.",
    "How would you reverse a string?",
    "What is a binary search tree and when would you use it?",
    "Explain the concept of recursion with an example.",
    "What is the time complexity of quicksort?",
    "How would you find the maximum element in an array?",
    "Explain what a hash table is and how it works.",
    "What is the difference between depth-first and breadth-first search?",
    "How would you implement a stack using an array?"
  ],
  resume: [
    "Tell me about the projects mentioned in your resume.",
    "What was the most challenging project you've worked on?",
    "How did you use the technologies listed in your resume?",
    "Describe your experience with the programming languages on your resume.",
    "What achievements are you most proud of?",
    "How did you handle conflicts in the projects listed?",
    "What did you learn from your previous roles?",
    "How would you apply your experience to this position?",
    "Tell me about your contributions to team projects.",
    "What new skills did you develop in your recent roles?"
  ],
  mock: [
    "Tell me about yourself and your professional background.",
    "What are your greatest strengths?",
    "Explain the difference between SQL and NoSQL databases.",
    "Tell me about a time you failed and what you learned.",
    "Why are you interested in this position?",
    "What is object-oriented programming and its benefits?",
    "How do you handle conflict with colleagues?",
    "Describe a challenging project you worked on.",
    "What do you know about our company?",
    "What are your career goals for the next 5 years?"
  ]
};

// ============================================
// ROUTES
// ============================================

// Authentication endpoint - Simple login without DB (for testing)
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  
  // Simple auth: accept any email/password combination for testing
  // In production, validate against database
  const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
  
  res.json({
    success: true,
    token,
    user: {
      id: email.split('@')[0],
      email,
      name: email.split('@')[0].replace(/[._]/g, ' ').trim()
    }
  });
});

// Signup endpoint
app.post('/auth/signup', (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name required' });
  }
  
  // Simple auth: accept any new signup for testing
  const token = Buffer.from(`${email}:${Date.now()}`).toString('base64');
  
  res.json({
    success: true,
    token,
    user: {
      id: email.split('@')[0],
      email,
      name
    }
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Avatar Interview API is running',
    timestamp: new Date().toISOString()
  });
});

// ============================================
// START INTERVIEW
// ============================================

app.post('/api/interviews/start', (req, res) => {
  try {
    const { type, count = 5, role, resumeText } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Interview type required' });
    }

    // Get questions for this interview type
    let questions = questionBank[type] || questionBank['hr'];
    
    // Shuffle and limit questions
    questions = questions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count, questions.length));

    // Create interview session
    const sessionId = Buffer.from(`${type}:${Date.now()}`).toString('hex');

    res.json({
      success: true,
      sessionId,
      type,
      role: role || 'Not specified',
      count: questions.length,
      questions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[/api/interviews/start] Error:', error);
    res.status(500).json({ error: 'Failed to start interview' });
  }
});

// ============================================
// GET QUESTIONS
// ============================================

app.post('/api/interview/questions', (req, res) => {
  try {
    const { type, count, role } = req.body;

    if (!type || !questionBank[type]) {
      return res.status(400).json({ error: 'Invalid interview type' });
    }

    let questions = questionBank[type];
    
    // Shuffle and limit questions
    questions = questions
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(count || 5, questions.length));

    res.json({
      success: true,
      type: type,
      role: role,
      questions: questions,
      count: questions.length
    });

  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// AVATAR GENERATION
// ============================================

app.post('/api/avatar/generate', async (req, res) => {
  try {
    const { text, style, voiceType } = req.body;

    console.log('🎥 Generating avatar video...');

    if (!config.didApiKey) {
      // Return mock video URL for demo
      return res.json({
        videoUrl: 'https://media.istockphoto.com/id/1470606967/video/corporate-headshot-of-attractive-diverse-young-adult-woman-smiling-at-the-camera-isolated.mp4',
        success: true,
        demo: true
      });
    }

    // Generate TTS audio first
    const audioUrl = await generateTTS(text, style);

    // Call D-ID API
    const didResponse = await axios.post('https://api.d-id.com/talks', {
      source_url: 'https://d-id-public-bucket.s3.amazonaws.com/videos/default.jpg',
      script: {
        type: 'text',
        subtitles: 'true',
        provider: {
          type: 'elevenlabs',
          voice_id: getVoiceId(style)
        },
        ssml: true,
        input: text
      },
      config: {
        fluent: true,
        pad_audio: 0.0
      }
    }, {
      headers: {
        Authorization: `Basic ${config.didApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const videoUrl = didResponse.data.result_url;

    res.json({
      success: true,
      videoUrl: videoUrl,
      duration: didResponse.data.duration,
      platform: 'D-ID'
    });

  } catch (error) {
    console.error('Avatar generation error:', error.message);
    
    // Return fallback
    res.json({
      success: true,
      videoUrl: 'https://media.istockphoto.com/id/1470606967/video/corporate-headshot-of-attractive-diverse-young-adult-woman-smiling-at-the-camera-isolated.mp4',
      fallback: true,
      error: error.message
    });
  }
});

// ============================================
// TEXT-TO-SPEECH
// ============================================

async function generateTTS(text, style) {
  try {
    if (!config.elevenlabsApiKey) {
      return null;
    }

    const voiceId = getVoiceId(style);
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      { text: text },
      {
        headers: {
          'xi-api-key': config.elevenlabsApiKey,
          'Content-Type': 'application/json'
        },
        responseType: 'arraybuffer'
      }
    );

    // Save to temporary file or upload to storage
    // For now, return the audio data
    return Buffer.from(response.data).toString('base64');

  } catch (error) {
    console.error('TTS generation error:', error.message);
    return null;
  }
}

function getVoiceId(style) {
  const voiceMap = {
    'professional': 'cgSgspJ2msm639mmd46d', // Professional voice
    'friendly': 'EXAVITQu4vr4xnSDxMaL',     // Friendly voice
    'technical': 'NM0g5B1dBd7eH2z0OaZJ'     // Technical voice
  };
  return voiceMap[style] || voiceMap['professional'];
}

// ============================================
// AUDIO TRANSCRIPTION
// ============================================

app.post('/api/audio/transcribe', upload.single('file'), async (req, res) => {
  try {
    console.log('🔊 Transcribing audio...');

    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    if (!config.openaiApiKey) {
      return res.json({
        success: true,
        text: 'Unable to transcribe without API key',
        demo: true
      });
    }

    // Create FormData for Whisper API
    const formData = new FormData();
    formData.append('file', req.file.buffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm'
    });
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');

    // Call OpenAI Whisper API
    const response = await axios.post(
      'https://api.openai.com/v1/audio/transcriptions',
      formData,
      {
        headers: {
          Authorization: `Bearer ${config.openaiApiKey}`,
          ...formData.getHeaders()
        }
      }
    );

    res.json({
      success: true,
      text: response.data.text,
      language: 'en'
    });

  } catch (error) {
    console.error('Transcription error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ANSWER SCORING & EVALUATION
// ============================================

app.post('/api/interview/score', async (req, res) => {
  try {
    const { question, answer, type, questionIndex } = req.body;

    console.log('🏆 Scoring answer...');

    if (!config.openaiApiKey) {
      // Return mock score
      return res.json({
        overall: Math.floor(Math.random() * 30) + 70,
        clarity: Math.floor(Math.random() * 30) + 70,
        completeness: Math.floor(Math.random() * 30) + 70,
        confidence: Math.floor(Math.random() * 30) + 70,
        feedback: 'Good response! (Demo scoring)',
        demo: true
      });
    }

    // Use ChatGPT to score the answer
    const prompt = `
    You are an expert interview evaluator. Score the following interview response.
    
    Interview Type: ${type}
    Question: "${question}"
    Candidate's Answer: "${answer}"
    
    Provide a JSON response with:
    {
      "overall": <0-100>,
      "clarity": <0-100>,
      "completeness": <0-100>,
      "confidence": <0-100>,
      "feedback": "<brief feedback>"
    }
    
    Consider:
    - Clarity: Is the answer clear and well-articulated?
    - Completeness: Does it fully address the question?
    - Confidence: Does the tone suggest confidence?
    - Overall: Weighted score considering all factors
    
    Respond with ONLY the JSON object, no additional text.
    `;

    const gptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 300
      },
      {
        headers: {
          Authorization: `Bearer ${config.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const scoreText = gptResponse.data.choices[0].message.content;
    const score = JSON.parse(scoreText);

    res.json({
      success: true,
      ...score
    });

  } catch (error) {
    console.error('Scoring error:', error.message);
    
    // Return fallback score
    res.json({
      overall: 75,
      clarity: 75,
      completeness: 75,
      confidence: 75,
      feedback: 'Answer processed',
      error: error.message
    });
  }
});

// ============================================
// INTERVIEW COMPLETION & RESULTS
// ============================================

app.post('/api/interview/results', async (req, res) => {
  try {
    const { scores, type, duration } = req.body;

    console.log('📊 Calculating final results...');

    // Calculate statistics
    const overall = scores.reduce((sum, s) => sum + (s.overall || 0), 0) / scores.length;
    const communication = scores.reduce((sum, s) => sum + (s.clarity || 0), 0) / scores.length;
    const clarity = scores.reduce((sum, s) => sum + (s.clarity || 0), 0) / scores.length;
    const confidence = scores.reduce((sum, s) => sum + (s.confidence || 0), 0) / scores.length;
    const technical = scores.reduce((sum, s) => sum + (s.completeness || 0), 0) / scores.length;

    // Generate summary with ChatGPT
    let summary = 'Great interview performance!';

    if (overall >= 80) {
      summary = 'Excellent! You demonstrated strong communication and knowledge.';
    } else if (overall >= 70) {
      summary = 'Good performance. Consider working on clarity and completeness in your answers.';
    } else if (overall >= 60) {
      summary = 'Acceptable performance. Focus on deeper explanations and examples.';
    } else {
      summary = 'Room for improvement. Practice structured answers and technical depth.';
    }

    res.json({
      success: true,
      overall: Math.round(overall),
      breakdown: {
        communication: Math.round(communication),
        clarity: Math.round(clarity),
        confidence: Math.round(confidence),
        technical: Math.round(technical)
      },
      summary: summary,
      duration: duration,
      type: type,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Results error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HEYGEN REAL-TIME STREAMING API
// ============================================

/**
 * GET /api/heygen/config
 * Returns HeyGen configuration (API key and agent IDs)
 * Frontend needs this to initialize the HeyGen real-time service
 */
app.get('/api/heygen/config', (req, res) => {
  try {
    const heygenApiKey = process.env.HEYGEN_API_KEY;
    const maleAgentId = process.env.HEYGEN_MALE_AGENT_ID;
    const femaleAgentId = process.env.HEYGEN_FEMALE_AGENT_ID;

    if (!heygenApiKey || !maleAgentId || !femaleAgentId) {
      console.warn('[HeyGen] Missing configuration');
      return res.status(400).json({
        error: 'HeyGen configuration incomplete',
        message: 'API key or agent IDs not configured'
      });
    }

    res.json({
      success: true,
      heygenApiKey: heygenApiKey,
      maleAgentId: maleAgentId,
      femaleAgentId: femaleAgentId
    });
  } catch (error) {
    console.error('[HeyGen] Config error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/heygen/session
 * Creates a HeyGen real-time streaming session
 * Returns sessionId, sessionToken, and streamingServerUrl
 */
app.post('/api/heygen/session', async (req, res) => {
  try {
    const { agentId } = req.body;
    const heygenApiKey = process.env.HEYGEN_API_KEY;

    if (!agentId || !heygenApiKey) {
      return res.status(400).json({
        error: 'Missing required parameters',
        details: 'agentId and HeyGen API key are required'
      });
    }

    console.log('[HeyGen] Creating session for agent:', agentId);

    // Call HeyGen API to create a session
    const response = await axios.post(
      'https://api.heygen.com/v1/streaming.create_session',
      {
        quality: 'high',
        avatar_id: agentId,
        voice: {
          voice_id: 'default'
        }
      },
      {
        headers: {
          'X-Api-Key': heygenApiKey,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    if (!response.data.data) {
      throw new Error('Invalid response from HeyGen API');
    }

    const sessionData = response.data.data;

    console.log('[HeyGen] Session created:', sessionData.session_id);

    res.json({
      success: true,
      sessionId: sessionData.session_id,
      sessionToken: sessionData.session_token,
      sessionServer: sessionData.server_url || 'wss://stream.heygen.com/v1/ws',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour expiry
    });

  } catch (error) {
    console.error('[HeyGen] Session creation error:', error.message);
    
    // Distinguish between HeyGen API errors and other errors
    if (error.response?.status === 401) {
      res.status(401).json({
        error: 'HeyGen authentication failed',
        message: 'Invalid or expired HeyGen API key'
      });
    } else if (error.response?.status === 400) {
      res.status(400).json({
        error: 'Invalid HeyGen parameters',
        message: error.response.data?.message || 'Check agentId and configuration'
      });
    } else {
      res.status(500).json({
        error: 'HeyGen session creation failed',
        message: error.message
      });
    }
  }
});

// ============================================
// AI RESUME GENERATION
// ============================================

/**
 * POST /api/ai/resume/generate
 * Generate an AI resume from user profile information
 */
app.post('/api/ai/resume/generate', async (req, res) => {
  try {
    const { name, email, phone, title, experience, skills, summary, jobUrl } = req.body;

    // Validate required fields
    if (!name || !title || !experience || !skills) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'name, title, experience, and skills are required'
      });
    }

    // If OpenAI API key is available, use it
    if (config.openaiApiKey) {
      console.log('[Resume] Using OpenAI to generate resume');
      
      const prompt = `Generate a professional resume based on this profile:
Name: ${name}
Email: ${email}
Phone: ${phone}
Current Title: ${title}
Experience: ${experience}
Skills: ${skills}
Professional Summary: ${summary}
${jobUrl ? `Target Job URL: ${jobUrl}` : ''}

Create a well-formatted, professional resume that includes:
1. Professional summary
2. Contact information
3. Professional experience
4. Skills section
5. Education (if mentioned)

Make it concise, impactful, and ATS-friendly.`;

      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are a professional resume writer. Generate clear, ATS-friendly resumes.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 1500
          },
          {
            headers: {
              'Authorization': `Bearer ${config.openaiApiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000
          }
        );

        if (!response.data.choices || !response.data.choices[0]) {
          throw new Error('Invalid response from OpenAI');
        }

        const resumeContent = response.data.choices[0].message.content;

        return res.json({
          success: true,
          resume: {
            content: resumeContent,
            name: name,
            title: title,
            email: email
          },
          content: resumeContent
        });
      } catch (openaiError) {
        console.warn('[Resume] OpenAI failed, using fallback template:', openaiError.message);
        // Fall through to use template below
      }
    }

    // Fallback: Generate resume from template
    console.log('[Resume] Using template-based resume generation');
    
    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
    const resumeContent = `
╔════════════════════════════════════════════════════════════════╗
║                     PROFESSIONAL RESUME                        ║
╚════════════════════════════════════════════════════════════════╝

${name.toUpperCase()}
${email} | ${phone || 'Phone not provided'}

PROFESSIONAL SUMMARY
────────────────────
${summary || `Experienced ${title} with expertise in ${skillsArray.join(', ')}. Seeking opportunities to leverage technical skills and contribute to dynamic teams.`}

PROFESSIONAL EXPERIENCE
────────────────────
${title}
${experience || 'Relevant experience in the field with proven track record of success and delivery.'}

CORE SKILLS
────────────────────
• ${skillsArray.join('\n• ')}

EDUCATION
────────────────────
Professional Development in Technology and Business

TECHNICAL PROFICIENCIES
────────────────────
${skillsArray.slice(0, 3).join(' • ')}

════════════════════════════════════════════════════════════════

ATS Score: HIGH
Generated: ${new Date().toLocaleDateString()}
    `;

    res.json({
      success: true,
      resume: {
        content: resumeContent,
        name: name,
        title: title,
        email: email
      },
      content: resumeContent
    });

  } catch (error) {
    console.error('[Resume] Generation error:', error.message);
    
    res.status(500).json({
      error: 'Resume generation failed',
      message: error.message,
      details: 'Failed to generate resume'
    });
  }
});

// ============================================
// RESUME EVALUATION & SCORING
// ============================================

/**
 * POST /api/evaluate/resume
 * Evaluate and score a resume with AI-powered feedback
 */
app.post('/api/evaluate/resume', async (req, res) => {
  try {
    const { resumeText, keywords = [] } = req.body;

    if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
      return res.status(400).json({
        error: 'Invalid resume text',
        message: 'Resume text is required and must be a string'
      });
    }

    const text = resumeText.trim();

    // Calculate basic scores
    const lines = text.split('\n').filter(l => l.trim());
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // ATS Score: Based on formatting, keywords, structure
    let atsScore = 50; // Base score
    
    // Bonus for proper sections
    if (text.match(/PROFESSIONAL|SUMMARY/i)) atsScore += 10;
    if (text.match(/EXPERIENCE|WORK/i)) atsScore += 10;
    if (text.match(/SKILLS/i)) atsScore += 10;
    if (text.match(/EDUCATION/i)) atsScore += 10;
    
    atsScore = Math.min(atsScore, 100);

    // Keyword Match Score
    let keywordScore = 0;
    if (keywords && keywords.length > 0) {
      const matchedKeywords = keywords.filter(kw => 
        text.toLowerCase().includes(kw.toLowerCase())
      ).length;
      keywordScore = Math.round((matchedKeywords / keywords.length) * 100);
    } else {
      keywordScore = 75; // Default if no keywords provided
    }

    // Grammar Score (basic - no AI needed)
    let grammarScore = 85;
    // Deduct for common issues
    if (text.match(/\s{2,}/g)) grammarScore -= 5; // Extra spaces
    if (!text.match(/[.!?].*[.!?]/)) grammarScore -= 10; // No proper punctuation
    grammarScore = Math.max(grammarScore, 50);

    // Length Score
    let lengthScore = 100;
    if (wordCount < 50) {
      lengthScore = 40; // Too short
    } else if (wordCount < 200) {
      lengthScore = 70; // Short but acceptable
    } else if (wordCount > 1000) {
      lengthScore = 70; // Too long
    }

    // Overall score
    const overallScore = Math.round((atsScore + keywordScore + grammarScore + lengthScore) / 4);

    // Generate feedback
    const strengths = [];
    const improvements = [];

    if (atsScore >= 70) {
      strengths.push('Good use of professional formatting and sections');
    } else {
      improvements.push('Add clear sections: Professional Summary, Experience, Skills, Education');
    }

    if (keywordScore >= 70) {
      strengths.push('Excellent keyword match for the target role');
    } else if (keywords.length > 0) {
      improvements.push(`Consider adding more relevant keywords: ${keywords.slice(0, 3).join(', ')}`);
    }

    if (grammarScore >= 90) {
      strengths.push('Well-written with proper grammar and punctuation');
    } else {
      improvements.push('Review for spelling and grammar errors');
    }

    if (lengthScore >= 90) {
      strengths.push('Appropriate resume length');
    } else if (wordCount < 100) {
      improvements.push('Expand your resume with more details about achievements and responsibilities');
    } else if (wordCount > 1000) {
      improvements.push('Consider condensing to a more concise format (ideal: 250-600 words)');
    }

    res.json({
      success: true,
      overallScore: overallScore,
      atsScore: atsScore,
      keywordMatchScore: keywordScore,
      grammarScore: grammarScore,
      lengthScore: lengthScore,
      wordCount: wordCount,
      strengths: strengths,
      improvements: improvements,
      weakSentences: [],
      feedback: `Your resume scores ${overallScore}% overall. ${strengths.length > 0 ? 'Strengths: ' + strengths.join('; ') + '.' : ''} ${improvements.length > 0 ? 'Improvements: ' + improvements.join('; ') + '.' : ''}`
    });

  } catch (error) {
    console.error('[Resume Evaluation] Error:', error.message);
    res.status(500).json({
      error: 'Resume evaluation failed',
      message: error.message
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined
  });
});

// ============================================
// START SERVER
// ============================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║     AI AVATAR INTERVIEW - BACKEND SERVER                      ║
║                                                                ║
║  🚀 Server is running on http://localhost:${PORT}                      
║  📡 CORS enabled                                              
║  🔐 API Key Status:                                           
║     - OpenAI: ${config.openaiApiKey ? '✅' : '❌'}                                          
║     - D-ID: ${config.didApiKey ? '✅' : '❌'}                                              
║     - ElevenLabs: ${config.elevenLabsKey ? '✅' : '❌'}
║                                                                ║
║  Available Endpoints:                                         ║
║  • POST /api/interview/questions      Get interview questions ║
║  • POST /api/avatar/generate          Generate avatar video   ║
║  • POST /api/audio/transcribe         Transcribe audio (STT)  ║
║  • POST /api/interview/score          Score an answer         ║
║  • POST /api/interview/results        Calculate final results ║
║  • GET /api/health                    Health check            ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
  });
}

module.exports = app;
