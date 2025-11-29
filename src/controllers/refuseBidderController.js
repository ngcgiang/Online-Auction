const refuseBidderService = require('../services/refuseBidderService');
const realtimeBidService = require('../services/realtimeBidService');
const { validationResult } = require('express-validator');

/**
 * Refuse/Kick a bidder from a product
 * POST /api/products/:product_id/refuse-bidder
 */
const refuseBidder = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { product_id } = req.params;
    const { bidder_id } = req.body;
    const sellerId = req.user?.user_id; // From verifyAccessToken middleware

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Call service to refuse bidder
    const result = await refuseBidderService.refuseBidder(
      sellerId,
      parseInt(product_id),
      parseInt(bidder_id)
    );

    if (!result.success) {
      return res.status(400).json(result);
    }

    // ✅ Emit real-time updates after refusing bidder
    // This notifies all connected clients about price change and bid history update
    if (result.data.recalculated) {
      const bidData = {
        currentPrice: result.data.new_current_price,
        winnerId: result.data.new_winner_id,
        bidCount: result.data.remaining_bids,
        endTime: null // No end time change in refuse operation
      };

      // Emit price update to all rooms
      realtimeBidService.emitProductDetailUpdate(parseInt(product_id), {
        ...bidData,
        endTime: new Date() // Placeholder, will be ignored if null
      }).catch(error => {
        console.error('⚠️ Failed to emit price update after refuse:', error);
      });

      realtimeBidService.emitHomepageFeedUpdate(parseInt(product_id), bidData).catch(error => {
        console.error('⚠️ Failed to emit homepage update after refuse:', error);
      });
    }

    // ✅ CRUCIAL: Emit bid history update (shows refused bid with strikethrough)
    realtimeBidService.emitBidHistoryUpdate(parseInt(product_id)).catch(error => {
      console.error('⚠️ Failed to emit bid history update after refuse:', error);
    });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error refusing bidder:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while refusing the bidder',
      error: error.message
    });
  }
};

/**
 * Get list of refused bidders for a product
 * GET /api/products/:product_id/refused-bidders
 */
const getRefusedBidders = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const refusedBidders = await refuseBidderService.getRefusedBidders(parseInt(product_id));

    return res.status(200).json({
      success: true,
      message: 'Refused bidders retrieved successfully',
      data: refusedBidders
    });

  } catch (error) {
    console.error('Error getting refused bidders:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving refused bidders',
      error: error.message
    });
  }
};

/**
 * Check if a bidder is refused for a product
 * GET /api/products/:product_id/is-refused/:bidder_id
 */
const checkIfRefused = async (req, res, next) => {
  try {
    const { product_id, bidder_id } = req.params;

    const isRefused = await refuseBidderService.isRefused(
      parseInt(product_id),
      parseInt(bidder_id)
    );

    return res.status(200).json({
      success: true,
      isRefused: isRefused
    });

  } catch (error) {
    console.error('Error checking refused status:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while checking refused status',
      error: error.message
    });
  }
};

module.exports = {
  refuseBidder,
  getRefusedBidders,
  checkIfRefused
};
