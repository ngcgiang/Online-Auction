const productService = require('../services/productService');
const productCreationService = require('../services/productCreationService');
const { validationResult } = require('express-validator');
const { Product, ProductDescription } = require('../models');
const sanitizeHtml = require('sanitize-html');

/**
 * Search products with full-text search
 * GET /api/products/search
 */
const searchProducts = async (req, res, next) => {
  try {
    const { 
      keyword, 
      category, 
      page = 1, 
      pageSize = 12,
      sortBy = 'time',
      newMinutes = 60
    } = req.query;

    const result = await productService.searchProducts({
      keyword,
      category,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      sortBy,
      newMinutes: parseInt(newMinutes)
    });

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: result.products,
      searchCriteria: result.searchCriteria,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get products by category with pagination
 * GET /api/products
 */
const getProductsByCategory = async (req, res, next) => {
  try {
    const { category, page = 1, pageSize = 12 } = req.query;

    const result = await productService.getProductsByCategory({
      category,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get all products with optional filters
 * GET /api/products/all
 */
const getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 12, status } = req.query;

    const result = await productService.getAllProducts({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      status
    });

    return res.status(200).json({
      success: true,
      message: 'Products retrieved successfully',
      data: result.products,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get product by ID
 * GET /api/products/:product_id
 */
const getProductById = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const product = await productService.getProductById(parseInt(product_id));

    return res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: product
    });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

/**
 * Get detailed product information
 * GET /api/products/:product_id/details
 */
const getProductDetails = async (req, res, next) => {
  try {
    const { product_id } = req.params;

    const productDetails = await productService.getProductDetails(parseInt(product_id));

    return res.status(200).json({
      success: true,
      message: 'Product details retrieved successfully',
      data: productDetails
    });
  } catch (error) {
    if (error.message === 'Product not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    next(error);
  }
};

const fetchTopValueProducts = async (req, res) => {
    try {
        const products = await productService.getTopValueProducts();   
        res.status(200).json(products);
    } catch (error) {
        console.error('Error in fetchTopValueProducts controller:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const fetchTopLeastTimeLeftProducts = async (req, res) => {
    try {
        const products = await productService.getTopLeastTimeLeftProducts();   
        res.status(200).json(products);
    } catch (error) {
        console.error('Error in fetchTopLeastTimeLeftProducts controller:', error);
        res.status(500).json({ message: 'Internal server error' }); 
    }
};

const fetchTopMostBiddedProducts = async (req,res) => {
    try{
        const products = await productService.getTopMostBiddedProducts();
        res.status(200).json(products);
    } catch (error){
        console.error('Error in fetchTopMostBiddedProducts controller:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}

/**
 * Create a new auction product
 * POST /api/products
 */
const createProduct = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const seller_id = req.user?.user_id;

    // Get seller info to validate permission
    const { User } = require('../models');
    const seller = await User.findByPk(seller_id);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Create product
    const result = await productCreationService.createProduct(req.body, seller_id);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: result.product
    });

  } catch (error) {
    console.error('Error creating product:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the product',
      error: error.message
    });
  }
};

/**
 * Append a new description update to existing product
 * POST /api/products/:product_id/updates
 * 
 * Requirements:
 * - User must be authenticated
 * - User must be the owner (seller) of the product
 * - Content must be provided and sanitized for XSS
 * - Creates a new ProductDescription record (1-many relationship)
 * - Does NOT overwrite original description
 */
const appendProductDescription = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array().map(err => ({
          field: err.path,
          message: err.msg
        }))
      });
    }

    const { product_id } = req.params;
    const { content } = req.body;
    const currentUserId = req.user?.user_id; // From verifyAccessToken middleware

    if (!currentUserId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Find the product
    const product = await Product.findByPk(parseInt(product_id));

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Authorization: Check if current user is the seller (owner) of the product
    if (product.seller_id !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Only the product owner can add description updates'
      });
    }

    // Sanitize HTML content to prevent XSS attacks
    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'span']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['style', 'class'],
        'img': ['src', 'alt', 'width', 'height']
      },
      allowedStyles: {
        '*': {
          'color': [/^#[0-9a-fA-F]{3,6}$/],
          'text-align': [/^left$/, /^right$/, /^center$/],
          'font-size': [/^\d+(?:px|em|%)$/],
          'font-weight': [/^bold$/, /^normal$/],
          'background-color': [/^#[0-9a-fA-F]{3,6}$/]
        }
      }
    });

    // Create new ProductDescription record (audit log)
    const newDescription = await ProductDescription.create({
      product_id: parseInt(product_id),
      description: sanitizedContent,
      created_at: new Date()
    });

    return res.status(201).json({
      success: true,
      message: 'Product description updated successfully',
      data: {
        des_id: newDescription.des_id,
        product_id: newDescription.product_id,
        description: newDescription.description,
        created_at: newDescription.created_at
      }
    });

  } catch (error) {
    console.error('Error appending product description:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while updating product description',
      error: error.message
    });
  }
};

module.exports = {
  searchProducts,
  getProductsByCategory,
  getAllProducts,
  getProductById,
  getProductDetails,
  fetchTopValueProducts,
  fetchTopLeastTimeLeftProducts,
  fetchTopMostBiddedProducts,
  createProduct,
  appendProductDescription
};
