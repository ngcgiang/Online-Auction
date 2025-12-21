const express = require('express');
const {updateInfoValidator} = require('../middlewares/userValidator');
const router = express.Router();
const { verifyAccessToken, checkRole } = require('../middlewares/authMiddleware');
const {
    getPendingRequests,
    approveUpgrade,
    rejectUpgrade,
    getAllSellers,
    createNewCategory,
    deleteCategory,
    deleteUser,
    getAllUsers,
    deleteProduct,
    getTotalIncome,
    getNewUsers,
    getMonthlyIncome,
    getTotalOrders,
    updateUserInfo
} = require('../controllers/adminController');

// Get all pending upgrade requests
router.get('/pending-requests', verifyAccessToken, checkRole(['admin']), getPendingRequests);

// Approve user upgrade to Seller
router.post('/approve-upgrade', verifyAccessToken, checkRole(['admin']), approveUpgrade);

// Reject user upgrade request
router.post('/reject-upgrade', verifyAccessToken, checkRole(['admin']), rejectUpgrade);

// Get all sellers with permission status
router.get('/sellers', verifyAccessToken, checkRole(['admin']), getAllSellers);

router.post('/new-category',verifyAccessToken,checkRole(['admin']),createNewCategory);
router.delete('/delete-category/:category_id',verifyAccessToken,checkRole(['admin']),deleteCategory);
router.delete('/delete-user/:id',verifyAccessToken,checkRole(['admin']),deleteUser);
router.get('/get-all-users',verifyAccessToken,checkRole(['admin']),getAllUsers);
router.delete('/delete-product/:id',verifyAccessToken,checkRole(['admin']),deleteProduct);

router.get('/total-income',verifyAccessToken,checkRole(['admin']),getTotalIncome);
router.get('/new-users',verifyAccessToken,checkRole(['admin']),getNewUsers);
router.get('/total-orders',verifyAccessToken,checkRole(['admin']),getTotalOrders);
router.get('/monthly-income',verifyAccessToken,checkRole(['admin']),getMonthlyIncome);
router.patch('/update-user-info/:id',verifyAccessToken,checkRole(['admin']),updateInfoValidator,updateUserInfo);

module.exports = router;