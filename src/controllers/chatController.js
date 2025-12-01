const chatService = require('../services/chatService');

/**
 * Get list of chat rooms for current user
 * GET /api/chat/rooms
 */
const getChatRooms = async (req, res) => {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const rooms = await chatService.getUserChatRooms(userId);

    return res.status(200).json({
      success: true,
      message: 'Chat rooms retrieved successfully',
      count: rooms.length,
      data: rooms
    });

  } catch (error) {
    console.error('Error getting chat rooms:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving chat rooms',
      error: error.message
    });
  }
};

/**
 * Get chat history for a specific product
 * GET /api/chat/:product_id/history
 */
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { product_id } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate access
    const validation = await chatService.validateChatAccess(userId, parseInt(product_id));

    if (!validation.valid) {
      return res.status(403).json({
        success: false,
        message: validation.error
      });
    }

    // Get chat history
    const messages = await chatService.getChatHistory(parseInt(product_id), limit);

    return res.status(200).json({
      success: true,
      message: 'Chat history retrieved successfully',
      product: validation.product,
      userRole: validation.userRole,
      count: messages.length,
      data: messages
    });

  } catch (error) {
    console.error('Error getting chat history:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while retrieving chat history',
      error: error.message
    });
  }
};

module.exports = {
  getChatRooms,
  getChatHistory
};
