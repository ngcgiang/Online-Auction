const { Server } = require('socket.io');
const { verifySocketToken } = require('../middlewares/socketAuthMiddleware');
const chatService = require('../services/chatService');

/**
 * Initialize Socket.io server with Express app
 * @param {Object} server - HTTP server instance
 * @returns {Object} - Socket.io instance
 */
const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // TODO: Change to specific domain in production
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Apply authentication middleware
  io.use(verifySocketToken);

  // Connection event
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id} (User ID: ${socket.user.user_id})`);

    /**
     * Event: Join private chat room (Seller-Winner chat)
     * Client emits: { productId: 123 }
     * Requires: Auction ended, user is seller or winner
     */
    socket.on('join_chat_room', async (data) => {
      try {
        const { productId } = data;
        const userId = socket.user.user_id;

        if (!productId) {
          return socket.emit('chat_error', {
            error: 'Product ID is required'
          });
        }

        // Validate access
        const validation = await chatService.validateChatAccess(userId, productId);

        if (!validation.valid) {
          return socket.emit('chat_error', {
            error: validation.error
          });
        }

        // Join room
        const roomName = `private_chat_${productId}`;
        socket.join(roomName);
        
        // Store current room in socket
        socket.currentChatRoom = roomName;
        socket.currentProductId = productId;

        console.log(`💬 User ${userId} (${validation.userRole}) joined chat room: ${roomName}`);

        // Fetch and send chat history
        const chatHistory = await chatService.getChatHistory(productId);

        socket.emit('chat_room_joined', {
          success: true,
          room: roomName,
          product: validation.product,
          userRole: validation.userRole,
          chatHistory: chatHistory
        });

      } catch (error) {
        console.error('Error joining chat room:', error);
        socket.emit('chat_error', {
          error: 'Failed to join chat room',
          details: error.message
        });
      }
    });

    /**
     * Event: Send message in chat room
     * Client emits: { productId: 123, content: "Hello!" }
     */
    socket.on('send_message', async (data) => {
      try {
        const { productId, content } = data;
        const userId = socket.user.user_id;

        if (!productId || !content) {
          return socket.emit('chat_error', {
            error: 'Product ID and message content are required'
          });
        }

        // Validate access
        const validation = await chatService.validateChatAccess(userId, productId);

        if (!validation.valid) {
          return socket.emit('chat_error', {
            error: validation.error
          });
        }

        // Save message to database
        const savedMessage = await chatService.saveMessage({
          productId,
          senderId: userId,
          content
        });

        // Emit to all users in the room (including sender)
        const roomName = `private_chat_${productId}`;
        io.to(roomName).emit('new_message', {
          success: true,
          message: savedMessage
        });

        console.log(`📨 Message sent in room ${roomName} by user ${userId}`);

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('chat_error', {
          error: 'Failed to send message',
          details: error.message
        });
      }
    });

    /**
     * Event: Leave chat room
     * Client emits: { productId: 123 }
     */
    socket.on('leave_chat_room', (data) => {
      try {
        const { productId } = data;
        const roomName = `auction_room_${productId}`;
        
        socket.leave(roomName);
        socket.currentChatRoom = null;
        socket.currentProductId = null;

        console.log(`📤 User ${socket.user.user_id} left chat room: ${roomName}`);

        socket.emit('chat_room_left', {
          success: true,
          room: roomName
        });

      } catch (error) {
        console.error('Error leaving chat room:', error);
      }
    });

    /**
     * Event: Join product detail room (for bidding updates)
     * Client emits: { productId: 123 }
     */
    socket.on('join_product_room', (data) => {
      const { productId } = data;
      const roomName = `product_${productId}`;
      
      socket.join(roomName);
      console.log(`📦 User ${socket.id} joined room: ${roomName}`);
      
      // Notify user they've joined successfully
      socket.emit('room_joined', {
        room: roomName,
        message: `Joined product ${productId} room`
      });
    });

    /**
     * Event: Leave product detail room
     * Client emits: { productId: 123 }
     */
    socket.on('leave_product_room', (data) => {
      const { productId } = data;
      const roomName = `product_${productId}`;
      
      socket.leave(roomName);
      console.log(`📤 User ${socket.id} left room: ${roomName}`);
    });

    /**
     * Event: Join homepage feed room
     * All users on homepage join this room to receive minimal updates
     */
    socket.on('join_homepage', () => {
      const roomName = 'homepage_feed';
      
      socket.join(roomName);
      console.log(`🏠 User ${socket.id} joined room: ${roomName}`);
      
      socket.emit('room_joined', {
        room: roomName,
        message: 'Joined homepage feed'
      });
    });

    /**
     * Event: Leave homepage feed room
     */
    socket.on('leave_homepage', () => {
      const roomName = 'homepage_feed';
      
      socket.leave(roomName);
      console.log(`📤 User ${socket.id} left homepage room`);
    });

    /**
     * Event: Disconnect
     */
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id} (User ID: ${socket.user.user_id})`);
    });

    /**
     * Event: Error handling
     */
    socket.on('error', (error) => {
      console.error(`⚠️ Socket error for ${socket.id}:`, error);
    });
  });

  console.log('🚀 Socket.io initialized successfully');
  return io;
};

module.exports = { initializeSocket };
