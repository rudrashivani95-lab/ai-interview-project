// Question Bank: Large sets of questions for different interview types
// Imported from backend for client-side local question selection
const questionBank = {
  general: [
    { id: 'gen_1', text: 'Tell me about yourself and your professional background.' },
    { id: 'gen_2', text: 'What are your greatest strengths as a professional?' },
    { id: 'gen_3', text: 'What are your weaknesses and how are you working to improve them?' },
    { id: 'gen_4', text: 'Where do you see yourself in 5 years?' },
    { id: 'gen_5', text: 'Why are you interested in this position?' },
    { id: 'gen_6', text: 'Tell me about a time you faced a challenge at work and how you handled it.' },
    { id: 'gen_7', text: 'Describe a situation where you had to work with a difficult team member.' },
    { id: 'gen_8', text: 'What is your approach to learning new technologies and skills?' },
    { id: 'gen_9', text: 'How do you prioritize your work when you have multiple deadlines?' },
    { id: 'gen_10', text: 'Tell me about your most significant achievement in your career.' },
    { id: 'gen_11', text: 'How do you handle failure and setbacks?' },
    { id: 'gen_12', text: 'What motivates you in your work?' },
    { id: 'gen_13', text: 'Describe your ideal work environment and company culture.' },
    { id: 'gen_14', text: 'How do you stay updated with industry trends and developments?' },
    { id: 'gen_15', text: 'Tell me about a project you led from start to finish.' },
    { id: 'gen_16', text: 'How do you approach problem-solving in your work?' },
    { id: 'gen_17', text: 'Describe a time when you had to adapt to a significant change.' },
    { id: 'gen_18', text: 'What skills do you want to develop further?' },
    { id: 'gen_19', text: 'Tell me about a time you received critical feedback and how you responded.' },
    { id: 'gen_20', text: 'Why should we hire you over other candidates?' },
    { id: 'gen_21', text: 'How do you define success in your career?' },
    { id: 'gen_22', text: 'Tell me about your experience working in cross-functional teams.' },
    { id: 'gen_23', text: 'What is your approach to communication with colleagues and stakeholders?' },
    { id: 'gen_24', text: 'Describe a time when you had to make a difficult decision at work.' },
    { id: 'gen_25', text: 'How do you balance work and personal life?' },
  ],

  dsa: [
    { id: 'dsa_1', text: 'Explain the difference between arrays and linked lists. When would you use each?' },
    { id: 'dsa_2', text: 'Write pseudocode for binary search and explain its time complexity.' },
    { id: 'dsa_3', text: 'What are the differences between stacks and queues? Provide examples of use cases.' },
    { id: 'dsa_4', text: 'Explain hash tables and hash collisions. How do you handle collisions?' },
    { id: 'dsa_5', text: 'What is the difference between depth-first search (DFS) and breadth-first search (BFS)?' },
    { id: 'dsa_6', text: 'Explain the concept of dynamic programming and give an example problem.' },
    { id: 'dsa_7', text: 'What is a balanced binary search tree? Why is balancing important?' },
    { id: 'dsa_8', text: 'Describe the quicksort algorithm and analyze its time complexity.' },
    { id: 'dsa_9', text: 'What is the difference between merge sort and quicksort?' },
    { id: 'dsa_10', text: 'Explain the concept of greedy algorithms with an example.' },
    { id: 'dsa_11', text: 'What is a graph? Describe different graph representations.' },
    { id: 'dsa_12', text: 'How would you detect a cycle in a linked list?' },
    { id: 'dsa_13', text: 'Explain the concept of memoization in dynamic programming.' },
    { id: 'dsa_14', text: 'What is the difference between stable and unstable sorting algorithms?' },
    { id: 'dsa_15', text: 'How would you find the longest common subsequence between two strings?' },
    { id: 'dsa_16', text: 'Explain the concept of Big O notation and provide examples.' },
    { id: 'dsa_17', text: 'What is a trie data structure and what are its use cases?' },
    { id: 'dsa_18', text: 'How would you implement a LRU (Least Recently Used) cache?' },
    { id: 'dsa_19', text: 'Describe Dijkstra\'s algorithm and its applications.' },
    { id: 'dsa_20', text: 'What is the difference between a heap and a binary search tree?' },
    { id: 'dsa_21', text: 'How would you find the kth largest element in an array?' },
    { id: 'dsa_22', text: 'Explain the concept of topological sorting and its applications.' },
    { id: 'dsa_23', text: 'What is the difference between recursion and iteration? When would you use each?' },
    { id: 'dsa_24', text: 'How would you solve the "Two Sum" problem?' },
    { id: 'dsa_25', text: 'Describe the algorithm for reversing a linked list.' },
  ],

  rolebased: [
    { id: 'role_1', text: 'Describe your experience with software development lifecycle (SDLC) methodologies.' },
    { id: 'role_2', text: 'What is your experience with version control systems like Git?' },
    { id: 'role_3', text: 'Tell me about your experience with code review processes.' },
    { id: 'role_4', text: 'How do you approach writing clean and maintainable code?' },
    { id: 'role_5', text: 'What is your experience with testing frameworks and unit testing?' },
    { id: 'role_6', text: 'Describe your experience with debugging and troubleshooting issues.' },
    { id: 'role_7', text: 'What is your experience with cloud platforms (AWS, GCP, Azure)?' },
    { id: 'role_8', text: 'Tell me about your experience with containerization (Docker, Kubernetes).' },
    { id: 'role_9', text: 'How do you approach system design and architecture decisions?' },
    { id: 'role_10', text: 'What is your experience with relational and non-relational databases?' },
    { id: 'role_11', text: 'Describe your experience with API design and development.' },
    { id: 'role_12', text: 'What is your experience with CI/CD pipelines?' },
    { id: 'role_13', text: 'Tell me about your experience with security best practices in development.' },
    { id: 'role_14', text: 'How do you approach performance optimization and profiling?' },
    { id: 'role_15', text: 'What is your experience with microservices architecture?' },
    { id: 'role_16', text: 'Describe your experience with message queues and event-driven architecture.' },
    { id: 'role_17', text: 'What is your experience with monitoring and logging in production systems?' },
    { id: 'role_18', text: 'Tell me about your experience with agile development and sprint planning.' },
    { id: 'role_19', text: 'How do you approach technical documentation and knowledge sharing?' },
    { id: 'role_20', text: 'What is your experience with mentoring junior developers?' },
    { id: 'role_21', text: 'Describe your experience with legacy code maintenance and refactoring.' },
    { id: 'role_22', text: 'What is your experience with API authentication and authorization?' },
    { id: 'role_23', text: 'Tell me about your experience with data migration and schema changes.' },
    { id: 'role_24', text: 'How do you approach technical debt management?' },
    { id: 'role_25', text: 'What is your experience with cross-team collaboration and communication?' },
  ],

  resumebased: [
    { id: 'resume_1', text: 'Tell me more about the technologies and tools you used in this project.' },
    { id: 'resume_2', text: 'What was your specific contribution to this achievement?' },
    { id: 'resume_3', text: 'How did you measure the success of this project?' },
    { id: 'resume_4', text: 'What challenges did you face during this project and how did you overcome them?' },
    { id: 'resume_5', text: 'If you could do this project again, what would you do differently?' },
    { id: 'resume_6', text: 'How did you collaborate with your team members on this project?' },
    { id: 'resume_7', text: 'What was the impact of this project on the company or users?' },
    { id: 'resume_8', text: 'What did you learn from this experience?' },
    { id: 'resume_9', text: 'Can you explain the technical architecture of this system you built?' },
    { id: 'resume_10', text: 'How would you improve the solution you developed?' },
    { id: 'resume_11', text: 'What was your role in the team and how did you interact with other team members?' },
    { id: 'resume_12', text: 'How did you handle conflicting requirements or feedback on this project?' },
    { id: 'resume_13', text: 'What tools or frameworks did you use and why did you choose them?' },
    { id: 'resume_14', text: 'How did you approach testing and quality assurance for this project?' },
    { id: 'resume_15', text: 'What was the timeline for this project and how did you manage it?' },
    { id: 'resume_16', text: 'Can you walk me through your decision-making process for this project?' },
    { id: 'resume_17', text: 'What was the most challenging part of this project?' },
    { id: 'resume_18', text: 'How did you ensure code quality and maintainability in this project?' },
    { id: 'resume_19', text: 'What metrics or KPIs did you track for this project?' },
    { id: 'resume_20', text: 'How did you handle requirements changes during this project?' },
  ]
};

