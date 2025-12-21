const SellerService = require('../services/sellerService');

/**
 * User request to upgrade to Seller role
 */
const requestUpgrade = async (req, res) => {
    try {
        const userId = req.user?.user_id;
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

/**
 * Get bidder list for a specific product
 * GET /api/seller/products/:productId/bidders
 */
const getBidderList = async (req, res, next) => {
  try {
    const sellerId = req.user?.user_id;
    const productId = req.params.productId;
    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    const bidders = await SellerService.getBidderList(productId);

    return res.status(200).json({
      success: true,
      message: 'Bidder list retrieved successfully',
      count: bidders.length,
      data: bidders
    });

  } catch (error) {
    console.error('Error getting bidder list:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving bidder list',
      error: error.message
    });
  }
};

/**
 * Get active products for the current seller
 * GET /api/seller/products
 */
const getActiveProducts = async (req, res, next) => {
  try {
    const sellerId = req.user?.user_id;

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const products = await SellerService.getActiveProducts(sellerId);

    return res.status(200).json({
      success: true,
      message: 'Active products retrieved successfully',
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error('Error getting active products:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving active products',
      error: error.message
    });
  }
};

/**
 * Get ended products for the current seller with winner info
 * GET /api/seller/products/ended
 */
const getEndedProducts = async (req, res, next) => {
  try {
    const sellerId = req.user?.user_id;

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const products = await SellerService.getEndedProducts(sellerId);

    return res.status(200).json({
      success: true,
      message: 'Ended products retrieved successfully',
      count: products.length,
      data: products
    });

  } catch (error) {
    console.error('Error getting ended products:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving ended products',
      error: error.message
    });
  }
};


module.exports = {
    requestUpgrade,
    checkPermission,
    getBidderList,
    getActiveProducts,
    getEndedProducts
};