const { User, Category, Product } = require('../models');
const { Op } = require('sequelize');

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
                    parent_1id: parent_category_id
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
                parent_category_id: parent_category_id
            });

            return {
                category_id: newCategory.category_id,
                category_name: newCategory.category_name,
                parent_category_id: newCategory.parent_category_id,
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
}

module.exports = new AdminService();