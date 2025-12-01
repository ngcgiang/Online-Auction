import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

/**
 * Private Chat Component for Seller-Winner Communication
 * After auction ends, seller and winner can chat about the transaction
 */
const PrivateChat = ({ productId, accessToken }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [productInfo, setProductInfo] = useState(null);
  const [error, setError] = useState('');
  const messagesEndRef = useRef(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.io connection
  useEffect(() => {
    if (!accessToken || !productId) return;

    // Connect to Socket.io server with authentication
    const newSocket = io('http://localhost:3000', {
      auth: {
        token: accessToken
      },
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to socket server');
      setIsConnected(true);
      
      // Join the chat room
      newSocket.emit('join_chat_room', { productId });
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from socket server');
      setIsConnected(false);
    });

    // Handle successful room join
    newSocket.on('chat_room_joined', (data) => {
      console.log('💬 Joined chat room:', data);
      setUserRole(data.userRole);
      setProductInfo(data.product);
      setMessages(data.chatHistory || []);
      setError('');
    });

    // Handle new messages
    newSocket.on('new_message', (data) => {
      console.log('📨 New message received:', data);
      setMessages((prev) => [...prev, data.message]);
    });

    // Handle errors
    newSocket.on('chat_error', (data) => {
      console.error('⚠️ Chat error:', data);
      setError(data.error);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err.message);
      setError('Failed to connect. Please check your authentication.');
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      if (newSocket) {
        newSocket.emit('leave_chat_room', { productId });
        newSocket.disconnect();
      }
    };
  }, [productId, accessToken]);

  // Send message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket) return;

    socket.emit('send_message', {
      productId,
      content: newMessage.trim()
    });

    setNewMessage('');
  };

  if (error) {
    return (
      <div className="chat-error">
        <h3>❌ Chat Not Available</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="private-chat-container">
      {/* Header */}
      <div className="chat-header">
        <h3>💬 Private Chat</h3>
        {productInfo && (
          <div className="product-info">
            <p><strong>Product:</strong> {productInfo.product_name}</p>
            <p><strong>Your Role:</strong> {userRole === 'seller' ? '🏪 Seller' : '🏆 Winner'}</p>
          </div>
        )}
        <div className="connection-status">
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={msg.message_id || index}
              className={`message ${msg.sender_id === productInfo?.winner_id ? 'winner' : 'seller'}`}
            >
              <div className="message-header">
                <span className="sender-name">{msg.sender_name}</span>
                <span className="message-time">
                  {new Date(msg.sent_at).toLocaleString()}
                </span>
              </div>
              <div className="message-content">{msg.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chat-input" onSubmit={handleSendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!isConnected}
          maxLength={5000}
        />
        <button type="submit" disabled={!isConnected || !newMessage.trim()}>
          Send 📤
        </button>
      </form>
    </div>
  );
};

export default PrivateChat;

/**
 * USAGE EXAMPLE:
 * 
 * import PrivateChat from './components/PrivateChat';
 * 
 * function AuctionDetailsPage() {
 *   const productId = 123; // Get from URL params
 *   const accessToken = localStorage.getItem('access_token');
 * 
 *   return (
 *     <div>
 *       <h1>Auction Details</h1>
 *       <PrivateChat productId={productId} accessToken={accessToken} />
 *     </div>
 *   );
 * }
 */
