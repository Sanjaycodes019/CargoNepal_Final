const Booking = require('../models/BookingModel');
const Truck = require('../models/TruckModel');
const Notification = require('../models/NotificationModel');
const { getRouteDistance, calculatePrice } = require('../utils/distanceCalculator');
const { geocodeLocation } = require('../utils/geocoding');
const bookingService = require('../services/bookingService');
const logger = require('../utils/logger');

// Create booking (customer) with smart conflict detection
const createBooking = async (req, res) => {
  try {
    const { truckId, pickup, dropoff, notes, capacityTons, startTime, endTime } = req.body;
    
    logger.info('BOOKING_CREATE_ATTEMPT', { 
      userId: req.user?.id, 
      truckId,
      hasPickup: !!pickup,
      hasDropoff: !!dropoff,
      capacityTons
    });

    if (!truckId || !pickup || !dropoff) {
      logger.warn('BOOKING_VALIDATION_FAILED', { 
        error: 'Missing required fields', 
        missingFields: [
          !truckId && 'truckId',
          !pickup && 'pickup',
          !dropoff && 'dropoff'
        ].filter(Boolean)
      });
      return res.status(400).json({
        success: false,
        message: 'Please provide truckId, pickup, and dropoff locations',
      });
    }

    // Validate capacityTons presence and correctness
    if (capacityTons === undefined || capacityTons === null) {
      logger.warn('BOOKING_VALIDATION_FAILED', { error: 'Missing capacityTons' });
      return res.status(400).json({
        success: false,
        message: 'capacityTons is required',
      });
    }

    const capacityNum = Number(capacityTons);
    if (isNaN(capacityNum) || capacityNum <= 0) {
      logger.warn('BOOKING_VALIDATION_FAILED', { 
        error: 'Invalid capacityTons', 
        provided: capacityTons 
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid capacityTons value',
      });
    }

    // Validate time slots for conflict detection
    if (!startTime || !endTime) {
      logger.warn('BOOKING_VALIDATION_FAILED', { 
        error: 'Missing time slots',
        missingFields: [
          !startTime && 'startTime',
          !endTime && 'endTime'
        ].filter(Boolean)
      });
      return res.status(400).json({
        success: false,
        message: 'startTime and endTime are required for time-based booking',
      });
    }

    // Geocode locations if coordinates are not provided
    let pickupCoords = { lat: pickup.lat, lng: pickup.lng };
    let dropoffCoords = { lat: dropoff.lat, lng: dropoff.lng };
    
    logger.debug('BOOKING_GEOCODE_START', { 
      hasPickupCoords: !!(pickup.lat && pickup.lng),
      hasDropoffCoords: !!(dropoff.lat && dropoff.lng)
    });

    if (!pickup.lat || !pickup.lng) {
      if (!pickup.address) {
        return res.status(400).json({
          success: false,
          message: 'Please provide pickup location address',
        });
      }
      try {
        logger.debug('GEOCODING_ATTEMPT', { type: 'pickup', address: pickup.address });
        pickupCoords = await geocodeLocation(pickup.address);
        logger.debug('GEOCODING_SUCCESS', { type: 'pickup', coords: pickupCoords });
      } catch (error) {
        logger.error('GEOCODING_FAILED', { 
          type: 'pickup', 
          address: pickup.address,
          error: error.message 
        });
        return res.status(400).json({
          success: false,
          message: `Could not find pickup location: ${error.message}`,
        });
      }
    }

    if (!dropoff.lat || !dropoff.lng) {
      if (!dropoff.address) {
        return res.status(400).json({
          success: false,
          message: 'Please provide dropoff location address',
        });
      }
      try {
        logger.debug('GEOCODING_ATTEMPT', { type: 'dropoff', address: dropoff.address });
        dropoffCoords = await geocodeLocation(dropoff.address);
        logger.debug('GEOCODING_SUCCESS', { type: 'dropoff', coords: dropoffCoords });
      } catch (error) {
        logger.error('GEOCODING_FAILED', { 
          type: 'dropoff', 
          address: dropoff.address,
          error: error.message 
        });
        return res.status(400).json({
          success: false,
          message: `Could not find dropoff location: ${error.message}`,
        });
      }
    }

    // Finalize pickup and dropoff info with coords
    const finalPickup = {
      address: pickup.address || `${pickupCoords.lat}, ${pickupCoords.lng}`,
      lat: pickupCoords.lat,
      lng: pickupCoords.lng,
    };

    const finalDropoff = {
      address: dropoff.address || `${dropoffCoords.lat}, ${dropoffCoords.lng}`,
      lat: dropoffCoords.lat,
      lng: dropoffCoords.lng,
    };

    // Fetch truck
    logger.debug('FETCHING_TRUCK', { truckId });
    const truck = await Truck.findById(truckId);
    if (!truck) {
      logger.warn('TRUCK_NOT_FOUND', { truckId });
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    // Check if truck is verified
    if (!truck.isVerified) {
      logger.warn('TRUCK_NOT_VERIFIED', { 
        truckId: truck._id,
        ownerId: truck.owner,
        message: 'Attempt to book unverified truck' 
      });
      return res.status(403).json({ 
        success: false, 
        message: 'This truck is not verified yet. Only verified trucks can be booked.' 
      });
    }

    // Check if customer is verified
    const Customer = require('../models/CustomerModel');
    const customer = await Customer.findById(req.user.id);
    if (!customer || !customer.isVerified) {
      logger.warn('CUSTOMER_NOT_VERIFIED', { 
        userId: req.user.id,
        isCustomerFound: !!customer,
        isVerified: customer?.isVerified
      });
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is not verified yet. Only verified customers can book trucks.' 
      });
    }

    // Calculate distance using OSRM routing
    const routeData = await getRouteDistance(
      finalPickup.lat,
      finalPickup.lng,
      finalDropoff.lat,
      finalDropoff.lng
    );
    const distanceKm = routeData.distanceKm;
    
    // Calculate price
    const ratePerKm = truck.ratePerKm || process.env.DEFAULT_RATE_PER_KM || 25;
    const price = calculatePrice(distanceKm, ratePerKm);
    
    logger.debug('BOOKING_CALCULATIONS', {
      distanceKm: Math.round(distanceKm * 100) / 100,
      ratePerKm,
      calculatedPrice: price
    });

    // Use booking service with conflict detection
    const bookingData = {
      truckId,
      customerId: req.user.id,
      startTime,
      endTime,
      pickup: finalPickup,
      dropoff: finalDropoff,
      capacityTons: capacityNum,
      notes
    };

    logger.debug('CREATING_BOOKING', { 
      userId: req.user.id,
      truckId,
      startTime,
      endTime,
      capacityTons: capacityNum
    });

    const result = await bookingService.createBooking(bookingData);

    if (!result.success) {
      logger.warn('BOOKING_CONFLICT', { 
        userId: req.user.id,
        truckId,
        message: result.message,
        hasConflicts: !!result.conflicts
      });
      return res.status(400).json({
        success: false,
        message: result.message,
        conflicts: result.conflicts || null
      });
    }

    const booking = result.data;

    // Update booking with calculated distance and price
    booking.distanceKm = Math.round(distanceKm * 100) / 100;
    booking.price = price;
    await booking.save();

    logger.info('BOOKING_CREATED', {
      bookingId: booking._id,
      customerId: booking.customerId,
      truckId: booking.truckId,
      status: booking.status,
      distanceKm: booking.distanceKm,
      price: booking.price
    });

    // Re-populate for response
    await booking.populate([
      { path: 'truck', select: 'title type capacityTons ratePerKm imageUrl' },
      { path: 'owner', select: 'name email phone' }
    ]);

    // Create notification for owner
    const ownerNotification = await Notification.create({
      userId: truck.owner,
      userRole: 'owner',
      message: `New booking request for ${booking.truck.title} (${booking.startTime} - ${booking.endTime})`,
      type: 'booking',
      relatedId: booking._id,
    });
    
    logger.info('NOTIFICATION_CREATED', {
      notificationId: ownerNotification._id,
      userId: truck.owner,
      userRole: 'owner',
      type: 'booking',
      relatedId: booking._id
    });

    // Create notification for customer
    const customerNotification = await Notification.create({
      userId: req.user.id,
      userRole: 'customer',
      message: `Your booking request for ${booking.truck.title} has been submitted. Waiting for owner approval.`,
      type: 'booking',
      relatedId: booking._id,
    });
    
    logger.info('NOTIFICATION_CREATED', {
      notificationId: customerNotification._id,
      userId: req.user.id,
      userRole: 'customer',
      type: 'booking',
      relatedId: booking._id
    });

    // Emit real-time notifications
    const io = req.app.get('io');
    if (io) {
      try {
        io.to(`user-${truck.owner}`).emit('new_booking', {
          booking: booking,
        });
        io.to(`user-${truck.owner}`).emit('notification', {
          message: `New booking request for ${booking.truck.title}`,
          type: 'booking',
        });
        io.to(`user-${req.user.id}`).emit('notification', {
          message: `Your booking request for ${booking.truck.title} has been submitted.`,
          type: 'booking',
        });
        
        logger.debug('SOCKET_EMIT', {
          event: 'new_booking',
          targetUser: truck.owner,
          bookingId: booking._id
        });
      } catch (socketError) {
        logger.error('SOCKET_EMIT_ERROR', {
          error: socketError.message,
          bookingId: booking._id,
          stack: process.env.NODE_ENV === 'development' ? socketError.stack : undefined
        });
      }
    }

    res.status(201).json({
      success: true,
      data: booking,
      message: 'Booking created successfully',
    });
    
    logger.info('BOOKING_CREATE_SUCCESS', {
      bookingId: booking._id,
      customerId: booking.customerId,
      truckId: booking.truckId,
      status: booking.status
    });
  } catch (error) {
    logger.error('BOOKING_CREATE_ERROR', {
      error: error.message,
      userId: req.user?.id,
      truckId: req.body.truckId,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while creating the booking' 
    });
  }
};

