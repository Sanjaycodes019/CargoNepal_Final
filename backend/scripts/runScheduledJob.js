/**
 * Cron Job Script for Automatic Truck Availability
 * This script should be run periodically (e.g., every hour) to update expired bookings
 */

require('dotenv').config();
const { updateExpiredBookings } = require('./services/scheduledJobsService');
const logger = require('./utils/logger');

/**
 * Main function to run the scheduled job
 */
const runScheduledJob = async () => {
  try {
    console.log('🚀 Starting scheduled job for expired bookings...');
    console.log(`⏰ Current time: ${new Date().toISOString()}`);
    
    const result = await updateExpiredBookings();
    
    if (result.success) {
      console.log('✅ Scheduled job completed successfully!');
      console.log(`📊 Processed ${result.expiredBookingsProcessed} expired bookings`);
      console.log(`🚚 Updated ${result.trucksUpdated} trucks to available`);
      
      // Log summary
      logger.info('SCHEDULED_JOB_SUCCESS', {
        expiredBookingsProcessed: result.expiredBookingsProcessed,
        trucksUpdated: result.trucksUpdated,
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('❌ Scheduled job failed:', result.error);
      logger.error('SCHEDULED_JOB_FAILED', {
        error: result.error,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('💥 Unexpected error running scheduled job:', error);
    logger.error('SCHEDULED_JOB_UNEXPECTED_ERROR', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  }
};

// Run the job if this script is executed directly
if (require.main === module) {
  runScheduledJob()
    .then(() => {
      console.log('🏁 Scheduled job execution finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Fatal error in scheduled job:', error);
      process.exit(1);
    });
}

module.exports = { runScheduledJob };
