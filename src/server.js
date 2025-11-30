const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const sequelize = require('./config/db');
const { initializeSocket } = require('./config/socket');
const realtimeBidService = require('./services/realtimeBidService');
const watchlistRoutes = require('./routes/watchlist');
const productRoutes = require('./routes/product');
const authRoutes = require('./routes/authorization');
const categoryRoutes = require('./routes/category');
const bidRoutes = require('./routes/bid');
const emailRoutes = require('./routes/email');
const sellerRoutes = require('./routes/seller');
const adminRoutes = require('./routes/admin');
const ratingRoutes = require('./routes/rating');
const orderRoutes = require('./routes/order');
const errorHandler = require('./middlewares/errorHandler');

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
app.use('/api/users', ratingRoutes);
app.use('/api/orders', orderRoutes);
  
app.use('/api/bids', bidRoutes);

// HTML Routes for client pages
app.get('/product/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product-detail-client.html'));
});

app.get('/homepage', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'homepage-client.html'));
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
});

module.exports = { app, server, io };
