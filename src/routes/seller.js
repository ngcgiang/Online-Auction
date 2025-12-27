const express = require('express');
const router = express.Router();
const { verifyAccessToken, checkRole } = require('../middlewares/authMiddleware');

const {
    requestUpgrade,
    checkPermission,
    getBidderList,
    getActiveProducts,
    getEndedProducts,
    getRefusedBidders,
    getTotalExpiredProducts,
    getTotalIncome,
    getTotalSoldProducts,
} = require('../controllers/sellerController');

// User request to upgrade to Seller
router.post('/request-upgrade', verifyAccessToken, requestUpgrade);

// Check seller permission status (7-day validity)
router.get('/check-permission/:userId', verifyAccessToken, checkRole(['seller']), checkPermission);

router.get('/total-expired', verifyAccessToken, checkRole(['seller']), getTotalExpiredProducts);
router.get('/total-income', verifyAccessToken, checkRole(['seller']), getTotalIncome);
router.get('/total-sold', verifyAccessToken, checkRole(['seller']), getTotalSoldProducts);
// Get bidder list for a specific product
router.get('/products/:productId/bidders', verifyAccessToken, checkRole(['seller']), getBidderList);

// Get active products (seller dashboard)
router.get('/products', verifyAccessToken, checkRole(['seller']), getActiveProducts);

// Get ended products with winner info
router.get('/products/ended', verifyAccessToken, checkRole(['seller']), getEndedProducts);

// Get refused bidders for a specific product
router.get('/products/:productId/refused-bidders', getRefusedBidders);

    
module.exports = router;