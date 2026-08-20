// Direct test of the feedback analyzer without HTTP
const FeedbackAnalyzer = require('./feedbackAnalyzer');

console.log('Testing FeedbackAnalyzer directly...\n');

const analyzer = new FeedbackAnalyzer();

// Test data
const testQuestion = 'Tell me about yourself';
const testAnswer = 'I have 5 years of full-stack development experience. I led a team of 3 developers and improved system performance by 40%. I am skilled in React, Node.js, and database optimization.';
const testCategory = 'hr';

console.log('Question:', testQuestion);
console.log('Answer:', testAnswer);
console.log('Category:', testCategory);
console.log('\n---\n');

// Call the analyzer
analyzer.analyzeAnswer(testQuestion, testAnswer, testCategory)
  .then(feedback => {
    console.log('✓ Feedback generated successfully!\n');
    console.log('Response:', JSON.stringify(feedback, null, 2));
  })
  .catch(error => {
    console.error('✗ Error analyzing answer:', error);
  });
