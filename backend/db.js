const mysql = require('mysql2/promise');

// Hardcoded connection configuration using your exact TiDB credentials
const pool = mysql.createPool({
  host: 'gateway01.ap-southeast-1.prod.aws.tidbcloud.com',
  port: 4000,
  user: 'dAbiaCpBof6L7YY.root',
  password: '6Z8ct7XUBzm2Iz67',
  database: 'test',
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Initialize database schema
async function initializeDatabase() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // 1. Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create products table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        seller_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        description TEXT,
        image_url VARCHAR(255),
        status VARCHAR(50) NOT NULL DEFAULT 'available',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    console.log('📊 Database tables verified/created successfully in test db!');
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

// Test connection and run setup exactly ONCE
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('🚀 SUCCESS: Connected directly to TiDB Cloud!');
    connection.release();
    
    // Fire the table initializer
    await initializeDatabase();
  } catch (error) {
    console.error('❌ CONNECTION FAILED:', error.message);
  }
})();

module.exports = pool;