/**
 * Get next unique question from the question bank
 * @param {string} category - Interview category (general, dsa, rolebased, resumebased)
 * @param {array} askedQuestionIds - List of already-asked question IDs
 * @returns {object} Next question with id and text, or null if all exhausted
 */
function getNextQuestion(category, askedQuestionIds = []) {
  const questions = questionBank[category] || questionBank['general'];
  
  if (!questions || questions.length === 0) {
    console.warn(`[Question Bank] No questions found for category: ${category}`);
    return null;
  }

  // Filter to get only unanswered questions
  const availableQuestions = questions.filter(q => !askedQuestionIds.includes(q.id));

  if (availableQuestions.length === 0) {
    console.warn(`[Question Bank] All ${questions.length} questions have been asked in category: ${category}`);
    return null;
  }

  // Select random from available questions
  const randomIndex = Math.floor(Math.random() * availableQuestions.length);
  const selectedQuestion = availableQuestions[randomIndex];

  console.log(`[Question Bank] Selected question: ${selectedQuestion.text.substring(0, 50)}... (${availableQuestions.length} available)`);
  
  return {
    questionId: selectedQuestion.id,
    questionText: selectedQuestion.text
  };
}

/**
 * Generate follow-up questions based on previous answers
 * Used when all questions in a category are exhausted
 * @param {string} category - Interview category
 * @param {array} previousAnswers - Previous user answers
 * @returns {object} Generated follow-up question
 */
