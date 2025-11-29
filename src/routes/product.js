const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { 
  validateSearchProducts, 
  validateGetProducts, 
  validateGetProductById,
  validateCreateProduct,
  validateAppendDescription
} = require('../middlewares/productValidator');
const handleValidationErrors = require('../middlewares/validationHandler');
const { verifyAccessToken} = require('../middlewares/authMiddleware');
const {
    checkPermission
} = require('../controllers/sellerController');


// GET /api/products/search - Advanced search with full-text and filters
router.get(
  '/search', 
  validateSearchProducts, 
  handleValidationErrors, 
  productController.searchProducts
);

// POST /api/products - Create new auction product
router.post(
  '/',
  verifyAccessToken,
  checkPermission,
  validateCreateProduct,
  handleValidationErrors,
  productController.createProduct
);

// GET /api/products - Get all products or filter by category with pagination
router.get(
  '/', 
  validateGetProducts, 
  handleValidationErrors, 
  productController.getProductsByCategory
);

router.get(
  '/top-value',
  productController.fetchTopValueProducts
);

router.get(
  '/top-least-time-left',
  productController.fetchTopLeastTimeLeftProducts
);

router.get(
  '/top-most-bidded',
  productController.fetchTopMostBiddedProducts
);

// POST /api/products/:product_id/updates - Append new description update
router.post(
  '/:product_id/updates',
  verifyAccessToken,
  validateAppendDescription,
  handleValidationErrors,
  productController.appendProductDescription
);

// GET /api/products/:product_id/details - Get detailed product information
router.get(
  '/:product_id/details',
  validateGetProductById,
  handleValidationErrors,
  productController.getProductDetails
);

// GET /api/products/:product_id - Get product by ID
router.get(
  '/:product_id', 
  validateGetProductById, 
  handleValidationErrors, 
  productController.getProductById
);



module.exports = router;
