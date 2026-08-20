// Final report: load evaluation and print/download report
function getCurrentInterviewId() {
  const stored = JSON.parse(localStorage.getItem('currentInterview') || 'null');
  return stored?._id || null;
}

async function authGet(path) { return window.apiGet(path); }

document.addEventListener('DOMContentLoaded', async () => {
  const id = getCurrentInterviewId();
  if (!id) return document.getElementById('finalReportSummary').textContent = 'No report available';
  const { ok, data } = await authGet(`/api/evaluate/interview/${id}`);
  if (!ok) return document.getElementById('finalReportSummary').textContent = 'Unable to fetch report';
  document.getElementById('finalReportSummary').textContent = 'Summary: Keep improving problem structure and communication.';
  document.getElementById('finalTechnical').textContent = data.technical;
  document.getElementById('finalCommunication').textContent = data.communication;
  document.getElementById('finalConfidence').textContent = data.confidence;
  document.getElementById('finalOverall').textContent = data.overall;

  document.getElementById('downloadReportBtn').addEventListener('click', () => {
    // Open printable window - user can Save as PDF from browser print dialog
    const content = document.querySelector('.card').innerHTML;
    const w = window.open('', '_blank');
    w.document.write(`<html><head><title>Final Report</title><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"></head><body><div class="container py-4">${content}</div></body></html>`);
    w.document.close();
    w.print();
  });
});
