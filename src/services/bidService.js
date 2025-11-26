const { Op } = require('sequelize');
const { sequelize, Product, Bid, User, Rating } = require('../models');

class BidService {
  /**
   * Check if user is eligible to bid on a product
   * @param {number} userId - ID of the user attempting to bid
   * @param {Object} product - Product object from database
   * @returns {Promise<Object>} - { eligible: boolean, message: string }
   */
  async checkUserEligibility(userId, product) {
    try {
      // Get all ratings received by this user
      const userRatings = await Rating.findAll({
        where: { user_id: userId },
        attributes: ['rating_point']
      });

      // If user has ratings, check the positive ratio
      if (userRatings.length > 0) {
        const positiveRatings = userRatings.filter(r => r.rating_point === 1).length;
        const totalRatings = userRatings.length;
        const positiveRatio = positiveRatings / totalRatings;

        if (positiveRatio < 0.8) {
          return {
            eligible: false,
            message: 'User has insufficient positive feedback ratio (< 80%) to bid on this product'
          };
        }
        return { eligible: true, message: 'User is eligible' };
      }

      // User is a newbie (no ratings)
      // Check product permission
      if (!product.permission) {
        return {
          eligible: false,
          message: 'This product does not allow bids from users without feedback history'
        };
      }

      return { eligible: true, message: 'User is eligible' };
    } catch (error) {
      return {
        eligible: false,
        message: 'Error checking user eligibility'
      };
    }
  }

  /**
   * Get the next valid bid price for a product
   * @param {Object} product - Product object from database
   * @returns {number} - Next valid bid price
   */
  getNextValidPrice(product) {
    return parseFloat(product.current_price) + parseFloat(product.price_step);
  }

  /**
   * Get the next valid bid price for a product by ID
   * @param {number} productId - ID of the product
   * @returns {Promise<Object>} - Next valid price or error
   */
  async getNextValidPriceByProductId(productId) {
    try {
      const product = await Product.findOne({
        where: { product_id: productId },
        attributes: ['product_id', 'current_price', 'price_step', 'status']
      });

      if (!product) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      if (product.status !== 'active') {
        return {
          success: false,
          message: 'This product auction is not active'
        };
      }

      const nextPrice = this.getNextValidPrice(product);

      return {
        success: true,
        nextPrice: nextPrice
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Error getting next bid price'
      };
    }
  }

  /**
   * Check if user is eligible to bid on a product by IDs
   * @param {number} userId - ID of the user attempting to bid
   * @param {number} productId - ID of the product
   * @returns {Promise<Object>} - Eligibility result with details
   */
  async checkUserEligibilityByIds(userId, productId) {
    try {
      // Fetch the product
      const product = await Product.findOne({
        where: { product_id: productId },
        attributes: ['product_id', 'seller_id', 'permission', 'status', 'start_time', 'end_time']
      });

      if (!product) {
        return {
          success: false,
          eligible: false,
          message: 'Product not found'
        };
      }

      // Check if product is active
      if (product.status !== 'active') {
        return {
          success: false,
          eligible: false,
          message: 'This product auction is not active'
        };
      }

      const currentTime = new Date();
      if (currentTime > product.end_time) {
        return {
          success: false,
          eligible: false,
          message: 'Auction has already ended'
        };
      }

      if (currentTime < product.start_time) {
        return {
          success: false,
          eligible: false,
          message: 'Auction has not started yet'
        };
      }

      // Check if user is the seller
      if (product.seller_id === userId) {
        return {
          success: false,
          eligible: false,
          message: 'Seller cannot bid on their own product'
        };
      }

      // Check user eligibility based on ratings
      const eligibilityCheck = await this.checkUserEligibility(userId, product);
      
      return {
        success: true,
        eligible: eligibilityCheck.eligible,
        message: eligibilityCheck.message
      };
    } catch (error) {
      return {
        success: false,
        eligible: false,
        message: error.message || 'Error checking user eligibility'
      };
    }
  }

  /**
   * Place a bid on a product with Proxy Bidding logic (similar to eBay)
   * @param {number} userId - ID of the user placing the bid
   * @param {number} productId - ID of the product
   * @param {number} bidAmount - Maximum amount user is willing to pay
   * @returns {Promise<Object>} - Result of the bidding operation
   */
  async placeBid(userId, productId, bidAmount) {
    let transaction;

    try {
      transaction = await sequelize.transaction();

      // Step 1: Lock and fetch the product
      const product = await Product.findOne({
        where: { product_id: productId },
        lock: transaction.LOCK.UPDATE,
        transaction
      });

      if (!product) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Product not found'
        };
      }

      // Check if product is active and auction hasn't ended
      if (product.status !== 'active') {
        await transaction.rollback();
        return {
          success: false,
          message: 'This product auction is not active'
        };
      }

