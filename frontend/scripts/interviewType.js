// Interview type selection and start interview via backend
function parseJwt(token) {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(decoded)));
  } catch (e) { return null; }
}

async function authPost(path, body) {
  return window.apiPost(path, body);
}

document.addEventListener('DOMContentLoaded', () => {
  let selectedType = null;
  let selectedTypeLabel = '';
  let selectedTypeDesc = '';

  // Type mapping for API
  const typeMap = {
    'HR': 'hr',
    'Technical': 'technical',
    'DSA': 'dsa',
    'RoleBased': 'role-based',
    'ResumeBased': 'resume',
    'Mock': 'mock'
  };

  // Type descriptions for display
  const typeDescriptions = {
    'HR': 'Behavioral and HR-focused questions about your experience, strengths, and career goals.',
    'Technical': 'System design, architecture, and technical problem-solving questions.',
    'DSA': 'Focus on DSA problems, coding challenges, and algorithmic thinking.',
    'RoleBased': 'Questions specifically tailored to your target job role and position.',
    'ResumeBased': 'Questions derived from your resume experiences and projects.',
    'Mock': 'Complete interview experience mixing HR, technical, and role-specific questions.'
  };

  // Get all interview type buttons
  const typeButtons = document.querySelectorAll('.type-btn');
  const selectedTypeSection = document.getElementById('selectedTypeSection');
  const selectedTypeName = document.getElementById('selectedTypeName');
  const selectedTypeDescEl = document.getElementById('selectedTypeDesc');
  const changeTypeBtn = document.getElementById('changeTypeBtn');

  // Handle type button clicks
  typeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Get the interview type from the parent card's data-type
      const typeCard = btn.closest('.type-card');
      const displayType = typeCard.getAttribute('data-type');
      
      selectedType = typeMap[displayType];
      selectedTypeLabel = displayType;
      selectedTypeDesc = typeDescriptions[displayType];

      // Save to localStorage
      localStorage.setItem('interviewType', selectedType);
      localStorage.setItem('interviewTypeLabel', selectedTypeLabel);

      console.log(`Selected interview type: ${selectedType} (${selectedTypeLabel})`);

      // Show the selected type section
      selectedTypeName.textContent = selectedTypeLabel;
      selectedTypeDescEl.textContent = selectedTypeDesc;
      selectedTypeSection.style.display = 'block';

      // Scroll to the selected section
      selectedTypeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  // Handle change type button
  if (changeTypeBtn) {
    changeTypeBtn.addEventListener('click', () => {
      selectedTypeSection.style.display = 'none';
      selectedType = null;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Handle start interview button
  const startInterviewBtn = document.getElementById('startInterviewBtn');
  if (startInterviewBtn) {
    startInterviewBtn.addEventListener('click', async () => {
      if (!selectedType) {
        return alert('Select an interview type first');
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        return alert('Please log in first');
      }

      // Show loading overlay
      const loadingOverlay = document.getElementById('loadingOverlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
      }

      try {
        // Get resume text if available
        let resumeText = '';
        if (selectedType === 'resume') {
          resumeText = localStorage.getItem('resumeText') || '';
        }

        // Start interview with backend
        console.log(`Starting interview with type: ${selectedType}`);
        const { ok, data } = await authPost('/api/interviews/start', {
          type: selectedType,
          count: 5,
          resumeText: resumeText,
        });

        if (!ok) {
          if (loadingOverlay) loadingOverlay.style.display = 'none';
          const errorMsg = data.message || data.error || 'Failed to start interview';
          console.error('Interview start failed:', errorMsg);
          return alert(errorMsg);
        }

        console.log('Interview started successfully:', data);

        // Save interview session for voiceInterview page
        localStorage.setItem('currentInterview', JSON.stringify(data));
        localStorage.setItem('currentQuestionIndex', '0');
        localStorage.setItem('interviewStartTime', new Date().toISOString());
        
        // Navigate to voice interview page using relative path
        console.log('Redirecting to voiceInterview.html...');
        window.location.href = './voiceInterview.html';
      } catch (err) {
        if (loadingOverlay) loadingOverlay.style.display = 'none';
        console.error('Error starting interview:', err);
        alert('Failed to start interview. Please try again.');
      }
    });
  }
});
