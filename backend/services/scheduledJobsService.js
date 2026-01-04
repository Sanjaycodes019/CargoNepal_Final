/**
 * Scheduled Jobs Service
 * Handles automated tasks like updating truck availability when booking dates pass
 */

const Booking = require('../models/BookingModel');
const Truck = require('../models/TruckModel');
const logger = require('../utils/logger');

/**
 * Update truck availability for expired bookings
 * This function should be called periodically (e.g., every hour)
 */
const updateExpiredBookings = async () => {
  try {
    logger.info('SCHEDULED_JOB_START', { job: 'updateExpiredBookings' });

    const now = new Date();

    // Find all bookings that have passed their end time but are still active
    const expiredBookings = await Booking.find({
      endTime: { $lt: now },
      status: { $in: ['accepted', 'in_transit'] }
    }).populate('truck');

    logger.info('EXPIRED_BOOKINGS_FOUND', { 
      count: expiredBookings.length,
      currentTime: now.toISOString()
    });

    let updatedTrucks = 0;

    for (const booking of expiredBookings) {
      try {
        // Update booking status to completed
        booking.status = 'completed';
        await booking.save();

        logger.info('BOOKING_AUTO_COMPLETED', {
          bookingId: booking._id,
          truckId: booking.truck._id,
          endTime: booking.endTime,
          actualTime: now.toISOString()
        });

        // Check if truck has other active bookings
        const activeBookings = await Booking.find({
          truck: booking.truck._id,
          status: { $in: ['pending', 'accepted', 'in_transit'] },
          _id: { $ne: booking._id }
        });

        // Only set truck to available if no other active bookings exist
        if (activeBookings.length === 0) {
          const truck = booking.truck;
          truck.available = true;
          await truck.save();

          logger.info('TRUCK_AUTO_AVAILABLE', {
            truckId: truck._id,
            bookingId: booking._id,
            reason: 'booking_expired_no_other_active_bookings'
          });

          updatedTrucks++;
        }
      } catch (error) {
        logger.error('ERROR_UPDATING_EXPIRED_BOOKING', {
          bookingId: booking._id,
          error: error.message,
          stack: error.stack
        });
      }
    }

    logger.info('SCHEDULED_JOB_COMPLETE', { 
      job: 'updateExpiredBookings',
      expiredBookingsProcessed: expiredBookings.length,
      trucksUpdated: updatedTrucks
    });

    return {
      success: true,
      expiredBookingsProcessed: expiredBookings.length,
      trucksUpdated: updatedTrucks
    };

  } catch (error) {
    logger.error('SCHEDULED_JOB_ERROR', {
      job: 'updateExpiredBookings',
      error: error.message,
      stack: error.stack
    });

    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get enhanced truck status with booking information
 */
const getEnhancedTruckStatus = async (truckId) => {
  try {
    const truck = await Truck.findById(truckId);
    if (!truck) {
      return { status: 'not_found', message: 'Truck not found' };
    }

    // If truck is manually turned off by owner
    if (truck.ownerTurnedOff) {
      return {
        status: 'owner_offline',
        statusType: 'unavailable',
        message: 'Owner turned off truck',
        available: false
      };
    }

    // If truck is marked as unavailable
    if (!truck.available) {
      // Find the most recent active booking
      const activeBooking = await Booking.findOne({
        truck: truckId,
        status: { $in: ['pending', 'accepted', 'in_transit'] }
      }).sort({ endTime: 1 });

      if (activeBooking) {
        const endTime = new Date(activeBooking.endTime);
        const now = new Date();
        
        if (endTime > now) {
          return {
            status: `Booked till ${endTime.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}`,
            statusType: 'booked',
            message: `Booked till ${endTime.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            })}`,
            available: false,
            bookingId: activeBooking._id,
            endTime: endTime
          };
        } else {
          // Booking has expired, should be available
          return {
            status: 'Available',
            statusType: 'available',
            message: 'Available',
            available: true
          };
        }
      } else {
        // No active bookings, but truck is manually marked as unavailable
        return {
          status: 'Busy',
          statusType: 'booked',
          message: 'Owner marked as busy',
          available: false
        };
      }
    }

    // Truck is available
    return {
      status: 'Available',
      statusType: 'available',
      message: 'Available',
      available: true
    };

  } catch (error) {
    logger.error('ERROR_GETTING_ENHANCED_STATUS', {
      truckId,
      error: error.message
    });

    return {
      status: 'error',
      statusType: 'error',
      message: 'Error checking status',
      available: false
    };
  }
};

module.exports = {
  updateExpiredBookings,
  getEnhancedTruckStatus
};
