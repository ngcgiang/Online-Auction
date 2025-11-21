const { Product, Category, User } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { removeVietnameseAccents } = require('../utils/textHelpers');

class ProductService {
  
  /**
   * Search products with full-text search (Vietnamese accent-insensitive)
   * @param {Object} searchParams - { keyword, category, page, pageSize, sortBy, newMinutes }
   * @returns {Object} - { products, pagination, searchCriteria }
   */
  async searchProducts(searchParams) {
    const { 
      keyword, 
      category, 
      page, 
      pageSize, 
      sortBy, 
      newMinutes 
    } = searchParams;

    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    // Build WHERE conditions
    const whereConditions = {};

    // Handle category search (Vietnamese accent-insensitive)
    if (category) {
      const normalizedCategory = removeVietnameseAccents(category);
      
      const categories = await Category.findAll({
        attributes: ['category_id', 'category_name']
      });
      
      const matchingCategoryIds = categories
        .filter(cat => removeVietnameseAccents(cat.category_name).includes(normalizedCategory))
        .map(cat => cat.category_id);

      if (matchingCategoryIds.length === 0) {
        return {
          products: [],
          pagination: {
            currentPage: page,
            pageSize,
            totalItems: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          }
        };
      }

      whereConditions.category_id = {
        [Op.in]: matchingCategoryIds
      };
    }

    // Handle keyword search (Vietnamese accent-insensitive)
    if (keyword) {
      const normalizedKeyword = removeVietnameseAccents(keyword);
      
      // Build nested REPLACE functions for accent removal in SQL
      whereConditions[Op.and] = sequelize.where(
        sequelize.fn('LOWER', 
          sequelize.fn('REPLACE',
            sequelize.fn('REPLACE',
              sequelize.fn('REPLACE',
                sequelize.fn('REPLACE',
                  sequelize.fn('REPLACE',
                    sequelize.fn('REPLACE',
                      sequelize.fn('REPLACE',
                        sequelize.fn('REPLACE',
                          sequelize.fn('REPLACE',
                            sequelize.fn('REPLACE',
                              sequelize.fn('REPLACE',
                                sequelize.fn('REPLACE',
                                  sequelize.fn('REPLACE',
                                    sequelize.fn('REPLACE',
                                      sequelize.fn('REPLACE',
                                        sequelize.fn('REPLACE',
                                          sequelize.fn('REPLACE',
                                            sequelize.col('product_name'),
                                            'à', 'a'), 'á', 'a'), 'ạ', 'a'), 'ả', 'a'), 'ã', 'a'),
                                        'â', 'a'), 'ầ', 'a'), 'ấ', 'a'), 'ậ', 'a'), 'ẩ', 'a'), 'ẫ', 'a'),
                                    'ă', 'a'), 'ằ', 'a'), 'ắ', 'a'), 'ặ', 'a'), 'ẳ', 'a'), 'ẵ', 'a')
        ),
        {
          [Op.like]: `%${normalizedKeyword}%`
        }
      );
    }

    // Determine sort order
    let orderClause;
    if (sortBy === 'price') {
      orderClause = [['current_price', 'ASC']];
    } else {
      orderClause = [['end_time', 'DESC']];
    }

    // Query products
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
      order: orderClause,
      distinct: true
    });

    // Mark new products
    const newProductThreshold = new Date(Date.now() - newMinutes * 60 * 1000);
    const enrichedProducts = products.map(product => {
      const productData = product.toJSON();
      const createdAt = new Date(productData.start_time);
      productData.isNew = createdAt > newProductThreshold;
      return productData;
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / pageSize);
    
    return {
      products: enrichedProducts,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: count,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      searchCriteria: {
        keyword: keyword || null,
        category: category || null,
        sortBy,
        newProductMinutes: newMinutes
      }
    };
  }

  /**
   * Get products by category with pagination
   * @param {Object} queryParams - { category, page, pageSize }
   * @returns {Object} - { products, pagination }
   */
  async getProductsByCategory(queryParams) {
    const { category, page, pageSize } = queryParams;

    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const whereConditions = {};

    // Find category by name if provided
    if (category) {
      const categoryRecord = await Category.findOne({
        where: { category_name: category }
      });

      if (!categoryRecord) {
        throw new Error('Category not found');
      }

      whereConditions.category_id = categoryRecord.category_id;
    }

    // Query products
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

    const totalPages = Math.ceil(count / pageSize);

    return {
      products,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: count,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get all products with optional status filter
   * @param {Object} queryParams - { page, pageSize, status }
   * @returns {Object} - { products, pagination }
   */
  async getAllProducts(queryParams) {
    const { page, pageSize, status } = queryParams;

    const offset = (page - 1) * pageSize;
    const limit = pageSize;

    const whereConditions = {};
    
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

    const totalPages = Math.ceil(count / pageSize);

    return {
      products,
      pagination: {
        currentPage: page,
        pageSize,
        totalItems: count,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    };
  }

  /**
   * Get product by ID
   * @param {Number} productId
   * @returns {Object} - Product details
   */
  async getProductById(productId) {
    const product = await Product.findByPk(productId, {
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
      throw new Error('Product not found');
    }

    return product;
  }
}

module.exports = new ProductService();
