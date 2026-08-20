#!/usr/bin/env node

// Test the interview API endpoints
const http = require('http');

function testEndpoint(method, path, data) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Testing Interview API endpoints...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing GET / (health check)');
    let result = await testEndpoint('GET', '/', null);
    console.log(`   Status: ${result.status}`);
    console.log(`   Body: ${result.body}\n`);

    // Test 2: POST /api/interviews/start
    console.log('2. Testing POST /api/interviews/start');
    result = await testEndpoint('POST', '/api/interviews/start', {
      type: 'hr',
      count: 5
    });
    console.log(`   Status: ${result.status}`);
    console.log(`   Body: ${result.body}`);
    let startData;
    try {
      startData = JSON.parse(result.body);
    } catch (e) {
      console.log('   Failed to parse response');
    }
    console.log();

    // Test 3: POST /api/interviews/{id}/answer
    if (startData && startData.interviewId) {
      console.log(`3. Testing POST /api/interviews/${startData.interviewId}/answer`);
      result = await testEndpoint('POST', `/api/interviews/${startData.interviewId}/answer`, {
        questionId: 'hr_001',
        questionText: 'Tell me about yourself',
        answer: 'I have 5 years of experience'
      });
      console.log(`   Status: ${result.status}`);
      console.log(`   Headers:`, result.headers);
      console.log(`   Body: ${result.body.substring(0, 200)}...\n`);
    }

    console.log('✓ All tests completed');
  } catch (error) {
    console.error('✗ Test error:', error.message);
  }
}

// Wait for server to be ready
setTimeout(runTests, 1000);
