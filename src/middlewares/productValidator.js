const { query, param, body } = require('express-validator');

/**
 * Validation rules for creating a new product
 */
const validateCreateProduct = [
  // Product name validation
  body('product_name')
    .notEmpty()
    .withMessage('Product name is required')
    .isString()
    .withMessage('Product name must be a string')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Product name must be between 3 and 255 characters'),

  // Category ID validation (optional)
  body('category_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Category ID must be a positive integer'),

  // Images validation is handled by Multer middleware
  // This validator ensures the field validation exists for documentation
  // Actual file validation is done in multer config

  // Start price validation
  body('start_price')
    .notEmpty()
    .withMessage('Start price is required')
    .isFloat({ min: 1 })
    .withMessage('Start price must be a positive number greater than 0')
    .custom((value) => {
      // Ensure it's an integer
      if (!Number.isInteger(Number(value))) {
        throw new Error('Start price must be a whole number');
      }
      return true;
    }),

  // Step price validation
  body('step_price')
    .notEmpty()
    .withMessage('Step price is required')
    .isFloat({ min: 1 })
    .withMessage('Step price must be a positive number greater than 0')
    .custom((value) => {
      // Ensure it's an integer
      if (!Number.isInteger(Number(value))) {
        throw new Error('Step price must be a whole number');
      }
      return true;
    }),

  // Buy now price validation (optional)
  body('buy_now_price')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Buy now price must be a positive number')
    .custom((value, { req }) => {
      if (value && Number(value) <= Number(req.body.start_price)) {
        throw new Error('Buy now price must be greater than start price');
      }
      return true;
    }),

  // End time validation
  body('end_time')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid date')
    .custom((value) => {
      const endTime = new Date(value);
      const currentTime = new Date();
      
      if (endTime <= currentTime) {
        throw new Error('End time must be in the future');
      }
      
      // Optional: Add minimum duration check (e.g., at least 1 hour)
      const minDuration = 60 * 60 * 1000; // 1 hour in milliseconds
      if (endTime.getTime() - currentTime.getTime() < minDuration) {
        throw new Error('Auction must run for at least 1 hour');
      }
      
      return true;
    }),

  // Description validation (HTML content)
  body('description')
    .notEmpty()
    .withMessage('Description is required')
    .isString()
    .withMessage('Description must be a string')
    .isLength({ min: 10 })
    .withMessage('Description must be at least 10 characters long'),

  // Auto renewal validation (optional, boolean)
  body('auto_renewal')
    .optional()
    .isBoolean()
    .withMessage('Auto renewal must be a boolean value'),

  // Allow new users validation (optional, boolean)
  body('allow_new_users')
    .optional()
    .isBoolean()
    .withMessage('Allow new users must be a boolean value')
];

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

/**
 * Validation rules for appending product description
 */
const validateAppendDescription = [
  // Product ID validation
  param('product_id')
    .isInt({ min: 1 })
    .withMessage('Product ID must be a positive integer')
    .toInt(),

  // Content validation
  body('content')
    .notEmpty()
    .withMessage('Content is required')
    .isString()
    .withMessage('Content must be a string')
    .trim()
    .isLength({ min: 10 })
    .withMessage('Content must be at least 10 characters long')
];

module.exports = {
  validateSearchProducts,
  validateGetProducts,
  validateGetProductById,
  validateCreateProduct,
  validateAppendDescription
};
