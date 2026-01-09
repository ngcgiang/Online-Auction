const rateLimit = require('express-rate-limit');

/**
 * Global rate limiter - Applies to all routes
 * 15 requests per 15 minutes per IP address
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  skip: (req, res) => {
    // Skip rate limiting for metrics endpoint
    return req.path === '/metrics';
  },
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes per IP address
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Quá nhiều lần đăng nhập thất bại, vui lòng thử lại sau 15 phút',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * API endpoint rate limiter
 * 30 requests per minute per IP address for API endpoints
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: 'Quá nhiều yêu cầu API, vui lòng thử lại sau 1 phút',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Payment endpoint rate limiter
 * 10 requests per minute per IP address for payment endpoints
 */
const paymentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per minute
  message: 'Quá nhiều yêu cầu thanh toán, vui lòng thử lại sau 1 phút',
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Chat/Message rate limiter
 * 20 messages per minute per IP address
 */
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per minute
  message: 'Quá nhiều tin nhắn, vui lòng thử lại sau 1 phút',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  globalLimiter,
  authLimiter,
  apiLimiter,
  paymentLimiter,
  chatLimiter,
};
