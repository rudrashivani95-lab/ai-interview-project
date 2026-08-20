/**
 * API Client
 * Handles all API calls to the backend
 */

class APIClient {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.timeout = 30000;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`[APIClient] Request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async getQuestions(type, count, role) {
    return this.request('/api/interview/questions', {
      method: 'POST',
      body: JSON.stringify({ type, count, role })
    });
  }

  async generateAvatar(text, style, emotion = 'neutral') {
    return this.request('/api/avatar/generate', {
      method: 'POST',
      body: JSON.stringify({ text, style, emotion })
    });
  }

  async transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    return fetch(`${this.baseUrl}/api/audio/transcribe`, {
      method: 'POST',
      body: formData
    }).then(r => r.json());
  }

  async scoreAnswer(question, answer, type, questionIndex) {
    return this.request('/api/interview/score', {
      method: 'POST',
      body: JSON.stringify({ question, answer, type, questionIndex })
    });
  }

  async getResults(scores, type, duration) {
    return this.request('/api/interview/results', {
      method: 'POST',
      body: JSON.stringify({ scores, type, duration })
    });
  }

  async healthCheck() {
    return this.request('/api/health');
  }
}

const apiClient = new APIClient();
