/**
 * HeyGen Real-Time Streaming Avatar Service
 * Handles connection to HeyGen real-time agent for live human-like interviewer
 * Uses HeyGen's real-time streaming API for one-to-one conversation
 */

class HeyGenRealtimeService {
  constructor() {
    this.sessionId = null;
    this.sessionToken = null;
    this.sessionServer = null;
    this.agentId = null;
    this.initialized = false;
    this.connected = false;
    this.ws = null;
    this.mediaStream = null;
    this.audioContext = null;
    this.audioElement = null;
  }

  /**
   * Initialize HeyGen real-time session
   * @param {string} heygenApiKey - HeyGen API key from environment
   * @param {string} agentId - Agent ID (male or female)
   * @returns {Promise<boolean>}
   */
  async initialize(heygenApiKey, agentId) {
    try {
      console.log('[HeyGenRealtimeService] Initializing with agent:', agentId);
      
      if (!heygenApiKey || !agentId) {
        console.error('[HeyGenRealtimeService] Missing API key or agent ID');
        return false;
      }

      this.agentId = agentId;
      
      // Step 1: Create session
      const sessionResponse = await this.createSession(heygenApiKey, agentId);
      if (!sessionResponse.sessionId) {
        console.error('[HeyGenRealtimeService] Failed to create session');
        return false;
      }

      this.sessionId = sessionResponse.sessionId;
      this.sessionToken = sessionResponse.sessionToken;
      this.sessionServer = sessionResponse.sessionServer;

      console.log('[HeyGenRealtimeService] Session created:', this.sessionId);

      // Step 2: Start real-time connection
      const connected = await this.startStreaming();
      if (!connected) {
        console.error('[HeyGenRealtimeService] Failed to connect to streaming');
        return false;
      }

      this.initialized = true;
      this.connected = true;
      console.log('[HeyGenRealtimeService] Successfully initialized');
      
      return true;
    } catch (error) {
      console.error('[HeyGenRealtimeService] Initialization error:', error);
      return false;
    }
  }

  /**
   * Create a HeyGen session via backend API
   * @private
   */
  async createSession(apiKey, agentId) {
    try {
      const response = await fetch('http://localhost:3000/api/heygen/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId, apiKey })
      });

      if (!response.ok) {
        throw new Error(`Session creation failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[HeyGenRealtimeService] Session creation error:', error);
      throw error;
    }
  }

  /**
   * Start WebSocket connection for real-time streaming
   * @private
   */
  async startStreaming() {
    try {
      if (!this.sessionServer || !this.sessionToken) {
        throw new Error('Missing session server or token');
      }

      // Connect to streaming server
      const wsUrl = `wss://${this.sessionServer}/session/${this.sessionId}?token=${this.sessionToken}`;
      this.ws = new WebSocket(wsUrl);

      return new Promise((resolve, reject) => {
        this.ws.onopen = () => {
          console.log('[HeyGenRealtimeService] WebSocket connected');
          this.connected = true;
          resolve(true);
        };

        this.ws.onerror = (error) => {
          console.error('[HeyGenRealtimeService] WebSocket error:', error);
          this.connected = false;
          reject(false);
        };

        this.ws.onmessage = (event) => {
          this.handleServerMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log('[HeyGenRealtimeService] WebSocket closed');
          this.connected = false;
        };

        // Set timeout for connection
        setTimeout(() => {
          if (!this.connected) reject(false);
        }, 10000);
      });
    } catch (error) {
      console.error('[HeyGenRealtimeService] Streaming error:', error);
      return false;
    }
  }

  /**
   * Handle messages from HeyGen server
   * @private
   */
  handleServerMessage(data) {
    try {
      const message = JSON.parse(data);
      console.log('[HeyGenRealtimeService] Server message:', message.type);

      switch (message.type) {
        case 'session_started':
          console.log('[HeyGenRealtimeService] Session started');
          break;
        case 'user_audio':
          // Handle incoming audio from agent
          if (message.data) {
            this.playAudio(message.data);
          }
          break;
        case 'agent_ready':
          console.log('[HeyGenRealtimeService] Agent is ready');
          break;
        default:
          console.log('[HeyGenRealtimeService] Unknown message type:', message.type);
      }
    } catch (error) {
      console.error('[HeyGenRealtimeService] Message handling error:', error);
    }
  }

  /**
   * Send audio to HeyGen for processing
   * @param {ArrayBuffer} audioData - Audio data to send
   */
  sendAudio(audioData) {
    if (!this.connected || !this.ws) {
      console.warn('[HeyGenRealtimeService] Not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify({
        type: 'user_audio',
        data: audioData
      }));
    } catch (error) {
      console.error('[HeyGenRealtimeService] Send audio error:', error);
    }
  }

  /**
   * Send text to be spoken by the agent
   * @param {string} text - Text for agent to speak
   */
  sendText(text) {
    if (!this.connected || !this.ws) {
      console.warn('[HeyGenRealtimeService] Not connected');
      return;
    }

    try {
      console.log('[HeyGenRealtimeService] Sending text:', text);
      this.ws.send(JSON.stringify({
        type: 'text_input',
        text: text
      }));
    } catch (error) {
      console.error('[HeyGenRealtimeService] Send text error:', error);
    }
  }

  /**
   * Play audio response from agent
   * @private
   */
  playAudio(audioData) {
    try {
      if (!this.audioElement) {
        this.audioElement = new Audio();
      }

      // Convert base64 or binary to blob
      let blob;
      if (typeof audioData === 'string') {
        const binaryString = atob(audioData);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        blob = new Blob([bytes], { type: 'audio/wav' });
      } else {
        blob = new Blob([audioData], { type: 'audio/wav' });
      }

      const url = URL.createObjectURL(blob);
      this.audioElement.src = url;
      this.audioElement.play().catch(err => {
        console.error('[HeyGenRealtimeService] Audio play error:', err);
      });
    } catch (error) {
      console.error('[HeyGenRealtimeService] Audio processing error:', error);
    }
  }

  /**
   * Gracefully close the session
   */
  async close() {
    try {
      if (this.ws) {
        this.ws.close();
      }
      this.connected = false;
      this.initialized = false;
      console.log('[HeyGenRealtimeService] Session closed');
    } catch (error) {
      console.error('[HeyGenRealtimeService] Close error:', error);
    }
  }

  /**
   * Check if service is ready
   */
  isReady() {
    return this.initialized && this.connected;
  }
}

// Export as singleton
window.heygenRealtimeService = window.heygenRealtimeService || new HeyGenRealtimeService();
