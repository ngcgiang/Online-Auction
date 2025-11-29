const { User } = require('../models');
const { maskFullname, maskMaxBit } = require('../utils/textHelpers');

/**
 * Service to handle realtime bid notifications via Socket.io
 */
class RealtimeBidService {
  constructor() {
    this.io = null;
  }

  /**
   * Set Socket.io instance
   * @param {Object} socketIo - Socket.io instance
   */
  setSocketIO(socketIo) {
    this.io = socketIo;
  }

  /**
   * Calculate remaining time in milliseconds
   * @param {Date} endTime - Auction end time
   * @returns {number} - Remaining time in milliseconds
   */
  calculateRemainingTime(endTime) {
    const now = new Date();
    const remaining = new Date(endTime).getTime() - now.getTime();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Emit full bid update to product detail room
   * @param {number} productId - Product ID
   * @param {Object} bidData - Complete bid information
   */
  async emitProductDetailUpdate(productId, bidData) {
    if (!this.io) {
      console.warn('⚠️ Socket.io not initialized');
      return;
    }

    try {
      const roomName = `product_${productId}`;

      // Fetch winner information
      let winnerData = null;
      if (bidData.winnerId) {
        const winner = await User.findOne({
          where: { user_id: bidData.winnerId },
          attributes: ['user_id', 'full_name', 'rating_score']
        });

        if (winner) {
          winnerData = {
            userId: winner.user_id,
            full_name: maskFullname(winner.full_name),
            ratingScore: winner.rating_score
          };
        }
      }

      // Prepare full data for product detail page
      const fullData = {
        productId: productId,
        currentPrice: bidData.currentPrice,
        winner: winnerData,
        bidCount: bidData.bidCount || null,
        remainingTime: this.calculateRemainingTime(bidData.endTime),
        endTime: bidData.endTime,
        timestamp: new Date().toISOString()
      };

      // Emit to product detail room
      this.io.to(roomName).emit('update_price_detail', fullData);
      console.log(`📡 Emitted to ${roomName}:`, fullData);

    } catch (error) {
      console.error('❌ Error emitting product detail update:', error);
    }
  }

  /**
   * Emit minimal bid update to homepage feed
   * @param {number} productId - Product ID
   * @param {Object} bidData - Minimal bid information
   */
  async emitHomepageFeedUpdate(productId, bidData) {
    if (!this.io) {
      console.warn('⚠️ Socket.io not initialized');
      return;
    }

    try {
      const roomName = 'homepage_feed';

      // Fetch winner full_name for masking
      let maskedWinner = null;
      if (bidData.winnerId) {
        const winner = await User.findOne({
          where: { user_id: bidData.winnerId },
          attributes: ['full_name']
        });

        if (winner) {
          maskedWinner = maskFullname(winner.full_name);
        }
      }

      // Prepare minimal data for homepage list
      const minimalData = {
        productId: productId,
        currentPrice: bidData.currentPrice,
        winnerFullName: maskedWinner,
        timestamp: new Date().toISOString()
      };

      // Emit to homepage feed room
      this.io.to(roomName).emit('update_price_list', minimalData);
      console.log(`📡 Emitted to ${roomName}:`, minimalData);

    } catch (error) {
      console.error('❌ Error emitting homepage feed update:', error);
    }
  }

  /**
   * Emit bid updates to both rooms (product detail + homepage)
   * @param {number} productId - Product ID
   * @param {Object} bidResult - Bid result from bidService
   */
  async emitBidUpdate(productId, bidResult) {
    try {
      const bidData = {
        currentPrice: bidResult.currentPrice,
        winnerId: bidResult.bid.bidder_id,
        bidCount: bidResult.bidCount,
        endTime: bidResult.endTime
      };

      // Emit to both rooms in parallel
      await Promise.all([
        this.emitProductDetailUpdate(productId, bidData),
        this.emitHomepageFeedUpdate(productId, bidData),
        this.emitBidHistoryUpdate(productId) // Add history update
      ]);

    } catch (error) {
      console.error('❌ Error emitting bid updates:', error);
    }
  }

  /**
   * Emit bid history update to product detail room
   * Triggers clients to refetch the latest 5 bids
   * @param {number} productId - Product ID
   * @param {Array} bidHistory - Optional: Pre-fetched bid history (latest 5)
   */
  async emitBidHistoryUpdate(productId, bidHistory = null) {
    if (!this.io) {
      console.warn('⚠️ Socket.io not initialized');
      return;
    }

    try {
      const roomName = `product_${productId}`;

      // If bid history not provided, fetch it
      if (!bidHistory) {
        const { Bid, User } = require('../models');
        
        const bids = await Bid.findAll({
          where: { product_id: productId },
          include: [{
            model: User,
            as: 'bidder',
            attributes: ['user_id', 'full_name', 'rating_score']
          }],
          order: [['bid_time', 'DESC']],
          limit: 5
        });

        bidHistory = bids.map(bid => {
          const bidData = bid.toJSON();
          if (bidData.bidder && bidData.bidder.full_name) {
            bidData.bidder.full_name = maskFullname(bidData.bidder.full_name);
          }
          return bidData;
        });
      }

      // Emit to product detail room
      const payload = {
        productId: productId,
        bids: bidHistory,
        timestamp: new Date().toISOString()
      };

      this.io.to(roomName).emit('bid_history_update', payload);
      console.log(`📡 Emitted bid_history_update to ${roomName}:`, payload.bids.length, 'bids');

    } catch (error) {
      console.error('❌ Error emitting bid history update:', error);
    }
  }
}

// Export singleton instance
module.exports = new RealtimeBidService();
