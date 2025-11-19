const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { run, get } = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateRegister, validateLogin } = require('../middleware/validators');
const { generateId, getTimestamp } = require('../utils/helpers');
require('dotenv').config();

/**
 * Register new user
 */
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = generateId();
    const timestamp = getTimestamp();

    await run(
      `INSERT INTO users (id, name, email, phone, password_hash, email_verified, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [userId, name, email || null, phone || null, passwordHash, timestamp]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userId,
        name,
        email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * Login user
 */
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * Get current user profile
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await get('SELECT id, name, email, phone, role, email_verified, created_at FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * Update user profile
 */
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = ?');
    values.push(getTimestamp());
    values.push(req.user.id);

    await run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const user = await get('SELECT id, name, email, phone, role, email_verified, created_at FROM users WHERE id = ?', [req.user.id]);

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Verify JWT token
 */
router.get('/verify', optionalAuth, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ valid: false });
  }

  try {
    const user = await get('SELECT id, name, email, role, email_verified, is_active FROM users WHERE id = ?', [req.user.id]);
    
    if (!user || !user.is_active) {
      return res.status(401).json({ valid: false });
    }

    res.json({
      valid: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ valid: false });
  }
});

module.exports = router;

