const express = require('express');
const router = express.Router();
const { verifyAccessToken, checkRole } = require('../middlewares/authMiddleware');

const {
    requestUpgrade,
    checkPermission
} = require('../controllers/sellerController');

// User request to upgrade to Seller
router.post('/request-upgrade', verifyAccessToken, requestUpgrade);

// Check seller permission status (7-day validity)
router.get('/check-permission/:userId', verifyAccessToken, checkRole(['seller']), checkPermission);

module.exports = router;