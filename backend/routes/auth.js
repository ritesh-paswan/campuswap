const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../db');

// Configure the Nodemailer email engine
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
    port: 465,
    secure: true,
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
    // Make sure the user isn't already registered
    const [exists] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (exists.length > 0) return res.status(400).json({ message: 'Email already registered' });

    // Generate a 6-digit random code string
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Reset row on duplicate email requests
    await pool.query(`
      INSERT INTO otps (email, otp_code) 
      VALUES (?, ?) 
      ON DUPLICATE KEY UPDATE otp_code = ?
    `, [email, otp, otp]);

    // Send the email layout
    const mailOptions = {
      from: `"CampuSwap Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Verify Your CampuSwap Account 🎓',
      text: `Your 6-digit CampuSwap verification security code is: ${otp}.`
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: 'Verification OTP sent to your inbox!' });
  } catch (error) {
    console.error("🚨 Send OTP Error:", error);
    res.status(500).json({ error: 'Failed to send verification email. Verify your .env setup.' });
  }
});

// 2. VERIFY & SIGNUP ROUTE
router.post('/signup', async (req, res) => {
  const name = req.body.name?.trim();
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password;
  const phone = req.body.phone?.trim();
  const otp = req.body.otp?.trim().toString(); 

  if (!name || !email || !password || !phone || !otp) {
    return res.status(400).json({ message: 'All registration parameters are required.' });
  }

  try {
    // Pull the active OTP token row matching this email
    const [records] = await pool.query(
      'SELECT * FROM otps WHERE email = ?',
      [email]
    );

    if (records.length === 0) {
      return res.status(400).json({ message: 'No OTP record found. Please send code again.' });
    }

    const latestRecord = records[0];

    // Debugging logs to verify synchronization
    console.log("-----------------------------------------");
    console.log(`💬 Frontend sent OTP: "${otp}" (Type: ${typeof otp}, Length: ${otp?.length})`);
    console.log(`🗄️ TiDB Cloud stored OTP: "${latestRecord.otp_code}" (Type: ${typeof latestRecord.otp_code}, Length: ${latestRecord.otp_code?.toString().length})`);
    console.log("-----------------------------------------");

    // Check if the typed code matches exactly as strings
    if (latestRecord.otp_code.toString().trim() !== otp) {
      return res.status(400).json({ message: 'Incorrect OTP code.' });
    }

    // Hash the password and save the complete profile
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // ✅ DUAL COLUMN FIX: Populates both password and password_hash fields
    // to bypass column variation constraints in your TiDB user schema structure
    await pool.query(
      'INSERT INTO users (name, email, password, password_hash, phone) VALUES (?, ?, ?, ?, ?)', 
      [name, email, hashedPassword, hashedPassword, phone]
    );

    // Clear out used code
    await pool.query('DELETE FROM otps WHERE email = ?', [email]);

    res.status(201).json({ message: 'Account verified and created successfully! 🎉' });
  } catch (error) {
    console.error("🚨 Signup Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3. LOGIN ROUTE
router.post('/login', async (req, res) => {
  const email = req.body.email?.trim().toLowerCase();
  const { password } = req.body;
  try {
    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = users[0];
    
    // Check whichever column is populated on your table format
    const activeHash = user.password_hash || user.password;
    
    const validPassword = await bcrypt.compare(password, activeHash);
    if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user.id }, 'SECRET_KEY', { expiresIn: '1h' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;