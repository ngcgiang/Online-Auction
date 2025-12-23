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
    // Rollback on any error (check if transaction is still active)
    if (t && !t.finished) {
      await t.rollback();
    }
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
 * @returns {Promise<Object>} Success message and order details
 * @throws {Error} Validation or business logic errors
 */
async function processWinnerPayment(userId, paymentData) {
  // Start database transaction for ACID compliance
  const t = await sequelize.transaction();
  
  try {
    const { productId, totalAmount, paymentMethod, shippingAddress } = paymentData;
    
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
    if (!paymentMethod || !shippingAddress) {
      await t.rollback();
      const error = new Error('Thiếu thông tin bắt buộc: paymentMethod hoặc shippingAddress');
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
        const error = new Error('Người bán đã hủy giao dịch này. Không thể thanh toán');
        error.statusCode = 400;
        throw error;
      }
      
      // Update existing unpaid order to paid
      await existingOrder.update({
        total_amount: totalAmount,
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
        order_status: order.order_status,
        delivery_status: order.delivery_status,
        created_at: order.created_at
      }
    };
    
  } catch (error) {
    // Rollback on any error (check if transaction is still active)
    if (t && !t.finished) {
      await t.rollback();
    }
    throw error;
  }
}

/**
 * Mark order as shipped by seller
 * Validates seller ownership, payment status, and prevents duplicate shipping
 * 
 * @param {number} sellerId - Current user ID (seller) from JWT token
 * @param {number} productId - Product ID to mark as shipped
 * @returns {Promise<Object>} Success message and order details
 * @throws {Error} Validation or business logic errors
 */
async function markAsShipped(sellerId, productId) {
  // Start database transaction for ACID compliance
  const t = await sequelize.transaction();
  
  try {
    // Step 1: Fetch order with product information
    const order = await Order.findOne({
      where: { product_id: productId },
      include: [
        {
          model: require('../models').Product,
          as: 'product',
          attributes: ['product_id', 'product_name', 'seller_id']
        }
      ],
      transaction: t
    });
    
    if (!order) {
      await t.rollback();
      const error = new Error('Không tìm thấy đơn hàng');
      error.statusCode = 404;
      throw error;
    }
    
    // Step 2: Validate seller ownership
    if (order.seller_id !== sellerId) {
      await t.rollback();
      const error = new Error('Bạn không có quyền cập nhật đơn hàng này');
      error.statusCode = 403;
      throw error;
    }
    
    // Step 3: Validate payment status
    if (order.order_status !== 'paid') {
      await t.rollback();
      const error = new Error('Chỉ có thể vận chuyển đơn hàng đã thanh toán');
      error.statusCode = 400;
      throw error;
    }
    
    // Step 4: Validate current delivery status
    if (order.delivery_status === 'cancelled') {
      await t.rollback();
      const error = new Error('Không thể vận chuyển đơn hàng đã hủy');
      error.statusCode = 400;
      throw error;
    }
    
    if (order.delivery_status === 'shipped') {
      await t.rollback();
      const error = new Error('Đơn hàng đã được vận chuyển trước đó');
      error.statusCode = 400;
      throw error;
    }
    
    if (order.delivery_status === 'delivered') {
      await t.rollback();
      const error = new Error('Đơn hàng đã được giao. Không thể cập nhật lại');
      error.statusCode = 400;
      throw error;
    }
    
    // Step 5: Update delivery status to shipped
    await order.update({
      delivery_status: 'shipped'
    }, { transaction: t });
    
    // Commit transaction
    await t.commit();
    
    return {
      success: true,
      message: 'Đã cập nhật trạng thái vận chuyển',
      order: {
        order_id: order.order_id,
        product_id: order.product_id,
        winner_id: order.winner_id,
        seller_id: order.seller_id,
        total_amount: order.total_amount,
        order_status: order.order_status,
        delivery_status: order.delivery_status,
        shipping_address: order.shipping_address
      }
    };
    
  } catch (error) {
    // Rollback on any error (check if transaction is still active)
    if (t && !t.finished) {
      await t.rollback();
    }
    throw error;
  }
}

/**
 * Get order status by product ID
 * 
 * @param {number} productId - Product ID to get order status for
 */
async function getOrderStatus(productId) {
  const order = await Order.findOne({
    where: { product_id: productId }
  });
  return order;
}

/**
 * Mark order as delivered by winner
 * Validates winner identity, shipped status, and prevents duplicate confirmation
 * 
 * @param {number} winnerId - Current user ID (winner) from JWT token
 * @param {number} productId - Product ID to mark as delivered
 * @returns {Promise<Object>} Success message and order details
 * @throws {Error} Validation or business logic errors
 */
async function markAsDelivered(winnerId, productId) {
  // Start database transaction for ACID compliance
  const t = await sequelize.transaction();
  
  try {
    // Step 1: Fetch order with product information
    const order = await Order.findOne({
      where: { product_id: productId },
      include: [
        {
          model: require('../models').Product,
          as: 'product',
          attributes: ['product_id', 'product_name', 'winner_id']
        }
      ],
      transaction: t
    });
    
    if (!order) {
      await t.rollback();
      const error = new Error('Không tìm thấy đơn hàng');
      error.statusCode = 404;
      throw error;
    }
    
    // Step 2: Validate winner identity
    if (order.winner_id !== winnerId) {
      await t.rollback();
      const error = new Error('Chỉ người thắng cuộc mới có thể xác nhận nhận hàng');
      error.statusCode = 403;
      throw error;
    }
    
    // Step 3: Validate payment status
    if (order.order_status !== 'paid') {
      await t.rollback();
      const error = new Error('Đơn hàng chưa được thanh toán');
      error.statusCode = 400;
      throw error;
    }
    
    // Step 4: Validate current delivery status
    if (order.delivery_status === 'cancelled') {
      await t.rollback();
      const error = new Error('Không thể xác nhận nhận hàng cho đơn đã hủy');
      error.statusCode = 400;
      throw error;
    }
    
    if (order.delivery_status === 'pending') {
      await t.rollback();
      const error = new Error('Người bán chưa vận chuyển đơn hàng này');
      error.statusCode = 400;
      throw error;
    }
    
    if (order.delivery_status === 'delivered') {
      await t.rollback();
      const error = new Error('Đã xác nhận nhận hàng trước đó');
      error.statusCode = 400;
      throw error;
    }
    
    // Step 5: Update delivery status to delivered
    await order.update({
      delivery_status: 'delivered'
    }, { transaction: t });
    
    // Commit transaction
    await t.commit();
    
    return {
      success: true,
      message: 'Đã xác nhận nhận hàng thành công',
      order: {
        order_id: order.order_id,
        product_id: order.product_id,
        winner_id: order.winner_id,
        seller_id: order.seller_id,
        total_amount: order.total_amount,
        order_status: order.order_status,
        delivery_status: order.delivery_status,
        shipping_address: order.shipping_address
      }
    };
    
  } catch (error) {
    // Rollback on any error (check if transaction is still active)
    if (t && !t.finished) {
      await t.rollback();
    }
    throw error;
  }
}

module.exports = {
  cancelTransaction,
  processWinnerPayment,
  markAsShipped,
  markAsDelivered,
  getOrderStatus
};
