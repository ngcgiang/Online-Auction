const { body, param } = require('express-validator');

/**
 * Validation rules for placing a bid
 */
const validatePlaceBid = [
  body('productId')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
  
  body('amount')
    .notEmpty().withMessage('Bid amount is required')
    .isFloat({ min: 0.01 }).withMessage('Bid amount must be a positive number')
    .custom((value) => {
      // Check if amount has at most 2 decimal places
      const decimalPart = value.toString().split('.')[1];
      if (decimalPart && decimalPart.length > 2) {
        throw new Error('Bid amount can have at most 2 decimal places');
      }
      return true;
    })
];

/**
 * Validation rules for getting bid history
 */
const validateGetBidHistory = [
  param('productId')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
];

/**
 * Validation rules for getting user's bid
 */
const validateGetUserBid = [
  param('productId')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
  
  param('userId')
    .notEmpty().withMessage('User ID is required')
    .isInt({ min: 1 }).withMessage('User ID must be a positive integer')
];

/**
 * Validation rules for checking bid availability
 */
const validateCheckBidAvailability = [
  param('productId')
    .notEmpty().withMessage('Product ID is required')
    .isInt({ min: 1 }).withMessage('Product ID must be a positive integer')
];

module.exports = {
  validatePlaceBid,
  validateGetBidHistory,
  validateGetUserBid,
  validateCheckBidAvailability
};
