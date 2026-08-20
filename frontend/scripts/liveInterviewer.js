/**
 * Live AI Interviewer Integration
 * Manages the real human AI interviewer experience
 * Integrates HeyGen real-time agent with interview question flow
 */

class LiveInterviewer {
  constructor() {
    this.service = null;
    this.interviewerContainer = null;
    this.isSpeaking = false;
    this.selectedGender = localStorage.getItem('interviewerGender') || 'male';
    this.heygenApiKey = null;
    this.maleAgentId = null;
    this.femaleAgentId = null;
  }

  /**
   * Initialize the live interviewer
   * Load configuration and setup service
   */
  async initialize() {
    try {
      console.log('[LiveInterviewer] Initializing...');

      // Get configuration from environment via backend
      const config = await this.getConfig();
      if (!config) {
        console.warn('[LiveInterviewer] Failed to get configuration');
        return false;
      }

      this.heygenApiKey = config.heygenApiKey;
      this.maleAgentId = config.maleAgentId;
      this.femaleAgentId = config.femaleAgentId;

      // Get interviewer container
      this.interviewerContainer = document.getElementById('aiRealInterviewer');
      if (!this.interviewerContainer) {
        console.warn('[LiveInterviewer] Container not found');
        return false;
      }

      // Initialize service
      this.service = window.heygenRealtimeService;
      
      const agentId = this.selectedGender === 'male' ? this.maleAgentId : this.femaleAgentId;
      const initialized = await this.service.initialize(this.heygenApiKey, agentId);

      if (!initialized) {
        console.error('[LiveInterviewer] Service initialization failed');
        return false;
      }

      console.log('[LiveInterviewer] Successfully initialized');
      return true;
    } catch (error) {
      console.error('[LiveInterviewer] Initialization error:', error);
      return false;
    }
  }

  /**
   * Get HeyGen configuration from backend
   * @private
   */
  async getConfig() {
    try {
      const response = await fetch('http://localhost:3000/api/heygen/config');
      if (!response.ok) {
        console.error('[LiveInterviewer] Config fetch failed');
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('[LiveInterviewer] Config error:', error);
      return null;
    }
  }

  /**
   * Make the interviewer speak a question
   * Called from the main interview engine when a question is loaded
   * @param {string} questionText - The question to speak
   */
  async speak(questionText) {
    try {
      if (!this.service || !this.service.isReady()) {
        console.warn('[LiveInterviewer] Service not ready');
        return;
      }

      console.log('[LiveInterviewer] Speaking question:', questionText);
      this.isSpeaking = true;

      // Send text to HeyGen agent
      this.service.sendText(questionText);

      // Wait for completion
      // In a real scenario, the service would notify when done
      // For now, estimate based on text length
      const estimatedDuration = (questionText.length / 150) * 1000; // rough estimate
      
      return new Promise((resolve) => {
        setTimeout(() => {
          this.isSpeaking = false;
          console.log('[LiveInterviewer] Finished speaking');
          resolve();
        }, estimatedDuration);
      });
    } catch (error) {
      console.error('[LiveInterviewer] Speak error:', error);
      this.isSpeaking = false;
    }
  }

  /**
   * Set the interviewer gender
   * @param {string} gender - 'male' or 'female'
   */
  setGender(gender) {
    this.selectedGender = gender;
    localStorage.setItem('interviewerGender', gender);
    console.log('[LiveInterviewer] Gender set to:', gender);
  }

  /**
   * Get the selected interviewer gender
   */
  getGender() {
    return this.selectedGender;
  }

  /**
   * Show the interviewer container
   */
  show() {
    if (this.interviewerContainer) {
      this.interviewerContainer.style.display = 'block';
    }
  }

  /**
   * Hide the interviewer container
   */
  hide() {
    if (this.interviewerContainer) {
      this.interviewerContainer.style.display = 'none';
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeakingNow() {
    return this.isSpeaking;
  }

  /**
   * Cleanup and close the interviewer
   */
  async close() {
    try {
      if (this.service) {
        await this.service.close();
      }
      this.hide();
      console.log('[LiveInterviewer] Closed');
    } catch (error) {
      console.error('[LiveInterviewer] Close error:', error);
    }
  }
}

// Export as singleton
window.liveInterviewer = window.liveInterviewer || new LiveInterviewer();
