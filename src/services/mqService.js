const mqConfig = require('../config/mqConfig');

/**
 * RabbitMQ Message Queue Service
 * Generic producer service for publishing messages to any queue
 * Supports different event types (BID_PLACED, USER_REGISTERED, AUCTION_ENDED, etc.)
 */
class MQService {
  constructor() {
    this.queues = new Map(); // Cache declared queues to avoid re-declaration
  }

  /**
   * Publish a message to a specific queue
   * @param {string} queueName - Name of the target queue (e.g., 'email_queue', 'notification_queue')
   * @param {Object} payload - Message payload with event type and data
   * @param {Object} options - Queue options (durable, persistent, etc.)
   * @returns {Promise<boolean>} - Success status
   * 
   * @example
   * await mqService.publishToQueue('email_queue', {
   *   event: 'BID_PLACED',
   *   data: { product_id: 123, seller_id: 1, new_bidder_id: 2 }
   * });
   */
  async publishToQueue(queueName, payload, options = {}) {
    try {
      // Get channel from connection pool
      const channel = await mqConfig.getChannel();

      // Default queue options
      const queueOptions = {
        durable: true, // Queue survives broker restart
        ...options
      };

      // Ensure queue exists (idempotent operation)
      if (!this.queues.has(queueName)) {
        await channel.assertQueue(queueName, queueOptions);
        this.queues.set(queueName, true);
        console.log(`📦 Queue '${queueName}' declared`);
      }

      // Convert payload to Buffer
      const messageBuffer = Buffer.from(JSON.stringify(payload));

      // Publish message with persistent flag
      const sent = channel.sendToQueue(queueName, messageBuffer, {
        persistent: true, // Message survives broker restart
        contentType: 'application/json',
        timestamp: Date.now()
      });

      if (sent) {
        console.log(`✅ [MQ Producer] Published to '${queueName}':`, {
          event: payload.event,
          timestamp: new Date().toISOString()
        });
        return true;
      } else {
        console.warn(`⚠️ [MQ Producer] Queue '${queueName}' buffer is full. Message may be lost.`);
        return false;
      }

    } catch (error) {
      console.error(`❌ [MQ Producer] Failed to publish to '${queueName}':`, error.message);
      throw error;
    }
  }

  /**
   * Publish multiple messages in batch
   * @param {string} queueName - Target queue name
   * @param {Array<Object>} payloads - Array of message payloads
   * @returns {Promise<Object>} - Success/failure counts
   */
  async publishBatch(queueName, payloads) {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const payload of payloads) {
      try {
        await this.publishToQueue(queueName, payload);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          payload,
          error: error.message
        });
      }
    }

    console.log(`📊 Batch publish to '${queueName}': ${results.success} succeeded, ${results.failed} failed`);
    return results;
  }

  /**
   * Gracefully close the connection
   */
  async close() {
    await mqConfig.close();
  }
}

// Export singleton instance
module.exports = new MQService();
