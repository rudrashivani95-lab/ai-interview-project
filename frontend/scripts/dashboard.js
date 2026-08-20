// ========== DASHBOARD SCRIPT ==========
// Handles dashboard initialization, data loading, and user interactions

function parseJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch (e) {
    console.error('JWT parsing error:', e);
    return null;
  }
}

async function getJson(path) {
  return window.apiGet(path);
}

// Show/hide loading overlay
function showLoading(show = true) {
  const overlay = document.getElementById('loadingOverlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

// Redirect with loading animation
function redirectWithLoading(url, delayMs = 1000) {
  showLoading(true);
  setTimeout(() => {
    window.location.href = url;
  }, delayMs);
}

document.addEventListener('DOMContentLoaded', async () => {
  // ========== AUTHENTICATION CHECK ==========
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const payload = parseJwt(token);
  const userId = payload?.id || (JSON.parse(localStorage.getItem('user') || '{}').id);
  if (!userId) {
    window.location.href = 'login.html';
    return;
  }

  // ========== LOAD DASHBOARD DATA ==========
  const { ok, data } = await getJson(`/api/progress/${userId}`);
  
  if (ok && data) {
    // Parse past scores
    const past = data.pastScores || [];
    const avg = past.length ? Math.round(past.reduce((s, p) => s + (p.score || 0), 0) / past.length) : '--';
    
    // Update Overall Score
    const overallScoreEl = document.getElementById('overallScore');
    if (overallScoreEl) overallScoreEl.textContent = avg;
    
    const overallSummaryEl = document.getElementById('overallSummary');
    if (overallSummaryEl) overallSummaryEl.textContent = `${past.length} sessions`;

    // Update Recent Resume
    const recentResume = (data.performanceGraph?.resumes || []).slice(-1)[0];
    if (recentResume) {
      const recentResumeEl = document.getElementById('recentResumeTitle');
      if (recentResumeEl) recentResumeEl.textContent = `ATS: ${recentResume.atsScore}`;
    }

    // Update Interviews Done Count
    const interviewsDoneEl = document.getElementById('interviewsDone');
    if (interviewsDoneEl) {
      const interviewCount = data.interviewsCompleted || past.filter(p => p.type === 'Interview').length;
      interviewsDoneEl.textContent = interviewCount || 0;
    }

    // Update Last Interview Date
    const lastInterviewEl = document.getElementById('lastInterviewDate');
    if (lastInterviewEl && past.length > 0) {
      const lastInterview = past[past.length - 1];
      const date = new Date(lastInterview.date);
      lastInterviewEl.textContent = `Last: ${date.toLocaleDateString()}`;
    }

    // ========== POPULATE RECENT ACTIVITY ==========
    const activityEl = document.getElementById('recentActivity');
    if (activityEl) {
      activityEl.innerHTML = '';
      
      if (past.length === 0) {
        const emptyItem = document.createElement('div');
        emptyItem.className = 'activity-item empty';
        emptyItem.innerHTML = `
          <i class="fas fa-inbox"></i>
          <p>No activity yet. Start by creating a resume or practicing an interview!</p>
        `;
        activityEl.appendChild(emptyItem);
      } else {
        // Show last 5 activities in reverse order (newest first)
        past.slice(-5).reverse().forEach(activity => {
          const date = new Date(activity.date);
          const timeStr = date.toLocaleString();
          const typeIcon = activity.type === 'Interview' ? '🎤' : '📄';
          
          const activityItem = document.createElement('div');
          activityItem.className = 'activity-item';
          activityItem.innerHTML = `
            <span>${typeIcon}</span>
            <span>${timeStr} — ${activity.type || 'Activity'}: <strong>${activity.score || 'N/A'}</strong></span>
            <span class="activity-date">${Math.floor((Date.now() - date) / (1000 * 60))} min ago</span>
          `;
          activityEl.appendChild(activityItem);
        });
      }
    }
  }

  // ========== BUTTON EVENT LISTENERS ==========
  
  // New Resume Button
  const newResumeBtn = document.getElementById('newResumeBtn');
  if (newResumeBtn) {
    newResumeBtn.addEventListener('click', () => {
      redirectWithLoading('manualResume.html');
    });
  }

  // View Resume Button
  const viewResumeBtn = document.getElementById('viewResumeBtn');
  if (viewResumeBtn) {
    viewResumeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      redirectWithLoading('resumeScore.html');
    });
  }

  // Start Interview Button (MAIN)
  const startInterviewBtn = document.getElementById('startInterviewBtn');
  if (startInterviewBtn) {
    startInterviewBtn.addEventListener('click', (e) => {
      e.preventDefault();
      redirectWithLoading('interviewType.html');
    });
  }

  // Build Resume Quick Action
  const buildResumeBtn = document.getElementById('buildResumeBtn');
  if (buildResumeBtn) {
    buildResumeBtn.addEventListener('click', () => {
      redirectWithLoading('manualResume.html');
    });
  }

  // Practice Interview Quick Action
  const practiceInterviewBtn = document.getElementById('practiceInterviewBtn');
  if (practiceInterviewBtn) {
    practiceInterviewBtn.addEventListener('click', () => {
      redirectWithLoading('interviewType.html');
    });
  }

  // View Progress Quick Action
  const viewProgressBtn = document.getElementById('viewProgressBtn');
  if (viewProgressBtn) {
    viewProgressBtn.addEventListener('click', () => {
      redirectWithLoading('progress.html');
    });
  }

  // Score Resume Quick Action
  const scoreResumeBtn = document.getElementById('scoreResumeBtn');
  if (scoreResumeBtn) {
    scoreResumeBtn.addEventListener('click', () => {
      redirectWithLoading('resumeScore.html');
    });
  }

  // Logout Button
  const logoutBtn = document.getElementById('navLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }

  console.log('Dashboard initialized successfully');
});
