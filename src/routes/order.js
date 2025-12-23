const express = require('express');
const router = express.Router();
const { verifyAccessToken, checkRole } = require('../middlewares/authMiddleware');
const { 
  validateCancelOrder, 
  validateProcessPayment,
  validateUpdateDeliveryStatus 
} = require('../middlewares/orderValidator');
const handleValidationErrors = require('../middlewares/validationHandler');
const { 
  cancelOrder, 
  processPayment,
  markOrderShipped,
  markOrderDelivered,
  getOrderStatus
} = require('../controllers/orderController');

/**
 * POST /api/seller/orders/cancel
 * Cancel transaction when winner fails to pay
 * Requires: Seller role, JWT authentication, valid product_id
 */
router.post(
  '/cancel',
  verifyAccessToken,
  checkRole(['seller']),
  validateCancelOrder,
  handleValidationErrors,
  cancelOrder
);

/**
 * POST /api/orders/paid
 * Process winner payment for auction product
 * Requires: Winner authorization, JWT authentication, valid payment data
 */
router.post(
  '/paid',
  verifyAccessToken,
  validateProcessPayment,
  handleValidationErrors,
  processPayment
);

/**
 * PUT /api/seller/orders/shipped
 * Mark order as shipped by seller
 * Requires: Seller role, JWT authentication, valid product_id
 */
router.put(
  '/shipped',
  verifyAccessToken,
  checkRole(['seller']),
  validateUpdateDeliveryStatus,
  handleValidationErrors,
  markOrderShipped
);

/**
 * PUT /api/orders/delivered
 * Mark order as delivered by winner
 * Requires: Winner authorization, JWT authentication, valid product_id
 */
router.put(
  '/delivered',
  verifyAccessToken,
  validateUpdateDeliveryStatus,
  handleValidationErrors,
  markOrderDelivered
);

/**
 * Get order status for a product
 * GET /api/orders/status/:productId
 * Requires: JWT authentication
 */
router.get(
  '/status/:productId',
  verifyAccessToken,
  getOrderStatus
);

module.exports = router;
