const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyAccessToken, checkRole } = require('../middlewares/authMiddleware');

/**
 * Step 1: Create payment intent (creates Order + returns clientSecret)
 * POST /api/payments/create-payment-intent
 * Body: { productId: number, totalAmount: number, shippingAddress: string, description?: string }
 * Returns: clientSecret for Stripe payment form
 */
router.post(
  '/create-payment-intent',
  verifyAccessToken,
  paymentController.createPaymentIntent
);

/**
 * Step 2: Confirm payment (verify with Stripe + update Order status)
 * POST /api/payments/confirm-payment
 * Body: { paymentIntentId: string }
 * Returns: success/failure status
 */
router.post(
  '/confirm-payment',
  verifyAccessToken,
  paymentController.confirmPayment
);

/**
 * Check payment status
 * GET /api/payments/:paymentIntentId
 * Returns: current payment status from Stripe
 */
router.get(
  '/:paymentIntentId',
  verifyAccessToken,
  paymentController.getPaymentStatus
);

/**
 * Refund payment (seller only)
 * POST /api/payments/refund
 * Body: { paymentIntentId: string, orderId: number }
 * Returns: refund details
 */
router.post(
  '/refund',
  verifyAccessToken,
  checkRole(['seller']),
  paymentController.refundPaymentIntent
);

module.exports = router;
