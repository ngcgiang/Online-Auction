const bidService = require('../services/bidService');
const realtimeBidService = require('../services/realtimeBidService');
const mqService = require('../services/mqService');

/**
 * Place a bid on a product
 * @route POST /api/bids
 */
const placeBid = async (req, res, next) => {
  try {
    const { productId, amount } = req.body;
    // TODO: Get userId from authenticated session/token
    // For now, assuming userId is passed in body or can be extracted from auth middleware
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const result = await bidService.placeBid(userId, productId, amount);

    // Check if bid placement was successful
    if (!result.success) {
      return res.status(400).json(result);
    }

    // ✅ Emit realtime updates to Socket.io rooms (non-blocking)
    // This runs in the background and doesn't affect the response
    realtimeBidService.emitBidUpdate(productId, result).catch(error => {
      console.error('⚠️ Failed to emit realtime bid update:', error);
    });

    // ✅ Publish BID_PLACED event to RabbitMQ for async email processing
    // Non-blocking: Errors are logged but don't affect the API response
    // Only send email if winner changed (previousWinnerId exists AND different from new winner)
    const winnerChanged = result.previousWinnerId && result.previousWinnerId !== result.highestBidderId;
    
    mqService.publishToQueue('email_queue', {
      event: 'BID_PLACED',
      data: {
        product_id: result.product.product_id,
        product_name: result.product.product_name,
        new_price: result.currentPrice,
        seller_id: result.product.seller_id,
        new_bidder_id: userId,
        previous_winner_id: winnerChanged ? result.previousWinnerId : null, // Only include if winner changed
        winner_changed: winnerChanged // Flag to help worker understand the context
      }
    }).catch(error => {
      console.error('⚠️ Failed to publish BID_PLACED event to MQ:', error);
    });

    res.status(201).json({
      success: true,
      message: result.message,
      data: {
        bid: result.bid,
        isWinning: result.isWinning,
        currentPrice: result.currentPrice,
        highestBidderId: result.highestBidderId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bid history for a product
 * @route GET /api/bids/history/:productId?mode=valid|all
 * @query mode - 'valid' (only status=1) or 'all' (both valid and invalid, default)
 */
const getBidHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { mode = 'all' } = req.query; // Default to 'all'

    // Validate mode parameter
    if (mode !== 'valid' && mode !== 'all') {
      return res.status(400).json({
        success: false,
        message: 'Invalid mode parameter. Must be "valid" or "all"'
      });
    }

    // Fetch latest 5 bids with mode filter
    const bids = await bidService.getBidHistory(productId, mode, 5);

    res.status(200).json({
      success: true,
      mode: mode,
      count: bids.length,
      data: bids
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's bid on a specific product
 * @route GET /api/bids/user/:userId/product/:productId
 */
const getUserBid = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user_id = req.user?.user_id;

    const bid = await bidService.getUserBid(user_id, productId);

    res.status(200).json({
      success: true,
      data: bid
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get valid next bid amount for a product
 * @route GET /api/bids/:productId/next-price
 */
const getNextBidPrice = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const result = await bidService.getNextValidPriceByProductId(productId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      data: {
        nextPrice: result.nextPrice
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user is eligible to bid on a product
 * @route GET /api/bids/:productId/bid-availability
 */
const checkBidAvailability = async (req, res, next) => {
  try {
    const { productId } = req.params;
    // TODO: Get userId from authenticated session/token
    const userId = req.query.userId || req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
    }

    const result = await bidService.checkUserEligibilityByIds(userId, productId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json({
      success: true,
      eligible: result.eligible,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  placeBid,
  getBidHistory,
  getUserBid,
  getNextBidPrice,
  checkBidAvailability
};
