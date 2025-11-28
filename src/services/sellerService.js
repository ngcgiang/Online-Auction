const { User } = require('../models');

class SellerService {
    /**
     * User (Bidder) request to upgrade to Seller role
     * @param {number} userId - ID of the user requesting upgrade
     * @returns {Promise<Object>} - Updated user info
     */
    async requestUpgradeToSeller(userId) {
        try {
            // Find user by ID
            const user = await User.findByPk(userId);

            if (!user) {
                throw new Error('User not found');
            }

            // Check if user is verified
            if (!user.is_verified) {
                throw new Error('Please verify your email first');
            }

            // Check if user is already a seller or admin
            if (user.role === 'seller') {
                throw new Error('You are already a seller');
            }

            if (user.role === 'admin') {
                throw new Error('Admin cannot request seller upgrade');
            }

            // Check if there's already a pending request
            if (user.upgrade_request === true) {
                throw new Error('You already have a pending upgrade request');
            }

            // Update upgrade_request to true
            user.upgrade_request = true;
            await user.save();

            return {
                user_id: user.user_id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                upgrade_request: user.upgrade_request
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Check if seller permission is still valid (within 7 days of upgrade_at)
     * @param {number} userId - ID of the seller
     * @returns {Promise<Object>} - Permission status
     */
    async checkSellerPermission(userId) {
        try {
            const user = await User.findByPk(userId);

            if (!user) {
                throw new Error('User not found');
            }

            if (user.role !== 'seller') {
                throw new Error('User is not a seller');
            }

            if (!user.upgrade_at) {
                throw new Error('Seller upgrade date not found');
            }

            // Calculate days since upgrade
            const currentDate = new Date();
            const upgradeDate = new Date(user.upgrade_at);
            const daysSinceUpgrade = Math.floor((currentDate - upgradeDate) / (1000 * 60 * 60 * 24));
            const daysRemaining = 7 - daysSinceUpgrade;

            const isValid = daysSinceUpgrade < 7;

            return {
                isValid,
                upgrade_at: user.upgrade_at,
                daysSinceUpgrade,
                daysRemaining: isValid ? daysRemaining : 0,
                expiresAt: new Date(upgradeDate.getTime() + 7 * 24 * 60 * 60 * 1000)
            };

        } catch (error) {
            throw error;
        }
    }
}

module.exports = new SellerService();