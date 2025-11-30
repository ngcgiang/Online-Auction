const { Product, Order, Rating, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Cancel transaction when winner fails to pay
 * Validates ownership, auction status, winner existence, prevents cancelling paid orders
 * Creates/updates Order record and automatically rates winner negatively
 * 
 * @param {number} sellerId - Current user ID (seller) from JWT token
 * @param {number} productId - Product ID to cancel transaction for
 * @returns {Promise<Object>} Success message and order details
 * @throws {Error} Validation or business logic errors
 */
async function cancelTransaction(sellerId, productId) {
  // Start database transaction for ACID compliance
  const t = await sequelize.transaction();
  
  try {
    // Step 1: Fetch product with all necessary validations
    const product = await Product.findByPk(productId, {
      transaction: t
    });
    
    if (!product) {
      await t.rollback();
      const error = new Error('Sản phẩm không tồn tại');
      error.statusCode = 404;
      throw error;
    }
    
    // Step 2: Validate ownership
    if (product.seller_id !== sellerId) {
      await t.rollback();
      const error = new Error('Bạn không có quyền hủy giao dịch này');
      error.statusCode = 403;
      throw error;
    }
    
    // Step 3: Validate auction has ended
    const now = new Date();
    if (new Date(product.end_time) >= now) {
      await t.rollback();
      const error = new Error('Không thể hủy giao dịch khi đấu giá chưa kết thúc');
      error.statusCode = 400;
      throw error;
    }
    
    // Step 4: Validate winner exists
    if (!product.winner_id) {
      await t.rollback();
      const error = new Error('Sản phẩm không có người thắng cuộc');
      error.statusCode = 400;
      throw error;
    }
    
    // Step 5: Check for existing order (CRITICAL: Race condition prevention)
    const existingOrder = await Order.findOne({
      where: { product_id: productId },
      transaction: t
    });
    
    // CRITICAL: Prevent cancelling paid orders
    if (existingOrder && existingOrder.order_status === 'paid') {
      await t.rollback();
      const error = new Error('Không thể hủy giao dịch đã thanh toán');
      error.statusCode = 400;
      throw error;
    }
    
    // Step 6: Check if already cancelled (prevent duplicate cancellation)
    if (existingOrder && existingOrder.order_status === 'cancelled') {
      await t.rollback();
      const error = new Error('Giao dịch đã được hủy trước đó');
      error.statusCode = 400;
      throw error;
    }
    
    // Step 7: Check if seller already rated this winner (prevent duplicate rating)
    const existingRating = await Rating.findOne({
      where: {
        product_id: productId,
        reviewer_id: sellerId,
        user_id: product.winner_id
      },
      transaction: t
    });
    
    if (existingRating) {
      await t.rollback();
      const error = new Error('Bạn đã đánh giá người thắng cuộc này rồi');
      error.statusCode = 400;
      throw error;
    }
    
    // Step 8: Execute transaction cancellation
    let order;
    
    if (!existingOrder) {
      // Case 1: No order exists - create new cancelled order
      order = await Order.create({
        product_id: productId,
        winner_id: product.winner_id,
        seller_id: sellerId,
        total_amount: product.current_price,
        img_evidence: 'N/A',
        payment_method: 'N/A',
        shipping_address: null,
        order_status: 'cancelled',
        delivery_status: 'cancelled'
      }, { transaction: t });
    } else {
      // Case 2: Order exists but unpaid - update to cancelled
      await existingOrder.update({
        order_status: 'cancelled',
        delivery_status: 'cancelled'
      }, { transaction: t });
      
      order = existingOrder;
    }
    
    // Step 9: Auto-rate winner with negative score
    const rating = await Rating.create({
      user_id: product.winner_id,
      reviewer_id: sellerId,
      product_id: productId,
      rating_point: -1,
      content: 'Người thắng không thanh toán'
    }, { transaction: t });
    
    // Commit transaction
    await t.commit();
    
    return {
      success: true,
      message: 'Đã hủy giao dịch và phạt người thắng cuộc',
      order: {
        order_id: order.order_id,
        product_id: order.product_id,
        winner_id: order.winner_id,
        total_amount: order.total_amount,
        order_status: order.order_status,
        delivery_status: order.delivery_status
      },
      rating: {
        rating_id: rating.rating_id,
        user_id: rating.user_id,
        rating_point: rating.rating_point,
        content: rating.content
      }
    };
    
  } catch (error) {
    // Rollback on any error
    await t.rollback();
    throw error;
  }
}

module.exports = {
  cancelTransaction
};
