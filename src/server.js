const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const sequelize = require('./config/db');
const { initializeSocket } = require('./config/socket');
const realtimeBidService = require('./services/realtimeBidService');
const auctionEndScanner = require('./cron/auctionEndScanner');
const watchlistRoutes = require('./routes/watchlist');
const productRoutes = require('./routes/product');
const authRoutes = require('./routes/authorization');
const categoryRoutes = require('./routes/category');
const bidRoutes = require('./routes/bid');
const emailRoutes = require('./routes/email');
const sellerRoutes = require('./routes/seller');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');
const orderRoutes = require('./routes/order');
const qaRoutes = require('./routes/qa');
const chatRoutes = require('./routes/chat');
const paymentRoutes = require('./routes/payment');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const morgan = require('morgan');
const metricsMiddleware = require('./middlewares/metricsMiddleware');
const { register } = require('./utils/metrics');
const {
  globalLimiter,
  authLimiter,
  apiLimiter,
  paymentLimiter,
  chatLimiter,
} = require('./middlewares/rateLimiter');

const app = express();

app.use(cors());

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = initializeSocket(server);

// Set Socket.io instance to realtimeBidService
realtimeBidService.setSocketIO(io);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply global rate limiter to all routes
//app.use(globalLimiter);

// Morgan logging with skip function to exclude /metrics endpoint
// app.use(morgan('combined', { 
//   stream: logger.stream,
//   skip: (req, res) => req.path === '/metrics'
// }));

// Prometheus metrics middleware (should be early in the chain)
//app.use(metricsMiddleware);

// Serve static files from public directory
app.use(express.static('public'));

// Routes
app.use('/api/auth', /*authLimiter*/ authRoutes);
app.use('/api/watchlist', /*apiLimiter*/ watchlistRoutes);
app.use('/api/products', /*apiLimiter*/ productRoutes);
app.use('/api/categories', /*apiLimiter*/ categoryRoutes);
app.use('/api/emails', /*apiLimiter*/ emailRoutes);
app.use('/api/seller', /*apiLimiter*/ sellerRoutes);
app.use('/api/admin', /*apiLimiter*/ adminRoutes);
app.use('/api/users', /*apiLimiter*/userRoutes);
app.use('/api/orders', /*apiLimiter*/ orderRoutes);
app.use('/api/qa', /*apiLimiter*/ qaRoutes);
app.use('/api/chat', /*chatLimiter*/ chatRoutes);
app.use('/api/bids', /*apiLimiter*/ bidRoutes);
app.use('/api/payments', /*paymentLimiter*/ paymentRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Auction API is running' });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).end(err);
  }
});

// Global error handler (must be last)
app.use(errorHandler);

// Test database connection
sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

// Sync models (optional - use with caution in production)
// sequelize.sync({ alter: true });

// Start server with Socket.io
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start Auction End Scanner after server is ready
  auctionEndScanner.start();
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  auctionEndScanner.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 SIGTERM received, shutting down...');
  auctionEndScanner.stop();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = { app, server, io };
