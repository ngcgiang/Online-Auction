const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middlewares/authMiddleware');
const { getChatRooms, getChatHistory } = require('../controllers/chatController');

/**
 * GET /api/chat/rooms
 * Get list of chat rooms for current user
 * Returns all products where user is seller or winner (after auction ended)
 */
router.get('/rooms', verifyAccessToken, getChatRooms);

/**
 * GET /api/chat/:product_id/history
 * Get chat history for a specific product
 * Query params: ?limit=50 (optional, default 50)
 */
router.get('/:product_id/history', verifyAccessToken, getChatHistory);

module.exports = router;
