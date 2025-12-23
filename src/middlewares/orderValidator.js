const { body } = require('express-validator');

/**
 * Validation rules for cancelling an order
 */
const validateCancelOrder = [
  body('product_id')
    .notEmpty()
    .withMessage('product_id là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('product_id phải là số nguyên dương')
];

/**
 * Validation rules for processing payment
 */
const validateProcessPayment = [
  body('productId')
    .notEmpty()
    .withMessage('productId là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('productId phải là số nguyên dương'),
  
  body('totalAmount')
    .notEmpty()
    .withMessage('totalAmount là bắt buộc')
    .isFloat({ min: 0.01 })
    .withMessage('totalAmount phải là số dương'),
  
  body('paymentMethod')
    .notEmpty()
    .withMessage('paymentMethod là bắt buộc')
    .isString()
    .withMessage('paymentMethod phải là chuỗi')
    .trim()
    .isLength({ min: 2 })
    .withMessage('paymentMethod phải có ít nhất 2 ký tự'),
  
  body('shippingAddress')
    .notEmpty()
    .withMessage('shippingAddress là bắt buộc')
    .isString()
    .withMessage('shippingAddress phải là chuỗi')
    .trim()
    .isLength({ min: 10 })
    .withMessage('shippingAddress phải có ít nhất 10 ký tự'),
];

/**
 * Validation rules for updating delivery status (shipped/delivered)
 */
const validateUpdateDeliveryStatus = [
  body('product_id')
    .notEmpty()
    .withMessage('product_id là bắt buộc')
    .isInt({ min: 1 })
    .withMessage('product_id phải là số nguyên dương')
];

module.exports = {
  validateCancelOrder,
  validateProcessPayment,
  validateUpdateDeliveryStatus
};
