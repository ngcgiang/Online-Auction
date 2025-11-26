const { Server } = require('socket.io');

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

  // Connection event
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    /**
     * Event: Join product detail room
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
      console.log(`❌ User disconnected: ${socket.id}`);
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
