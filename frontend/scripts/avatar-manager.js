/**
 * Avatar Manager
 * Handles D-ID or HeyGen Live Avatar API integration
 * Manages avatar initialization, video playback, and lip-syncing
 */

class AvatarManager {
  constructor(config = {}) {
    this.config = {
      provider: config.provider || 'did', // 'did' or 'heygen'
      apiKey: config.apiKey || process.env.AVATAR_API_KEY,
      sessionToken: null,
      ...config
    };

    this.state = {
      initialized: false,
      isSpeaking: false,
      currentAvatar: null
    };

    this.avatarConfigs = {
      'professional-male': {
        name: 'Professional Male',
        didId: 'ava-hdh8j2o8e7dk2k2k', // Example D-ID avatar
        heygenId: 'avtr_c383d89c0c',    // Example HeyGen avatar
        voice: 'male-professional'
      },
      'professional-female': {
        name: 'Professional Female',
        didId: 'ava-jdk2k2o8e7d2l2l2',
        heygenId: 'avtr_d392d89c0c',
        voice: 'female-professional'
      },
      'friendly-male': {
        name: 'Friendly Male',
        didId: 'ava-kdl2l2p9f8e3m3m3',
        heygenId: 'avtr_e401d89c0c',
        voice: 'male-friendly'
      },
      'friendly-female': {
        name: 'Friendly Female',
        didId: 'ava-ldm3m3q9f8e3n3n3',
        heygenId: 'avtr_f410d89c0c',
        voice: 'female-friendly'
      },
      'technical-male': {
        name: 'Technical Lead (Male)',
        didId: 'ava-mdn3n3r9f8e3o3o3',
        heygenId: 'avtr_g419d89c0c',
        voice: 'male-technical'
      },
      'technical-female': {
        name: 'Technical Lead (Female)',
        didId: 'ava-ndo3o3s9f8e3p3p3',
        heygenId: 'avtr_h428d89c0c',
        voice: 'female-technical'
      }
    };

    this.emotionMap = {
      // Maps emotion detected from text to avatar response style
      'encouraging': { speed: 1.0, emotion: 'smile' },
      'neutral': { speed: 1.0, emotion: 'neutral' },
      'surprised': { speed: 0.9, emotion: 'surprise' },
      'encouraging-slow': { speed: 0.8, emotion: 'nod' }
    };
  }

  async initialize(avatarType = 'professional-male') {
    console.log('[AvatarManager] Initializing with avatar:', avatarType);

    try {
      this.state.currentAvatar = avatarType;
      const config = this.avatarConfigs[avatarType];

      if (!config) {
        throw new Error(`Unknown avatar type: ${avatarType}`);
      }

      if (this.config.provider === 'did') {
        await this.initializeD_ID();
      } else if (this.config.provider === 'heygen') {
        await this.initializeHeyGen();
      }

      this.state.initialized = true;
      console.log('[AvatarManager] Avatar initialized successfully');
    } catch (error) {
      console.error('[AvatarManager] Initialization failed:', error);
      throw error;
    }
  }

  async initializeD_ID() {
    console.log('[AvatarManager] Initializing D-ID avatar...');

    try {
      // Create D-ID streaming session
      const response = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(':' + this.config.apiKey)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_url: this.getAvatarImageUrl(),
          script: {
            type: 'text',
            input: 'Hello, welcome to the interview.'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.statusText}`);
      }

      const data = await response.json();
      this.config.sessionToken = data.session_id;

      // Load D-ID iframe
      this.loadD_IDIframe();
    } catch (error) {
      console.warn('[AvatarManager] D-ID initialization failed, using fallback:', error);
      this.loadFallbackAvatar();
    }
  }

  async initializeHeyGen() {
    console.log('[AvatarManager] Initializing HeyGen avatar...');

    try {
      // HeyGen Real-Time Avatar setup
      const token = await this.getHeyGenToken();
      this.config.heygenToken = token;

      // Load HeyGen iframe with real-time avatar
      this.loadHeyGenIframe();
    } catch (error) {
      console.warn('[AvatarManager] HeyGen initialization failed, using fallback:', error);
      this.loadFallbackAvatar();
    }
  }

  async getHeyGenToken() {
    console.log('[AvatarManager] Getting HeyGen token...');

    const response = await fetch('https://api.heygen.com/v1/streaming.create_session', {
      method: 'POST',
      headers: {
        'X-CUSTOM-HEADER': 'X-API-KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        avatar_id: 'avtr_xxxx', // Replace with actual avatar ID
        voice: {
          voice_id: this.config.voiceId || 'default'
        }
      })
    });

    if (!response.ok) {
      throw new Error('HeyGen token creation failed');
    }

    const data = await response.json();
    return data.session_id;
  }

  loadD_IDIframe() {
    console.log('[AvatarManager] Loading D-ID iframe...');

    const iframe = document.getElementById('avatarIframe');
    if (iframe) {
      iframe.src = `https://d-id.com/talks/${this.config.sessionToken}`;
    }
  }

