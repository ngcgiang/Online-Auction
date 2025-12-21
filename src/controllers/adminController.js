const adminService = require('../services/adminService');
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
};

const deleteCategory = async (req, res) => {
    try {
        // Get category_id from request parameters or body
        const { category_id } = req.params.category_id ? req.params : req.body;
        
        // Validate input
        if (!category_id) {
            return res.status(400).json({
                success: false,
                message: 'Category ID is required'
            });
        }

        // Call service to delete category
        const result = await AdminService.deleteCategory(category_id);

        return res.status(200).json({
            success: true,
            message: 'Category deleted successfully',
            data: result
        });

    } catch (error) {
        // Log error for debugging
        console.error('Error deleting category:', error.message);

        // Handle specific errors
        if (error.message === 'Category not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'Category ID is required') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('contains products') || 
            error.message.includes('child categories contain products')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        // Generic error
        return res.status(500).json({
            success: false,
            message: 'An error occurred while deleting category',
            error: error.message
        });
    }
};

/**
 * Delete a user
 */
const deleteUser = async (req, res) => {
    try {
        // Get user_id from request parameters or body
        const { id } = req.params.id ? req.params:req.body;

        // Validate input
        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Call service to delete user
        const result = await AdminService.deleteUser(id);

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: result
        });

    } catch (error) {
        // Log error for debugging
        console.error('Error deleting user:', error.message);

        // Handle specific errors
        if (error.message === 'User not found') {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'User ID is required') {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        if (error.message === 'Cannot delete admin users') {
            return res.status(403).json({
                success: false,
                message: error.message
            });
        }

        if (error.message.includes('active products')) {
            return res.status(409).json({
                success: false,
                message: error.message
            });
        }

        // Generic error
        return res.status(500).json({
            success: false,
            message: 'An error occurred while deleting user',
            error: error.message
        });
    }
};

const getAllUsers = async(req,res) =>{
    try{
        const users = await adminService.getAllUsers();
        return res.status(200).json({
            success: true,
            message: 'Fetch all users successfully',
            data: {
                list: users
            }
        })
    }catch(error){
        return res.status(500).json({
            success: false,
            message: 'Error fetching users'
        })
    }
}

const deleteProduct = async(req,res)=>{
    try{
        const id = req.params.id || req.body.id;
        console.log(id);
        await adminService.deleteProduct(id);
        return res.status(200).json({
            success: true,
            message: 'Product deleted'
        })
    }catch(error){
        console.error("error deleting product",error);
        return res.status(500).json({
            success: false,
            message: "failed to delete product"
        })
    }
}

const getTotalIncome = async(req,res)=>{
    try{
        const income = await adminService.getTotalIncome();
        return res.status(200).json({
            success: true,
            message: "Get total income",
            data: income
        })
    }catch(error){
        console.error("error get total income",error)
        return res.status(500).json({
            success: false,
            message: "Failed to get total income"
        })
    }
}

const getNewUsers = async(req,res)=>{
    try{
        const users = await adminService.getTotalNewUsers();
        return res.status(200).json({
            success: true,
            message: "fecth new users successfully",
            data: {
                list: users,
            }
        })
    }catch(error){
        console.error("error fetching new users:",error);
        return res.status(500).json({
            success:false,
            message: "failed to fetch new users"
        })
    }
}

const getTotalOrders = async(req,res)=>{
    try{
        const orders = await adminService.getTotalOrders();
        return res.status(200).json({
            success: true,
            message: "fetch all orders successfully",
            data: {
                list: orders
            }
        })
    }catch(error){
        console.error('error fetching orders', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch orders"
        })
    }
}

const getMonthlyIncome = async(req,res)=>{
    try{
        const income = await adminService.getMonthlyIncome();
        return res.status(200).json({
            success: true,
            message: "Get monthly income",
            data: income
        })
    }catch(error){
        console.error("error get monthly income",error)
        return res.status(500).json({
            success: false,
            message: "Failed to get monthly income"
        })
    }
}

const updateUserInfo = async (req, res) => {
    try {
        const {user_id, full_name, email, address, dob } = req.body;

        // Check for user_id
        if (!user_id) {
            return res.status(400).json({
                success: false,
                message: 'User ID is required'
            });
        }

        // Create update object, only including fields that have values
        const updateData = {};

        if (full_name && full_name.trim() !== '') {
            updateData.full_name = full_name;
        }

        if (email && email.trim() !== '') {
            updateData.email = email;
        }

        if (dob && dob.trim() !== '') {
            updateData.dob = dob;
        }

        if (address && address.trim() !== '') {
            updateData.address = address;
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid fields to update'
            });
        }

        const updatedUser = await adminService.updateUserInfo(user_id, updateData);

        return res.status(200).json({
            success: true,
            message: 'User info updated successfully',
            data: {
                user: updatedUser
            }
        });
    } catch (error) {
        console.error('Error updating user info:', error);
        // Return error message for debugging (remove in production)
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message // Add this line for debugging
        });
    }
}

module.exports = {
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
};