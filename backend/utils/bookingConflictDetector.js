/**
 * Smart Booking Conflict Detection Utility
 * Implements time-window based availability checking
 */

const Booking = require('../models/BookingModel');

/**
 * Check if two time ranges overlap
 * Overlap condition: (startA < endB && endA > startB)
 */
const timeRangesOverlap = (startA, endA, startB, endB) => {
  return startA < endB && endA > startB;
};

/**
 * Check for booking conflicts for a specific truck
 * @param {string} truckId - Truck ID
 * @param {Date} startTime - New booking start time
 * @param {Date} endTime - New booking end time
 * @param {string} excludeBookingId - Optional: exclude current booking from check (for updates)
 * @returns {Promise<Object>} - Conflict detection result
 */
const checkBookingConflict = async (truckId, startTime, endTime, excludeBookingId = null) => {
  try {
    // Validate inputs
    if (!truckId || !startTime || !endTime) {
      throw new Error('Missing required parameters: truckId, startTime, endTime');
    }
    
    // Validate that startTime and endTime are valid dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error('Invalid date format for startTime or endTime');
    }
    
    if (start >= end) {
      throw new Error('startTime must be before endTime');
    }
    // Find existing bookings that might conflict
    const conflictQuery = {
      truck: truckId,
      status: { $in: ['pending', 'accepted', 'in_transit'] }, // Only active bookings
      $or: [
        // Overlap condition 1: New booking starts during existing booking
        {
          startTime: { $lte: start },
          endTime: { $gt: start }
        },
        // Overlap condition 2: New booking ends during existing booking
        {
          startTime: { $lt: end },
          endTime: { $gte: end }
        },
        // Overlap condition 3: New booking completely contains existing booking
        {
          startTime: { $gte: start },
          endTime: { $lte: end }
        }
      ]
    };

    // Exclude current booking if updating
    if (excludeBookingId) {
      conflictQuery._id = { $ne: excludeBookingId };
    }

    const conflictingBookings = await Booking.find(conflictQuery)
      .populate('customer', 'name email')
      .populate('owner', 'name email')
      .select('startTime endTime status customer owner');

    if (conflictingBookings.length > 0) {
      return {
        hasConflict: true,
        conflicts: conflictingBookings.map(booking => ({
          bookingId: booking._id,
          startTime: booking.startTime,
          endTime: booking.endTime,
          status: booking.status,
          customer: booking.customer?.name || 'Unknown',
          owner: booking.owner?.name || 'Unknown'
        })),
        message: `Truck is already booked during the requested time period`
      };
    }

    return {
      hasConflict: false,
      conflicts: [],
      message: 'Time slot is available'
    };

  } catch (error) {
    throw new Error(`Conflict detection failed: ${error.message}`);
  }
};

/**
 * Get available time slots for a truck within a date range
 * @param {string} truckId - Truck ID
 * @param {Date} startDate - Start of search window
 * @param {Date} endDate - End of search window
 * @param {number} slotDuration - Duration of each slot in hours (default: 2)
 * @returns {Promise<Array>} - Available time slots
 */
const getAvailableTimeSlots = async (truckId, startDate, endDate, slotDuration = 2) => {
  try {
    // Get all existing bookings in the time range
    const existingBookings = await Booking.find({
      truck: truckId,
      status: { $in: ['pending', 'accepted', 'in_transit'] },
      $or: [
        { startTime: { $lte: endDate }, endTime: { $gte: startDate } }
      ]
    }).select('startTime endTime');

    // Generate time slots and filter out conflicts
    const availableSlots = [];
    const slotDurationMs = slotDuration * 60 * 60 * 1000; // Convert to milliseconds

    let currentSlotStart = new Date(startDate);
    
    while (currentSlotStart < endDate) {
      const currentSlotEnd = new Date(currentSlotStart.getTime() + slotDurationMs);
      
      // Check if this slot conflicts with any existing booking
      const hasConflict = existingBookings.some(booking => {
        return timeRangesOverlap(
          currentSlotStart, 
          currentSlotEnd, 
          booking.startTime, 
          booking.endTime
        );
      });

      if (!hasConflict) {
        availableSlots.push({
          startTime: new Date(currentSlotStart),
          endTime: new Date(currentSlotEnd),
          duration: slotDuration
        });
      }

      // Move to next slot
      currentSlotStart = new Date(currentSlotStart.getTime() + slotDurationMs);
    }

    return availableSlots;

  } catch (error) {
    throw new Error(`Failed to get available slots: ${error.message}`);
  }
};

/**
 * Validate booking time constraints
 * @param {Date} startTime - Booking start time
 * @param {Date} endTime - Booking end time
 * @param {number} maxDuration - Maximum allowed duration in hours (default: 168 = 7 days)
 * @returns {Object} - Validation result
 */
const validateBookingTime = (startTime, endTime, maxDuration = 168) => {
  const now = new Date();
  const durationMs = endTime - startTime;
  const durationHours = durationMs / (1000 * 60 * 60);

  const validation = {
    isValid: true,
    errors: []
  };

  // Check if start time is in the future
  if (startTime <= now) {
    validation.isValid = false;
    validation.errors.push('Start time must be in the future');
  }

  // Check if end time is after start time
  if (endTime <= startTime) {
    validation.isValid = false;
    validation.errors.push('End time must be after start time');
  }

  // Check maximum duration
  if (durationHours > maxDuration) {
    validation.isValid = false;
    validation.errors.push(`Booking duration cannot exceed ${maxDuration} hours`);
  }

  // Check minimum duration (30 minutes)
  if (durationHours < 0.5) {
    validation.isValid = false;
    validation.errors.push('Booking duration must be at least 30 minutes');
  }

  return validation;
};

module.exports = {
  checkBookingConflict,
  getAvailableTimeSlots,
  validateBookingTime,
  timeRangesOverlap
};
