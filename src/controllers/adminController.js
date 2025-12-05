const AdminService = require('../services/adminService');

/**
 * Get all pending upgrade requests
 */
const getPendingRequests = async (req, res) => {
    try {
        const requests = await AdminService.getPendingUpgradeRequests();

        return res.status(200).json({
            success: true,
            message: 'Pending requests retrieved successfully',
            data: requests,
            count: requests.length
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving requests'
        });
    }
};

/**
 * Approve user upgrade to Seller
 */
const approveUpgrade = async (req, res) => {
    try {
        const { userId } = req.body;
        const adminId = req.params.userId || req.user?.user_id;

        if (!adminId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Admin ID and User ID are required'
            });
        }

        const result = await AdminService.approveUpgradeRequest(adminId, userId);

        return res.status(200).json({
            success: true,
            message: 'Upgrade request approved successfully',
            data: result
        });

    } catch (error) {
        if (error.message === 'User not found' || error.message === 'Admin not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('Only admins') || error.message.includes('pending')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while approving request'
        });
    }
};

/**
 * Reject user upgrade request
 */
const rejectUpgrade = async (req, res) => {
    try {
        const { adminId, reason } = req.body;
        const userId = req.body.userId || req.user?.user_id;

        if (!adminId || !userId) {
            return res.status(400).json({
                success: false,
                message: 'Admin ID and User ID are required'
            });
        }

        const result = await AdminService.rejectUpgradeRequest(adminId, userId, reason);

        return res.status(200).json({
            success: true,
            message: 'Upgrade request rejected successfully',
            data: result
        });

    } catch (error) {
        if (error.message === 'User not found' || error.message === 'Admin not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('Only admins') || error.message.includes('pending')) {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        return res.status(500).json({
            success: false,
            message: 'An error occurred while rejecting request'
        });
    }
};

/**
 * Get all sellers
 */
const getAllSellers = async (req, res) => {
    try {
        const sellers = await AdminService.getAllSellers();

        return res.status(200).json({
            success: true,
            message: 'Sellers retrieved successfully',
            data: sellers,
            count: sellers.length
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'An error occurred while retrieving sellers'
        });
    }
};

const createNewCategory = async(req, res) => {
    try {
        // Log the incoming request for debugging
        console.log('Request body:', req.body);
        
        const { newCategory, parentCategoryID } = req.body;
        
        // Validate input
        if (!newCategory) {
            return res.status(400).json({
                success: false,
                message: 'Category name is required'
            });
        }
        
        // Call service with proper parameter names
        const result = await AdminService.createNewCategory(
            newCategory, 
            parentCategoryID || null
        );
        
        console.log('Category created:', result);
        
        return res.status(201).json({
            success: true,
            message: 'New category created successfully',
            data: result
        });
        
    } catch (error) {
        // Log the actual error for debugging
        console.error('Error creating category:', error.message);
        
        // Handle specific errors
        if (error.message === 'Category name is required' || 
            error.message.includes('already exists')) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        
        if (error.message === 'Parent category not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }
        
        // Generic error
        return res.status(500).json({
            success: false,
            message: 'An error occurred while creating category',
            error: error.message // Include error message in development
        });
    }
}

module.exports = {
    getPendingRequests,
    approveUpgrade,
    rejectUpgrade,
    getAllSellers,
    createNewCategory
};