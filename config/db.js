const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false, 
  },
  port: 25060, 
});

// Test the connection
const testConnection = async () => {
  try {
    const connection = await pool.promise().getConnection();
    console.log('Database connected successfully');
    connection.release();
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
};

testConnection();

module.exports = pool.promise();
