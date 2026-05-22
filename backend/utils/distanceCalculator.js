const axios = require('axios');

/**
 * Calculate route distance using OSRM (real road routing)
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Promise<Object>} Route data with distance, duration, and routing info
 */
async function getRouteDistance(lat1, lon1, lat2, lon2) {
  try {
    const response = await axios.get(
      `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson&steps=true`,
      {
        timeout: 15000,
        headers: {
          'User-Agent': 'CargoNepal/1.0'
        }
      }
    );

    if (response.data && response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      return {
        distanceKm: route.distance / 1000, // Convert meters to km
        durationMinutes: route.duration / 60, // Convert seconds to minutes
        isRouteDistance: true,
        routeData: route
      };
    } else {
      throw new Error('No route found');
    }
  } catch (error) {
    console.log('OSRM routing failed, using Haversine fallback:', error.message);
    // Fallback to Haversine if OSRM fails
    const distance = haversineKm(lat1, lon1, lat2, lon2);
    return {
      distanceKm: distance,
      durationMinutes: null,
      isRouteDistance: false,
      routeData: null
    };
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula (fallback)
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Number} Distance in kilometers
 */
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) ** 2 + 
    Math.cos(lat1 * Math.PI / 180) * 
    Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate price based on distance and rate per km
 * @param {Number} distanceKm - Distance in kilometers
 * @param {Number} ratePerKm - Rate per kilometer
 * @returns {Number} Total price
 */
function calculatePrice(distanceKm, ratePerKm) {
  return Math.round(distanceKm * ratePerKm);
}

module.exports = { getRouteDistance, haversineKm, calculatePrice };

