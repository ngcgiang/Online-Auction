const bidService = require('../services/bidService');
const realtimeBidService = require('../services/realtimeBidService');

/**
 * Place a bid on a product
 * @route POST /api/bids
 */
const placeBid = async (req, res, next) => {
  try {
    const { productId, amount } = req.body;
    // TODO: Get userId from authenticated session/token
    // For now, assuming userId is passed in body or can be extracted from auth middleware
    const userId = req.body.userId || req.user?.user_id;

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
 * @route GET /api/bids/history/:productId
 */
const getBidHistory = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const bids = await bidService.getBidHistory(productId);

    res.status(200).json({
      success: true,
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
    const { userId, productId } = req.params;

    const bid = await bidService.getUserBid(userId, productId);

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