      const currentTime = new Date();
      if (currentTime > product.end_time) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Auction has already ended'
        };
      }

      if (currentTime < product.start_time) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Auction has not started yet'
        };
      }

      // Check if user is the seller
      if (product.seller_id === userId) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Seller cannot bid on their own product'
        };
      }

      // Step 2: Check user eligibility
      const eligibilityCheck = await this.checkUserEligibility(userId, product);
      if (!eligibilityCheck.eligible) {
        await transaction.rollback();
        return {
          success: false,
          message: eligibilityCheck.message
        };
      }

      // Step 3: Validate bid amount
      const nextValidPrice = this.getNextValidPrice(product);
      if (bidAmount < nextValidPrice) {
        await transaction.rollback();
        return {
          success: false,
          message: `Bid amount must be at least ${nextValidPrice}`
        };
      }

      // Step 4: Get current leader bid (highest amount)
      const currentLeaderBid = await Bid.findOne({
        where: { 
          product_id: productId,
          status: 1
        },
        order: [['amount', 'DESC']],
        transaction
      });

      let newEndTime;
      let newCurrentPrice;
      let winnerId;
      let bidResult;

      // Step 5: Proxy Bidding Logic
      if (!currentLeaderBid) {
        // Case 1: No bids yet - First bidder wins
        newCurrentPrice = product.start_value;
        winnerId = userId;
        if (product.end_time - currentTime <= 10 * 60 * 1000) {
          newEndTime = new Date(currentTime.getTime() + 10 * 60 * 1000);
        }
        bidResult = {
          isWinning: true,
          message: 'You are now the highest bidder',
          currentPrice: newCurrentPrice
        };
      } else {
        const leaderAmount = parseFloat(currentLeaderBid.amount);
        const newBidAmount = parseFloat(bidAmount);
        const priceStep = parseFloat(product.price_step);

        if (newBidAmount > leaderAmount) {
          // Case 2: New bid is higher - New bidder wins
          winnerId = userId;
          // New current price = old leader's max + step
          // But cannot exceed new bidder's max
          newCurrentPrice = Math.min(leaderAmount + priceStep, newBidAmount);
          
          if (product.end_time - currentTime <= 10 * 60 * 1000) {
            newEndTime = new Date(currentTime.getTime() + 10 * 60 * 1000);
          }

          bidResult = {
            isWinning: true,
            message: 'You are now the highest bidder',
            currentPrice: newCurrentPrice
          };
        } else if (newBidAmount < leaderAmount) {
          // Case 3: New bid is lower - Old leader still wins
          winnerId = currentLeaderBid.bidder_id;
          // New current price = new bidder's max + step
          // But cannot exceed old leader's max
          newCurrentPrice = Math.min(newBidAmount + priceStep, leaderAmount);
          
          bidResult = {
            isWinning: false,
            message: 'Your bid was placed but you have been outbid by another bidder',
            currentPrice: newCurrentPrice,
            highestBidderId: winnerId
          };
        } else {
          // Case 4: Tie - Old leader wins (first come, first served)
          winnerId = currentLeaderBid.bidder_id;
          newCurrentPrice = leaderAmount;
          
          bidResult = {
            isWinning: false,
            message: 'Your bid matches the current highest bid, but the other bidder was first',
            currentPrice: newCurrentPrice,
            highestBidderId: winnerId
          };
        }
      }

      // Step 6: Create new bid record
      const newBid = await Bid.create({
        product_id: productId,
        bidder_id: userId,
        amount: bidAmount,
        bid_time: new Date(),
        status: 1
      }, { transaction });

      // Step 7: Update product current_price, winner_id, and end_time
      await product.update({
        end_time: newEndTime || product.end_time,
        current_price: newCurrentPrice,
        winner_id: winnerId
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Get bid count for realtime update
      const bidCount = await Bid.count({
        where: { 
          product_id: productId,
          status: 1
        }
      });

      return {
        success: true,
        bid: newBid,
        bidCount: bidCount,
        endTime: newEndTime || product.end_time,
        ...bidResult
      };

    } catch (error) {
      // Rollback transaction on error
      if (transaction) {
        await transaction.rollback();
      }
      return {
        success: false,
        message: error.message || 'An error occurred while placing the bid'
      };
    }
  }

  /**
   * Get bid history for a product
   * @param {number} productId - ID of the product
   * @returns {Promise<Array>} - Array of bids
   */
  async getBidHistory(productId) {
    try {
      const bids = await Bid.findAll({
        where: { 
          product_id: productId,
          status: 1
        },
        include: [{
          model: User,
          as: 'bidder',
          attributes: ['user_id', 'username', 'full_name', 'rating_score']
        }],
        order: [['bid_time', 'DESC']]
      });

      return bids;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's bid on a specific product
   * @param {number} userId - ID of the user
   * @param {number} productId - ID of the product
   * @returns {Promise<Object|null>} - User's highest bid or null
   */
  async getUserBid(userId, productId) {
    try {
      const userBid = await Bid.findOne({
        where: { 
          product_id: productId,
          bidder_id: userId,
          status: 1
        },
        order: [['amount', 'DESC']]
      });

      return userBid;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new BidService();
