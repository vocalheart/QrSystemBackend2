// -----------------------------------------------------------------------------------------
// middleware/AuthenticationToken.js
// Middleware to authenticate requests using JSON Web Tokens (JWT).
// Verifies the JWT token in the Authorization header and attaches user data to the request.
// Used across protected routes to ensure user authentication and authorization.
// -----------------------------------------------------------------------------------------

const jwt = require('jsonwebtoken');

// Middleware function to authenticate JWT tokens
function authenticateToken(req, res, next) {
  try {
    // Extract the Authorization header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }
    // Extract the token from the header
    const token = authHeader.split(' ')[1];
    // Verify the token using the JWT_SECRET environment variable
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
      }
      // Attach user data (id, email, role) to the request object
      req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
      next();
    });
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
// Export the middleware for use in protected routes
module.exports = authenticateToken;
