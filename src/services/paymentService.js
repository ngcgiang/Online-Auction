const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = require('stripe')(stripeSecretKey);
const { Order, Product } = require('../models');

/**
 * Create Stripe PaymentIntent for order
 * @param {number} amount - Amount in VND
 * @param {number} orderId - Order ID for metadata
 * @param {number} productId - Product ID for metadata
 * @param {number} winnerId - Winner user ID
 * @param {string} description - Payment description
 * @returns {Promise<Object>} PaymentIntent object with clientSecret
 */
async function createPaymentIntent(amount, orderId, productId, winnerId, description) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // VND doesn't use decimal places
      currency: 'vnd',
      description: description || `Order payment for order #${orderId}`,
      metadata: {
        orderId: orderId,
        productId: productId,
        winnerId: winnerId,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return paymentIntent;
  } catch (error) {
    throw new Error(`Stripe payment intent creation failed: ${error.message}`);
  }
}

/**
 * Confirm payment status from Stripe
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} Payment status details
 */
async function confirmPaymentIntent(paymentIntentId) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Update Order status based on Stripe payment status
    if (paymentIntent.metadata.orderId) {
      const order = await Order.findByPk(paymentIntent.metadata.orderId);
      
      if (order) {
        if (paymentIntent.status === 'succeeded') {
          await order.update({
            order_status: 'paid',
            payment_method: paymentIntent.payment_method || 'card'
          });
        }
      }
    }

    return {
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
    };
  } catch (error) {
    throw new Error(`Failed to confirm payment: ${error.message}`);
  }
}

/**
 * Handle Stripe webhook events
 * @param {Object} event - Stripe webhook event
 */
async function handlePaymentWebhook(event) {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        if (paymentIntent.metadata.orderId) {
          const order = await Order.findByPk(paymentIntent.metadata.orderId);
          if (order) {
            await order.update({
              order_status: 'paid',
              payment_method: paymentIntent.payment_method || 'card'
            });
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedIntent = event.data.object;
        if (failedIntent.metadata.orderId) {
          const order = await Order.findByPk(failedIntent.metadata.orderId);
          if (order) {
            await order.update({
              order_status: 'unpaid'
            });
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    throw new Error(`Webhook handling failed: ${error.message}`);
  }
}

/**
 * Refund payment
 * @param {string} paymentIntentId - Stripe PaymentIntent ID
 * @returns {Promise<Object>} Refund details
 */
async function refundPayment(paymentIntentId) {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });

    // Update Order status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.metadata.orderId) {
      const order = await Order.findByPk(paymentIntent.metadata.orderId);
      if (order) {
        await order.update({
          order_status: 'cancelled'
        });
      }
    }

    return refund;
  } catch (error) {
    throw new Error(`Refund failed: ${error.message}`);
  }
}

module.exports = {
  createPaymentIntent,
  confirmPaymentIntent,
  handlePaymentWebhook,
  refundPayment,
};