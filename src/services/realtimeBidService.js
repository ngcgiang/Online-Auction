const { User } = require('../models');

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
   * Mask username for privacy (hide first half of characters)
   * Example: "john_doe" -> "****_doe"
   * @param {string} username - Original username
   * @returns {string} - Masked username
   */
  maskUsername(username) {
    if (!username || username.length === 0) return '****';
    
    const halfLength = Math.ceil(username.length / 2);
    const visiblePart = username.slice(halfLength);
    const maskedPart = '*'.repeat(halfLength);
    
    return maskedPart + visiblePart;
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
          attributes: ['user_id', 'username', 'rating_score']
        });

        if (winner) {
          winnerData = {
            userId: winner.user_id,
            username: this.maskUsername(winner.username),
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

      // Fetch winner username for masking
      let maskedWinner = null;
      if (bidData.winnerId) {
        const winner = await User.findOne({
          where: { user_id: bidData.winnerId },
          attributes: ['username']
        });

        if (winner) {
          maskedWinner = this.maskUsername(winner.username);
        }
      }

      // Prepare minimal data for homepage list
      const minimalData = {
        productId: productId,
        currentPrice: bidData.currentPrice,
        winnerUsername: maskedWinner,
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
        this.emitHomepageFeedUpdate(productId, bidData)
      ]);

    } catch (error) {
      console.error('❌ Error emitting bid updates:', error);
    }
  }
}

// Export singleton instance
module.exports = new RealtimeBidService();
