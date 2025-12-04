const amqp = require('amqplib');
require('dotenv').config();

/**
 * RabbitMQ Connection Configuration
 * Singleton pattern to ensure only one connection instance
 */
class RabbitMQConfig {
  constructor() {
    this.connection = null;
    this.channel = null;
    this.isConnecting = false;
    this.RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
    this.RECONNECT_DELAY = 5000; // 5 seconds
  }

  /**
   * Establish connection to RabbitMQ server
   * @returns {Promise<Object>} - Connection and channel objects
   */
  async connect() {
    // If already connected, return existing connection
    if (this.connection && this.channel) {
      return { connection: this.connection, channel: this.channel };
    }

    // Prevent multiple simultaneous connection attempts
    if (this.isConnecting) {
      await this._waitForConnection();
      return { connection: this.connection, channel: this.channel };
    }

    try {
      this.isConnecting = true;
      console.log('🔌 Connecting to RabbitMQ at:', this.RABBITMQ_URL);

      // Create connection
      this.connection = await amqp.connect(this.RABBITMQ_URL);
      console.log('✅ RabbitMQ Connection established');

      // Create channel
      this.channel = await this.connection.createChannel();
      console.log('✅ RabbitMQ Channel created');

      // Handle connection close
      this.connection.on('close', () => {
        console.warn('⚠️ RabbitMQ connection closed. Reconnecting...');
        this.connection = null;
        this.channel = null;
        setTimeout(() => this.connect(), this.RECONNECT_DELAY);
      });

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('❌ RabbitMQ connection error:', err.message);
        this.connection = null;
        this.channel = null;
      });

      // Handle channel close
      this.channel.on('close', () => {
        console.warn('⚠️ RabbitMQ channel closed');
        this.channel = null;
      });

      // Handle channel errors
      this.channel.on('error', (err) => {
        console.error('❌ RabbitMQ channel error:', err.message);
      });

      this.isConnecting = false;
      return { connection: this.connection, channel: this.channel };

    } catch (error) {
      this.isConnecting = false;
      console.error('❌ Failed to connect to RabbitMQ:', error.message);
      console.log(`🔄 Retrying connection in ${this.RECONNECT_DELAY / 1000} seconds...`);
      
      // Auto-reconnect after delay
      setTimeout(() => this.connect(), this.RECONNECT_DELAY);
      
      throw error;
    }
  }

  /**
   * Wait for ongoing connection attempt to complete
   * @private
   */
  async _waitForConnection() {
    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (!this.isConnecting && this.connection && this.channel) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Get existing channel or create new connection
   * @returns {Promise<Channel>} - RabbitMQ channel
   */
  async getChannel() {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel;
  }

  /**
   * Close RabbitMQ connection gracefully
   */
  async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        console.log('✅ RabbitMQ channel closed');
      }
      if (this.connection) {
        await this.connection.close();
        console.log('✅ RabbitMQ connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error.message);
    }
  }
}

// Export singleton instance
module.exports = new RabbitMQConfig();
