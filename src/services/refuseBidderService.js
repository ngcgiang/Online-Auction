const { sequelize, Product, Bid, User, RefusedBidder } = require('../models');
const { Op } = require('sequelize');

class RefuseBidderService {
  /**
   * Refuse/Kick a bidder from a product
   * @param {number} sellerId - ID of the seller (must be owner)
   * @param {number} productId - ID of the product
   * @param {number} bidderId - ID of the bidder to refuse
   * @returns {Promise<Object>} - Result of the operation
   */
  async refuseBidder(sellerId, productId, bidderId) {
    let transaction;

    try {
      transaction = await sequelize.transaction();

      // Step 1: Verify product exists and seller is the owner
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

      if (product.seller_id !== sellerId) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Only the product owner can refuse bidders'
        };
      }

      // Check if product is active
      if (product.status !== 'active') {
        await transaction.rollback();
        return {
          success: false,
          message: 'Cannot refuse bidders on inactive products'
        };
      }

      // Step 2: Check if bidder exists
      const bidder = await User.findByPk(bidderId);
      if (!bidder) {
        await transaction.rollback();
        return {
          success: false,
          message: 'Bidder not found'
        };
      }

      // Step 3: Check if bidder has ever bid on this product
      const bidderBids = await Bid.findAll({
        where: {
          product_id: productId,
          bidder_id: bidderId
        },
        transaction
      });

      if (bidderBids.length === 0) {
        await transaction.rollback();
        return {
          success: false,
          message: 'This user has not bid on this product'
        };
      }

      // Step 4: Check if bidder is already refused
      const existingRefusal = await RefusedBidder.findOne({
        where: {
          product_id: productId,
          bidder_id: bidderId
        },
        transaction
      });

      if (existingRefusal) {
        await transaction.rollback();
        return {
          success: false,
          message: 'This bidder is already refused for this product'
        };
      }

      // Step 5: Insert into RefusedBidders table
      await RefusedBidder.create({
        product_id: productId,
        bidder_id: bidderId,
        refused_at: new Date()
      }, { transaction });

      // Step 6: Invalidate all bids from this bidder for this product
      await Bid.update(
        { status: 0 },
        {
          where: {
            product_id: productId,
            bidder_id: bidderId,
            status: 1
          },
          transaction
        }
      );

      // Step 7: Get all valid bids (status = 1) ordered by amount DESC
      const validBids = await Bid.findAll({
        where: {
          product_id: productId,
          status: 1
        },
        order: [['amount', 'DESC']],
        transaction
      });

      // Step 8: Recalculate auction state
      let newWinnerId = null;
      let newCurrentPrice = product.start_value;
      let requiresRecalculation = false;

      // Check if refused bidder was the current winner
      if (product.winner_id === bidderId) {
        requiresRecalculation = true;

        if (validBids.length === 0) {
          // No valid bids left, reset to start price
          newWinnerId = null;
          newCurrentPrice = product.start_value;
        } else if (validBids.length === 1) {
          // Only one valid bid left (User B becomes winner)
          newWinnerId = validBids[0].bidder_id;
          newCurrentPrice = product.start_value; // Price = start price
        } else {
          // Multiple valid bids (User B = highest, User C = second highest)
          const userB = validBids[0]; // New highest bidder
          const userC = validBids[1]; // Second highest bidder

          newWinnerId = userB.bidder_id;
          
          // Calculate new_current_price = User C's bid + step price
          // But cannot exceed User B's max bid
          const calculatedPrice = parseFloat(userC.amount) + parseFloat(product.price_step);
          newCurrentPrice = Math.min(calculatedPrice, parseFloat(userB.amount));
        }
      } else {
        // Check if refused bidder was second highest (affects current price)
        if (validBids.length >= 2) {
          const currentHighest = validBids[0];
          
          // Check if refused bidder's bid was affecting the current price
          const refusedBidderHighestBid = await Bid.findOne({
            where: {
              product_id: productId,
              bidder_id: bidderId,
              status: 0 // Just invalidated
            },
            order: [['amount', 'DESC']],
            transaction
          });

          if (refusedBidderHighestBid) {
            const refusedBidAmount = parseFloat(refusedBidderHighestBid.amount);
            
            // Check if this bid was second highest before invalidation
            // We need to recalculate if refused bidder was pushing up the price
            if (validBids.length === 1) {
              // Only current winner left
              requiresRecalculation = true;
              newWinnerId = currentHighest.bidder_id;
              newCurrentPrice = product.start_value;
            } else {
              // Check if current price needs adjustment
              const newSecondHighest = validBids[1];
              const calculatedPrice = parseFloat(newSecondHighest.amount) + parseFloat(product.price_step);
              const maxPrice = parseFloat(currentHighest.amount);
              
              newCurrentPrice = Math.min(calculatedPrice, maxPrice);
              newWinnerId = currentHighest.bidder_id;
              requiresRecalculation = true;
            }
          }
        }
      }

      // Step 9: Update Product table
      if (requiresRecalculation) {
        await product.update({
          winner_id: newWinnerId,
          current_price: newCurrentPrice
        }, { transaction });
      }

      // Commit transaction
      await transaction.commit();

      // Get updated bid count
      const bidCount = await Bid.count({
        where: {
          product_id: productId,
          status: 1
        }
      });

      return {
        success: true,
        message: 'Bidder refused successfully',
        data: {
          product_id: productId,
          refused_bidder_id: bidderId,
          new_winner_id: newWinnerId,
          new_current_price: newCurrentPrice,
          recalculated: requiresRecalculation,
          remaining_bids: bidCount
        }
      };

    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }

  /**
   * Get list of refused bidders for a product
   * @param {number} productId - ID of the product
   * @returns {Promise<Array>} - List of refused bidders
   */
  async getRefusedBidders(productId) {
    try {
      const refusedBidders = await RefusedBidder.findAll({
        where: { product_id: productId },
        include: [{
          model: User,
          as: 'bidder',
          attributes: ['user_id', 'full_name', 'email']
        }],
        order: [['refused_at', 'DESC']]
      });

      return refusedBidders;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a bidder is refused for a product
   * @param {number} productId - ID of the product
   * @param {number} bidderId - ID of the bidder
   * @returns {Promise<boolean>} - True if refused, false otherwise
   */
  async isRefused(productId, bidderId) {
    try {
      const refusal = await RefusedBidder.findOne({
        where: {
          product_id: productId,
          bidder_id: bidderId
        }
      });

      return refusal !== null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new RefuseBidderService();
