const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { 
  validateSearchProducts, 
  validateGetProducts, 
  validateGetProductById 
} = require('../middlewares/productValidator');
const handleValidationErrors = require('../middlewares/validationHandler');

// GET /api/products/search - Advanced search with full-text and filters
router.get(
  '/search', 
  validateSearchProducts, 
  handleValidationErrors, 
  productController.searchProducts
);

// GET /api/products - Get all products or filter by category with pagination
router.get(
  '/', 
  validateGetProducts, 
  handleValidationErrors, 
  productController.getProductsByCategory
);

// GET /api/products/:product_id - Get product by ID
router.get(
  '/:product_id', 
  validateGetProductById, 
  handleValidationErrors, 
  productController.getProductById
);

module.exports = router;
