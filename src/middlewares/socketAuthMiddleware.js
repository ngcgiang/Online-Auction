const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

/**
 * Socket.io middleware to verify JWT token
 * Extracts token from handshake auth or query
 * Attaches decoded user info to socket.user
 */
const verifySocketToken = (socket, next) => {
  try {
    // Get token from handshake auth or query parameters
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    // Verify token
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          return next(new Error('Authentication error: Token expired'));
        }
        return next(new Error('Authentication error: Invalid token'));
      }

      // Attach user info to socket
      socket.user = decoded;
      next();
    });

  } catch (error) {
    return next(new Error('Authentication error: Server error'));
  }
};

module.exports = { verifySocketToken };
