// -----------------------------------------------------------------------------------------
// Backend/db/mysql.js
// Configures and initializes a MySQL connection pool using mysql2/promise.
// Loads environment variables from a .env file for secure database configuration.
// Exports a connection pool for use in database queries across the application.
// -----------------------------------------------------------------------------------------

const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Create a MySQL connection pool with specified configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Database host from environment variables
  user: process.env.DB_USER, // Database user from environment variables
  password: process.env.DB_PASSWORD, // Database password from environment variables
  database: process.env.DB_NAME, // Database name from environment variables
  waitForConnections: true, // Wait for connections if all are in use
  connectionLimit: 10, // Maximum number of connections in the pool
  queueLimit: 0 // Unlimited queueing for connection requests
});

// Log successful pool creation
console.log('MySQL pool created successfully!');

// Export the pool for use in other modules
module.exports = pool;