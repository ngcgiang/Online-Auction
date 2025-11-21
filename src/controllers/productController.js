const { Product, Category, User } = require('../models');
const { Op } = require('sequelize');

// Get products by category with pagination
const getProductsByCategory = async (req, res) => {
  try {
    const { category, page = 1, pageSize = 12 } = req.query;

    // Validate pagination parameters
    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

    if (pageNum < 1 || pageSizeNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page and pageSize must be positive numbers'
      });
    }

    // Calculate offset
    const offset = (pageNum - 1) * pageSizeNum;
    const limit = pageSizeNum;

    // Build query conditions
    const whereConditions = {};
    let includeCategory = {
      model: Category,
      as: 'category',
      attributes: ['category_id', 'category_name', 'parent_id']
    };

    // If category name is provided, find products in that category
    if (category) {
      // First, find the category by name
      const categoryRecord = await Category.findOne({
        where: { category_name: category }
      });

      if (!categoryRecord) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }

      whereConditions.category_id = categoryRecord.category_id;
    }

    // Get products with pagination
    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        includeCategory,
        {
          model: User,
          as: 'seller',
          attributes: ['user_id', 'username', 'full_name', 'rating_score']
        }
      ],
      limit,
      offset,
      order: [['product_id', 'DESC']], // Most recent products first
      distinct: true
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / pageSizeNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      pagination: {
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalItems: count,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error getting products:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all products with pagination (no category filter)
const getAllProducts = async (req, res) => {
  try {
    const { page = 1, pageSize = 12, status } = req.query;

    const pageNum = parseInt(page);
    const pageSizeNum = parseInt(pageSize);

    if (pageNum < 1 || pageSizeNum < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page and pageSize must be positive numbers'
      });
    }

    const offset = (pageNum - 1) * pageSizeNum;
    const limit = pageSizeNum;

    const whereConditions = {};
    
    // Optional status filter
    if (status && ['active', 'sold', 'expired'].includes(status)) {
      whereConditions.status = status;
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['category_id', 'category_name', 'parent_id']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['user_id', 'username', 'full_name', 'rating_score']
        }
      ],
      limit,
      offset,
      order: [['product_id', 'DESC']],
      distinct: true
    });

    const totalPages = Math.ceil(count / pageSizeNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: products,
      pagination: {
        currentPage: pageNum,
        pageSize: pageSizeNum,
        totalItems: count,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Error getting products:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const { product_id } = req.params;

    const product = await Product.findByPk(product_id, {
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['category_id', 'category_name', 'parent_id']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['user_id', 'username', 'full_name', 'rating_score', 'email']
        },
        {
          model: User,
          as: 'winner',
          attributes: ['user_id', 'username', 'full_name']
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });

  } catch (error) {
    console.error('Error getting product:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  getProductsByCategory,
  getAllProducts,
  getProductById
};
