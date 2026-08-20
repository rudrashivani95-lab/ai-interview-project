// ========== NAVIGATION & ACTIVE STATE MANAGEMENT ==========
// This script handles:
// - Active state highlighting based on current page
// - Sidebar management across all pages
// - Navigation persistence across page reloads

function initializeNavigation() {
  // Get current page from URL
  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  
  // Map of nav items and their corresponding pages
  const navMapping = {
    'navDashboard': ['dashboard.html', ''],
    'navManualResume': ['manualResume.html'],
    'navAiResume': ['aiResume.html'],
    'navResumeScore': ['resumeScore.html'],
    'navInterviews': ['interviewType.html', 'voiceInterview.html', 'evaluation.html', 'finalReport.html'],
    'navProgress': ['progress.html'],
  };

  // Remove active class from all nav links
  document.querySelectorAll('#mainNav .nav-link').forEach(link => {
    link.classList.remove('active');
  });

  // Add active class to matching nav item
  for (const [navId, pages] of Object.entries(navMapping)) {
    const navElement = document.getElementById(navId);
    if (navElement && pages.includes(currentPage)) {
      navElement.classList.add('active');
      break;
    }
  }

  // Handle logout button
  const logoutBtn = document.getElementById('navLogout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.clear();
      window.location.href = 'login.html';
    });
  }

  console.log('Navigation initialized for page:', currentPage);
}

// Initialize navigation when DOM is ready (if nav.js loads before other scripts)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeNavigation);
} else {
  // If DOM is already loaded, initialize immediately
  initializeNavigation();
}

// Show loading overlay
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
