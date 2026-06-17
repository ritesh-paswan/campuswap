require('dotenv').config(); // Loads standard environment variables smoothly
const express = require('express');
const cors = require('cors');
const pool = require('./db'); 

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

// Clean connection check without trying to alter existing tables
async function verifyDatabaseConnection() {
  try {
    await pool.query('SELECT 1');
    console.log("✅ TiDB Cloud Database connected and ready!");
  } catch (err) {
    console.error("🚨 DATABASE CONNECTION ERROR:", err.message);
  }
}

verifyDatabaseConnection();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});