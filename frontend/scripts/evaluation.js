// Evaluation page: load aggregated scores from the backend
async function authGet(path) { return window.apiGet(path); }

function getCurrentInterviewId() {
  const stored = JSON.parse(localStorage.getItem('currentInterview') || 'null');
  return stored?._id || null;
}

document.addEventListener('DOMContentLoaded', async () => {
  const id = getCurrentInterviewId();
  if (!id) return document.getElementById('evaluationFeedback').textContent = 'No interview data available';
  const { ok, data } = await authGet(`/api/evaluate/interview/${id}`);
  if (!ok) return alert(data.message || 'Failed to load evaluation');
  document.getElementById('technicalScore').textContent = data.technical;
  document.getElementById('communicationScore').textContent = data.communication;
  document.getElementById('confidenceScore').textContent = data.confidence;
  document.getElementById('overallScoreEval').textContent = data.overall;
  document.getElementById('evaluationFeedback').textContent = 'Mock feedback: ' + (data.feedback || 'Focus on structured answers and trade-offs.');

  document.getElementById('evaluateInterviewBtn').addEventListener('click', async () => {
    const r = await authGet(`/api/evaluate/interview/${id}`);
    if (!r.ok) return alert('Re-evaluation failed');
    const d = r.data;
    document.getElementById('technicalScore').textContent = d.technical;
    document.getElementById('communicationScore').textContent = d.communication;
    document.getElementById('confidenceScore').textContent = d.confidence;
    document.getElementById('overallScoreEval').textContent = d.overall;
  });

  document.getElementById('exportReportBtn').addEventListener('click', () => {
    window.location.href = 'finalReport.html';
  });
});