function generateFollowUpQuestion(category, previousAnswers = []) {
  const followUpQuestions = {
    general: [
      'Can you tell me more about what you mentioned earlier?',
      'How would you approach a similar situation in the future?',
      'What did you learn from that experience?',
      'How does that align with our company values?',
      'Can you provide a specific example to illustrate your point?',
      'What would you do differently if you faced that situation again?',
      'How has that experience shaped your professional development?',
      'What impact did your actions have on the team or organization?',
      'How do you measure your success in that area?',
      'What skills did you develop or strengthen through that experience?',
    ],
    dsa: [
      'Can you explain the space and time complexity of your approach?',
      'How would you optimize your solution further?',
      'Can you think of edge cases for this problem?',
      'How would you handle very large inputs?',
      'What tradeoffs did you consider in your solution?',
      'Can you compare this approach to alternative solutions?',
      'How would you test your implementation?',
      'What data structures would you use and why?',
      'How does your solution scale with input size?',
      'Can you walk me through your algorithm step by step?',
    ],
    rolebased: [
      'How have you applied that in your previous roles?',
      'What best practices do you follow in this area?',
      'Can you describe your experience with similar technologies?',
      'How do you stay current with industry standards?',
      'What challenges have you faced in this area?',
      'How would you improve the current system or process?',
      'What frameworks or tools do you prefer and why?',
      'How do you ensure code quality and best practices?',
      'Can you describe a complex project where you applied this skill?',
      'What would be your approach to solving a problem in this domain?',
    ],
    resumebased: [
      'Can you provide more context about that situation?',
      'What was your role specifically in that project?',
      'How did your contribution impact the final outcome?',
      'What tools and technologies were involved?',
      'What challenges did you overcome?',
      'How would you do it differently today?',
      'What did you learn from that experience?',
      'How does that experience relate to this role?',
      'What was the timeline and team size?',
      'Can you describe the technical architecture?',
    ]
  };

  const categoryFollowUps = followUpQuestions[category] || followUpQuestions['general'];
  const randomIndex = Math.floor(Math.random() * categoryFollowUps.length);

  return {
    questionId: `followup_${Date.now()}`,
    questionText: categoryFollowUps[randomIndex],
    isFollowUp: true
  };
}

/**
 * Get total questions available for a category
 * @param {string} category - Interview category
 * @returns {number} Total number of questions
 */
function getTotalQuestionsForCategory(category) {
  const questions = questionBank[category] || questionBank['general'];
  return questions ? questions.length : 0;
}

/**
 * Get progress percentage for asked questions
 * @param {string} category - Interview category
 * @param {array} askedQuestionIds - List of asked question IDs
 * @returns {number} Progress percentage (0-100)
 */
function getQuestionProgress(category, askedQuestionIds = []) {
  const total = getTotalQuestionsForCategory(category);
  if (total === 0) return 0;
  return Math.round((askedQuestionIds.length / total) * 100);
}
