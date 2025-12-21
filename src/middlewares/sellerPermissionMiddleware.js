const { User } = require('../models');

/**
 * Middleware to check if seller can create products
 * Validates that:
 * 1. User has 'seller' role
 * 2. upgrade_at is within 7 days (permission not expired)
 */
const canCreateProduct = async (req, res, next) => {
    try {
        // Get userId from request body or authenticated user
        const userId = req.user?.user_id;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'User authentication required'
            });
        }

        // Find user
        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is a seller
        if (user.role !== 'seller') {
            return res.status(403).json({
                success: false,
                message: 'Only sellers can create products'
            });
        }

        // Check if upgrade_at exists
        if (!user.upgrade_at) {
            return res.status(403).json({
                success: false,
                message: 'Seller upgrade date not found. Please contact admin.'
            });
        }

        // Calculate days since upgrade
        const currentDate = new Date();
        const upgradeDate = new Date(user.upgrade_at);
        const daysSinceUpgrade = Math.floor((currentDate - upgradeDate) / (1000 * 60 * 60 * 24));

        // Check if permission is still valid (within 7 days)
        if (daysSinceUpgrade >= 7) {
            const daysExpired = daysSinceUpgrade - 7;
            return res.status(403).json({
                success: false,
                message: `Your seller permission has expired ${daysExpired} day(s) ago. Please request renewal from admin.`,
                data: {
                    upgrade_at: user.upgrade_at,
                    daysSinceUpgrade,
                    permissionExpired: true,
                    daysExpired
                }
            });
        }

        // Permission is valid, attach user to request
        req.seller = {
            user_id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            upgrade_at: user.upgrade_at,
            daysRemaining: 7 - daysSinceUpgrade
        };

        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while checking seller permission'
        });
    }
};

/**
 * Middleware to check if user is admin
 */
const isAdmin = async (req, res, next) => {
    try {
        const adminId = req.body.adminId || req.user?.user_id;

        if (!adminId) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const admin = await User.findByPk(adminId);

        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (admin.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin access required'
            });
        }

        req.admin = {
            user_id: admin.user_id,
            email: admin.email,
            full_name: admin.full_name,
            role: admin.role
        };

        next();

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while checking admin permission'
        });
    }
};

module.exports = {
    canCreateProduct,
    isAdmin
};