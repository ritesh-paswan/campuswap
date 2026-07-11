const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db');

// ─────────────────────────────────────────────
// Rate limiters
// ─────────────────────────────────────────────
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many OTP requests. Please wait 15 minutes and try again.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait 15 minutes.' }
});

// ─────────────────────────────────────────────
// Brevo HTTP API mailer (port 443)
// ─────────────────────────────────────────────
async function sendOtpEmail(toEmail, otp) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: {
        name: 'CampuSwap Team',
        email: process.env.EMAIL_USER
      },
      to: [{ email: toEmail }],
      subject: 'Verify Your CampuSwap Account 🎓',
      textContent: `Your 6-digit CampuSwap verification code is: ${otp}\n\nDo not share this code with anyone.`
    })
  });

  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(`Brevo API error ${response.status}: ${JSON.stringify(errorBody)}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────
// 1. SEND OTP
// ─────────────────────────────────────────────
router.post('/send-otp', otpLimiter, async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  try {
    const [existingUsers] = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email is already registered.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `INSERT INTO otps (email, otp_code)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE otp_code = ?, created_at = CURRENT_TIMESTAMP`,
      [email, otp, otp]
    );

    await sendOtpEmail(email, otp);

    return res.json({ message: 'Verification code sent to your inbox!' });
  } catch (error) {
    console.error('🚨 Send OTP Error:', error.message);
    // ✅ Never expose internal error details to client
    return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 2. VERIFY OTP & SIGNUP
// ─────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  const name     = req.body.name?.trim();
  const email    = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const phone    = req.body.phone?.trim() || '';
  const otp      = req.body.otp?.trim().toString();

  if (!name || !email || !password || !otp) {
    return res.status(400).json({ message: 'Name, email, password, and OTP are required.' });
  }

  if (password.length < 4) {
    return res.status(400).json({ message: 'Password must be at least 4 characters.' });
  }

  try {
    const [records] = await pool.query(
      'SELECT * FROM otps WHERE email = ?',
      [email]
    );

    if (!records || records.length === 0) {
      return res.status(400).json({ message: 'No OTP found for this email. Please request a new code.' });
    }

    if (records[0].otp_code.toString().trim() !== otp) {
      return res.status(400).json({ message: 'Incorrect verification code.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (name, email, password, password_hash, phone)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, hashedPassword, phone]
    );

    await pool.query('DELETE FROM otps WHERE email = ?', [email]);

    return res.status(201).json({ message: 'Account created successfully! Welcome to CampuSwap 🎉' });
  } catch (error) {
    console.error('🚨 Signup Error:', error.message);
    return res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 3. LOGIN
// ─────────────────────────────────────────────
router.post('/login', loginLimiter, async (req, res) => {
  const email    = req.body.email?.trim().toLowerCase();
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const [users] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!users || users.length === 0) {
      return res.status(400).json({ message: 'No account found with that email.' });
    }

    const user = users[0];
    const hashToCompare = user.password_hash || user.password;
    const validPassword = await bcrypt.compare(password, hashToCompare);

    if (!validPassword) {
      return res.status(400).json({ message: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error('🚨 Login Error:', error.message);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

module.exports = router;