const express = require('express');
const router = express.Router();
const {
  addToWatchlist,
  removeFromWatchlist,
  getUserWatchlist
} = require('../controllers/watchlistController');

// POST /api/watchlist/add - Add product to watchlist
router.post('/add', addToWatchlist);

// DELETE /api/watchlist/remove - Remove product from watchlist
router.delete('/remove', removeFromWatchlist);

// GET /api/watchlist/:user_id - Get user's watchlist
router.get('/:user_id', getUserWatchlist);

module.exports = router;
