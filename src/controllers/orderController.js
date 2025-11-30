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

module.exports = {
  cancelOrder
};
