#!/usr/bin/env node

require('dotenv').config({ path: '../../.env' });
const { connectToDatabase, closeConnection, processInBatches } = require('../utils/dbUtils');
const logger = require('../utils/silentLogger');

// Import models
const Booking = require('../../models/BookingModel');

// Valid booking states in order of progression
const VALID_STATES = [
  'PENDING',       // Initial state
  'CONFIRMED',     // Owner accepted
  'PAYMENT_PENDING',// Waiting for payment
  'PAID',          // Payment received
  'IN_TRANSIT',    // Truck is on the way
  'DELIVERED',     // Delivery completed
  'COMPLETED',     // All done, payment settled
  'CANCELLED',     // Booking was cancelled
  'REJECTED',      // Owner rejected
  'EXPIRED'        // No response from owner
];

// Valid state transitions
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED', 'EXPIRED'],
  CONFIRMED: ['PAYMENT_PENDING', 'CANCELLED'],
  PAYMENT_PENDING: ['PAID', 'CANCELLED'],
  PAID: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['DELIVERED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
  REJECTED: [],
  EXPIRED: []
};

// Track state changes for summary
const stateChanges = new Map();

/**
 * Validates and fixes a booking's state
 */
async function fixBookingState(booking, { dryRun = true } = {}) {
  const result = { updated: false };
  const now = new Date();
  
  // Check if the current state is valid
  if (!VALID_STATES.includes(booking.status)) {
    result.updated = true;
    result.from = booking.status;
    result.to = 'PENDING';
    
    if (!dryRun) {
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { status: 'PENDING', updatedAt: now } }
      );
    }
  } 
  // Check if booking end time has passed
  else if (booking.endTime && booking.endTime < now && !['COMPLETED', 'CANCELLED'].includes(booking.status)) {
    result.updated = true;
    result.from = booking.status;
    result.to = 'COMPLETED';
    
    if (!dryRun) {
      await Booking.updateOne(
        { _id: booking._id },
        { $set: { status: 'COMPLETED', updatedAt: now } }
      );
    }
  }
  
  // Track state changes for summary
  if (result.updated) {
    const key = `${result.from} → ${result.to}`;
    stateChanges.set(key, (stateChanges.get(key) || 0) + 1);
  }
  
  return result;
}

/**
 * Main function to run the migration
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--apply');
  
  logger.info('START_BOOKING_STATE_FIX', { 
    dryRun,
    timestamp: new Date().toISOString() 
  });
  
  try {
    // Connect to database
    await connectToDatabase(process.env.MONGO_URI);
    
    // Process bookings in batches
    const result = await processInBatches(
      Booking,
      {},
      fixBookingState,
      {
        batchSize: 200,
        dryRun,
        select: '_id status startTime endTime',
        sort: { createdAt: 1 }
      }
    );
    
    // Log summary of state changes
    if (stateChanges.size > 0) {
      logger.info('BOOKING_STATE_CHANGES_SUMMARY', {
        changes: Object.fromEntries(stateChanges),
        dryRun
      });
    }
    
    logger.info('FINISH_BOOKING_STATE_FIX', {
      ...result,
      dryRun,
      duration: `${(Date.now() - startTime) / 1000}s`
    });
    
    await closeConnection();
    process.exit(0);
    
  } catch (error) {
    logger.error('BOOKING_STATE_FIX_ERROR', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
    
    try {
      await closeConnection();
    } catch (e) {
      // Ignore close errors
    }
    
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  const startTime = Date.now();
  main().catch(console.error);
}

module.exports = {
  fixBookingState,
  VALID_STATES,
  VALID_TRANSITIONS
};
