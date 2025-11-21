const { Watchlist, Product, User } = require('../models');

// Add product to watchlist
const addToWatchlist = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    // Validate required fields
    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id and product_id are required'
      });
    }

    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if product exists
    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if already in watchlist
    const existingWatchlist = await Watchlist.findOne({
      where: { user_id, product_id }
    });

    if (existingWatchlist) {
      return res.status(409).json({
        success: false,
        message: 'Product is already in watchlist'
      });
    }

    // Add to watchlist
    const watchlistItem = await Watchlist.create({
      user_id,
      product_id
    });

    return res.status(201).json({
      success: true,
      message: 'Product added to watchlist successfully',
      data: watchlistItem
    });

  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Remove product from watchlist
const removeFromWatchlist = async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    // Validate required fields
    if (!user_id || !product_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id and product_id are required'
      });
    }

    // Find watchlist item
    const watchlistItem = await Watchlist.findOne({
      where: { user_id, product_id }
    });

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Product not found in watchlist'
      });
    }

    // Remove from watchlist
    await watchlistItem.destroy();

    return res.status(200).json({
      success: true,
      message: 'Product removed from watchlist successfully'
    });

  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get user's watchlist
const getUserWatchlist = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id is required'
      });
    }

    // Check if user exists
    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get watchlist with product details
    const watchlist = await Watchlist.findAll({
      where: { user_id },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['product_id', 'product_name', 'current_price', 'start_value', 'end_time', 'status']
        }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'Watchlist retrieved successfully',
      data: watchlist,
      count: watchlist.length
    });

  } catch (error) {
    console.error('Error getting watchlist:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  addToWatchlist,
  removeFromWatchlist,
  getUserWatchlist
};
