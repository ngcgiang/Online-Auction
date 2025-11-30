const express = require('express');
const router = express.Router();
const { verifyAccessToken, checkRole } = require('../middlewares/authMiddleware');
const { validateCancelOrder, validateProcessPayment } = require('../middlewares/orderValidator');
const handleValidationErrors = require('../middlewares/validationHandler');
const { cancelOrder, processPayment } = require('../controllers/orderController');

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

module.exports = router;
