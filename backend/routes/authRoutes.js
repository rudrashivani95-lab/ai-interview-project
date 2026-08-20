// Routes for user signup and login using JWT
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'secret_dev_key';

// Signup: create a new user
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    console.log(`\n=== SIGNUP REQUEST ===\n[Email: ${email}]`);
    console.log(`[Fields] name=${!!name}, email=${!!email}, password=${!!password}`);
    
    // Validate inputs
    if (!name || !email || !password) {
      console.warn(`[Signup] Missing required field`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ success: false, message: 'Missing required fields: name, email, password' });
    }

    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.warn(`[Signup] Email already registered: ${email}`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password with bcrypt
    console.log(`[Signup] Hashing password (length: ${password.length})...`);
    const salt = await bcrypt.genSalt(10);
    console.log(`[Signup] Generated salt: ${salt}`);
    
    const hashed = await bcrypt.hash(password, salt);
    console.log(`[Signup] Password hashed successfully. Hash length: ${hashed.length}`);

    // Create user with hashed password
    const user = await User.create({ name, email, password: hashed });
    console.log(`[Signup] User created in DB: ID=${user._id}`);

    // Create JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    console.log(`[Signup] Token generated`);
    
    // Return success response
    const response = {
      success: true,
      message: 'Account created successfully',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      },
      token
    };
    
    console.log(`[Signup] Returning response with token\n=== SIGNUP SUCCESS ===\n`);
    res.setHeader('Content-Type', 'application/json');
    res.status(201).json(response);
    
  } catch (err) {
    console.error(`[Signup] ERROR: ${err.message}`);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// Login: verify user and return token
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`\n=== LOGIN REQUEST ===\n[Email: ${email}]`);
    console.log(`[Fields] email=${!!email}, password=${!!password ? 'present' : 'missing'}`);
    
    // Validate inputs
    if (!email || !password) {
      console.warn(`[Login] Missing required field`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ success: false, message: 'Missing email or password' });
    }

    // Find user in database
    console.log(`[Login] Searching for user: ${email}...`);
    const user = await User.findOne({ email });
    
    if (!user) {
      console.warn(`[Login] User not found: ${email}`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }
    
    console.log(`[Login] User found: ${user.name} (ID: ${user._id})`);
    console.log(`[Login] Password in DB: ${user.password.substring(0, 20)}... (length: ${user.password.length})`);
    console.log(`[Login] Comparing password (${password.length} chars) with hash...`);

    // Compare password with stored hash
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[Login] bcrypt.compare result: ${isMatch}`);
    
    if (!isMatch) {
      console.warn(`[Login] Password mismatch for: ${email}`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    // Create JWT token
    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    console.log(`[Login] Token generated successfully`);
    
    // Return success response
    const response = {
      success: true,
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email
      },
      token
    };
    
    console.log(`[Login] Returning response with token\n=== LOGIN SUCCESS ===\n`);
    res.setHeader('Content-Type', 'application/json');
    res.json(response);
    
  } catch (err) {
    console.error(`[Login] ERROR: ${err.message}`);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

module.exports = router;
