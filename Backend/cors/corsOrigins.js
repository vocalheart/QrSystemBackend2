// -----------------------------------------------------------------------------------------
// allowedOrigins.js
// Defines the list of allowed origins for CORS (Cross-Origin Resource Sharing).
// Used to restrict which domains can access the server’s resources.
// Includes local development and production URLs for the application.
// -----------------------------------------------------------------------------------------

const allowedOrigins = [
  'http://localhost:5173', // Local development URL (likely for frontend dev server)
  'http://localhost:5174', // Additional local development URL
  'http://localhost:3000', // Common local development URL (e.g., React default port)
  'https://admin.vocalheart.com', // Production admin dashboard URL
  'https://visits.vocalheart.com', // Production visits application URL
  'https://Qr-Image.s3.us-east-005.backblazeb2.com' // Backblaze B2 storage URL for QR images
];

module.exports = allowedOrigins;