  loadHeyGenIframe() {
    console.log('[AvatarManager] Loading HeyGen iframe...');

    const iframe = document.getElementById('avatarIframe');
    if (iframe) {
      // HeyGen streaming URL format
      iframe.src = `https://app.heygen.com/embed/streaming?session_id=${this.config.heygenToken}`;
    }
  }

  loadFallbackAvatar() {
    console.log('[AvatarManager] Loading fallback avatar...');

    const wrapper = document.getElementById('interviewerVideoWrapper');
    if (wrapper) {
      const avatarConfig = this.avatarConfigs[this.state.currentAvatar];
      wrapper.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <div style="text-align: center;">
            <div style="font-size: 80px; margin-bottom: 20px;">👤</div>
            <h2 style="margin: 0 0 10px 0; font-size: 24px;">${avatarConfig.name}</h2>
            <p style="margin: 0; font-size: 14px; opacity: 0.8;">Avatar loading...</p>
            <p style="margin: 10px 0 0 0; font-size: 12px; opacity: 0.6;">Check API keys and internet connection</p>
          </div>
        </div>
      `;
    }
  }

  async playQuestion(question) {
    console.log('[AvatarManager] Playing question:', question);

    if (!this.state.initialized) {
      console.warn('[AvatarManager] Avatar not initialized, skipping playback');
      return;
    }

    try {
      // Detect emotion from question
      const emotion = this.detectEmotion(question);

      // Generate TTS and play
      if (this.config.provider === 'did') {
        await this.playQuestionD_ID(question, emotion);
      } else if (this.config.provider === 'heygen') {
        await this.playQuestionHeyGen(question, emotion);
      }

      this.state.isSpeaking = true;
      // Simulate speaking duration
      const duration = this.estimateSpeakingDuration(question);
      setTimeout(() => {
        this.state.isSpeaking = false;
      }, duration);
    } catch (error) {
      console.error('[AvatarManager] Failed to play question:', error);
    }
  }

  async playQuestionD_ID(question, emotion) {
    console.log('[AvatarManager] Playing question via D-ID');

    try {
      const response = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(':' + this.config.apiKey)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          source_url: this.getAvatarImageUrl(),
          driver_url: 'bank://lively/',
          script: {
            type: 'text',
            input: question
          },
          config: {
            stitch: true,
            pad_audio: emotion.padAudio || 0,
            emotion: emotion.emotion || 'neutral'
          },
          language: {
            type: 'en'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`D-ID API error: ${response.statusText}`);
      }

      const data = await response.json();
      await this.playVideo(data.result_url);
    } catch (error) {
      console.error('[AvatarManager] D-ID playback failed:', error);
    }
  }

  async playQuestionHeyGen(question, emotion) {
    console.log('[AvatarManager] Playing question via HeyGen');

    try {
      // Send text to HeyGen for real-time streaming
      const response = await fetch('https://api.heygen.com/v1/streaming.send_action', {
        method: 'POST',
        headers: {
          'X-CUSTOM-HEADER': 'X-API-KEY',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: this.config.heygenToken,
          action: {
            type: 'talk',
            text: question,
            emotion: emotion.emotion || 'neutral'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HeyGen API error: ${response.statusText}`);
      }
    } catch (error) {
      console.error('[AvatarManager] HeyGen playback failed:', error);
    }
  }

  async playVideo(videoUrl) {
    const wrapper = document.getElementById('interviewerVideoWrapper');
    if (wrapper) {
      const video = document.createElement('video');
      video.src = videoUrl;
      video.autoplay = true;
      video.controls = false;
      video.style.width = '100%';
      video.style.height = '100%';
      video.style.objectFit = 'cover';
      video.style.borderRadius = '12px';

      wrapper.innerHTML = '';
      wrapper.appendChild(video);

      return new Promise((resolve) => {
        video.onended = resolve;
      });
    }
  }

  detectEmotion(text) {
    /**
     * Detect emotion from text to guide avatar response
     * This is a simple implementation - can be enhanced with sentiment analysis
     */
    const lowerText = text.toLowerCase();

    if (lowerText.includes('nervous') || lowerText.includes('struggling')) {
      return { emotion: 'encouraging', speed: 1.0 };
    }

    if (lowerText.includes('?') && text.length < 50) {
      return { emotion: 'surprised', speed: 0.9 };
    }

    if (lowerText.includes('congratulations') || lowerText.includes('great')) {
      return { emotion: 'smile', speed: 1.0 };
    }

    return { emotion: 'neutral', speed: 1.0 };
  }

  estimateSpeakingDuration(text) {
    // Rough estimate: 150 words per minute = 2.5 words per second
    const wordCount = text.split(/\s+/).length;
    return Math.max(2000, (wordCount / 2.5) * 1000);
  }

  getAvatarImageUrl() {
    /**
     * Returns the avatar image URL for D-ID
     * In production, this should be a custom trained avatar
     */
    const config = this.avatarConfigs[this.state.currentAvatar];
    
    // Default avatar images - replace with custom trained avatars
    const defaultAvatars = {
      'professional-male': 'https://img.d-id.com/avatars/professional-male.jpg',
      'professional-female': 'https://img.d-id.com/avatars/professional-female.jpg',
      'friendly-male': 'https://img.d-id.com/avatars/friendly-male.jpg',
      'friendly-female': 'https://img.d-id.com/avatars/friendly-female.jpg',
      'technical-male': 'https://img.d-id.com/avatars/technical-male.jpg',
      'technical-female': 'https://img.d-id.com/avatars/technical-female.jpg'
    };

    return defaultAvatars[this.state.currentAvatar] || defaultAvatars['professional-male'];
  }

  // Avatar response with emotion based on user's answer
  async respondToAnswer(userAnswer, emotion) {
    console.log('[AvatarManager] Avatar responding to answer with emotion:', emotion);

    const responses = {
      'encouraging': [
        'That\'s a great point. Tell me more about that.',
        'I appreciate your perspective. Can you expand on that?',
        'Excellent! That shows strong thinking.'
      ],
      'neutral': [
        'I see. Let\'s move to the next question.',
        'Thank you for that answer. Proceeding...',
        'Noted. Moving forward...'
      ],
      'surprised': [
        'That\'s an interesting approach!',
        'I wasn\'t expecting that answer. Can you elaborate?',
        'Fascinating! Tell me more.'
      ],
      'encouraging-slow': [
        'I notice you paused there. Take your time.',
        'No rush, let me know when you\'re ready.',
        'Would you like to try that answer again?'
      ]
    };

    const emotionResponses = responses[emotion] || responses.neutral;
    const selectedResponse = emotionResponses[Math.floor(Math.random() * emotionResponses.length)];

    await this.playQuestion(selectedResponse);
  }
}

// Initialize Avatar Manager on page load
document.addEventListener('DOMContentLoaded', () => {
  // Detect if D-ID or HeyGen API key is available
  const provider = process.env.HEYGEN_API_KEY ? 'heygen' : 'did';
  
  window.avatarManager = new AvatarManager({
    provider,
    apiKey: process.env.AVATAR_API_KEY || ''
  });
});
