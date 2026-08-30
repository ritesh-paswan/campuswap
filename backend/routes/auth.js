const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const pool = require('../db');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 5,
  message: { message: 'Too many OTP requests. Please wait 15 minutes.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  message: { message: 'Too many login attempts. Please wait 15 minutes.' }
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 3,
  message: { message: 'Too many reset requests. Please wait 15 minutes.' }
});

async function sendEmail(toEmail, subject, textContent) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': process.env.BREVO_API_KEY },
    body: JSON.stringify({
      sender: { name: 'CampuSwap Team', email: process.env.EMAIL_USER },
      to: [{ email: toEmail }],
      subject,
      textContent
    })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Brevo error: ${JSON.stringify(err)}`);
  }
  return response.json();
}

function generateToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// ─────────────────────────────────────────────
// 1. SEND OTP — IIITA email only
// ─────────────────────────────────────────────
router.post('/send-otp', otpLimiter, async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Invalid email format.' });
  }

  // ✅ Fix 3: Only allow IIITA emails OR the admin Gmail
  const isIIITA = email.endsWith('@iiita.ac.in');
  const isAdmin = email === 'sp.riteshpaswan7700@gmail.com';

  if (!isIIITA && !isAdmin) {
    return res.status(400).json({
      message: 'Only IIITA email addresses (@iiita.ac.in) are allowed to register.'
    });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ message: 'Email is already registered.' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `INSERT INTO otps (email, otp_code) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE otp_code = ?, created_at = CURRENT_TIMESTAMP`,
      [email, otp, otp]
    );

    await sendEmail(email, 'Verify Your CampuSwap Account 🎓',
      `Your 6-digit CampuSwap verification code is: ${otp}\n\nDo not share this code with anyone.`
    );

    return res.json({ message: 'Verification code sent to your inbox!' });
  } catch (error) {
    console.error('🚨 Send OTP Error:', error.message);
    return res.status(500).json({ message: 'Failed to send verification email. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 2. SIGNUP — auto login
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
    const [records] = await pool.query('SELECT * FROM otps WHERE email = ?', [email]);
    if (!records || records.length === 0) {
      return res.status(400).json({ message: 'No OTP found. Please request a new code.' });
    }
    if (records[0].otp_code.toString().trim() !== otp) {
      return res.status(400).json({ message: 'Incorrect verification code.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      `INSERT INTO users (name, email, password, password_hash, phone) VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, hashedPassword, phone]
    );

    await pool.query('DELETE FROM otps WHERE email = ?', [email]);

    const token = generateToken(result.insertId);

    return res.status(201).json({
      message: 'Account created successfully! Welcome to CampuSwap 🎉',
      token,
      user: { id: result.insertId, name, email }
    });
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
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return res.status(400).json({ message: 'No account found with that email.' });
    }

    const user = users[0];

    // Check if banned
    if (user.is_banned) {
      return res.status(403).json({ message: 'Your account has been banned. Contact admin.' });
    }

    const hashToCompare = user.password_hash || user.password;
    const validPassword = await bcrypt.compare(password, hashToCompare);
    if (!validPassword) return res.status(400).json({ message: 'Incorrect password.' });

    const token = generateToken(user.id);

    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error('🚨 Login Error:', error.message);
    return res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 4. FORGOT PASSWORD
// ─────────────────────────────────────────────
router.post('/forgot-password', forgotLimiter, async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) return res.status(400).json({ message: 'Email is required.' });

  try {
    const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) {
      return res.json({ message: 'If this email exists, a reset code has been sent.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(
      `INSERT INTO password_resets (email, otp_code) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE otp_code = ?, created_at = CURRENT_TIMESTAMP`,
      [email, otp, otp]
    );

    await sendEmail(email, 'Reset Your CampuSwap Password 🔒',
      `Your password reset code is: ${otp}\n\nExpires in 15 minutes.`
    );

    return res.json({ message: 'If this email exists, a reset code has been sent.' });
  } catch (error) {
    console.error('🚨 Forgot Password Error:', error.message);
    return res.status(500).json({ message: 'Failed to send reset email. Please try again.' });
  }
});

// ─────────────────────────────────────────────
// 5. RESET PASSWORD
// ─────────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  const email       = req.body.email?.trim().toLowerCase();
  const otp         = req.body.otp?.trim().toString();
  const newPassword = req.body.newPassword;

  if (!email || !otp || !newPassword) {
    return res.status(400).json({ message: 'Email, OTP, and new password are required.' });
  }
  if (newPassword.length < 4) {
    return res.status(400).json({ message: 'Password must be at least 4 characters.' });
  }

  try {
    const [records] = await pool.query('SELECT * FROM password_resets WHERE email = ?', [email]);
    if (!records || records.length === 0) {
      return res.status(400).json({ message: 'No reset request found. Please request a new code.' });
    }

    const ageMinutes = (Date.now() - new Date(records[0].created_at).getTime()) / 60000;
    if (ageMinutes > 15) {
      await pool.query('DELETE FROM password_resets WHERE email = ?', [email]);
      return res.status(400).json({ message: 'Reset code expired. Please request a new one.' });
    }

    if (records[0].otp_code.toString().trim() !== otp) {
      return res.status(400).json({ message: 'Incorrect reset code.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ?, password_hash = ? WHERE email = ?',
      [hashedPassword, hashedPassword, email]
    );
    await pool.query('DELETE FROM password_resets WHERE email = ?', [email]);

    return res.json({ message: 'Password reset successfully! You can now sign in.' });
  } catch (error) {
    console.error('🚨 Reset Password Error:', error.message);
    return res.status(500).json({ message: 'Failed to reset password. Please try again.' });
  }
});

module.exports = router;
