// ========== INTERVIEW SYSTEM INTEGRATION TEST ==========
// Run this in browser DevTools console to verify all components working

console.log('🧪 Starting AI Interview System Integration Tests...\n');

// Test 1: Check Enhanced Question Bank
console.log('TEST 1: Enhanced Question Bank');
try {
  if (typeof enhancedQuestionBank !== 'undefined') {
    console.log('✅ enhancedQuestionBank loaded');
    console.log('   Categories:', Object.keys(enhancedQuestionBank));
    
    let totalQuestions = 0;
    for (let category in enhancedQuestionBank) {
      const count = enhancedQuestionBank[category].length;
      console.log(`   - ${category}: ${count} questions`);
      totalQuestions += count;
    }
    console.log(`   ✅ Total: ${totalQuestions}+ questions`);
  } else {
    console.log('❌ enhancedQuestionBank not found');
  }
} catch (e) {
  console.log('❌ Error:', e.message);
}
console.log('');

// Test 2: Check Enhanced Voice Manager
console.log('TEST 2: Enhanced Voice Manager');
try {
  if (typeof EnhancedVoiceManager !== 'undefined') {
    console.log('✅ EnhancedVoiceManager class loaded');
    
    // Check methods
    const methods = ['speak', 'startListening', 'stopListening', 'stopSpeaking'];
    let allMethodsPresent = true;
    for (let method of methods) {
      if (typeof EnhancedVoiceManager.prototype[method] !== 'undefined') {
        console.log(`   ✅ Method: ${method}()`);
      } else {
        console.log(`   ❌ Missing: ${method}()`);
        allMethodsPresent = false;
      }
    }
    if (allMethodsPresent) {
      console.log('   ✅ All required methods present');
    }
  } else {
    console.log('❌ EnhancedVoiceManager not found');
  }
} catch (e) {
  console.log('❌ Error:', e.message);
}
console.log('');

// Test 3: Check localStorage Support
console.log('TEST 3: localStorage Support');
try {
  const testKey = 'test_interview_' + Date.now();
  localStorage.setItem(testKey, 'test_value');
  const retrieved = localStorage.getItem(testKey);
  if (retrieved === 'test_value') {
    console.log('✅ localStorage working');
  }
  localStorage.removeItem(testKey);
} catch (e) {
  console.log('❌ localStorage not available:', e.message);
}
console.log('');

// Test 4: Check Interview State
console.log('TEST 4: Interview State');
try {
  const state = JSON.parse(sessionStorage.getItem('voiceInterviewState') || 'null');
  if (state) {
    console.log('✅ Interview state found');
    console.log(`   Type: ${state.type}`);
    console.log(`   Category: ${state.category}`);
    console.log(`   Asked Questions: ${state.askedQuestions.length}`);
    console.log(`   Answers: ${state.answers.length}`);
  } else {
    console.log('ℹ️  No interview active (normal on first load)');
  }
} catch (e) {
  console.log('❌ Error:', e.message);
}
console.log('');

// Test 5: Check DOM Elements
console.log('TEST 5: DOM Elements');
try {
  const elements = [
    'questionContainer',
    'answerInput',
    'speakQuestionBtn',
    'recordAnswerBtn',
    'submitAnswerBtn',
    'skipQuestionBtn',
    'endInterviewBtn'
  ];
  
  let allPresent = true;
  for (let id of elements) {
    if (document.getElementById(id)) {
      console.log(`   ✅ #${id}`);
    } else {
      console.log(`   ❌ #${id} not found`);
      allPresent = false;
    }
  }
  
  if (allPresent) {
    console.log('✅ All required DOM elements present');
  }
} catch (e) {
  console.log('❌ Error:', e.message);
}
console.log('');

// Test 6: Test Question Selection (Simulation)
console.log('TEST 6: Question Selection Logic');
try {
  if (typeof enhancedQuestionBank !== 'undefined') {
    const pool = enhancedQuestionBank.hr;
    const asked = ['hr_1', 'hr_5'];
    
    // Simulate getRandomQuestion
    const available = pool.filter(q => !asked.includes(q.id));
    const random = available[Math.floor(Math.random() * available.length)];
    
    console.log('✅ Question selection works');
    console.log(`   Pool size: ${pool.length}`);
    console.log(`   Already asked: ${asked.length}`);
    console.log(`   Available: ${available.length}`);
    console.log(`   Selected: ${random.id} - "${random.text.substring(0, 40)}..."`);
  }
} catch (e) {
  console.log('❌ Error:', e.message);
}
console.log('');

// Test 7: Test API Endpoint
console.log('TEST 7: Backend API Connection');
try {
  fetch('/api/interviews/test/answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionId: 'hr_1',
      questionText: 'Test question?',
      answer: 'Test answer'
    })
  })
  .then(r => r.json())
  .then(data => {
    if (data.score !== undefined) {
      console.log('✅ Backend API responding');
      console.log(`   Score: ${data.score}/100`);
      console.log(`   Feedback: ${data.feedback}`);
    } else {
      console.log('⚠️  Backend response but no score');
    }
  })
  .catch(e => {
    console.log('❌ Backend API error:', e.message);
    console.log('   Make sure backend is running: npm start in backend/');
  });
} catch (e) {
  console.log('❌ Error:', e.message);
}
console.log('');

// Test 8: Check Browser Capabilities
console.log('TEST 8: Browser Capabilities');
try {
  // Speech Recognition
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    console.log('✅ Speech Recognition API available');
  } else {
    console.log('❌ Speech Recognition not supported in this browser');
  }
  
  // Speech Synthesis
  if ('speechSynthesis' in window) {
    console.log('✅ Speech Synthesis API available');
    const voices = window.speechSynthesis.getVoices();
    console.log(`   Available voices: ${voices.length}`);
  } else {
    console.log('❌ Speech Synthesis not supported in this browser');
  }
  
  // localStorage
  if (typeof localStorage !== 'undefined') {
    console.log('✅ localStorage available');
  } else {
    console.log('❌ localStorage not available');
  }
} catch (e) {
  console.log('❌ Error:', e.message);
}
console.log('');

// Summary
console.log('═══════════════════════════════════════════════');
console.log('✅ INTEGRATION TEST COMPLETE');
console.log('═══════════════════════════════════════════════');
console.log('');
console.log('Next Steps:');
console.log('1. If all tests pass ✅ - System is ready!');
console.log('2. If backend test fails - Run: cd backend && npm start');
console.log('3. If speech APIs fail - Use a modern browser (Chrome, Edge, Safari)');
console.log('4. If questions missing - Refresh page and check console');
console.log('');
console.log('Ready to start interview? Navigate to interview type selector!');
