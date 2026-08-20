// Splash behavior: redirect to dashboard if logged in, otherwise to login
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  // short delay to show splash
  setTimeout(() => {
    if (token) {
      window.location.href = 'dashboard.html';
    } else {
      window.location.href = 'login.html';
    }
  }, 1200);
});
