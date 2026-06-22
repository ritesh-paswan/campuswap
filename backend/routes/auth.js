const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../db');

// Configure the Nodemailer email engine securely for production environments
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for port 465, false for port 587
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS  
  }
});

// 1. SEND OTP ROUTE
router.post('/send-otp', async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows && rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    await pool.query(`
      INSERT INTO otps (email, otp_code) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE otp_code = ?
    `, [email, otp, otp]);

    const mailOptions = {
      from: `"CampuSwap Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your CampuSwap Account 🎓',
      text: `Your 6-digit CampuSwap verification security code is: ${otp}.`
    };

    await transporter.sendMail(mailOptions);
    return res.json({ message: 'Verification OTP sent to your inbox!' });
  } catch (error) {
    console.error("🚨 Send OTP Error Details:", error);
    return res.status(500).json({ message: 'Failed to send verification email.', error: error.message });
  }
});

// 2. VERIFY & SIGNUP ROUTE (UPDATED)
router.post('/signup', async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const phone = req.body.phone?.trim() || ""; // Safe fallback if frontend leaves it blank
  const otp = req.body.otp?.trim().toString(); 

  // Make phone optional so missing fields don't instantly block registration
  if (!name || !email || !password || !otp) {
    return res.status(400).json({ message: 'Name, email, password, and OTP are required.' });
  }

  try {
    const [records] = await pool.query('SELECT * FROM otps WHERE email = ?', [email]);

    if (!records || records.length === 0) {
      return res.status(400).json({ message: 'No OTP record found. Please send code again.' });
    }

    const latestRecord = records[0];

    if (latestRecord.otp_code.toString().trim() !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP code.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Clean, standard SQL structure inserting only into 'password' and 'phone'
    await pool.query(
      'INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)', 
      [name, email, hashedPassword, phone]
    );

    // Clear out used code
    await pool.query('DELETE FROM otps WHERE email = ?', [email]);

    return res.status(201).json({ message: 'Account verified and created successfully! 🎉' });
  } catch (error) {
    console.error("🚨 Signup Error Details:", error);
    return res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
});

// 3. LOGIN ROUTE
router.post('/login', async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users || users.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = users[0];
    const activeHash = user.password_hash || user.password;
    
    const validPassword = await bcrypt.compare(password, activeHash);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, 'SECRET_KEY', { expiresIn: '1h' });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    console.error("🚨 Login Error Details:", error);
    return res.status(500).json({ message: 'Login execution failed.', error: error.message });
  }
});

module.exports = router;