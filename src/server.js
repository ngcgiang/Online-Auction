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
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');
const morgan = require('morgan');

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
app.use(morgan('combined', { stream: logger.stream }));

// Serve static files from public directory
app.use(express.static('public'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/qa', qaRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/bids', bidRoutes);

// HTML Routes for client pages
app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product-detail-client.html'));
});

app.get('/homepage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'homepage-client.html'));
});

app.get('/chat-demo', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat-demo.html'));
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Auction API is running' });
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
