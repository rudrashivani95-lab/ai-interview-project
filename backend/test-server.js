const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
});

server.listen(6001, '127.0.0.1', () => {
  console.log('Test server running on http://127.0.0.1:6001');
});

server.on('error', (err) => {
  console.error('Server error:', err);
});
