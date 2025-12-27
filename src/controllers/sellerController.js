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

const getRefusedBidders = async (req, res, next) => {
  try {
    const productId = req.params.productId;
    const bidders = await SellerService.getRefusedBidders(productId);

    return res.status(200).json({
      success: true,
      message: 'Refused bidder list retrieved successfully',
      count: bidders.length,
      data: bidders
    });
  } catch (error) {
    console.error('Error getting refused bidder list:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving refused bidder list',
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

const getTotalSoldProducts = async (req, res, next) => {
  try {
    const sellerId = req.user?.user_id;
    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }
    const totalSold = await SellerService.totalSoldProducts(sellerId);
    return res.status(200).json({
      success: true,
      message: 'Total sold products retrieved successfully',
      data: { totalSold }
    });
  } catch (error) {
    console.error('Error getting total sold products:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving total sold products',
      error: error.message
    });
  }
};
  const getTotalExpiredProducts = async (req, res, next) => {
    try {
      const sellerId = req.user?.user_id;
      if (!sellerId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      } 
      const totalExpired = await SellerService.totalExpiredProducts(sellerId);
      return res.status(200).json({
        success: true,
        message: 'Total expired products retrieved successfully',
        data: { totalExpired }
      });
    } catch (error) {
      console.error('Error getting total expired products:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving total expired products',
        error: error.message
      });
    }
};

const getTotalIncome = async (req, res, next) => {
    try {
      const sellerId = req.user?.user_id;
      if (!sellerId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      const totalIncome = await SellerService.totalEarnings(sellerId);
      return res.status(200).json({
        success: true,
        message: 'Total income retrieved successfully',
        data: { totalIncome }
      });
    } catch (error) {
      console.error('Error getting total income:', error);
      return res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving total income',
        error: error.message
      });
    }
};



module.exports = {
    requestUpgrade,
    checkPermission,
    getBidderList,
    getActiveProducts,
    getEndedProducts,
    getRefusedBidders,
    getTotalSoldProducts,
    getTotalExpiredProducts,
    getTotalIncome
};