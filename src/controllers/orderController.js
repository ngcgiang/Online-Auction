const { validationResult } = require('express-validator');
const orderService = require('../services/orderService');

/**
 * Cancel transaction when winner fails to pay
 * POST /api/seller/orders/cancel
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.user - User info from JWT (contains user_id)
 * @param {Object} req.body - Request body
 * @param {number} req.body.product_id - Product ID to cancel
 * @param {Object} res - Express response object
 */
async function cancelOrder(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }
    
    // Extract seller ID from JWT token
    const sellerId = req.user.user_id;
    
    // Extract product_id from request body
    const { product_id } = req.body;
    
    // Call service to cancel transaction
    const result = await orderService.cancelTransaction(sellerId, product_id);
    
    // Return success response
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Error in cancelOrder controller:', error);
    
    // Handle specific error types
    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi hủy giao dịch',
      error: error.message
    });
  }
}

/**
 * Process winner payment for auction product
 * POST /api/orders/paid
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.user - User info from JWT (contains user_id)
 * @param {Object} req.body - Payment details
 * @param {number} req.body.productId - Product ID
 * @param {number} req.body.totalAmount - Payment amount
 * @param {string} req.body.paymentMethod - Payment method
 * @param {string} req.body.shippingAddress - Delivery address
 * @param {Object} res - Express response object
 */
async function processPayment(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }
    
    // Extract user ID from JWT token
    const userId = req.user.user_id;
    
    // Extract payment data from request body
    const paymentData = {
      productId: req.body.productId,
      totalAmount: req.body.totalAmount,
      paymentMethod: req.body.paymentMethod,
      shippingAddress: req.body.shippingAddress,
    };
    
    // Call service to process payment
    const result = await orderService.processWinnerPayment(userId, paymentData);
    
    // Return success response
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Error in processPayment controller:', error);
    
    // Handle specific error types
    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý thanh toán',
      error: error.message
    });
  }
}

/**
 * Mark order as shipped by seller
 * PUT /api/seller/orders/shipped
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.user - User info from JWT (contains user_id)
 * @param {Object} req.body - Request body
 * @param {number} req.body.product_id - Product ID to mark as shipped
 * @param {Object} res - Express response object
 */
async function markOrderShipped(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }
    
    // Extract seller ID from JWT token
    const sellerId = req.user.user_id;
    
    // Extract product_id from request body
    const { product_id } = req.body;
    
    // Call service to mark as shipped
    const result = await orderService.markAsShipped(sellerId, product_id);
    
    // Return success response
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Error in markOrderShipped controller:', error);
    
    // Handle specific error types
    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật trạng thái vận chuyển',
      error: error.message
    });
  }
}

/**
 * Mark order as delivered by winner
 * PUT /api/orders/delivered
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.user - User info from JWT (contains user_id)
 * @param {Object} req.body - Request body
 * @param {number} req.body.product_id - Product ID to mark as delivered
 * @param {Object} res - Express response object
 */
async function markOrderDelivered(req, res) {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ',
        errors: errors.array()
      });
    }
    
    // Extract winner ID from JWT token
    const winnerId = req.user.user_id;
    
    // Extract product_id from request body
    const { product_id } = req.body;
    
    // Call service to mark as delivered
    const result = await orderService.markAsDelivered(winnerId, product_id);
    
    // Return success response
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Error in markOrderDelivered controller:', error);
    
    // Handle specific error types
    if (error.statusCode === 403) {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    // Generic server error
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xác nhận nhận hàng',
      error: error.message
    });
  }
}

module.exports = {
  cancelOrder,
  processPayment,
  markOrderShipped,
  markOrderDelivered
};
