const productService = require('../services/productService');

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

module.exports = {
  searchProducts,
  getProductsByCategory,
  getAllProducts,
  getProductById,
  fetchTopValueProducts,
  fetchTopLeastTimeLeftProducts,
  fetchTopMostBiddedProducts
};
