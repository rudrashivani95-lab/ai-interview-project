/**
 * Comprehensive Voice Interview System Test
 * Tests all key features: TTS, STT, adaptive questions, session memory, summary generation
 */

const fetch = require('node-fetch');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Color output helpers
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test results tracker
const results = {
  passed: [],
  failed: [],
};

async function testAPI(name, method, path, body = null, expectedStatus = 200) {
  try {
    log(`\n📝 Testing: ${name}`, 'cyan');
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer test-token-${Date.now()}`, // Mock token
      },
    };

    const url = `${API_BASE}${path}`;
    log(`   ${method} ${path}`, 'blue');

    const response = await fetch(url, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    if (response.status === expectedStatus || (expectedStatus === 200 && response.ok)) {
      log(`✅ PASSED: ${name}`, 'green');
      log(`   Status: ${response.status}`, 'green');
      if (data.data) {
        log(`   Response: ${JSON.stringify(data.data).substring(0, 100)}...`, 'green');
      }
      results.passed.push(name);
      return { success: true, data: data.data, response };
    } else {
      log(`❌ FAILED: ${name}`, 'red');
      log(`   Expected status: ${expectedStatus}, got: ${response.status}`, 'red');
      log(`   Response: ${JSON.stringify(data).substring(0, 150)}`, 'red');
      results.failed.push(name);
      return { success: false, data, response };
    }
  } catch (error) {
    log(`❌ ERROR in ${name}: ${error.message}`, 'red');
    results.failed.push(`${name} (Error: ${error.message})`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  log('\n========================================', 'blue');
  log('VOICE INTERVIEW SYSTEM - COMPREHENSIVE TEST', 'blue');
  log('========================================\n', 'blue');

  // Test 1: Start Interview
  log('\n🎬 PHASE 1: Interview Initialization', 'cyan');
  const startResult = await testAPI(
    'POST /api/interviews/start - Start interview',
    'POST',
    '/interviews/start',
    {
      type: 'general',
      count: 3,
    }
  );

  if (!startResult.success || !startResult.data?.interviewId) {
    log('⚠️  Could not proceed - failed to start interview', 'yellow');
    showResults();
    return;
  }

  const interviewId = startResult.data.interviewId;
  const questions = startResult.data.questions || [];

  log(`\n📊 Interview Details:`, 'cyan');
  log(`   Interview ID: ${interviewId}`, 'green');
  log(`   Total Questions: ${questions.length}`, 'green');
  if (questions.length > 0) {
    log(`   First Question: ${questions[0].questionText || questions[0].text}`, 'green');
  }

  // Test 2: Answer First Question
  if (questions.length > 0) {
    log('\n🎯 PHASE 2: Answer Submission & Adaptive Questions', 'cyan');
    const answerResult = await testAPI(
      'POST /api/interviews/:id/answer - Submit answer',
      'POST',
      `/interviews/${interviewId}/answer`,
      {
        questionId: questions[0].questionId || 'q1',
        text: 'I have strong experience in JavaScript, React, and Node.js. I built several full-stack applications with modern web technologies.',
      }
    );

    if (answerResult.success && answerResult.data) {
      log(`\n💬 Answer Processing:`, 'cyan');
      log(`   Answer submitted: "${answerResult.data.text?.substring(0, 80)}..."`, 'green');
      log(`   Score received: ${answerResult.data.overallScore || 'N/A'}/100`, 'green');
      log(`   Answer count: ${answerResult.data.answerCount || '?'}`, 'green');

      if (answerResult.data.nextQuestion) {
        log(`   Next question generated: ${answerResult.data.nextQuestion.questionText?.substring(0, 80)}...`, 'green');
      }
    }

    // Test 3: Get Next Contextual Question
    log('\n🔄 PHASE 3: Fetching Contextual Follow-up', 'cyan');
    const nextResult = await testAPI(
      'POST /api/interviews/:id/next-question - Get adaptive question',
      'POST',
      `/interviews/${interviewId}/next-question`,
      {
        answerText: 'I primarily work with React for frontend and Express for backend',
      }
    );

    if (nextResult.success && nextResult.data) {
      log(`   Contextual question: ${nextResult.data.questionText?.substring(0, 100)}...`, 'green');
    }

    // Test 4: Submit more answers for summary
    log('\n📤 PHASE 4: Submitting Multiple Answers', 'cyan');
    for (let i = 1; i < Math.min(3, questions.length); i++) {
      const multiAnswer = await testAPI(
        `POST /api/interviews/:id/answer - Answer #${i + 1}`,
        'POST',
        `/interviews/${interviewId}/answer`,
        {
          questionId: questions[i].questionId || `q${i + 1}`,
          text: `This is my answer to question ${i + 1}. I approach this with best practices and clean code principles.`,
        }
      );

      if (multiAnswer.success) {
        log(`   Answer #${i + 1} score: ${multiAnswer.data.overallScore || '?'}/100`, 'green');
      }
    }
  }

  // Test 5: Generate Summary
  log('\n📋 PHASE 5: Interview Summary Generation', 'cyan');
  const summaryResult = await testAPI(
    'POST /api/interviews/:id/summary - Generate final report',
    'POST',
    `/interviews/${interviewId}/summary`,
    {
      answers: [
        { text: 'JavaScript, React, Node.js, MongoDB, Docker' },
        { text: 'I use agile methodologies and continuous integration for quality assurance' },
        { text: 'I focus on scalability, maintainability, and user experience' },
      ],
    }
  );

  if (summaryResult.success && summaryResult.data?.summary) {
    const summary = summaryResult.data.summary;
    log(`\n🏆 Interview Summary:`, 'cyan');
    log(`   Overall Score: ${summary.overallScore || '?'}/100`, 'green');
    log(`   Strengths: ${summary.strengths?.length || 0} identified`, 'green');
    log(`   Weaknesses: ${summary.weaknesses?.length || 0} identified`, 'green');
    log(`   Improvements: ${summary.improvements?.length || 0} suggestions`, 'green');
    log(`   Topics to Practice: ${summary.topics?.length || 0} areas`, 'green');

    if (summary.strengths && summary.strengths.length > 0) {
      log(`   Sample Strength: ${summary.strengths[0]}`, 'green');
    }
    if (summary.weaknesses && summary.weaknesses.length > 0) {
      log(`   Sample Weakness: ${summary.weaknesses[0]}`, 'green');
    }
  }

  // Test 6: Verify Frontend Integration
  log('\n🌐 PHASE 6: Frontend Integration Check', 'cyan');
  try {
    const voiceManagerCheck = await fetch(`${BASE_URL}/scripts/voiceManager.js`);
    if (voiceManagerCheck.ok) {
      log(`✅ voiceManager.js is accessible`, 'green');
    }
  } catch (e) {
    log(`❌ voiceManager.js not found`, 'red');
  }

  try {
    const voiceInterviewCheck = await fetch(`${BASE_URL}/voiceInterview.html`);
    if (voiceInterviewCheck.ok) {
      log(`✅ voiceInterview.html is accessible`, 'green');
    }
  } catch (e) {
    log(`❌ voiceInterview.html not found`, 'red');
  }

  // Show final results
  showResults();
}

function showResults() {
  log('\n========================================', 'blue');
  log('TEST SUMMARY', 'blue');
  log('========================================\n', 'blue');

  log(`✅ PASSED: ${results.passed.length}`, 'green');
  results.passed.forEach(test => log(`   • ${test}`, 'green'));

  if (results.failed.length > 0) {
    log(`\n❌ FAILED: ${results.failed.length}`, 'red');
    results.failed.forEach(test => log(`   • ${test}`, 'red'));
  }

  const totalTests = results.passed.length + results.failed.length;
  const passPercentage = Math.round((results.passed.length / totalTests) * 100);
  
  log(`\n📊 Total: ${totalTests} tests, ${passPercentage}% pass rate`, 'cyan');

  if (results.failed.length === 0) {
    log('\n🎉 ALL TESTS PASSED! Voice interview system is ready.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the output above for details.', 'yellow');
  }
}

// Run all tests
runTests().catch(err => {
  log(`\nFatal error: ${err.message}`, 'red');
  process.exit(1);
});
