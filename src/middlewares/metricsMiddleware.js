const { httpRequestDuration, httpRequestTotal } = require('../utils/metrics');

/**
 * Middleware to track HTTP request metrics for Prometheus
 * Automatically captures request duration and count with labels
 */
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  // Capture the original end function
  const originalEnd = res.end;

  // Override res.end to capture metrics after response is sent
  res.end = function (...args) {
    // Calculate request duration in seconds
    const duration = (Date.now() - start) / 1000;

    // Get route pattern (e.g., /api/products/:id instead of /api/products/123)
    const route = req.route ? req.route.path : req.path;
    const method = req.method;
    const statusCode = res.statusCode;

    // Record metrics
    httpRequestDuration.labels(method, route, statusCode).observe(duration);
    httpRequestTotal.labels(method, route, statusCode).inc();

    // Call the original end function
    originalEnd.apply(res, args);
  };

  next();
};

module.exports = metricsMiddleware;
