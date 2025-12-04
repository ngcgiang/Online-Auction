const mqConfig = require('../config/mqConfig');
const emailService = require('../services/emailService');
const { User } = require('../models');

/**
 * RabbitMQ Email Worker (Consumer)
 * Listens to 'email_queue' and processes email sending tasks
 * Supports multiple event types: BID_PLACED, USER_REGISTERED, AUCTION_ENDED, etc.
 */
class EmailWorker {
  constructor() {
    this.queueName = 'email_queue';
    this.channel = null;
    this.isRunning = false;
  }

  /**
   * Start the email worker
   */
  async start() {
    try {
      console.log('🚀 Starting Email Worker...');

      // Get channel from connection pool
      this.channel = await mqConfig.getChannel();

      // Declare queue (idempotent)
      await this.channel.assertQueue(this.queueName, {
        durable: true // Queue survives broker restart
      });

      // Set prefetch to process one message at a time
      // This ensures fair distribution among multiple workers
      this.channel.prefetch(1);

      console.log(`✅ Email Worker listening on queue: '${this.queueName}'`);
      console.log('⏳ Waiting for messages. To exit press CTRL+C\n');

      this.isRunning = true;

      // Start consuming messages
      this.channel.consume(
        this.queueName,
        async (msg) => {
          if (msg !== null) {
            await this.processMessage(msg);
          }
        },
        {
          noAck: false // Manual acknowledgment
        }
      );

    } catch (error) {
      console.error('❌ Failed to start Email Worker:', error.message);
      // Retry after 5 seconds
      setTimeout(() => this.start(), 5000);
    }
  }

  /**
   * Process a single message from the queue
   * @param {Object} msg - RabbitMQ message object
   */
  async processMessage(msg) {
    const startTime = Date.now();
    let payload;

    try {
      // Parse message content
      payload = JSON.parse(msg.content.toString());
      console.log(`\n📨 [${new Date().toISOString()}] Received message:`, {
        event: payload.event,
        data: payload.data
      });

      // Route to appropriate handler based on event type
      switch (payload.event) {
        case 'BID_PLACED':
          await this.handleBidPlaced(payload.data);
          break;

        case 'AUCTION_ENDED_NO_BIDS':
          await this.handleAuctionEndedNoBids(payload.data);
          break;

        case 'AUCTION_ENDED_SUCCESS':
          await this.handleAuctionEndedSuccess(payload.data);
          break;

        case 'USER_REGISTERED':
          await this.handleUserRegistered(payload.data);
          break;

        case 'AUCTION_ENDED':
          await this.handleAuctionEnded(payload.data);
          break;

        default:
          console.warn(`⚠️ Unknown event type: ${payload.event}`);
      }

      // Acknowledge message after successful processing
      this.channel.ack(msg);

      const processingTime = Date.now() - startTime;
      console.log(`✅ Message processed successfully in ${processingTime}ms`);

    } catch (error) {
      console.error('❌ Error processing message:', error.message);
      console.error('📋 Payload:', payload);

      // Reject message and requeue if processing failed
      // In production, implement a retry limit and dead-letter queue
      this.channel.nack(msg, false, true);
    }
  }

  /**
   * Handle BID_PLACED event
   * Send notifications to: Seller, New Bidder, Previous Winner (only if winner changed)
   * @param {Object} data - Event payload
   */
  async handleBidPlaced(data) {
    const {
      product_id,
      product_name,
      new_price,
      seller_id,
      new_bidder_id,
      previous_winner_id,
      winner_changed
    } = data;

    console.log(`🔔 Processing BID_PLACED event for product #${product_id}`);
    console.log(`   Winner changed: ${winner_changed ? 'YES' : 'NO'}`);

    try {
      // Fetch user emails in parallel
      const userFetchPromises = [
        User.findByPk(seller_id, { attributes: ['user_id', 'email', 'full_name'] }),
        User.findByPk(new_bidder_id, { attributes: ['user_id', 'email', 'full_name'] })
      ];

      // Only fetch previous winner if winner actually changed
      if (previous_winner_id && winner_changed) {
        userFetchPromises.push(
          User.findByPk(previous_winner_id, { attributes: ['user_id', 'email', 'full_name'] })
        );
      }

      const users = await Promise.all(userFetchPromises);
      const [seller, newBidder, previousWinner] = users;

      // Validate users exist
      if (!seller || !newBidder) {
        throw new Error(`Missing user data: Seller (${seller_id}) or New Bidder (${new_bidder_id})`);
      }

      const bidData = {
        product_id,
        product_name,
        new_price,
        new_bidder_id
      };

      // Send emails in parallel (non-blocking)
      const emailPromises = [
        // 1. Notify Seller (always send)
        emailService.sendBidNotificationToSeller(seller.email, bidData)
          .then(() => console.log(`  ✅ Seller email sent to: ${seller.email}`))
          .catch(err => console.error(`  ❌ Failed to send seller email:`, err.message)),

        // 2. Notify New Bidder (always send)
        emailService.sendBidConfirmationToNewBidder(newBidder.email, bidData)
          .then(() => console.log(`  ✅ New bidder email sent to: ${newBidder.email}`))
          .catch(err => console.error(`  ❌ Failed to send new bidder email:`, err.message))
      ];

      // 3. Notify Previous Winner (ONLY if winner changed)
      if (previousWinner && winner_changed) {
        emailPromises.push(
          emailService.sendOutbidNotificationToPreviousWinner(previousWinner.email, bidData)
            .then(() => console.log(`  ✅ Previous winner email sent to: ${previousWinner.email}`))
            .catch(err => console.error(`  ❌ Failed to send previous winner email:`, err.message))
        );
      } else if (!winner_changed) {
        console.log(`  ℹ️ Winner unchanged - no outbid notification needed`);
      } else {
        console.log(`  ℹ️ No previous winner to notify (first bid)`);
      }

      // Wait for all emails to complete
      await Promise.allSettled(emailPromises);

      console.log(`🎉 BID_PLACED event processed successfully for product #${product_id}`);

    } catch (error) {
      console.error(`❌ Error in handleBidPlaced:`, error.message);
      throw error; // Re-throw to trigger message requeue
    }
  }

