/**
 * Booking Service with Smart Conflict Detection
 * Handles booking operations with time-based availability checking
 */

const Booking = require('../models/BookingModel');
const Truck = require('../models/TruckModel');
const { checkBookingConflict, validateBookingTime, getAvailableTimeSlots } = require('../utils/bookingConflictDetector');

/**
 * Create a new booking with conflict detection
 */
const createBooking = async (bookingData) => {
  try {
    const { truckId, customerId, startTime, endTime, pickup, dropoff, capacityTons, notes } = bookingData;

    // Validate time constraints
    const timeValidation = validateBookingTime(new Date(startTime), new Date(endTime));
    if (!timeValidation.isValid) {
      throw new Error(`Invalid booking time: ${timeValidation.errors.join(', ')}`);
    }

    // Check if truck exists and is available
    const truck = await Truck.findById(truckId).populate('owner');
    if (!truck) {
      throw new Error('Truck not found');
    }

    // Check for booking conflicts
    const conflictCheck = await checkBookingConflict(truckId, new Date(startTime), new Date(endTime));
    if (conflictCheck.hasConflict) {
      const conflictDetails = conflictCheck.conflicts.map(conflict => 
        `Conflicts with booking from ${conflict.startTime} to ${conflict.endTime} (Status: ${conflict.status})`
      ).join(', ');
      
      throw new Error(`Booking conflict detected: ${conflictDetails}`);
    }

    // Calculate estimated duration
    const durationMs = new Date(endTime) - new Date(startTime);
    const estimatedDuration = durationMs / (1000 * 60 * 60); // Convert to hours

    // Create the booking
    const booking = new Booking({
      truck: truckId,
      owner: truck.owner._id,
      customer: customerId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      estimatedDuration,
      pickup,
      dropoff,
      capacityTons,
      notes,
      status: 'pending'
    });

    await booking.save();

    // Populate booking details for response
    await booking.populate([
      { path: 'truck', select: 'title type capacityTons ratePerKm location' },
      { path: 'owner', select: 'name email phone' },
      { path: 'customer', select: 'name email phone' }
    ]);

    return {
      success: true,
      data: booking,
      message: 'Booking created successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
};

/**
 * Update booking with conflict detection
 */
const updateBooking = async (bookingId, updateData, userId, userRole) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('truck')
      .populate('customer');

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check permissions
    if (userRole === 'customer' && booking.customer._id.toString() !== userId) {
      throw new Error('Unauthorized to update this booking');
    }

    if (userRole === 'owner' && booking.truck.owner.toString() !== userId) {
      throw new Error('Unauthorized to update this booking');
    }

    // If time is being updated, check for conflicts
    if (updateData.startTime || updateData.endTime) {
      const newStartTime = updateData.startTime ? new Date(updateData.startTime) : booking.startTime;
      const newEndTime = updateData.endTime ? new Date(updateData.endTime) : booking.endTime;

      // Validate time constraints
      const timeValidation = validateBookingTime(newStartTime, newEndTime);
      if (!timeValidation.isValid) {
        throw new Error(`Invalid booking time: ${timeValidation.errors.join(', ')}`);
      }

      // Check for conflicts (exclude current booking)
      const conflictCheck = await checkBookingConflict(
        booking.truck._id, 
        newStartTime, 
        newEndTime, 
        bookingId
      );

      if (conflictCheck.hasConflict) {
        throw new Error(`Booking conflict detected: ${conflictCheck.message}`);
      }

      // Update estimated duration
      const durationMs = newEndTime - newStartTime;
      updateData.estimatedDuration = durationMs / (1000 * 60 * 60);
    }

    // Update the booking
    Object.assign(booking, updateData);
    await booking.save();

    // Auto-manage truck availability based on booking status
    if (updateData.status) {
      const truck = await Truck.findById(booking.truck._id);
      
      if (updateData.status === 'accepted' || updateData.status === 'in_transit') {
        // Set truck to unavailable when booking is accepted or in transit
        truck.available = false;
        await truck.save();
      } else if (updateData.status === 'completed' || updateData.status === 'cancelled') {
        // Check if there are any other active bookings for this truck
        const activeBookings = await Booking.find({
          truck: booking.truck._id,
          status: { $in: ['pending', 'accepted', 'in_transit'] },
          _id: { $ne: bookingId }
        });
        
        // Only set truck to available if no other active bookings exist
        if (activeBookings.length === 0) {
          truck.available = true;
          await truck.save();
        }
      }
    }

    // Populate updated booking
    await booking.populate([
      { path: 'truck', select: 'title type capacityTons ratePerKm location' },
      { path: 'owner', select: 'name email phone' },
      { path: 'customer', select: 'name email phone' }
    ]);

    return {
      success: true,
      data: booking,
      message: 'Booking updated successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
};

/**
 * Get available time slots for a truck
 */
const getTruckAvailability = async (truckId, startDate, endDate, slotDuration = 2) => {
  try {
    // Check if truck exists
    const truck = await Truck.findById(truckId);
    if (!truck) {
      throw new Error('Truck not found');
    }

    // Get available slots
    const availableSlots = await getAvailableTimeSlots(
      truckId, 
      new Date(startDate), 
      new Date(endDate), 
      slotDuration
    );

    return {
      success: true,
      data: {
        truckId,
        truckTitle: truck.title,
        startDate,
        endDate,
        slotDuration,
        availableSlots,
        totalSlots: availableSlots.length
      },
      message: 'Availability retrieved successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
};

/**
 * Check booking conflicts (for validation before booking)
 */
const checkBookingConflicts = async (truckId, startTime, endTime) => {
  try {
    const conflictCheck = await checkBookingConflict(truckId, new Date(startTime), new Date(endTime));
    
    return {
      success: true,
      data: conflictCheck,
      message: conflictCheck.hasConflict ? 'Conflicts found' : 'No conflicts'
    };

  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
};

/**
 * Get user's bookings with conflict information
 */
const getUserBookings = async (userId, userRole) => {
  try {
    let query = {};
    
    if (userRole === 'customer') {
      query.customer = userId;
    } else if (userRole === 'owner') {
      query.owner = userId;
    } else if (userRole === 'admin') {
      // Admin can see all bookings
    }

    const bookings = await Booking.find(query)
      .populate('truck', 'title type capacityTons ratePerKm location')
      .populate('customer', 'name email phone')
      .populate('owner', 'name email phone')
      .sort({ startTime: 1 });

    return {
      success: true,
      data: bookings,
      message: 'Bookings retrieved successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
};

/**
 * Cancel booking (with conflict check for rescheduling)
 */
const cancelBooking = async (bookingId, userId, userRole) => {
  try {
    const booking = await Booking.findById(bookingId).populate('customer truck');

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check permissions
    if (userRole === 'customer' && booking.customer._id.toString() !== userId) {
      throw new Error('Unauthorized to cancel this booking');
    }

    if (userRole === 'owner' && booking.truck.owner.toString() !== userId) {
      throw new Error('Unauthorized to cancel this booking');
    }

    // Only allow cancellation of pending or accepted bookings
    if (!['pending', 'accepted'].includes(booking.status)) {
      throw new Error('Cannot cancel booking that is already in transit or completed');
    }

    booking.status = 'cancelled';
    await booking.save();

    // Auto-manage truck availability when booking is cancelled
    const truck = await Truck.findById(booking.truck._id);
    
    // Check if there are any other active bookings for this truck
    const activeBookings = await Booking.find({
      truck: booking.truck._id,
      status: { $in: ['pending', 'accepted', 'in_transit'] },
      _id: { $ne: bookingId }
    });
    
    // Only set truck to available if no other active bookings exist
    if (activeBookings.length === 0) {
      truck.available = true;
      await truck.save();
    }

    return {
      success: true,
      data: booking,
      message: 'Booking cancelled successfully'
    };

  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: null
    };
  }
};

module.exports = {
  createBooking,
  updateBooking,
  getTruckAvailability,
  checkBookingConflicts,
  getUserBookings,
  cancelBooking
};
