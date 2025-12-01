const { Message, Product, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Service for handling chat messages between seller and winner
 */
class ChatService {
  /**
   * Validate if user can access chat room for a product
   * @param {number} userId - User ID from JWT
   * @param {number} productId - Product ID
   * @returns {Promise<Object>} - Validation result with product info
   */
  async validateChatAccess(userId, productId) {
    try {
      // Fetch product with seller and winner info
      const product = await Product.findByPk(productId, {
        attributes: ['product_id', 'product_name', 'seller_id', 'winner_id', 'end_time', 'status']
      });

      if (!product) {
        return {
          valid: false,
          error: 'Product not found'
        };
      }

      // Check if auction has ended
      const now = new Date();
      if (new Date(product.end_time) >= now) {
        return {
          valid: false,
          error: 'Auction has not ended yet. Chat is only available after auction ends.'
        };
      }

      // Check if there's a winner
      if (!product.winner_id) {
        return {
          valid: false,
          error: 'This auction has no winner. Chat is not available.'
        };
      }

      // Check if user is either seller or winner
      const isSeller = product.seller_id === userId;
      const isWinner = product.winner_id === userId;

      if (!isSeller && !isWinner) {
        return {
          valid: false,
          error: 'Access denied. Only seller and winner can chat.'
        };
      }

      return {
        valid: true,
        product: {
          product_id: product.product_id,
          product_name: product.product_name,
          seller_id: product.seller_id,
          winner_id: product.winner_id
        },
        userRole: isSeller ? 'seller' : 'winner'
      };

    } catch (error) {
      console.error('Error validating chat access:', error);
      throw error;
    }
  }

  /**
   * Get chat history for a product
   * @param {number} productId - Product ID
   * @param {number} limit - Number of messages to fetch (default: 50)
   * @returns {Promise<Array>} - Array of messages
   */
  async getChatHistory(productId, limit = 50) {
    try {
      const messages = await Message.findAll({
        where: { product_id: productId },
        include: [
          {
            model: User,
            as: 'sender',
            attributes: ['user_id', 'full_name', 'email']
          }
        ],
        order: [['sent_at', 'ASC']],
        limit: limit
      });

      return messages.map(msg => ({
        message_id: msg.message_id,
        product_id: msg.product_id,
        sender_id: msg.sender_id,
        sender_name: msg.sender?.full_name || 'Unknown',
        content: msg.content,
        sent_at: msg.sent_at
      }));

    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  }

  /**
   * Save a new message to the database
   * @param {Object} messageData - Message data
   * @returns {Promise<Object>} - Saved message
   */
  async saveMessage(messageData) {
    try {
      const { productId, senderId, content } = messageData;

      // Validate content
      if (!content || content.trim().length === 0) {
        throw new Error('Message content cannot be empty');
      }

      if (content.length > 5000) {
        throw new Error('Message content too long (max 5000 characters)');
      }

      // Create message
      const message = await Message.create({
        product_id: productId,
        sender_id: senderId,
        content: content.trim(),
        sent_at: new Date()
      });

      // Fetch sender info
      const sender = await User.findByPk(senderId, {
        attributes: ['user_id', 'full_name', 'email']
      });

      return {
        message_id: message.message_id,
        product_id: message.product_id,
        sender_id: message.sender_id,
        sender_name: sender?.full_name || 'Unknown',
        content: message.content,
        sent_at: message.sent_at
      };

    } catch (error) {
      console.error('Error saving message:', error);
      throw error;
    }
  }

  /**
   * Get list of chat rooms for a user (products where they are seller or winner)
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - Array of chat rooms
   */
  async getUserChatRooms(userId) {
    try {
      const now = new Date();

      const products = await Product.findAll({
        where: {
          [Op.or]: [
            { seller_id: userId },
            { winner_id: userId }
          ],
          end_time: {
            [Op.lt]: now
          },
          winner_id: {
            [Op.ne]: null
          }
        },
        include: [
          {
            model: User,
            as: 'seller',
            attributes: ['user_id', 'full_name']
          },
          {
            model: User,
            as: 'winner',
            attributes: ['user_id', 'full_name']
          }
        ],
        order: [['end_time', 'DESC']]
      });

      return products.map(product => {
        const isSeller = product.seller_id === userId;
        const otherUser = isSeller ? product.winner : product.seller;

        return {
          product_id: product.product_id,
          product_name: product.product_name,
          other_user: {
            user_id: otherUser.user_id,
            full_name: otherUser.full_name
          },
          your_role: isSeller ? 'seller' : 'winner',
          end_time: product.end_time
        };
      });

    } catch (error) {
      console.error('Error fetching user chat rooms:', error);
      throw error;
    }
  }
}

module.exports = new ChatService();
