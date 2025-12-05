const client = require('prom-client');

// Create a Registry to register metrics
const register = new client.Registry();

// Add default metrics (CPU, Memory, Event Loop Lag, etc.)
client.collectDefaultMetrics({
  register,
  prefix: 'nodejs_',
  timeout: 10000,
  gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

// ========================================
// CUSTOM METRICS
// ========================================

// HTTP Request Duration (Histogram)
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.001, 0.005, 0.015, 0.05, 0.1, 0.5, 1, 5],
});

// HTTP Request Count (Counter)
const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Business Metric: Auction Bids Total (Counter)
const auctionBidsTotal = new client.Counter({
  name: 'auction_bids_total',
  help: 'Total number of bids placed in the auction system',
  labelNames: ['product_id', 'user_id', 'status'], // status: success, failed
});

// Register custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(auctionBidsTotal);

module.exports = {
  register,
  httpRequestDuration,
  httpRequestTotal,
  auctionBidsTotal,
};
