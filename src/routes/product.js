const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const refuseBidderController = require('../controllers/refuseBidderController');
const { 
  validateSearchProducts, 
  validateGetProducts, 
  validateGetProductById,
  validateCreateProduct,
  validateAppendDescription
} = require('../middlewares/productValidator');
const { validateRefuseBidder, validateCheckRefused } = require('../middlewares/refuseBidderValidator');
const handleValidationErrors = require('../middlewares/validationHandler');
const { verifyAccessToken} = require('../middlewares/authMiddleware');
const { canCreateProduct} = require('../middlewares/sellerPermissionMiddleware');
const { handleMultipleUpload } = require('../config/multer');

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
  canCreateProduct,
  handleMultipleUpload,
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

// GET /api/products/related - Get related products
router.get(
  '/related/:product_id',
  productController.getRelatedProducts
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

// POST /api/products/:product_id/refuse-bidder - Refuse/kick a bidder
router.post(
  '/:product_id/refuse-bidder',
  verifyAccessToken,
  validateRefuseBidder,
  handleValidationErrors,
  refuseBidderController.refuseBidder
);

// GET /api/products/:product_id/refused-bidders - Get list of refused bidders
router.get(
  '/:product_id/refused-bidders',
  verifyAccessToken,
  validateGetProductById,
  handleValidationErrors,
  refuseBidderController.getRefusedBidders
);

// GET /api/products/:product_id/is-refused/:bidder_id - Check if bidder is refused
router.get(
  '/:product_id/is-refused/:bidder_id',
  validateCheckRefused,
  handleValidationErrors,
  refuseBidderController.checkIfRefused
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
