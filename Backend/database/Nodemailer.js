// -----------------------------------------------------------------------------------------
// Backend/config/nodemailer.js
// Configures a Nodemailer transporter for sending emails using Gmail's SMTP service.
// Uses environment variables or hardcoded credentials for authentication.
// Exports the transporter for use in other modules to send emails.
// -----------------------------------------------------------------------------------------

const nodemailer = require('nodemailer');

// Create a Nodemailer transporter instance with Gmail service configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // Specifies Gmail as the email service provider
  auth: {
    user: 'vocalheart.tech@gmail.com', // Gmail account used for sending emails
    pass: 'ybbgrkvknqccupzy' // App-specific password for Gmail authentication
  },
  tls: {
    rejectUnauthorized: false // Allows self-signed certificates (use with caution)
  }
});

// Export the transporter for use in other modules
module.exports = transporter;