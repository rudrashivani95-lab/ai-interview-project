// Central API helper: sets API_BASE and provides robust fetch helpers
(function () {
  const DEFAULT_BASE = 'http://127.0.0.1:3000';
  const API_BASE = window.API_BASE || DEFAULT_BASE;

  async function safeParse(res) {
    const text = await res.text();
    if (!text) return { ok: res.ok, status: res.status, data: null };
    try {
      const json = JSON.parse(text);
      return { ok: res.ok, status: res.status, data: json };
    } catch (e) {
      return { ok: res.ok, status: res.status, data: { message: text } };
    }
  }

  async function apiFetch(pathOrUrl, opts = {}) {
    const url = pathOrUrl.startsWith('http') ? pathOrUrl : API_BASE + pathOrUrl;
    const token = localStorage.getItem('token');
    opts.headers = opts.headers || {};
    if (!(opts.headers['Content-Type'] || opts.headers['content-type'])) {
      opts.headers['Content-Type'] = 'application/json';
    }
    if (token) opts.headers['Authorization'] = 'Bearer ' + token;
    try {
      const res = await fetch(url, opts);
      return safeParse(res);
    } catch (err) {
      console.error(`[API Error] ${opts.method || 'GET'} ${url}:`, err.message);
      return { ok: false, status: 0, data: { message: `Network error: ${err.message}` } };
    }
  }

  async function apiGet(path) {
    return apiFetch(path, { method: 'GET' });
  }

  async function apiPost(path, body) {
    return apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
  }

  async function apiPostJson(path, body) {
    return apiPost(path, body);
  }

  // Health check to verify backend connectivity
  async function checkBackendHealth() {
    console.log(`[API] Checking backend health at ${API_BASE}...`);
    try {
      const res = await fetch(API_BASE, { method: 'GET' });
      console.log(`[API] Backend health check: ${res.status} ${res.statusText}`);
      return res.ok;
    } catch (err) {
      console.error(`[API] Backend health check failed:`, err.message);
      return false;
    }
  }

  // Expose globally
  window.API_BASE = API_BASE;
  window.apiFetch = apiFetch;
  window.apiGet = apiGet;
  window.apiPost = apiPost;
  window.checkBackendHealth = checkBackendHealth;
  window.apiPostJson = apiPostJson;
})();
