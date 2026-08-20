// Main server entry: imports routes, sets up middleware, and starts Express
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./db');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
let databaseConnection;

function ensureDatabaseConnection() {
  if (!databaseConnection) {
    databaseConnection = connectDB();
  }
  return databaseConnection;
}

// Middleware
app.use(cors({
  origin: 'http://127.0.0.1:5500',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve the frontend from the same public origin in production.
const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));
app.use(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    next();
  } catch (error) {
    next(error);
  }
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const aiResumeRoutes = require('./routes/aiResumeRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const evaluationRoutes = require('./routes/evaluationRoutes');
const progressRoutes = require('./routes/progressRoutes');
const interviewAPI = require('./interview-api');
const virtualInterviewRoutes = require('./routes/virtualInterviewRoutes');

// Mount routes
app.use('/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/ai/resume', aiResumeRoutes);
app.use('/api/interviews', interviewAPI);  // Comprehensive interview API
app.use('/api/virtual-interviews', virtualInterviewRoutes);  // Virtual face-to-face interviews
app.use('/api/evaluate', evaluationRoutes);
app.use('/api/progress', progressRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ status: 'ok', app: 'prepmate AI Backend', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(404).json({ message: 'Route not found', path: req.path });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.setHeader('Content-Type', 'application/json');
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

// Start server and connect to DB
async function start() {
  try {
    console.log('Starting prepmate AI Backend...');
    console.log('Attempting to connect to MongoDB...');
    
    await ensureDatabaseConnection();
    console.log('MongoDB connected, starting Express server...');
    
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log('[Server] Ready to accept connections');
    });
    
    server.on('error', (err) => {
      console.error('[Server] Error:', err);
    });
  } catch (err) {
    console.error('[Startup] Failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
