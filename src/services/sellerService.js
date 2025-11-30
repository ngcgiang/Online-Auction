const { Product, User, ProductImage, Rating } = require('../models');
const { Op } = require('sequelize');

class SellerService {
    /**
     * User (Bidder) request to upgrade to Seller role
     * @param {number} userId - ID of the user requesting upgrade
     * @returns {Promise<Object>} - Updated user info
     */
    async requestUpgradeToSeller(userId) {
        try {
            // Find user by ID
            const user = await User.findByPk(userId);

            if (!user) {
                throw new Error('User not found');
            }

            // Check if user is verified
            if (!user.is_verified) {
                throw new Error('Please verify your email first');
            }

            // Check if user is already a seller or admin
            if (user.role === 'seller') {
                throw new Error('You are already a seller');
            }

            if (user.role === 'admin') {
                throw new Error('Admin cannot request seller upgrade');
            }

            // Check if there's already a pending request
            if (user.upgrade_request === true) {
                throw new Error('You already have a pending upgrade request');
            }

            // Update upgrade_request to true
            user.upgrade_request = true;
            await user.save();

            return {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                upgrade_request: user.upgrade_request
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if seller permission is still valid (within 7 days of upgrade_at)
     * @param {number} userId - ID of the seller
     * @returns {Promise<Object>} - Permission status
     */
    async checkSellerPermission(userId) {
        try {
            const user = await User.findByPk(userId);

            if (!user) {
                throw new Error('User not found');
            }

            if (user.role !== 'seller') {
                throw new Error('User is not a seller');
            }

            if (!user.upgrade_at) {
                throw new Error('Seller upgrade date not found');
            }

            // Calculate days since upgrade
            const currentDate = new Date();
            const upgradeDate = new Date(user.upgrade_at);
            const daysSinceUpgrade = Math.floor((currentDate - upgradeDate) / (1000 * 60 * 60 * 24));
            const daysRemaining = 7 - daysSinceUpgrade;

            const isValid = daysSinceUpgrade < 7;

            return {
                isValid,
                upgrade_at: user.upgrade_at,
                daysSinceUpgrade,
                daysRemaining: isValid ? daysRemaining : 0,
                expiresAt: new Date(upgradeDate.getTime() + 7 * 24 * 60 * 60 * 1000)
            };

        } catch (error) {
            throw error;
        }
    }

     /**
   * Get active products for a seller (endtime > current_time)
   * @param {number} sellerId - ID of the seller
   * @returns {Promise<Array>} - Array of active products
   */
  async getActiveProducts(sellerId) {
    try {
      const currentTime = new Date();

      const products = await Product.findAll({
        where: {
          seller_id: sellerId,
          end_time: {
            [Op.gt]: currentTime
          },
          status: 'active'
        },
        include: [
          {
            model: ProductImage,
            as: 'images',
            attributes: ['image_id', 'img_url'],
            limit: 1,
            separate: true,
            order: [['image_id', 'ASC']]
          },
          {
            model: User,
            as: 'winner',
            attributes: ['user_id', 'full_name', 'email'],
            required: false
          }
        ],
        order: [['end_time', 'ASC']]
      });

      return products.map(product => {
        const productData = product.toJSON();
        
        // Calculate remaining time
        const remainingMs = new Date(productData.end_time).getTime() - currentTime.getTime();
        const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
        
        return {
          ...productData,
          mainImage: productData.images?.[0]?.img_url || null,
          remainingHours: remainingHours > 0 ? remainingHours : 0
        };
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get ended products for a seller (endtime < current_time)
   * @param {number} sellerId - ID of the seller
   * @returns {Promise<Array>} - Array of ended products with winner info
   */
  async getEndedProducts(sellerId) {
    try {
      const currentTime = new Date();

      const products = await Product.findAll({
        where: {
          seller_id: sellerId,
          end_time: {
            [Op.lt]: currentTime
          }
        },
        include: [
          {
            model: ProductImage,
            as: 'images',
            attributes: ['image_id', 'img_url'],
            limit: 1,
            separate: true,
            order: [['image_id', 'ASC']]
          },
          {
            model: User,
            as: 'winner',
            attributes: ['user_id', 'full_name', 'email', 'rating_score'],
            required: false
          }
        ],
        order: [['end_time', 'DESC']]
      });

      return products.map(product => {
        const productData = product.toJSON();
        
        // Check if product has winner
        const hasWinner = productData.winner_id !== null;
        
        return {
          product_id: productData.product_id,
          product_name: productData.product_name,
          start_value: productData.start_value,
          current_price: productData.current_price,
          buy_now_value: productData.buy_now_value,
          start_time: productData.start_time,
          end_time: productData.end_time,
          status: hasWinner ? 'sold' : 'expired',
          mainImage: productData.images?.[0]?.img_url || null,
          winner: hasWinner ? {
            user_id: productData.winner.user_id,
            full_name: productData.winner.full_name,
            email: productData.winner.email,
            rating_score: productData.winner.rating_score
          } : null,
          winnerStatus: hasWinner ? 'Has Winner' : 'No Winner'
        };
      });

    } catch (error) {
      throw error;
    }
  }

  /**
   * Rate the winner of an auction
   * @param {Object} ratingData - Rating information
   * @returns {Promise<Object>} - Created rating
   */
  async rateWinner(ratingData) {
    try {
      const { reviewerId, userId, productId, ratingPoint, content } = ratingData;

      // Step 1: Verify product exists and belongs to the seller
      const product = await Product.findOne({
        where: { product_id: productId }
      });

      if (!product) {
        return {
          success: false,
          message: 'Product not found'
        };
      }

      if (product.seller_id !== reviewerId) {
        return {
          success: false,
          message: 'You are not the seller of this product'
        };
      }

      // Step 2: Ensure product has ended
      const currentTime = new Date();
      if (new Date(product.end_time) >= currentTime) {
        return {
          success: false,
          message: 'Product auction has not ended yet'
        };
      }

      // Step 3: Verify the target user is the winner
      if (product.winner_id !== userId) {
        return {
          success: false,
          message: 'The specified user is not the winner of this auction'
        };
      }

      if (!product.winner_id) {
        return {
          success: false,
          message: 'This auction has no winner'
        };
      }

      // Step 4: Check if seller has already rated this transaction
      const existingRating = await Rating.findOne({
        where: {
          reviewer_id: reviewerId,
          user_id: userId,
          product_id: productId
        }
      });

      if (existingRating) {
        return {
          success: false,
          message: 'You have already rated this winner for this transaction'
        };
      }

      // Step 5: Validate rating point
      if (ratingPoint !== 1 && ratingPoint !== -1) {
        return {
          success: false,
          message: 'Rating point must be either +1 or -1'
        };
      }

      // Step 6: Create rating
      const newRating = await Rating.create({
        user_id: userId,
        reviewer_id: reviewerId,
        product_id: productId,
        rating_point: ratingPoint,
        content: content || null,
        created_at: new Date()
      });

      // Step 7: Update user's rating score
      await this.updateUserRatingScore(userId);

      return {
        success: true,
        message: 'Rating submitted successfully',
        rating: newRating
      };

    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user's rating score based on all ratings received
   * @param {number} userId - ID of the user
   */
  async updateUserRatingScore(userId) {
    try {
      // Get all ratings for this user
      const ratings = await Rating.findAll({
        where: { user_id: userId },
        attributes: ['rating_point']
      });

      if (ratings.length === 0) {
        return;
      }

      // Calculate positive ratio
      const positiveRatings = ratings.filter(r => r.rating_point === 1).length;
      const totalRatings = ratings.length;
      const ratingScore = (positiveRatings / totalRatings) * 100;

      // Update user's rating score
      await User.update(
        { rating_score: ratingScore.toFixed(2) },
        { where: { user_id: userId } }
      );

    } catch (error) {
      console.error('Error updating user rating score:', error);
    }
  }
}

module.exports = new SellerService();