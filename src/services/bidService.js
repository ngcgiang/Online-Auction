const { Op } = require('sequelize');
const { sequelize, Product, Bid, User, Rating, RefusedBidder } = require('../models');
const { getAuctionConfig} = require('../utils/configHelper');
const { maskFullname, maskMaxBit } = require('../utils/textHelpers');

class BidService {
/**
   * Check if user is eligible to bid on a product
   * Logic: Check permission first -> If restricted, check rating stats.
   */
  async checkUserEligibility(userId, product) {
    try {
      // --- BƯỚC 1: Kiểm tra cấu hình sản phẩm trước ---
      // Nếu product.permission là true (Ví dụ: Cho phép tất cả), 
      // thì return luôn, KHÔNG CẦN tốn tài nguyên gọi vào Database.
      if (product.permission) {
        return { 
          eligible: true, 
          message: 'Sản phẩm mở cho mọi người dùng.' 
        };
      }

      // Lấy tổng số đánh giá (Dùng count cho nhẹ server)
      const totalRatings = await Rating.count({
        where: { user_id: userId }
      });

      // Trường hợp 1: User là Newbie (Chưa có đánh giá nào)
      // Vì sản phẩm đang yêu cầu "permission check" (hạn chế), nên newbie sẽ bị loại.
      if (totalRatings === 0) {
        return {
          eligible: false,
          message: 'Sản phẩm này yêu cầu người dùng phải có lịch sử uy tín để tham gia.'
        };
      }

      // Trường hợp 2: User đã có lịch sử, check tỷ lệ tốt
      const positiveRatings = await Rating.count({
        where: { 
          user_id: userId,
          rating_point: 1 
        }
      });

      const positiveRatio = positiveRatings / totalRatings;

      // Check điều kiện 80%
      if (positiveRatio < 0.8) {
        return {
          eligible: false,
          message: `Điểm uy tín của bạn thấp (${(positiveRatio * 100).toFixed(1)}%). Yêu cầu tối thiểu 80% cho sản phẩm này.`
        };
      }

      // Nếu vượt qua tất cả
      return { eligible: true, message: 'User is eligible' };

    } catch (error) {
      console.error("Error in checkUserEligibility:", error);
      return {
        eligible: false,
        message: 'Lỗi hệ thống khi kiểm tra điều kiện người dùng.'
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

      // Step 2.5: Check if user is refused for this product
      const isRefused = await RefusedBidder.findOne({
        where: {
          product_id: productId,
          bidder_id: userId
        },
        transaction
      });

      if (isRefused) {
        await transaction.rollback();
        return {
          success: false,
          message: 'You have been blocked from bidding on this product by the seller'
        };
      }

      // Step 3: Check if user has previous bids (prevent decreasing max bid)
      const userPreviousBid = await Bid.findOne({
        where: {
          product_id: productId,
          bidder_id: userId,
          status: 1
        },
        order: [['amount', 'DESC']],
        transaction
      });

      if (userPreviousBid) {
        const previousMaxBid = parseFloat(userPreviousBid.amount);
        if (bidAmount < previousMaxBid) {
          await transaction.rollback();
          return {
            success: false,
            message: `You cannot decrease your maximum bid. Your current maximum bid is ${previousMaxBid}`
          };
        }
      }

      // Step 4: Validate bid amount
      const nextValidPrice = this.getNextValidPrice(product);
      if (bidAmount < nextValidPrice) {
        await transaction.rollback();
        return {
          success: false,
          message: `Bid amount must be at least ${nextValidPrice}`
        };
      }

      // Step 4.5: Check Buy Now condition
      if (product.buy_now_value && product.buy_now_value > 0 && bidAmount >= product.buy_now_value) {
        // Instant win via Buy Now
        const buyNowPrice = parseFloat(product.buy_now_value);
        
        // Create the winning bid at exact buy_now_price (not higher)
        const buyNowBid = await Bid.create({
          product_id: productId,
          bidder_id: userId,
          amount: buyNowPrice,
          bid_time: currentTime,
          status: 1
        }, { transaction });

        // Update product: set current price to buy_now_price, mark as sold, end immediately
        await product.update({
          current_price: buyNowPrice,
          winner_id: userId,
          status: 'sold',
          end_time: currentTime
        }, { transaction });

        await transaction.commit();
        
        return {
          success: true,
          isBuyNow: true,
          message: `Congratulations! You purchased this item instantly at ${buyNowPrice}`,
          bid: {
            bid_id: buyNowBid.bid_id,
            bidder_id: userId,
            amount: buyNowPrice,
            bid_time: currentTime
          },
          currentPrice: buyNowPrice,
          bidCount: 1,
          endTime: currentTime,
          isWinning: true,
          highestBidderId: userId,
          product: {
            current_price: buyNowPrice,
            status: 'sold',
            end_time: currentTime,
            winner_id: userId
          }
        };
      }

      // Step 5: Get current leader bid (highest amount)
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
      const { triggerTime, extendTime } = await getAuctionConfig();

      // Step 6: Proxy Bidding Logic
      if (!currentLeaderBid) {
        // Case 1: No bids yet - First bidder wins
        newCurrentPrice = product.start_value;
        winnerId = userId;
        if (product.end_time - currentTime <= triggerTime * 60 * 1000 && product.auto_renewal) {
          newEndTime = new Date(currentTime.getTime() + extendTime * 60 * 1000);
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
          if (currentLeaderBid.bidder_id === userId) {
            // If the current leader is bidding again, just increase their max bid
            newCurrentPrice = product.current_price;
          } else {
            newCurrentPrice = Math.min(leaderAmount + priceStep, newBidAmount);
          }
                    
          if (product.end_time - currentTime <= triggerTime * 60 * 1000 && product.auto_renewal) {
            newEndTime = new Date(currentTime.getTime() + extendTime * 60 * 1000);
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

      // Step 7: Create new bid record
      const newBid = await Bid.create({
        product_id: productId,
        bidder_id: userId,
        amount: bidAmount,
        bid_time: new Date(),
        status: 1
      }, { transaction });

      // Step 8: Update product current_price, winner_id, and end_time
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
   * @param {string} mode - 'valid' (status=1) or 'all' (both valid and invalid)
   * @param {number} limit - Maximum number of bids to return (default: 5)
   * @returns {Promise<Array>} - Array of bids with status field
   */
  async getBidHistory(productId, mode = 'all', limit = 5) {
    try {
      // Build where condition based on mode
      const whereCondition = { product_id: productId };
      
      if (mode === 'valid') {
        whereCondition.status = 1;
      }
      // mode === 'all' will fetch both status 0 and 1

      const bids = await Bid.findAll({
        where: whereCondition,
        include: [{
          model: User,
          as: 'bidder',
          attributes: ['user_id', 'full_name', 'rating_score']
        }],
        order: [['bid_time', 'DESC']],
        limit: limit
      });

      // Mask full names for privacy and include status
      // Also mask the highest bid amount for privacy
      
      // Find the highest bid amount to mask it
      let highestBidIndex = -1;
      let highestAmount = -1;
      
      bids.forEach((bid, index) => {
        const amount = parseFloat(bid.amount);
        if (amount > highestAmount) {
          highestAmount = amount;
          highestBidIndex = index;
        }
      });
      
      const maskedBids = bids.map((bid, index) => {
        const bidData = bid.toJSON();
        if (bidData.bidder && bidData.bidder.full_name) {
          bidData.bidder.full_name = maskFullname(bidData.bidder.full_name);
        }
        
        // Mask the highest bid amount
        if (index === highestBidIndex && bidData.amount) {
          bidData.amount = maskMaxBit(bidData.amount);
        }
        
        // Ensure status field is included for frontend
        return bidData;
      });

      return maskedBids;
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

 async getBidddedUsersEmailsFromProduct(product_id) {
  try {
    // Get all valid bids with bidder information
    const bids = await Bid.findAll({
      where: { 
        product_id: product_id,
        status: 1
      },
      include: [{
        model: User,
        as: 'bidder',
        attributes: ['user_id', 'email', 'full_name']
      }],
      attributes: ['bidder_id']
    });

    // Create a Set to store unique emails
    const emailSet = new Set();
    
    bids.forEach(bid => {
      if (bid.bidder && bid.bidder.email) {
        emailSet.add(bid.bidder.email);
      }
    });

    return Array.from(emailSet);
  } catch (error) {
    console.error('Error in getBidddedUsersEmailsFromProduct:', error);
    throw error;
  }
}
  
}

module.exports = new BidService();
