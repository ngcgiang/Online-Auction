const SellerService = require('../services/sellerService');

/**
 * User request to upgrade to Seller role
 */
const requestUpgrade = async (req, res) => {
    try {
        const userId = req.body.userId || req.user?.user_id;
        console.log(userId);
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const result = await SellerService.requestUpgradeToSeller(userId);

        return res.status(200).json({
            success: true,
            message: 'Upgrade request submitted successfully',
            data: result
        });

    } catch (error) {
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('already')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing upgrade request'
        });
    }
};

/**
 * Check seller permission status (7-day validity)
 */
const checkPermission = async (req, res) => {
    try {
        const userId = req.params.userId || req.user?.user_id;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        const result = await SellerService.checkSellerPermission(parseInt(userId));

        return res.status(200).json({
            success: true,
            message: 'Permission status retrieved successfully',
            data: result
        });

    } catch (error) {
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'User is not a seller') {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while checking permission'
        });
    }
};

module.exports = {
    requestUpgrade,
    checkPermission
};