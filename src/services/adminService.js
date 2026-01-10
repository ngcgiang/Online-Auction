const { User, Category, Product, Order, Bid } = require('../models');
const { Op,fn,col } = require('sequelize');
const bcrypt = require('bcrypt');
class AdminService {
    /**
     * Get all pending upgrade requests
     * @returns {Promise<Array>} - List of users with pending requests
     */
    async getPendingUpgradeRequests() {
        try {
            const pendingRequests = await User.findAll({
                where: {
                    upgrade_request: true
                },
                attributes: ['user_id', 'email', 'full_name', 'role', 'upgrade_request', 'upgrade_at', 'created_at'],
                order: [['created_at', 'DESC']]
            });

            return pendingRequests;

        } catch (error) {
            throw error;
        }
    }

    /**
     * Approve user upgrade to Seller role
     * @param {number} adminId - ID of the admin approving
     * @param {number} userId - ID of the user to be upgraded
     * @returns {Promise<Object>} - Updated user info
     */
    async approveUpgradeRequest(adminId, userId) {
        try {
            // Verify admin role
            const admin = await User.findByPk(adminId);

            if (!admin) {
                throw new Error('Admin not found');
            }

            if (admin.role !== 'admin') {
                throw new Error('Only admins can approve upgrade requests');
            }

            // Find user to upgrade
            const user = await User.findByPk(userId);

            if (!user) {
                throw new Error('User not found');
            }

            // Check if user has pending request
            if (user.upgrade_request !== true) {
                throw new Error('This user does not have a pending upgrade request');
            }

            // Check if user is verified
            if (!user.is_verified) {
                throw new Error('User must verify email before upgrade');
            }

            // Update user to Seller role
            user.role = 'seller';
            user.upgrade_request = false;
            user.upgrade_at = new Date(); // Set approval timestamp
            await user.save();

            return {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                upgrade_request: user.upgrade_request,
                upgrade_at: user.upgrade_at,
                message: 'User successfully upgraded to Seller'
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Reject user upgrade request
     * @param {number} adminId - ID of the admin rejecting
     * @param {number} userId - ID of the user to be rejected
     * @param {string} reason - Reason for rejection (optional)
     * @returns {Promise<Object>} - Updated user info
     */
    async rejectUpgradeRequest(adminId, userId, reason = null) {
        try {
            // Verify admin role
            const admin = await User.findByPk(adminId);

            if (!admin) {
                throw new Error('Admin not found');
            }

            if (admin.role !== 'admin') {
                throw new Error('Only admins can reject upgrade requests');
            }

            // Find user
            const user = await User.findByPk(userId);

            if (!user) {
                throw new Error('User not found');
            }

            // Check if user has pending request
            if (user.upgrade_request !== true) {
                throw new Error('This user does not have a pending upgrade request');
            }

            // Reset upgrade_request to false
            user.upgrade_request = false;
            await user.save();

            return {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                upgrade_request: user.upgrade_request,
                message: reason || 'Upgrade request has been rejected'
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Get all sellers
     * @returns {Promise<Array>} - List of sellers
     */
    async getAllSellers() {
        try {
            const sellers = await User.findAll({
                where: {
                    role: 'seller'
                },
                attributes: ['user_id', 'email', 'full_name', 'role', 'upgrade_at', 'rating_score', 'created_at'],
                order: [['upgrade_at', 'DESC']]
            });

            // Add permission status for each seller
            const sellersWithStatus = sellers.map(seller => {
                const sellerData = seller.toJSON();
                
                if (sellerData.upgrade_at) {
                    const currentDate = new Date();
                    const upgradeDate = new Date(sellerData.upgrade_at);
                    const daysSinceUpgrade = Math.floor((currentDate - upgradeDate) / (1000 * 60 * 60 * 24));
                    const isValid = daysSinceUpgrade < 7;
                    
                    sellerData.permissionStatus = {
                        isValid,
                        daysSinceUpgrade,
                        daysRemaining: isValid ? 7 - daysSinceUpgrade : 0
                    };
                }
                
                return sellerData;
            });

            return sellersWithStatus;

        } catch (error) {
            throw error;
        }
    }

    /**
 * Create a new category
 * @param {string} category_name - Name of the category
 * @param {number|null} parent_category_id - ID of parent category (null for root category)
 * @returns {Promise<Object>} - Created category info
 */
    async createNewCategory(category_name, parent_category_id) {
        try {
            // Validate category name
            if (!category_name || category_name.trim() === '') {
                throw new Error('Category name is required');
            }
            console.log(category_name);

            // Check if category name already exists at the same level
            const existingCategory = await Category.findOne({
                where: {
                    category_name: category_name.trim(),
                    parent_id: parent_category_id
                }
            });

            if (existingCategory) {
                throw new Error('Category with this name already exists at this level');
            }

            // If parent_categor y_id is provided, verify it exists
            if (parent_category_id) {
                const parentCategory = await Category.findByPk(parent_category_id);
                
                if (!parentCategory) {
                    throw new Error('Parent category not found');
                }
            }

            // Create new category
            const newCategory = await Category.create({
                category_name: category_name.trim(),
                parent_id: parent_category_id
            });

            return {
                category_id: newCategory.category_id,
                category_name: newCategory.category_name,
                parent_id: newCategory.parent_category_id,
                created_at: newCategory.created_at,
                message: 'Category created successfully'
            };

        } catch (error) {
            throw error;
        }
    }

    /**
 * Delete a category
 * @param {number} category_id - ID of the category to delete
 * @returns {Promise<Object>} - Deletion result
 */
    async deleteCategory(category_id) {
        try {
            
            if (!category_id) {
                throw new Error('Category ID is required');
            }

            // Find the category to delete
            const category = await Category.findByPk(category_id);

            if (!category) {
                throw new Error('Category not found');
            }

            // Check if this is a parent category (has child categories)
            const childCategories = await Category.findAll({
                where: {
                    parent_id: category_id
                }
            });

            // If it's a parent category, check if any child has products
            if (childCategories.length > 0) {
                // Get all child category IDs
                const childCategoryIds = childCategories.map(child => child.category_id);

                // Check if any child category has products
                const productsInChildren = await Product.count({
                    where: {
                        category_id: {
                            [Op.in]: childCategoryIds
                        }
                    }
                });

                if (productsInChildren > 0) {
                    throw new Error('Cannot delete category: child categories contain products');
                }

                // Delete all child categories first (they have no products)
                await Category.destroy({
                    where: {
                        category_id: {
                            [Op.in]: childCategoryIds
                        }
                    }
                });
            }

            // Check if the category itself has products (if it's a child category)
            const productsInCategory = await Product.count({
                where: {
                    category_id: category_id
                }
            });

            if (productsInCategory > 0) {
                throw new Error('Cannot delete category: category contains products');
            }

            // Delete the category
            await category.destroy();

            return {
                category_id: category_id,
                category_name: category.category_name,
                message: 'Category deleted successfully'
            };

        } catch (error) {
            throw error;
        }
    }

    async deleteUser(user_id) {
    try {
        // Validate user_id
        if (!user_id) {
            throw new Error('User ID is required');
        }

        // Find the user to delete
        const user = await User.findByPk(user_id);

        if (!user) {
            throw new Error('User not found');
        }

        // Prevent deletion of admin users (optional security measure)
        if (user.role === 'admin') {
            throw new Error('Cannot delete admin users');
        }

        // If user is a seller, check for active products
        if (user.role === 'seller') {
            const activeProducts = await Product.count({
                where: {
                    seller_id: user_id
                }
            });

            if (activeProducts > 0) {
                throw new Error('Cannot delete seller with active products. Please remove all products first.');
            }
        }

        // Store user info before deletion
        const deletedUserInfo = {
            user_id: user.user_id,
            email: user.email,
            full_name: user.full_name,
            role: user.role
        };

        // Delete the user
        await user.destroy();

        return {
            ...deletedUserInfo,
            message: 'User deleted successfully'
        };

    } catch (error) {
        throw error;
    }
}

    async getAllUsers() {
    try {
        const users = await User.findAll({
            attributes: ['user_id', 'full_name', 'email', 'role', 'is_verified', 'created_at', 'dob', 'rating_score', 'address'],
            order: [['created_at', 'DESC']]
        });

        return users;

    } catch (error) {
        throw error;
    }
}

    async deleteProduct(product_id){
        try{
            await Product.destroy({
                where: {product_id}
            });
            return {
                message: "Product deleted successfully"
            }

        }catch(error){
            throw error;
        }
    }

    /**
 * Get total income from all paid orders
 * @returns {Promise<Object>} - Total income statistics
 */
async getTotalIncome() {
    try {
        const result = await Order.sum('total_amount', {
            where: {
                order_status: 'paid'
            }
        });

        const totalIncome = result || 0;

        return {
            total_income: parseFloat(totalIncome).toFixed(2),
            currency: 'USD',
            message: 'Total income retrieved successfully'
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Get monthly income (current month)
 * @returns {Promise<Object>} - Monthly income statistics
 */
async getMonthlyIncome() {
    try {
        // Get the first and last day of current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const result = await Order.sum('total_amount', {
            where: {
                order_status: 'paid',
                created_at: {
                    [Op.between]: [firstDay, lastDay]
                }
            }
        });

        const monthlyIncome = result || 0;

        return {
            monthly_income: parseFloat(monthlyIncome).toFixed(2),
            month: now.toLocaleString('default', { month: 'long' }),
            year: now.getFullYear(),
            currency: 'USD',
            message: 'Monthly income retrieved successfully'
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Get total number of orders
 * @returns {Promise<Object>} - Total orders statistics
 */
async getTotalOrders() {
    try {
        const totalOrders = await Order.count();

        // Get count by order status
        //const { fn, col } = require('sequelize');
        const orderStatusBreakdown = await Order.findAll({
            attributes: [
                'order_status',
                [fn('COUNT', col('order_id')), 'count']
            ],
            group: ['order_status']
        });

        const orderStatusCounts = {};
        orderStatusBreakdown.forEach(item => {
            orderStatusCounts[item.order_status] = parseInt(item.get('count'));
        });

        // Get count by delivery status
        const deliveryStatusBreakdown = await Order.findAll({
            attributes: [
                'delivery_status',
                [fn('COUNT', col('order_id')), 'count']
            ],
            group: ['delivery_status']
        });

        const deliveryStatusCounts = {};
        deliveryStatusBreakdown.forEach(item => {
            deliveryStatusCounts[item.delivery_status] = parseInt(item.get('count'));
        });

        return {
            total_orders: totalOrders,
            order_status_breakdown: orderStatusCounts,
            delivery_status_breakdown: deliveryStatusCounts,
            message: 'Total orders retrieved successfully'
        };

    } catch (error) {
        throw error;
    }
}

/**
 * Get total new users registered in current month
 * @returns {Promise<Object>} - Monthly new users statistics
 */
async getTotalNewUsers() {
    try {
        // Get the first and last day of current month
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const newUsersCount = await User.count({
            where: {
                created_at: {
                    [Op.between]: [firstDay, lastDay]
                }
            }
        });

        // Get breakdown by role
        //const { fn, col } = require('sequelize');
        const roleBreakdown = await User.findAll({
            attributes: [
                'role',
                [fn('COUNT', col('user_id')), 'count']
            ],
            where: {
                created_at: {
                    [Op.between]: [firstDay, lastDay]
                }
            },
            group: ['role']
        });

        const roleCounts = {};
        roleBreakdown.forEach(item => {
            roleCounts[item.role] = parseInt(item.get('count'));
        });

        return {
            total_new_users: newUsersCount,
            month: now.toLocaleString('default', { month: 'long' }),
            year: now.getFullYear(),
            role_breakdown: roleCounts,
            message: 'Monthly new users retrieved successfully'
        };

    } catch (error) {
        throw error;
    }
}

async updateUserInfo(user_id, newInfo){
        try{
            const user = await User.findByPk(user_id);
            if (!user) {
                throw new Error('User not found');
            }
            
            // Sequelize's update() method only updates fields present in newInfo
            await user.update(newInfo);
            return user;
        }
        catch (error) {
            console.error("updateUserInfo error:", error);
            throw error; // Throw the original error to see what's wrong
        }
    }
async countUsersByRole(){
    try{
        const totalSellers = await User.count({
            where: { role: 'seller' }
        });

        const totalBidders = await User.count({
            where: { role: 'bidder' }
        });
        return {
            total_sellers: totalSellers,
            total_bidders: totalBidders,
            message: 'Total bidders and sellers retrieved successfully'
        };
    }catch(error){
        //console.log(error);
        console.error("countUsersByRole error:", error); 
        throw error;
           
}    
}


async countProductsByStatus(){
    try{
        const productStatusCounts = await Product.findAll({
            attributes: [
                'status',
                [fn('COUNT', col('product_id')), 'count']
            ],
            group: ['status']
        });
        const statusCounts = {};
        productStatusCounts.forEach(item => {
            statusCounts[item.status] = parseInt(item.get('count'));
        });
        return {
            product_status_counts: statusCounts,
            message: 'Product counts by status retrieved successfully'
        };
    }catch(error){
        throw error;
    }
}

async countAllBids(){
    try{
        const totalBids = await Bid.count();
        return {
            total_bids: totalBids,
            message: 'Total bids retrieved successfully'
        };
    }catch(error){
        throw error;
    }
}

async resetUserPassword(user_id, newPassword){
    try{
        const user = await User.findByPk(user_id);
        if (!user) {
            throw new Error('User not found');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();
        
        // ✅ QUAN TRỌNG: Trả về newPassword (plaintext) để gửi email
        return {
            user_id: user.user_id,
            email: user.email,
            newPassword: newPassword,  // ← Thêm dòng này
            message: 'Password reset successfully'
        };
    }
    catch(error){
        console.error("resetUserPassword error:", error);
        throw error;
    }   
}
}


module.exports = new AdminService();