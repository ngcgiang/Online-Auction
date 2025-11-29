const { param, body } = require('express-validator');

/**
 * Validation rules for refusing a bidder
 */
const validateRefuseBidder = [
  // Product ID validation
  param('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
    .toInt(),

  // Bidder ID validation
  body('bidder_id')
    .notEmpty()
    .withMessage('Bidder ID is required')
    .isInt({ min: 1 })
    .withMessage('Bidder ID must be a positive integer')
    .toInt()
];

/**
 * Validation rules for checking refused status
 */
const validateCheckRefused = [
  param('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
    .toInt(),

  param('bidder_id')
    .isInt({ min: 1 })
    .withMessage('Bidder ID must be a positive integer')
    .toInt()
];

module.exports = {
  validateRefuseBidder,
  validateCheckRefused
};
