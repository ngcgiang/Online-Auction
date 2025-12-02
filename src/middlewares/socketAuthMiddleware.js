const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;

/**
 * Socket.io middleware with OPTIONAL authentication
 * If token is provided and valid: socket.user = decoded user info, socket.isAuthenticated = true
 * If no token or invalid token: socket.user = null, socket.isAuthenticated = false (Guest mode)
 * This allows both authenticated users and guests to connect
 */
const verifySocketToken = (socket, next) => {
  try {
    // Get token from handshake auth or query parameters
    const token = socket.handshake.auth.token || socket.handshake.query.token;

    // If no token provided, allow connection as Guest
    if (!token) {
      socket.user = null;
      socket.isAuthenticated = false;
      socket.isGuest = true;
      return next();
    }

    // If token provided, verify it
    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
      if (err) {
        // If token is invalid/expired, still allow connection as Guest
        console.warn(`⚠️ Invalid token for socket ${socket.id}: ${err.message}`);
        socket.user = null;
        socket.isAuthenticated = false;
        socket.isGuest = true;
        return next();
      }

      // Token is valid, attach user info
      socket.user = decoded;
      socket.isAuthenticated = true;
      socket.isGuest = false;
      next();
    });

  } catch (error) {
    // On unexpected error, allow connection as Guest
    console.error('Socket auth middleware error:', error);
    socket.user = null;
    socket.isAuthenticated = false;
    socket.isGuest = true;
    next();
  }
};

/**
 * Helper middleware to require authentication for specific events
 * Use this in event handlers that need authenticated users only
 */
const requireAuth = (socket, callback) => {
  if (!socket.isAuthenticated) {
    return {
      authorized: false,
      error: 'Authentication required. Please login to access this feature.'
    };
  }
  return { authorized: true };
};

module.exports = { verifySocketToken, requireAuth };
