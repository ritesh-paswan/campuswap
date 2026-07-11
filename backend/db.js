const mysql = require('mysql2/promise');

// All credentials from environment variables — never hardcode
const pool = mysql.createPool({
  host:     process.env.TIDB_HOST,
  port:     parseInt(process.env.TIDB_PORT) || 4000,
  user:     process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE || 'test',
  ssl: { rejectUnauthorized: true },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('🚀 SUCCESS: Connected to TiDB Cloud!');
    connection.release();
  } catch (error) {
    console.error('❌ CONNECTION FAILED:', error.message);
    process.exit(1);
  }
})();

module.exports = pool;