const { Product, Category, User, Bid, ProductImage } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');
const { removeVietnameseAccents, generateUnaccentSQL, formatRelativeTime, maskFullname } = require('../utils/textHelpers');

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
    const categoryWhere = {};

    // Handle keyword search (Vietnamese accent-insensitive)
    // Search in both product name AND category name using FULLTEXT search
    if (keyword) {
      const normalizedKeyword = removeVietnameseAccents(keyword);
      
      // Get all categories that match the keyword
      const categories = await Category.findAll({
        attributes: ['category_id', 'category_name']
      });
      
      const matchingCategoryIds = categories
        .filter(cat => removeVietnameseAccents(cat.category_name).includes(normalizedKeyword))
        .map(cat => cat.category_id);
      
      // Build OR condition: match product name (FULLTEXT) OR category
      const searchConditions = [];
      
      // Add FULLTEXT search for product name
      searchConditions.push(
        sequelize.literal(`MATCH (product_name) AGAINST (:searchTerm IN NATURAL LANGUAGE MODE)`)
      );
      
      // Add category condition if any categories match
      if (matchingCategoryIds.length > 0) {
        searchConditions.push({
          category_id: {
            [Op.in]: matchingCategoryIds
          }
        });
      }
      
      // Combine with OR
      whereConditions[Op.or] = searchConditions;
    }

    // Handle category filter (explicit category parameter)
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

      // If both keyword and category, use AND condition
      whereConditions.category_id = {
        [Op.in]: matchingCategoryIds
      };
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
      replacements: { searchTerm: keyword || '' },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['category_id', 'category_name', 'parent_id']
        },
        {
          model: User,
          as: 'seller',
          attributes: ['user_id', 'full_name', 'rating_score']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['image_id', 'img_url'],
          limit: 1,
          separate: true,
          order: [['image_id', 'ASC']]
        },
        {
          model: Bid,
          as: 'bids',
          attributes: ['bid_id', 'bidder_id', 'amount'],
          where: { status: 1 },
          required: false,
          separate: true,
          include: [{
            model: User,
            as: 'bidder',
            attributes: ['user_id', 'full_name', 'rating_score']
          }]
        }
      ],
      limit,
      offset,
      order: orderClause,
      distinct: true
    });

    // Mark new products and enrich with bid data
    const newProductThreshold = new Date(Date.now() - newMinutes * 60 * 1000);
    const enrichedProducts = products.map(product => {
      const productData = product.toJSON();
      const createdAt = new Date(productData.start_time);
      productData.isNew = createdAt > newProductThreshold;
      
      // Get avatar (first image)
      productData.avatar = productData.images && productData.images.length > 0 
        ? productData.images[0].img_url 
        : null;
      
      // Get bid count and highest bidder
      const validBids = productData.bids || [];
      productData.bidCount = validBids.length;
      
      if (validBids.length > 0) {
        // Find highest bid
        const highestBid = validBids.reduce((max, bid) => 
          parseFloat(bid.amount) > parseFloat(max.amount) ? bid : max
        );
        productData.highestBidder = highestBid.bidder;
      } else {
        productData.highestBidder = null;
      }
      
      // Remove bids and images arrays from response
      delete productData.bids;
      delete productData.images;
      
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
          attributes: ['user_id', 'full_name', 'rating_score']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['image_id', 'img_url'],
          limit: 1,
          separate: true,
          order: [['image_id', 'ASC']]
        },
        {
          model: Bid,
          as: 'bids',
          attributes: ['bid_id', 'bidder_id', 'amount'],
          where: { status: 1 },
          required: false,
          separate: true,
          include: [{
            model: User,
            as: 'bidder',
            attributes: ['user_id', 'full_name', 'rating_score']
          }]
        }
      ],
      limit,
      offset,
      order: [['product_id', 'DESC']],
      distinct: true
    });

    // Enrich products with avatar, bid count, and highest bidder
    const enrichedProducts = products.map(product => {
      const productData = product.toJSON();
      
      // Get avatar (first image)
      productData.avatar = productData.images && productData.images.length > 0 
        ? productData.images[0].img_url 
        : null;
      
      // Get bid count and highest bidder
      const validBids = productData.bids || [];
      productData.bidCount = validBids.length;
      
      if (validBids.length > 0) {
        // Find highest bid
        const highestBid = validBids.reduce((max, bid) => 
          parseFloat(bid.amount) > parseFloat(max.amount) ? bid : max
        );
        productData.highestBidder = highestBid.bidder;
      } else {
        productData.highestBidder = null;
      }
      
      // Remove bids and images arrays from response
      delete productData.bids;
      delete productData.images;
      
      return productData;
    });

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
          attributes: ['user_id', 'full_name', 'rating_score']
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
          attributes: ['user_id', 'full_name', 'rating_score', 'email']
        },
        {
          model: User,
          as: 'winner',
          attributes: ['user_id', 'full_name', 'rating_score']
        }
      ]
    });

    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  /**
   * Get detailed product information with all related data
   * @param {Number} productId
   * @returns {Object} - Complete product details
   */
  async getProductDetails(productId) {
    const { ProductDescription, QuestionAnswer } = require('../models');
    
    // Get main product with relations
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
          attributes: ['user_id', 'full_name', 'rating_score', 'email', 'address']
        },
        {
          model: User,
          as: 'winner',
          attributes: ['user_id', 'full_name', 'rating_score']
        },
        {
          model: ProductImage,
          as: 'images',
          attributes: ['image_id', 'img_url'],
          order: [['image_id', 'ASC']]
        },
        {
          model: ProductDescription,
          as: 'descriptions',
          attributes: ['des_id', 'description', 'created_at'],
          order: [['created_at', 'DESC']]
        },
        {
          model: QuestionAnswer,
          as: 'questions',
          where: { parent_comment_id: null },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['user_id', 'full_name', 'role']
            },
            {
              model: QuestionAnswer,
              as: 'replies',
              include: [{
                model: User,
                as: 'user',
                attributes: ['user_id', 'full_name', 'role']
              }],
              order: [['created_at', 'ASC']]
            }
          ],
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Get highest bidder information
    const highestBid = await Bid.findOne({
      where: { 
        product_id: productId,
        status: 1
      },
      order: [['amount', 'DESC']],
      include: [{
        model: User,
        as: 'bidder',
        attributes: ['user_id', 'full_name', 'rating_score']
      }]
    });

    // Get 5 related products in same category
    let relatedProducts = [];
    if (product.category_id) {
      relatedProducts = await Product.findAll({
        where: {
          category_id: product.category_id,
          product_id: { [Op.ne]: productId },
          status: 'active'
        },
        include: [
          {
            model: ProductImage,
            as: 'images',
            attributes: ['image_id', 'img_url'],
            limit: 1,
            separate: true,
            order: [['image_id', 'ASC']]
          },
          {
            model: User,
            as: 'seller',
            attributes: ['user_id', 'full_name', 'rating_score']
          }
        ],
        limit: 5,
        order: [['product_id', 'DESC']]
      });
    }

    // Format the response
    const productData = product.toJSON();
    
    // Separate images
    const images = productData.images || [];
    productData.mainImage = images.length > 0 ? images[0].img_url : null;
    productData.subImages = images.slice(1, 4).map(img => img.img_url); // Get 3 sub-images
    productData.allImages = images.map(img => img.img_url);
    delete productData.images;

    // Add highest bidder
    productData.highestBidder = highestBid ? {
      ...highestBid.bidder.toJSON(),
      full_name: maskFullname(highestBid.bidder.full_name)
    } : null;
    productData.highestBidAmount = highestBid ? highestBid.amount : null;

    // Mask winner full_name if exists
    if (productData.winner) {
      productData.winner.full_name = maskFullname(productData.winner.full_name);
    }

    // Count total bids for this product
    const bidCount = await Bid.count({
      where: { 
        product_id: productId,
        status: 1
      }
    });
    productData.bidCount = bidCount;

    // Calculate relative time for end_time if less than 3 days
    const now = new Date();
    const endTime = new Date(productData.end_time);
    const diffMs = endTime - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    
    if (diffDays < 3 && diffDays > 0) {
      productData.timeRemaining = formatRelativeTime(diffMs);
      productData.showRelativeTime = true;
    } else {
      productData.timeRemaining = null;
      productData.showRelativeTime = false;
    }

    // Format related products
    productData.relatedProducts = relatedProducts.map(rp => {
      const rpData = rp.toJSON();
      rpData.avatar = rpData.images && rpData.images.length > 0 
        ? rpData.images[0].img_url 
        : null;
      delete rpData.images;
      return rpData;
    });

    return productData;
  }

  async getTopValueProducts(limit = 5) {
    try{
      const products = await Product.findAll({
        order: [['current_price', 'DESC']],
        limit,
    });
      return products;
    } catch (error){
      throw new Error('Error fetching top valued products: ' + error.message);
    }
  }

  async getTopLeastTimeLeftProducts(limit = 5) {
    try{
      const products = await Product.findAll({
        order: [['end_time', 'ASC']],
        limit,
    });
      return products;
    } catch (error){
      throw new Error('Error fetching top least time left products: ' + error.message);
    }
  }

  async getTopMostBiddedProducts(limit = 5) {
    try {
        const products = await Product.findAll({
            attributes:[
                'product_id', 
                'product_name', 
                'current_price', 
                'end_time',
                [sequelize.fn('COUNT', sequelize.col('bids.bid_id')), 'bidCount']
            ],
            include: [{
                model: Bid,
                as: 'bids',  
                attributes: [],
                duplicating: false  
            }],
            group: ['Product.product_id', 'Product.product_name', 'Product.current_price', 'Product.end_time'],  // Include all selected attributes
            order: [[sequelize.literal('bidCount'), 'DESC']],
            limit: 5,
            subQuery: false  // Add this for better performance with grouping
        });
        return products;
    } catch (error) {
        console.error('Error fetching top most bidded products:', error);
        throw error;
    }
  }

}

module.exports = new ProductService();
