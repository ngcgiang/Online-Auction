const express = require('express');
const sequelize = require('./config/db');
const watchlistRoutes = require('./routes/watchlist');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/watchlist', watchlistRoutes);

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

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Auction API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
