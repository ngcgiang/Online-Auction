const express = require('express');
const router = express.Router();
const bidController = require('../controllers/bidController');
const { validatePlaceBid, validateGetBidHistory, validateGetUserBid, validateCheckBidAvailability } = require('../middlewares/bidValidator');
const validationHandler = require('../middlewares/validationHandler');

/**
 * @route   POST /api/bids
 * @desc    Place a bid on a product (Proxy Bidding)
 * @access  Private (requires authentication)
 */
router.post(
  '/',
  validatePlaceBid,
  validationHandler,
  bidController.placeBid
);

/**
 * @route   GET /api/bids/history/:productId
 * @desc    Get bid history for a product
 * @access  Public
 */
router.get(
  '/history/:productId',
  validateGetBidHistory,
  validationHandler,
  bidController.getBidHistory
);

/**
 * @route   GET /api/bids/user/:userId/product/:productId
 * @desc    Get user's bid on a specific product
 * @access  Private (should check if requesting user matches userId)
 */
router.get(
  '/user/:userId/product/:productId',
  validateGetUserBid,
  validationHandler,
  bidController.getUserBid
);

/**
 * @route   GET /api/bids/:productId/next-price
 * @desc    Get valid next bid amount for a product
 * @access  Public
 */
router.get(
  '/:productId/next-price',
  bidController.getNextBidPrice
);

/**
 * @route   GET /api/bids/:productId/bid-availability
 * @desc    Check if user is eligible to bid on a product
 * @access  Private (requires authentication or userId in query)
 */
router.get(
  '/:productId/bid-availability',
  validateCheckBidAvailability,
  validationHandler,
  bidController.checkBidAvailability
);

module.exports = router;
