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

module.exports = {
  validateCancelOrder
};
