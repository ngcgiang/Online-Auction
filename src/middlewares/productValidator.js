const { query, param } = require('express-validator');

// Validation for search products
const validateSearchProducts = [
  query('keyword')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Keyword must be between 1 and 255 characters'),
  
  query('category')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be between 1 and 100 characters'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100')
    .toInt(),
  
  query('sortBy')
    .optional()
    .isIn(['time', 'price'])
    .withMessage('Sort by must be either "time" or "price"'),
  
  query('newMinutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('New minutes must be between 1 and 1440')
    .toInt()
];

// Validation for get products by category
const validateGetProducts = [
  query('category')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category must be between 1 and 100 characters'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Page size must be between 1 and 100')
    .toInt(),
  
  query('status')
    .optional()
    .isIn(['active', 'sold', 'expired'])
    .withMessage('Status must be either "active", "sold", or "expired"')
];

// Validation for get product by ID
const validateGetProductById = [
  param('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
    .toInt()
];

module.exports = {
  validateSearchProducts,
  validateGetProducts,
  validateGetProductById
};
