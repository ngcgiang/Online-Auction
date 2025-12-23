const cron = require('node-cron');
const { sequelize, Product } = require('../models');
const mqService = require('../services/mqService');
const { Op } = require('sequelize');

/**
 * Auction Ending Scanner
 * Runs every 1 minute to detect and process expired auctions
 * Updates product status and publishes events to RabbitMQ
 */
class AuctionEndScanner {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
    this.scanInterval = '* * * * *'; // Every 1 minute (cron format)
  }

  /**
   * Initialize and start the cron job
   */
  start() {
    if (this.isRunning) {
      console.warn('⚠️ [Auction Scanner] Already running');
      return;
    }

    console.log('🚀 [Auction Scanner] Starting auction end scanner...');
    console.log(`⏰ [Auction Scanner] Schedule: Every 1 minute`);

    this.cronJob = cron.schedule(this.scanInterval, async () => {
      await this.scanExpiredAuctions();
    }, {
      scheduled: true,
      timezone: 'Asia/Ho_Chi_Minh' // Adjust to your timezone
    });

    this.isRunning = true;
    console.log('✅ [Auction Scanner] Scanner started successfully\n');
  }

  /**
   * Stop the cron job
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('🛑 [Auction Scanner] Scanner stopped');
    }
  }

  /**
   * Main scanning logic - Find and process expired auctions
   */
  async scanExpiredAuctions() {
    const scanStartTime = Date.now();
    console.log(`\n🔍 [${new Date().toISOString()}] Starting auction scan...`);

    let transaction;

    try {
      // Step 1: Find all expired active auctions
      const expiredProducts = await Product.findAll({
        where: {
          status: 'active',
          end_time: {
            [Op.lte]: new Date() // end_time <= NOW()
          }
        },
        attributes: ['product_id', 'product_name', 'seller_id', 'winner_id', 'current_price', 'end_time']
      });

      if (expiredProducts.length === 0) {
        console.log('✓ No expired auctions found');
        return;
      }

      console.log(`📦 Found ${expiredProducts.length} expired auction(s)`);

      // Step 2: Process each expired product
      let successCount = 0;
      let failCount = 0;

      for (const product of expiredProducts) {
        try {
          await this.processExpiredProduct(product);
          successCount++;
        } catch (error) {
          failCount++;
          console.error(`  ❌ Failed to process product #${product.product_id}:`, error.message);
          // Continue processing other products even if one fails
        }
      }

      // Summary
      const scanDuration = Date.now() - scanStartTime;
      console.log(`\n📊 Scan Summary:`);
      console.log(`   • Total: ${expiredProducts.length}`);
      console.log(`   • Success: ${successCount}`);
      console.log(`   • Failed: ${failCount}`);
      console.log(`   • Duration: ${scanDuration}ms\n`);

    } catch (error) {
      console.error('❌ [Auction Scanner] Error during scan:', error.message);
    }
  }

  /**
   * Process a single expired product
   * @param {Object} product - Product instance from database
   */
  async processExpiredProduct(product) {
    const transaction = await sequelize.transaction();

    try {
      console.log(`  🔄 Processing product #${product.product_id}: "${product.product_name}"`);

      // Step A: Update status based on winner existence
      const newStatus = product.winner_id !== null ? 'sold' : 'expired';
      await product.update(
        { status: newStatus },
        { transaction }
      );

      await transaction.commit();
      console.log(`  ✅ Status updated to 'expired'`);

      // Step B: Publish event to RabbitMQ based on winner existence
      if (product.winner_id === null) {
        // Case 1: No winner (no bids or all bids were invalid)
        await this.publishNoWinnerEvent(product);
      } else {
        // Case 2: Has winner
        await this.publishSuccessEvent(product);
      }

    } catch (error) {
      // Rollback transaction if anything fails
      if (transaction && !transaction.finished) {
        await transaction.rollback();
      }
      throw error; // Re-throw to be caught by parent
    }
  }

  /**
   * Publish AUCTION_ENDED_NO_BIDS event
   * @param {Object} product - Product instance
   */
  async publishNoWinnerEvent(product) {
    const payload = {
      event: 'AUCTION_ENDED_NO_BIDS',
      data: {
        product_id: product.product_id,
        product_name: product.product_name,
        seller_id: product.seller_id,
        end_time: product.end_time
      }
    };

    try {
      await mqService.publishToQueue('email_queue', payload);
      console.log(`  📤 Published AUCTION_ENDED_NO_BIDS event`);
    } catch (error) {
      console.error(`  ⚠️ Failed to publish event:`, error.message);
      // Don't throw - we already updated the status, email notification is secondary
    }
  }

  /**
   * Publish AUCTION_ENDED_SUCCESS event
   * @param {Object} product - Product instance
   */
  async publishSuccessEvent(product) {
    const payload = {
      event: 'AUCTION_ENDED_SUCCESS',
      data: {
        product_id: product.product_id,
        product_name: product.product_name,
        seller_id: product.seller_id,
        winner_id: product.winner_id,
        final_price: parseFloat(product.current_price),
        end_time: product.end_time
      }
    };

    try {
      await mqService.publishToQueue('email_queue', payload);
      console.log(`  📤 Published AUCTION_ENDED_SUCCESS event (Winner: User #${product.winner_id})`);
    } catch (error) {
      console.error(`  ⚠️ Failed to publish event:`, error.message);
      // Don't throw - we already updated the status, email notification is secondary
    }
  }

  /**
   * Manual trigger for testing (optional)
   */
  async triggerManualScan() {
    console.log('🔧 [Auction Scanner] Manual scan triggered');
    await this.scanExpiredAuctions();
  }
}

// Export singleton instance
module.exports = new AuctionEndScanner();
