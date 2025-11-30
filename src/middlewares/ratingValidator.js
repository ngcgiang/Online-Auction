const { body } = require('express-validator');

/**
 * Validation rules for rating a winner
 */
const validateRateUser = [
  // User ID validation (target user)
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
    .toInt(),

  // Product ID validation
  body('productId')
    .notEmpty()
    .withMessage('Product ID is required')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
    .toInt(),

  // Rating point validation
  body('ratingPoint')
    .notEmpty()
    .withMessage('Rating point is required')
    .isInt()
    .withMessage('Rating point must be an integer')
    .custom((value) => {
      if (value !== 1 && value !== -1) {
        throw new Error('Rating point must be either +1 or -1');
      }
      return true;
    })
    .toInt(),

  // Content validation (optional)
  body('content')
    .optional()
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ max: 255 })
    .withMessage('Content must not exceed 255 characters')
];

module.exports = {
  validateRateUser
};
