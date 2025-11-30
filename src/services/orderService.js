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

/**
 * Process winner payment for an auction product
 * Validates winner identity, payment amount, and processes checkout
 * 
 * @param {number} userId - Current user ID from JWT token
 * @param {Object} paymentData - Payment details
 * @param {number} paymentData.productId - Product ID
 * @param {number} paymentData.totalAmount - Payment amount
 * @param {string} paymentData.paymentMethod - Payment method (MOMO, ZALOPAY, etc.)
 * @param {string} paymentData.shippingAddress - Delivery address
 * @param {string} paymentData.imgEvidence - Payment proof URL
 * @returns {Promise<Object>} Success message and order details
 * @throws {Error} Validation or business logic errors
 */
async function processWinnerPayment(userId, paymentData) {
  // Start database transaction for ACID compliance
  const t = await sequelize.transaction();
  
  try {
    const { productId, totalAmount, paymentMethod, shippingAddress, imgEvidence } = paymentData;
    
    // Step 1: Fetch product with winner information
    const product = await Product.findByPk(productId, {
      transaction: t
    });
    
    if (!product) {
      await t.rollback();
      const error = new Error('Sản phẩm không tồn tại');
      error.statusCode = 404;
      throw error;
    }
    
    // Step 2: Winner Authorization Check
    if (!product.winner_id) {
      await t.rollback();
      const error = new Error('Sản phẩm này chưa có người thắng cuộc');
      error.statusCode = 400;
      throw error;
    }
    
    if (product.winner_id !== userId) {
      await t.rollback();
      const error = new Error('Chỉ người thắng cuộc mới có thể thanh toán');
      error.statusCode = 403;
      throw error;
    }
    
    // Step 3: Validate auction has ended
    const now = new Date();
    if (new Date(product.end_time) >= now) {
      await t.rollback();
      const error = new Error('Không thể thanh toán khi đấu giá chưa kết thúc');
      error.statusCode = 400;
      throw error;
    }
    
    // Step 4: Amount Integrity Check
    const currentPrice = parseFloat(product.current_price);
    const paymentAmount = parseFloat(totalAmount);
    
    if (paymentAmount !== currentPrice) {
      await t.rollback();
      const error = new Error(`Số tiền thanh toán không hợp lệ. Bạn phải thanh toán đúng ${currentPrice} VND`);
      error.statusCode = 400;
      throw error;
    }
    
    // Step 5: Required Fields Validation
    if (!paymentMethod || !shippingAddress || !imgEvidence) {
      await t.rollback();
      const error = new Error('Thiếu thông tin bắt buộc: paymentMethod, shippingAddress, hoặc imgEvidence');
      error.statusCode = 400;
      throw error;
    }
    
    // Step 6: Check for existing order
    const existingOrder = await Order.findOne({
      where: { product_id: productId },
      transaction: t
    });
    
    let order;
    
    if (!existingOrder) {
      // Scenario A: First time payment - Create new order
      order = await Order.create({
        product_id: productId,
        winner_id: userId,
        seller_id: product.seller_id,
        total_amount: totalAmount,
        img_evidence: imgEvidence,
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
        order_status: 'paid',
        delivery_status: 'pending'
      }, { transaction: t });
      
    } else {
      // Scenario B: Order already exists - Check status
      if (existingOrder.order_status === 'paid') {
        await t.rollback();
        const error = new Error('Đơn hàng này đã được thanh toán trước đó');
        error.statusCode = 400;
        throw error;
      }
      
      // Scenario D: Order was cancelled
      if (existingOrder.order_status === 'cancelled') {
        await t.rollback();
        const error = new Error('Người bán đã hủy giao dịch này. Không thể thanh toán.');
        error.statusCode = 400;
        throw error;
      }
      
      // Update existing unpaid order to paid
      await existingOrder.update({
        total_amount: totalAmount,
        img_evidence: imgEvidence,
        payment_method: paymentMethod,
        shipping_address: shippingAddress,
        order_status: 'paid',
        delivery_status: 'pending'
      }, { transaction: t });
      
      order = existingOrder;
    }
    
    // Commit transaction
    await t.commit();
    
    return {
      success: true,
      message: 'Thanh toán thành công. Đơn hàng đang chờ giao hàng',
      order: {
        order_id: order.order_id,
        product_id: order.product_id,
        winner_id: order.winner_id,
        seller_id: order.seller_id,
        total_amount: order.total_amount,
        payment_method: order.payment_method,
        shipping_address: order.shipping_address,
        img_evidence: order.img_evidence,
        order_status: order.order_status,
        delivery_status: order.delivery_status,
        created_at: order.created_at
      }
    };
    
  } catch (error) {
    // Rollback on any error
    await t.rollback();
    throw error;
  }
}

module.exports = {
  cancelTransaction,
  processWinnerPayment
};
