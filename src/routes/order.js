const express = require('express');
const router = express.Router();
const { verifyAccessToken, checkRole } = require('../middlewares/authMiddleware');
const { validateCancelOrder } = require('../middlewares/orderValidator');
const handleValidationErrors = require('../middlewares/validationHandler');
const { cancelOrder } = require('../controllers/orderController');

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

module.exports = router;