// Check booking conflicts (validation endpoint)
const checkBookingConflicts = async (req, res) => {
  try {
    const { truckId, startTime, endTime } = req.query;
    
    logger.debug('CHECK_BOOKING_CONFLICTS', {
      truckId,
      startTime,
      endTime,
      userId: req.user?.id
    });

    if (!truckId || !startTime || !endTime) {
      logger.warn('CHECK_CONFLICTS_VALIDATION_FAILED', {
        missingFields: [
          !truckId && 'truckId',
          !startTime && 'startTime',
          !endTime && 'endTime'
        ].filter(Boolean)
      });
      return res.status(400).json({
        success: false,
        message: 'truckId, startTime, and endTime are required',
      });
    }

    const result = await bookingService.checkBookingConflicts(truckId, startTime, endTime);

    if (!result.success) {
      logger.warn('BOOKING_CONFLICTS_FOUND', {
        truckId,
        startTime,
        endTime,
        message: result.message,
        hasConflicts: result.conflicts?.length > 0
      });
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    logger.debug('NO_BOOKING_CONFLICTS', {
      truckId,
      startTime,
      endTime,
      availableSlots: result.data?.availableSlots?.length || 0
    });

    res.status(200).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    logger.error('CHECK_CONFLICTS_ERROR', {
      error: error.message,
      truckId,
      startTime,
      endTime,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while checking for booking conflicts' 
    });
  }
};

// Get truck availability slots
const getTruckAvailability = async (req, res) => {
  try {
    const { truckId } = req.params;
    const { startDate, endDate, slotDuration = 2 } = req.query;
    
    logger.debug('GET_TRUCK_AVAILABILITY', {
      truckId,
      startDate,
      endDate,
      slotDuration,
      userId: req.user?.id
    });

    if (!truckId || !startDate || !endDate) {
      logger.warn('AVAILABILITY_VALIDATION_FAILED', {
        missingFields: [
          !truckId && 'truckId',
          !startDate && 'startDate',
          !endDate && 'endDate'
        ].filter(Boolean)
      });
      return res.status(400).json({
        success: false,
        message: 'truckId, startDate, and endDate are required',
      });
    }

    const result = await bookingService.getTruckAvailability(
      truckId, 
      startDate, 
      endDate, 
      parseInt(slotDuration)
    );

    if (!result.success) {
      logger.warn('AVAILABILITY_CHECK_FAILED', {
        truckId,
        startDate,
        endDate,
        error: result.message
      });
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    logger.debug('AVAILABILITY_RETRIEVED', {
      truckId,
      startDate,
      endDate,
      availableSlots: result.data?.availableSlots?.length || 0,
      conflicts: result.data?.conflicts?.length || 0
    });

    res.status(200).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    logger.error('AVAILABILITY_CHECK_ERROR', {
      error: error.message,
      truckId,
      startDate,
      endDate,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while checking truck availability' 
    });
  }
};

// Get user bookings
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    
    logger.debug('GET_USER_BOOKINGS', { userId, userRole });

    const result = await bookingService.getUserBookings(userId, userRole);

    if (!result.success) {
      logger.warn('GET_USER_BOOKINGS_FAILED', {
        userId,
        userRole,
        error: result.message
      });
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    logger.info('USER_BOOKINGS_RETRIEVED', {
      userId,
      userRole,
      bookingCount: result.data?.length || 0
    });

    res.status(200).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    logger.error('GET_USER_BOOKINGS_ERROR', {
      error: error.message,
      userId: req.user?.id,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while retrieving user bookings' 
    });
  }
};

// Update booking
const updateBooking = async (req, res) => {
  const { bookingId } = req.params;
  const updateData = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  
  logger.info('UPDATE_BOOKING_ATTEMPT', {
    bookingId,
    userId,
    userRole,
    updates: Object.keys(updateData)
  });

  try {
    const result = await bookingService.updateBooking(bookingId, updateData, userId, userRole);

    if (!result.success) {
      logger.warn('UPDATE_BOOKING_FAILED', {
        bookingId,
        userId,
        userRole,
        error: result.message
      });
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    logger.info('BOOKING_UPDATED', {
      bookingId,
      userId,
      userRole,
      status: result.data?.status,
      updatedFields: Object.keys(updateData)
    });

    res.status(200).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    logger.error('UPDATE_BOOKING_ERROR', {
      error: error.message,
      bookingId,
      userId,
      userRole,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while updating the booking' 
    });
  }
};

// Cancel booking
const cancelBooking = async (req, res) => {
  const { bookingId } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  
  logger.info('CANCEL_BOOKING_ATTEMPT', {
    bookingId,
    userId,
    userRole
  });

  try {
    const result = await bookingService.cancelBooking(bookingId, userId, userRole);

    if (!result.success) {
      logger.warn('CANCEL_BOOKING_FAILED', {
        bookingId,
        userId,
        userRole,
        error: result.message
      });
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    logger.info('BOOKING_CANCELLED', {
      bookingId,
      userId,
      userRole,
      status: result.data?.status
    });

    res.status(200).json({
      success: true,
      data: result.data,
      message: result.message,
    });
  } catch (error) {
    logger.error('CANCEL_BOOKING_ERROR', {
      error: error.message,
      bookingId,
      userId,
      userRole,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while cancelling the booking' 
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    
    logger.info('GET_BOOKING_ATTEMPT', { 
      bookingId: id,
      userId: req.user?.id,
      userRole: req.user?.role
    });

    // Find the booking and populate related data
    const booking = await Booking.findById(id)
      .populate('truck', 'title model capacityTons ratePerKm images')
      .populate('customer', 'name email phone')
      .populate('owner', 'name email phone')
      .lean();

    if (!booking) {
      logger.warn('BOOKING_NOT_FOUND', { bookingId: id });
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user has permission to view this booking
    const isOwner = booking.owner?._id?.toString() === req.user?.id;
    const isCustomer = booking.customer?._id?.toString() === req.user?.id;
    const isAdmin = req.user?.role === 'admin';

    if (!isOwner && !isCustomer && !isAdmin) {
      logger.warn('UNAUTHORIZED_BOOKING_ACCESS', { 
        bookingId: id,
        userId: req.user?.id,
        userRole: req.user?.role
      });
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
    }

    logger.info('BOOKING_FETCHED', { bookingId: id });
    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (error) {
    logger.error('GET_BOOKING_ERROR', {
      error: error.message,
      stack: error.stack,
      bookingId: req.params?.id,
      userId: req.user?.id
    });
    res.status(500).json({
      success: false,
      message: 'Error fetching booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = { 
  createBooking, 
  checkBookingConflicts, 
  getTruckAvailability,
  getUserBookings,
  updateBooking,
  cancelBooking,
  getBookingById
};
