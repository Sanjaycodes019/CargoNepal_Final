const axios = require('axios');
const Truck = require('../models/TruckModel');
const Review = require('../models/ReviewModel');
const { createAdminNotification } = require('../services/adminNotificationService');
const { getEnhancedTruckStatus } = require('../utils/truckStatusUtils');
const logger = require('../utils/logger');
const { config } = require('../config/env');
const { getRouteDistance } = require('../utils/distanceCalculator');

// ===============================
// GET ALL TRUCKS (PUBLIC)
// ===============================
const getTrucks = async (req, res) => {
  try {
    const { type, capacity, available, availableFrom, availableUntil } = req.query;
    const filter = {};
    
    logger.debug('GET_TRUCKS_REQUEST', { type, capacity, available, availableFrom, availableUntil });

    if (type) filter.type = { $regex: new RegExp(type, 'i') };
    if (capacity) filter.capacityTons = { $gte: Number(capacity) };
    if (available !== undefined) filter.available = available === 'true';
    
    // Add availability date filtering
    if (availableFrom || availableUntil) {
      filter.$and = [];
      
      if (availableFrom) {
        filter.$and.push({
          $or: [
            { availableFrom: { $lte: new Date(availableFrom) } },
            { availableFrom: { $exists: false } }
          ]
        });
      }
      
      if (availableUntil) {
        filter.$and.push({
          $or: [
            { availableUntil: { $gte: new Date(availableUntil) } },
            { availableUntil: { $exists: false } }
          ]
        });
      }
    }

    const trucks = await Truck.find(filter)
      .populate('owner', 'name email phone profileImageUrl verificationBadge')
      .sort({ createdAt: -1 });

    // Calculate average ratings and enhanced status for each truck
    const trucksWithRatings = await Promise.all(
      trucks.map(async (truck) => {
        const reviews = await Review.find({ truck: truck._id });
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;
        
        // Get enhanced truck status
        const enhancedStatus = await getEnhancedTruckStatus(truck);
        
        return {
          ...truck.toObject(),
          averageRating: Math.round(avgRating * 10) / 10, // Round to 1 decimal
          totalReviews: reviews.length,
          enhancedStatus: enhancedStatus
        };
      })
    );

    logger.info('TRUCKS_FETCHED', { count: trucksWithRatings.length });
    res.json({ success: true, data: trucksWithRatings });
  } catch (error) {
    logger.error('GET_TRUCKS_ERROR', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({ success: false, message: 'Error fetching trucks' });
  }
};

// ===============================
// GET SINGLE TRUCK
// ===============================
const getTruckById = async (req, res) => {
  const { id } = req.params;
  logger.debug('GET_TRUCK_BY_ID', { truckId: id });

  try {
    const truck = await Truck.findById(id)
      .populate('owner', 'name email phone address profileImageUrl verificationBadge');

    if (!truck) {
      logger.warn('TRUCK_NOT_FOUND', { truckId: id });
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    // Get enhanced truck status
    const enhancedStatus = await getEnhancedTruckStatus(truck);

    logger.info('TRUCK_FETCHED', { 
      truckId: truck._id,
      status: enhancedStatus
    });

    res.json({ 
      success: true, 
      data: {
        ...truck.toObject(),
        enhancedStatus
      }
    });
  } catch (error) {
    logger.error('GET_TRUCK_ERROR', {
      truckId: id,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({ success: false, message: 'Error fetching truck details' });
  }
};

// ===============================
// CREATE TRUCK (AUTO GEOCODING)
// ===============================
const createTruck = async (req, res) => {
  const { locationString, ...rest } = req.body;
  logger.info('CREATE_TRUCK_REQUEST', { 
    ownerId: rest.owner,
    title: rest.title,
    hasLocation: !!locationString
  });

  try {
    let lat = null;
    let lng = null;

    if (locationString) {
      const geo = await axios.get(
        `${config.apis.nominatim.url}?format=json&q=${encodeURIComponent(locationString)}&countrycodes=NP&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CargoNepal/1.0 (contact@cargonepal.com)'
          }
        }
      );

      if (geo.data && geo.data.length > 0) {
        lat = parseFloat(geo.data[0].lat);
        lng = parseFloat(geo.data[0].lon);
        logger.debug('GEOCODING_SUCCESS', { address: locationString, lat, lng });
      } else {
        logger.warn('GEOCODING_NO_RESULTS', { address: locationString });
      }
    }

    const truck = await Truck.create({
      ...rest,
      location: {
        type: 'Point',
        coordinates: [lng, lat], // GeoJSON format: [longitude, latitude]
        address: locationString
      }
    });

    logger.info('TRUCK_CREATED', { 
      truckId: truck._id,
      ownerId: truck.owner,
      title: truck.title
    });

    // Create admin notification for new truck registration
    try {
      const Owner = require('../models/OwnerModel');
      const owner = await Owner.findById(truck.owner);
      
      if (owner) {
        await createAdminNotification({
          type: 'new_truck',
          relatedUserId: truck._id,
          relatedUserModel: 'Truck',
          truckId: truck._id,
          userName: owner.name,
          metadata: {
            truckTitle: truck.title,
            truckId: truck._id.toString()
          }
        });
        logger.info('TRUCK_NOTIFICATION_CREATED', {
          truckId: truck._id,
          ownerId: owner._id,
          ownerName: owner.name
        });
      }
    } catch (notificationError) {
      logger.error('TRUCK_NOTIFICATION_FAILED', {
        truckId: truck._id,
        error: notificationError.message,
        stack: process.env.NODE_ENV === 'development' ? notificationError.stack : undefined
      });
    }

    res.status(201).json({ success: true, data: truck });
  } catch (error) {
    logger.error('TRUCK_CREATION_FAILED', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      ownerId: rest.owner
    });
    res.status(500).json({ success: false, message: 'Error creating truck' });
  }
};

// ===============================
// SEARCH TRUCKS (FOR CUSTOMER BOOKING)
// Called by: POST /customer/search-trucks
// THIS IS THE MAIN FUNCTION YOUR FRONTEND USES
// ===============================
const searchTrucks = async (req, res) => {
  const { pickup, dropoff, requiredCapacity } = req.body;
  
  logger.info('TRUCK_SEARCH_REQUEST', {
    pickup: pickup?.address ? 'provided' : 'missing',
    dropoff: dropoff?.address ? 'provided' : 'missing',
    requiredCapacity: requiredCapacity || 'missing'
  });

  try {
    // Validate inputs
    if (!pickup?.address || !dropoff?.address) {
      logger.warn('INVALID_SEARCH_PARAMS', { 
        error: 'Missing pickup or dropoff address',
        hasPickup: !!pickup?.address,
        hasDropoff: !!dropoff?.address
      });
      return res.status(400).json({ 
        success: false, 
        message: "Pickup and dropoff addresses are required" 
      });
    }

    if (!requiredCapacity) {
      logger.warn('MISSING_CAPACITY', { error: 'Required capacity not specified' });
      return res.status(400).json({ 
        success: false, 
        message: "Required capacity must be specified" 
      });
    }

    // CRITICAL: Convert to number FIRST
    const requiredCapacityNum = Number(requiredCapacity);
    
    if (isNaN(requiredCapacityNum) || requiredCapacityNum <= 0) {
      logger.warn('INVALID_CAPACITY', { 
        error: 'Invalid capacity value',
        provided: requiredCapacity,
        parsed: requiredCapacityNum
      });
      return res.status(400).json({ 
        success: false, 
        message: "Invalid capacity value" 
      });
    }

    // ===============================
    // STEP 1: GEOCODE PICKUP & DROPOFF
    // ===============================
    
    logger.debug('GEOCODING_STARTED', { 
      pickup: pickup.address,
      dropoff: dropoff.address 
    });

    let pickupGeo, dropoffGeo;
    
    // Try Nominatim first, fallback to OpenCage
    try {
      const pickupUrl = `${config.apis.nominatim.url}?format=json&q=${encodeURIComponent(pickup.address)}&countrycodes=NP&limit=1&addressdetails=1`;
      logger.debug('PICKUP_GEOCODING_URL', { url: pickupUrl, address: pickup.address });
      
      pickupGeo = await axios.get(pickupUrl, {
        headers: {
          'User-Agent': 'CargoNepal/1.0 (contact@cargonepal.com)'
        },
        timeout: 10000
      });
      
      logger.debug('PICKUP_GEOCODING_RESPONSE', { 
        status: pickupGeo.status,
        dataLength: pickupGeo.data?.length || 0
      });
      
      // If Nominatim returns empty results, try OpenCage
      if (!pickupGeo.data || pickupGeo.data.length === 0) {
        logger.warn('NOMINATIM_PICKUP_EMPTY, trying OpenCage', {
          address: pickup.address
        });
        
        try {
          pickupGeo = await axios.get(`${config.apis.opencage.url}?q=${encodeURIComponent(pickup.address)}&key=${config.apis.opencage.key}&limit=1&countrycode=NP`);
          logger.debug('OPENCAGE_PICKUP_RESPONSE', { status: pickupGeo.status });
        } catch (opencageError) {
          logger.error('OPENCAGE_PICKUP_FAILED', {
            error: opencageError.message,
            address: pickup.address
          });
        }
      }
    } catch (error) {
      logger.warn('NOMINATIM_PICKUP_FAILED, trying OpenCage', {
        error: error.message,
        address: pickup.address
      });
      
      // Fallback to OpenCage
      try {
        pickupGeo = await axios.get(`${config.apis.opencage.url}?q=${encodeURIComponent(pickup.address)}&key=${config.apis.opencage.key}&limit=1&countrycode=NP`);
        logger.debug('OPENCAGE_PICKUP_RESPONSE', { status: pickupGeo.status });
      } catch (opencageError) {
        logger.error('BOTH_GEOCODERS_FAILED_PICKUP', {
          nominatimError: error.message,
          opencageError: opencageError.message,
          address: pickup.address
        });
        return res.status(400).json({ 
          success: false, 
          message: `Failed to geocode pickup location "${pickup.address}". Please check the location and try again.` 
        });
      }
    }
    
    try {
      const dropoffUrl = `${config.apis.nominatim.url}?format=json&q=${encodeURIComponent(dropoff.address)}&countrycodes=NP&limit=1&addressdetails=1`;
      logger.debug('DROPOFF_GEOCODING_URL', { url: dropoffUrl, address: dropoff.address });
      
      dropoffGeo = await axios.get(dropoffUrl, {
        headers: {
          'User-Agent': 'CargoNepal/1.0 (contact@cargonepal.com)'
        },
        timeout: 10000
      });
      
      logger.debug('DROPOFF_GEOCODING_RESPONSE', { 
        status: dropoffGeo.status,
        dataLength: dropoffGeo.data?.length || 0
      });
      
      // If Nominatim returns empty results, try OpenCage
      if (!dropoffGeo.data || dropoffGeo.data.length === 0) {
        logger.warn('NOMINATIM_DROPOFF_EMPTY, trying OpenCage', {
          address: dropoff.address
        });
        
        try {
          dropoffGeo = await axios.get(`${config.apis.opencage.url}?q=${encodeURIComponent(dropoff.address)}&key=${config.apis.opencage.key}&limit=1&countrycode=NP`);
          logger.debug('OPENCAGE_DROPOFF_RESPONSE', { status: dropoffGeo.status });
        } catch (opencageError) {
          logger.error('OPENCAGE_DROPOFF_FAILED', {
            error: opencageError.message,
            address: dropoff.address
          });
        }
      }
    } catch (error) {
      logger.warn('NOMINATIM_DROPOFF_FAILED, trying OpenCage', {
        error: error.message,
        address: dropoff.address
      });
      
      // Fallback to OpenCage
      try {
        dropoffGeo = await axios.get(`${config.apis.opencage.url}?q=${encodeURIComponent(dropoff.address)}&key=${config.apis.opencage.key}&limit=1&countrycode=NP`);
        logger.debug('OPENCAGE_DROPOFF_RESPONSE', { status: dropoffGeo.status });
      } catch (opencageError) {
        logger.error('BOTH_GEOCODERS_FAILED_DROPOFF', {
          nominatimError: error.message,
          opencageError: opencageError.message,
          address: dropoff.address
        });
        return res.status(400).json({ 
          success: false, 
          message: `Failed to geocode dropoff location "${dropoff.address}". Please check the location and try again.` 
        });
      }
    }

    // Enhanced error handling for geocoding failures
    // Handle both Nominatim and OpenCage response formats
    let pickupFound, dropoffFound;
    let pickupCoords, dropoffCoords;
    
    // Check if we got Nominatim or OpenCage response for pickup
    if (pickupGeo.data && pickupGeo.data.length > 0) {
      // Nominatim response
      pickupFound = true;
      pickupCoords = {
        lat: parseFloat(pickupGeo.data[0].lat),
        lng: parseFloat(pickupGeo.data[0].lon),
        address: pickup.address
      };
    } else if (pickupGeo.data && pickupGeo.data.results && pickupGeo.data.results.length > 0) {
      // OpenCage response
      pickupFound = true;
      pickupCoords = {
        lat: pickupGeo.data.results[0].geometry.lat,
        lng: pickupGeo.data.results[0].geometry.lng,
        address: pickup.address
      };
    } else {
      pickupFound = false;
    }
    
    // Check if we got Nominatim or OpenCage response for dropoff
    if (dropoffGeo.data && dropoffGeo.data.length > 0) {
      // Nominatim response
      dropoffFound = true;
      dropoffCoords = {
        lat: parseFloat(dropoffGeo.data[0].lat),
        lng: parseFloat(dropoffGeo.data[0].lon),
        address: dropoff.address
      };
    } else if (dropoffGeo.data && dropoffGeo.data.results && dropoffGeo.data.results.length > 0) {
      // OpenCage response
      dropoffFound = true;
      dropoffCoords = {
        lat: dropoffGeo.data.results[0].geometry.lat,
        lng: dropoffGeo.data.results[0].geometry.lng,
        address: dropoff.address
      };
    } else {
      dropoffFound = false;
    }
    
    if (!pickupFound || !dropoffFound) {
      const failedLocations = [];
      if (!pickupFound) failedLocations.push(`Pickup: "${pickup.address}"`);
      if (!dropoffFound) failedLocations.push(`Dropoff: "${dropoff.address}"`);
      
      logger.warn('GEOCODING_FAILED', { 
        error: 'Could not geocode one or both locations',
        hasPickupResults: pickupFound,
        hasDropoffResults: dropoffFound,
        pickupAddress: pickup.address,
        dropoffAddress: dropoff.address
      });
      
      return res.status(400).json({ 
        success: false, 
        message: `Location not found: ${failedLocations.join(', ')}. Please check spelling and try more specific location names like "Kathmandu, Nepal" or "Pokhara, Nepal".` 
      });
    }

    logger.debug('GEOCODING_COMPLETE', { 
      pickup: { lat: pickupCoords.lat, lng: pickupCoords.lng },
      dropoff: { lat: dropoffCoords.lat, lng: dropoffCoords.lng }
    });

    // ===============================
    // STEP 2: CALCULATE TRIP DISTANCE USING OSRM
    // ===============================
    const routeData = await getRouteDistance(
      pickupCoords.lat, 
      pickupCoords.lng, 
      dropoffCoords.lat, 
      dropoffCoords.lng
    );
    
    const tripDistance = Math.round(routeData.distanceKm);

    logger.debug('TRIP_DISTANCE_CALCULATED', { 
      distanceKm: tripDistance,
      isRouteDistance: routeData.isRouteDistance,
      pickup: pickupCoords.address,
      dropoff: dropoffCoords.address
    });

    // ===============================
    // STEP 3: FIND TRUCKS WITH SUFFICIENT CAPACITY
    // ===============================
    const allTrucks = await Truck.find()
      .select('title type capacityTons ratePerKm location available description imageUrl owner isVerified createdAt updatedAt')
      .populate('owner', 'name email phone profileImageUrl verificationBadge');
    
    logger.debug('TRUCK_FILTERING_STARTED', {
      totalTrucks: allTrucks.length,
      requiredCapacity: requiredCapacityNum
    });

    // CRITICAL FILTER: Only trucks with capacity >= required
    const eligibleTrucks = [];

    allTrucks.forEach((truck, index) => {
      const hasLocation = truck.location?.coordinates && truck.location.coordinates.length === 2;
      
      // FORCE CONVERSION TO NUMBER for comparison
      const truckCapacity = Number(truck.capacityTons);
      
      // THE CRITICAL COMPARISON
      const meetsCapacity = truckCapacity >= requiredCapacityNum;

      logger.debug('TRUCK_FILTER_DEBUG', {
        truckId: truck._id,
        title: truck.title || 'Unnamed Truck',
        capacityInDb: truck.capacityTons,
        capacityType: typeof truck.capacityTons,
        capacityAsNumber: truckCapacity,
        hasLocation: hasLocation,
        capacityComparison: `${truckCapacity} >= ${requiredCapacityNum}`,
        meetsCapacity: meetsCapacity,
        included: hasLocation && meetsCapacity
      });

      // Only add trucks that meet BOTH conditions
      if (hasLocation && meetsCapacity) {
        eligibleTrucks.push(truck);
      }
    });

    logger.info('TRUCK_FILTER_RESULTS', {
      eligibleTrucks: eligibleTrucks.length,
      excludedTrucks: allTrucks.length - eligibleTrucks.length,
      totalTrucks: allTrucks.length
    });

    // Calculate distance from truck to pickup & estimated price with enhanced status
    const trucksWithDetails = await Promise.all(eligibleTrucks.map(async (truck) => {
      let distanceToPickup = 0;
      
      // If truck has location data, calculate distance from truck to pickup
      if (truck.location && truck.location.coordinates && truck.location.coordinates.length === 2) {
        const truckRouteData = await getRouteDistance(
          truck.location.coordinates[1], // latitude (second element)
          truck.location.coordinates[0], // longitude (first element)
          pickupCoords.lat,
          pickupCoords.lng
        );
        distanceToPickup = Math.round(truckRouteData.distanceKm);
      }

      // Estimate price: (trip distance * rate per km) + base fee
      const estimatedPrice = Math.round((tripDistance * (truck.ratePerKm || 50)) + 500);

      // Calculate excess capacity (how much more than required)
      const capacityDifference = Number(truck.capacityTons) - requiredCapacityNum;

      // Get enhanced truck status
      const enhancedStatus = await getEnhancedTruckStatus(truck);

      return {
        ...truck.toObject(),
        distanceToPickup,
        tripDistance,
        estimatedPrice,
        capacityDifference,
        enhancedStatus
      };
    }));

    // ===============================
    // STEP 4: SMART SORTING
    // ===============================
    const capacityWeight = 10;  // Prioritize closer capacity match
    const distanceWeight = 1;   // Secondary priority

    const sortedTrucks = trucksWithDetails
      .map(truck => ({
        ...truck,
        matchScore: (truck.capacityDifference * capacityWeight) + (truck.distanceToPickup * distanceWeight)
      }))
      .sort((a, b) => a.matchScore - b.matchScore);

    logger.debug('TRUCK_SORTING_COMPLETE', { count: sortedTrucks.length });

    // ===============================
    // RESPONSE
    // ===============================
    logger.info('SEARCH_RESPONSE_PREPARED', {
      trucksCount: sortedTrucks.length,
      hasResults: sortedTrucks.length > 0
    });

    res.json({
      success: true,
      data: {
        trucks: sortedTrucks,
        route: {
          pickup: pickupCoords,
          dropoff: dropoffCoords,
          distance: tripDistance,
          isRouteDistance: routeData.isRouteDistance,
          durationMinutes: routeData.durationMinutes
        }
      }
    });

  } catch (error) {
    logger.error('SEARCH_TRUCKS_ERROR', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      body: req.body
    });
    
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Something went wrong while searching trucks' 
    });
  }
};
// NEAREST TRUCKS (LEGACY)
// ===============================
const nearestTrucks = async (req, res) => {
  const { pickupLat, pickupLng, requiredCapacity } = req.body;
  
  logger.info('NEAREST_TRUCKS_REQUEST', {
    coordinates: { pickupLat, pickupLng },
    requiredCapacity: requiredCapacity
  });

  try {
    if (!pickupLat || !pickupLng) {
      logger.warn('MISSING_COORDINATES', { error: 'Latitude and longitude are required' });
      return res.status(400).json({ message: "Pickup location required" });
    }

    if (!requiredCapacity) {
      logger.warn('MISSING_CAPACITY', { error: 'Required capacity must be specified' });
      return res.status(400).json({ message: "Required capacity must be specified" });
    }

    const requiredCapacityNum = Number(requiredCapacity);
    
    if (isNaN(requiredCapacityNum) || requiredCapacityNum <= 0) {
      logger.warn('INVALID_CAPACITY', { error: 'Invalid capacity value' });
      return res.status(400).json({ message: "Invalid capacity value" });
    }

    const trucks = await Truck.find()
      .select('title type capacityTons ratePerKm location available description imageUrl owner isVerified');

    const calcDistance = (lat1, lng1, lat2, lng2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) *
        Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) ** 2;
      return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
    };

    let filtered = trucks
      .filter(t => {
        const hasLocation = t.location?.coordinates && t.location.coordinates.length === 2;
        const truckCapacity = Number(t.capacityTons);
        const hasEnoughCapacity = truckCapacity >= requiredCapacityNum;
        
        if (hasLocation && !hasEnoughCapacity) {
          logger.info('TRUCK_EXCLUDED', {
            truckId: t._id,
            capacity: truckCapacity,
            requiredCapacity: requiredCapacityNum
          });
        }
        
        return hasLocation && hasEnoughCapacity;
      })
      .map(t => {
        const distance = calcDistance(pickupLat, pickupLng, t.location.coordinates[1], t.location.coordinates[0]);
        const estimatedPrice = Math.round(distance * 60 + 500);
        const capacityDifference = Number(t.capacityTons) - requiredCapacityNum;

        return {
          ...t.toObject(),
          distance,
          estimatedPrice,
          capacityDifference
        };
      });

    logger.info('TRUCKS_FILTERED', {
      count: filtered.length,
      requiredCapacity: requiredCapacityNum
    });

    const capacityWeight = 10;
    const distanceWeight = 1;
    
    filtered = filtered
      .map(t => ({
        ...t,
        matchScore: (t.capacityDifference * capacityWeight) + (t.distance * distanceWeight)
      }))
      .sort((a, b) => a.matchScore - b.matchScore);

    logger.info('TRUCKS_SORTED', {
      count: filtered.length,
      requiredCapacity: requiredCapacityNum
    });

    res.json({ success: true, data: filtered });
  } catch (err) {
    logger.error('NEAREST_TRUCKS_ERROR', {
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    res.status(500).json({ message: "Something went wrong" });
  }
};

// ===============================
// UPDATE TRUCK
// ===============================
const updateTruck = async (req, res) => {
  const { id } = req.params;
  const updateFields = Object.keys(req.body);
  
  logger.info('UPDATE_TRUCK_REQUEST', {
    truckId: id,
    updatedFields: updateFields
  });

  try {
    const truck = await Truck.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!truck) {
      logger.warn('TRUCK_UPDATE_FAILED', { 
        truckId: id,
        error: 'Truck not found'
      });
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    logger.info('TRUCK_UPDATED', {
      truckId: truck._id,
      updatedFields: updateFields
    });

    res.json({ success: true, data: truck });
  } catch (error) {
    logger.error('TRUCK_UPDATE_ERROR', {
      truckId: id,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// TOGGLE TRUCK AVAILABILITY (OWNER)
// ===============================
const toggleTruckAvailability = async (req, res) => {
  try {
    const { truckId } = req.params;
    const { ownerTurnedOff } = req.body;

    const truck = await Truck.findById(truckId);
    if (!truck) {
      logger.warn('TRUCK_NOT_FOUND', { 
        truckId: truckId,
        error: 'Truck not found'
      });
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    // Verify ownership
    if (truck.owner.toString() !== req.user.id) {
      logger.warn('UNAUTHORIZED_UPDATE', { 
        truckId: truckId,
        error: 'Not authorized to modify this truck'
      });
      return res.status(403).json({ success: false, message: 'Not authorized to modify this truck' });
    }

    // Update owner turned off status
    truck.ownerTurnedOff = ownerTurnedOff;
    
    // If owner turned off, set available to false
    if (ownerTurnedOff) {
      truck.available = false;
    } else {
      // If owner turned back on, check if there are active bookings
      const Booking = require('../models/BookingModel');
      const activeBookings = await Booking.find({
        truck: truckId,
        status: { $in: ['accepted', 'in_transit'] }
      });
      
      // Only set to available if no active bookings
      truck.available = activeBookings.length === 0;
    }

    await truck.save();

    // Get enhanced status
    const { getEnhancedTruckStatus } = require('../utils/truckStatusUtils');
    const enhancedStatus = await getEnhancedTruckStatus(truck);

    res.json({ 
      success: true, 
      message: `Truck ${ownerTurnedOff ? 'turned off' : 'turned on'} successfully`,
      data: {
        ...truck.toObject(),
        enhancedStatus
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
module.exports = {
  getTrucks,
  getTruckById,
  createTruck,
  updateTruck,
  nearestTrucks,
  searchTrucks,
  toggleTruckAvailability
};
