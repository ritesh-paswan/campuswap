require('dotenv').config(); // 1. Load your .env config first
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // 2. LINK THE DATABASE HERE!

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: ["http://localhost:5173", "https://campuswap.vercel.app"], 
    credentials: true
}));
app.use(express.json());

app.use('/uploads', express.static('uploads'));

// Link authentication endpoints
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Link product endpoints
const productRoutes = require('./routes/products');
app.use('/api/products', productRoutes);

app.get('/', (req, res) => {
    res.json({ status: "Backend Server is running smoothly" });
});

// Force-verify database columns on boot
async function checkDatabaseSchema() {
  
  try {
    // 1. Add image_url column to products table if missing
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS image_url VARCHAR(255) AFTER description
    `);

    // 2. Add category column to products table if missing
    await pool.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'Other' AFTER image_url
    `);

    // 3. CORRECTED: Create otps validation table with proper TiDB syntax
    await pool.query(`
      CREATE TABLE IF NOT EXISTS otps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        otp_code VARCHAR(6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 4. Add phone column to users table if missing
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS password VARCHAR(255) NOT NULL AFTER email
    `);

    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20) AFTER password
    `);

    console.log("✅ TiDB Cloud Database schema verified successfully!");
  } catch (err) {
    console.error("🚨 DATABASE REJECTION ERROR:", err.message);
  }
}

checkDatabaseSchema();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});