  /**
   * Handle AUCTION_ENDED_NO_BIDS event
   * Notify seller that auction ended with no bids
   * @param {Object} data - Event payload
   */
  async handleAuctionEndedNoBids(data) {
    const { product_id, product_name, seller_id, end_time } = data;
    
    console.log(`🏁 Processing AUCTION_ENDED_NO_BIDS event for product #${product_id}`);

    try {
      // Fetch seller information
      const seller = await User.findByPk(seller_id, { 
        attributes: ['user_id', 'email', 'full_name'] 
      });

      if (!seller) {
        throw new Error(`Seller not found: ${seller_id}`);
      }

      // Send notification email to seller
      await emailService.sendAuctionEndedNoBidsEmail(seller.email, {
        product_id,
        product_name,
        end_time
      });

      console.log(`  ✅ Auction ended (no bids) email sent to seller: ${seller.email}`);

    } catch (error) {
      console.error(`❌ Error in handleAuctionEndedNoBids:`, error.message);
      throw error;
    }
  }

  /**
   * Handle AUCTION_ENDED_SUCCESS event
   * Notify seller and winner that auction ended successfully
   * @param {Object} data - Event payload
   */
  async handleAuctionEndedSuccess(data) {
    const { product_id, product_name, seller_id, winner_id, final_price, end_time } = data;
    
    console.log(`🏁 Processing AUCTION_ENDED_SUCCESS event for product #${product_id}`);

    try {
      // Fetch seller and winner information in parallel
      const [seller, winner] = await Promise.all([
        User.findByPk(seller_id, { attributes: ['user_id', 'email', 'full_name'] }),
        User.findByPk(winner_id, { attributes: ['user_id', 'email', 'full_name'] })
      ]);

      if (!seller || !winner) {
        throw new Error(`Missing user data: Seller (${seller_id}) or Winner (${winner_id})`);
      }

      const auctionData = {
        product_id,
        product_name,
        final_price,
        end_time,
        winner_name: winner.full_name,
        winner_id
      };

      // Send emails to both seller and winner in parallel
      const emailPromises = [
        emailService.sendAuctionWonEmailToSeller(seller.email, auctionData)
          .then(() => console.log(`  ✅ Auction success email sent to seller: ${seller.email}`))
          .catch(err => console.error(`  ❌ Failed to send seller email:`, err.message)),

        emailService.sendAuctionWonEmailToWinner(winner.email, auctionData)
          .then(() => console.log(`  ✅ Congratulations email sent to winner: ${winner.email}`))
          .catch(err => console.error(`  ❌ Failed to send winner email:`, err.message))
      ];

      await Promise.allSettled(emailPromises);

      console.log(`🎉 AUCTION_ENDED_SUCCESS event processed successfully for product #${product_id}`);

    } catch (error) {
      console.error(`❌ Error in handleAuctionEndedSuccess:`, error.message);
      throw error;
    }
  }

  /**
   * Handle USER_REGISTERED event (placeholder)
   * @param {Object} data - Event payload
   */
  async handleUserRegistered(data) {
    console.log(`📧 Processing USER_REGISTERED event for user #${data.user_id}`);
    // TODO: Implement welcome email logic
    console.log('  ℹ️ USER_REGISTERED handler not implemented yet');
  }

  /**
   * Handle AUCTION_ENDED event (placeholder - deprecated, use specific events above)
   * @param {Object} data - Event payload
   */
  async handleAuctionEnded(data) {
    console.log(`🏁 Processing AUCTION_ENDED event for product #${data.product_id}`);
    // TODO: Implement auction end notification logic
    console.log('  ℹ️ AUCTION_ENDED handler not implemented yet');
  }

  /**
   * Gracefully stop the worker
   */
  async stop() {
    try {
      if (this.isRunning) {
        console.log('\n🛑 Stopping Email Worker...');
        this.isRunning = false;
        await mqConfig.close();
        console.log('✅ Email Worker stopped gracefully');
        process.exit(0);
      }
    } catch (error) {
      console.error('❌ Error stopping Email Worker:', error.message);
      process.exit(1);
    }
  }
}

// Initialize and start worker
const worker = new EmailWorker();

// Handle graceful shutdown
process.on('SIGINT', () => worker.stop());
process.on('SIGTERM', () => worker.stop());

// Start the worker
worker.start();

module.exports = worker;
