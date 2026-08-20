// Progress dashboard: fetch progress data and render Chart.js chart
async function authGet(path) { return window.apiGet(path); }

function parseJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch (e) { return null; }
}

function loadChartLib(callback) {
  if (window.Chart) return callback();
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
  s.onload = callback;
  document.head.appendChild(s);
}

document.addEventListener('DOMContentLoaded', async () => {
  const token = localStorage.getItem('token');
  if (!token) return window.location.href = 'login.html';
  const payload = parseJwt(token);
  const userId = payload?.id || (JSON.parse(localStorage.getItem('user') || '{}').id);
  if (!userId) return window.location.href = 'login.html';

  const { ok, data } = await authGet(`/api/progress/${userId}`);
  if (!ok) return alert('Failed to load progress');

  // Fill weak topics
  const weakTopics = data.weakTopics || [];
  const weakList = document.getElementById('weakTopicsList');
  weakList.innerHTML = '';
  if (!weakTopics.length) weakList.innerHTML = '<li class="list-group-item">No weak topics yet</li>';
  weakTopics.forEach(w => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.textContent = `${w.topic} (${w.count})`;
    weakList.appendChild(li);
  });

  const resumes = data.performanceGraph?.resumes || [];
  const interviews = data.performanceGraph?.interviews || data.pastScores || [];
  document.getElementById('statSessions').textContent = interviews.length;
  const avg = interviews.length ? Math.round(interviews.reduce((s,i)=>s+(i.score||0),0)/interviews.length) : '--';
  document.getElementById('statAvg').textContent = avg;

  document.getElementById('resumeScoresList').innerHTML = resumes.length ? resumes.map(r=>`<div>${new Date(r.date).toLocaleDateString()}: ${r.atsScore}</div>`).join('') : 'No resume scores yet';

  loadChartLib(() => {
    const ctx = document.getElementById('progressChart').getContext('2d');
    const labels = interviews.map(i=>new Date(i.date).toLocaleDateString());
    const values = interviews.map(i=>i.score || 0);
    new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: 'Overall Score', data: values, borderColor: '#6f42c1', backgroundColor: 'rgba(111,66,193,0.15)' }] },
      options: { responsive: true }
    });
  });
});
