const express = require('express');
const router = express.Router();
const {
  getProductsByCategory,
  getAllProducts,
  getProductById
} = require('../controllers/productController');

// GET /api/products - Get all products or filter by category with pagination
router.get('/', getProductsByCategory);

// GET /api/products/:product_id - Get product by ID
router.get('/:product_id', getProductById);

module.exports = router;
