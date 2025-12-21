const express = require('express');
const router = express.Router();
const { verifyAccessToken, checkRole } = require('../middlewares/authMiddleware');

const {
    requestUpgrade,
    checkPermission,
    getBidderList,
    getActiveProducts,
    getEndedProducts
} = require('../controllers/sellerController');

// User request to upgrade to Seller
router.post('/request-upgrade', verifyAccessToken, requestUpgrade);

// Check seller permission status (7-day validity)
router.get('/check-permission/:userId', verifyAccessToken, checkRole(['seller']), checkPermission);

// Get bidder list for a specific product
router.get('/products/:productId/bidders', verifyAccessToken, checkRole(['seller']), getBidderList);

// Get active products (seller dashboard)
router.get('/products', verifyAccessToken, checkRole(['seller']), getActiveProducts);

// Get ended products with winner info
router.get('/products/ended', verifyAccessToken, checkRole(['seller']), getEndedProducts);

module.exports = router;