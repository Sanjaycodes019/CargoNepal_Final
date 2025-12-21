/**
 * Enhanced Truck Status Utility
 * Provides detailed status information for truck displays
 */

const Booking = require('../models/BookingModel');
const logger = require('./logger');

/**
 * Get enhanced truck status with booking details
 * @param {Object} truck - Truck document
 * @returns {Promise<Object>} - Enhanced status information
 */
const getEnhancedTruckStatus = async (truck) => {
  try {
    // Check if owner has turned off the truck (highest priority)
    if (truck.ownerTurnedOff) {
      return {
        status: 'Busy/Owner has turned off',
        statusType: 'owner_off',
        available: false,
        details: 'Owner has temporarily turned off this truck'
      };
    }

    // Check for active bookings
    const activeBookings = await Booking.find({
      truck: truck._id,
      status: { $in: ['accepted', 'in_transit'] }
    }).sort({ endTime: 1 });

    if (activeBookings.length > 0) {
      const latestBooking = activeBookings[activeBookings.length - 1];
      const endDate = new Date(latestBooking.endTime);
      const formattedDate = endDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      return {
        status: `Booked till ${formattedDate}`,
        statusType: 'booked',
        available: false,
        details: `Currently booked until ${formattedDate}`,
        bookingInfo: {
          endTime: latestBooking.endTime,
          status: latestBooking.status
        }
      };
    }

    // Check for pending bookings
    const pendingBookings = await Booking.find({
      truck: truck._id,
      status: 'pending'
    });

    if (pendingBookings.length > 0) {
      return {
        status: 'Pending bookings',
        statusType: 'pending',
        available: true,
        details: 'Has pending booking requests'
      };
    }

    // Check actual availability set by owner
    if (!truck.available) {
      return {
        status: 'Busy/Marked by owner',
        statusType: 'owner_busy',
        available: false,
        details: 'Owner has marked this truck as busy'
      };
    }

    // Truck is available
    return {
      status: 'Available',
      statusType: 'available',
      available: true,
      details: 'Ready for booking'
    };

  } catch (error) {
    logger.error('TRUCK_STATUS_ERROR', {
      truckId: truck._id,
      error: error.message
    });
    return {
      status: truck.available ? 'Available' : 'Busy',
      statusType: truck.available ? 'available' : 'busy',
      available: truck.available,
      details: 'Status information unavailable'
    };
  }
};

/**
 * Get status color and styling based on status type
 * @param {string} statusType - Status type
 * @returns {Object} - Color and styling information
 */
const getStatusStyling = (statusType) => {
  const styles = {
    available: {
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      borderColor: 'border-green-300',
      badgeColor: 'bg-green-500'
    },
    booked: {
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      borderColor: 'border-blue-300',
      badgeColor: 'bg-blue-500'
    },
    owner_off: {
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-700',
      borderColor: 'border-orange-300',
      badgeColor: 'bg-orange-500'
    },
    pending: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-300',
      badgeColor: 'bg-yellow-500'
    },
    busy: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      borderColor: 'border-red-300',
      badgeColor: 'bg-red-500'
    }
  };

  return styles[statusType] || styles.busy;
};

module.exports = {
  getEnhancedTruckStatus,
  getStatusStyling
};
