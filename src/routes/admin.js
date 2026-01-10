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
    updateUserInfo,
    countUserByRole,
    countProductsByStatus,
    countAllBids,
    resetUserPassword
} = require('../controllers/adminController');

const { getAuctionConfig, createSystemConfig, updateSystemConfig } = require('../utils/configHelper');
const {passwordValidator} = require("../middlewares/userValidator");

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
router.patch('/update-user-info/',verifyAccessToken,checkRole(['admin']),updateInfoValidator,updateUserInfo);
router.patch('/reset-user-password/',verifyAccessToken,checkRole(['admin']),passwordValidator,resetUserPassword);

// Count users by role
router.get('/count-user-by-role', verifyAccessToken, checkRole(['admin']), countUserByRole);

// Count products by status
router.get('/count-products-by-status', verifyAccessToken, checkRole(['admin']), countProductsByStatus);

// Count all bids
router.get('/count-all-bids', verifyAccessToken, checkRole(['admin']), countAllBids);

// Config
router.get('/config', verifyAccessToken, checkRole(['admin']), async (req, res, next) => {
    try {
        // Giả sử bạn có một hàm để lấy cấu hình hệ thống
        const config = await getAuctionConfig(); // Cần implement hàm này trong utils hoặc services
        res.json(config);
    } catch (error) {
        next(error);
    }
});

router.post('/config', verifyAccessToken, checkRole(['admin']), async (req, res, next) => {
    try {
        const newConfig = req.body;
        // Giả sử bạn có một hàm để tạo cấu hình hệ thống
        const createdConfig = await createSystemConfig(newConfig);
        res.json(createdConfig);
    }
    catch (error) {
        next(error);
    }
});

router.patch('/config', verifyAccessToken, checkRole(['admin']), async (req, res, next) => {
    try {
        const newConfig = req.body;
        // Giả sử bạn có một hàm để cập nhật cấu hình hệ thống
        const updatedConfig = await updateSystemConfig(newConfig);
        res.json(updatedConfig);
    } catch (error) {
        next(error);
    }
});

module.exports = router;