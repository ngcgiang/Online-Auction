const { Product, ProductImage, ProductDescription } = require('../models');
const { sequelize } = require('../models');
const sanitizeHtml = require('sanitize-html');

class ProductCreationService {
  /**
   * Create a new auction product with images and description
   * @param {Object} productData - Product information
   * @param {number} sellerId - ID of the seller creating the product
   * @returns {Promise<Object>} - Created product with details
   */
  async createProduct(productData, sellerId) {
    let transaction;

    try {
      transaction = await sequelize.transaction();

      const {
        product_name,
        category_id,
        images,
        start_price,
        step_price,
        buy_now_price,
        end_time,
        description,
        auto_renewal,
        allow_new_users
      } = productData;

      // Sanitize HTML description to prevent XSS attacks
      const sanitizedDescription = sanitizeHtml(description, {
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

      // Set start_time to current time
      const start_time = new Date();

      // Create product record
      const newProduct = await Product.create({
        product_name,
        category_id: category_id || null,
        seller_id: sellerId,
        winner_id: null,
        start_value: start_price,
        current_price: start_price,
        buy_now_value: buy_now_price || null,
        price_step: step_price,
        start_time,
        end_time: new Date(end_time),
        status: 'active',
        permission: allow_new_users || false,
        auto_renewal: auto_renewal || true
      }, { transaction });

      // Create product images
      const imageRecords = images.map((imageUrl) => ({
        product_id: newProduct.product_id,
        img_url: imageUrl
      }));

      await ProductImage.bulkCreate(imageRecords, { transaction });

      // Create product description
      await ProductDescription.create({
        product_id: newProduct.product_id,
        description: sanitizedDescription,
        created_at: new Date()
      }, { transaction });

      // Commit transaction
      await transaction.commit();

      // Fetch complete product with relations
      const completeProduct = await Product.findByPk(newProduct.product_id, {
        include: [
          {
            model: ProductImage,
            as: 'images',
            attributes: ['image_id', 'img_url']
          },
          {
            model: ProductDescription,
            as: 'descriptions',
            attributes: ['des_id', 'description', 'created_at']
          }
        ]
      });

      return {
        success: true,
        message: 'Product created successfully',
        product: completeProduct
      };

    } catch (error) {
      // Rollback transaction on error
      if (transaction) {
        await transaction.rollback();
      }
      throw error;
    }
  }
}

module.exports = new ProductCreationService();
