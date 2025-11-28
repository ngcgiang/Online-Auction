const express = require('express');
const router = express.Router();
const { verifyAccessToken, checkRole } = require('../middlewares/authMiddleware');
const {
    getPendingRequests,
    approveUpgrade,
    rejectUpgrade,
    getAllSellers
} = require('../controllers/adminController');

// Get all pending upgrade requests
router.get('/pending-requests', verifyAccessToken, checkRole(['admin']), getPendingRequests);

// Approve user upgrade to Seller
router.post('/approve-upgrade', verifyAccessToken, checkRole(['admin']), approveUpgrade);

// Reject user upgrade request
router.post('/reject-upgrade', verifyAccessToken, checkRole(['admin']), rejectUpgrade);

// Get all sellers with permission status
router.get('/sellers', verifyAccessToken, checkRole(['admin']), getAllSellers);

module.exports = router;