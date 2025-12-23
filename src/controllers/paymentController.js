const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require("stripe")(stripeSecretKey);
const paymentService = require('../services/paymentService');
const { Order, Product } = require('../models');

/**
 * Create payment intent for order (Step 1 of payment process)
 * POST /api/payments/create-payment-intent
 * Creates Order record with 'unpaid' status and returns Stripe clientSecret
 */
const createPaymentIntent = async (req, res, next) => {
  try {
    const { productId, totalAmount, shippingAddress, description } = req.body;
    const winnerId = req.user.user_id;

    // Validate required fields
    if (!productId || !totalAmount || !shippingAddress) {
      return res.status(400).json({ 
        success: false, 
        error: "productId, totalAmount, and shippingAddress are required" 
      });
    }

    if (totalAmount <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Amount must be greater than 0" 
      });
    }

    // Fetch product to get seller_id and validate winner
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        error: "Product not found" 
      });
    }

    if (product.winner_id !== winnerId) {
      return res.status(403).json({ 
        success: false, 
        error: "You are not the winner of this auction" 
      });
    }

    if (parseFloat(product.current_price) !== parseFloat(totalAmount)) {
      return res.status(400).json({ 
        success: false, 
        error: "Amount does not match product price" 
      });
    }

    // Check if order already exists
    let order = await Order.findOne({
      where: { product_id: productId }
    });

    // Create or update Order in database
    if (!order) {
      order = await Order.create({
        product_id: productId,
        winner_id: winnerId,
        seller_id: product.seller_id,
        total_amount: totalAmount,
        shipping_address: shippingAddress,
        order_status: 'unpaid',
        delivery_status: 'pending'
      });
    } else if (order.order_status === 'unpaid') {
      // Update existing unpaid order
      await order.update({
        total_amount: totalAmount,
        shipping_address: shippingAddress
      });
    } else if (order.order_status === 'paid') {
      return res.status(400).json({ 
        success: false, 
        error: "Order already paid" 
      });
    }

    // Create Stripe PaymentIntent
    const paymentIntent = await paymentService.createPaymentIntent(
      totalAmount,
      order.order_id,
      productId,
      winnerId,
      description
    );

    // Return clientSecret for frontend
    res.json({
      success: true,
      message: "Payment intent created successfully",
      data: {
        orderId: order.order_id,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totalAmount,
        currency: 'vnd'
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Confirm payment (Step 2 of payment process)
 * POST /api/payments/confirm-payment
 * Verifies Stripe payment and updates Order status to 'paid'
 */
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body;
    const winnerId = req.user.user_id;

    if (!paymentIntentId) {
      return res.status(400).json({ 
        success: false, 
        error: "paymentIntentId is required" 
      });
    }

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Validate ownership (check if user matches metadata)
    if (parseInt(paymentIntent.metadata.winnerId) !== winnerId) {
      return res.status(403).json({ 
        success: false, 
        error: "This payment does not belong to you" 
      });
    }

    // Check payment status
    if (paymentIntent.status === "succeeded") {
      // Update Order status to 'paid'
      const order = await Order.findByPk(paymentIntent.metadata.orderId);
      if (order) {
        await order.update({
          order_status: 'paid',
          payment_method: 'stripe_card'
        });
      }

      return res.json({
        success: true,
        message: "Payment successful",
        data: {
          orderId: paymentIntent.metadata.orderId,
          status: "succeeded",
          amount: paymentIntent.amount,
          currency: paymentIntent.currency
        }
      });
    }

    // Payment not succeeded yet
    res.status(400).json({
      success: false,
      message: `Payment ${paymentIntent.status}`,
      data: {
        status: paymentIntent.status,
        paymentIntentId: paymentIntent.id
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Get payment status
 * GET /api/payments/:paymentIntentId
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    const { paymentIntentId } = req.params;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    res.json({
      success: true,
      data: {
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        created: paymentIntent.created,
        metadata: paymentIntent.metadata
      }
    });

  } catch (error) {
    next(error);
  }
};

/**
 * Refund payment
 * POST /api/payments/refund
 */
const refundPaymentIntent = async (req, res, next) => {
  try {
    const { paymentIntentId, orderId } = req.body;
    const sellerId = req.user.user_id;

    if (!paymentIntentId) {
      return res.status(400).json({ 
        success: false, 
        error: "paymentIntentId is required" 
      });
    }

    // Validate seller ownership
    const order = await Order.findByPk(orderId);
    if (!order || order.seller_id !== sellerId) {
      return res.status(403).json({ 
        success: false, 
        error: "Not authorized to refund this payment" 
      });
    }

    // Refund through Stripe
    const refund = await paymentService.refundPayment(paymentIntentId);

    res.json({
      success: true,
      message: "Payment refunded successfully",
      data: {
        refundId: refund.id,
        amount: refund.amount,
        status: refund.status
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPaymentIntent,
  confirmPayment,
  getPaymentStatus,
  refundPaymentIntent,
};