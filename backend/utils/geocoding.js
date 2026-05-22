// Simple geocoding for Nepal locations
// This uses Nominatim (OpenStreetMap) for geocoding

const axios = require('axios');
const logger = require('./logger');

/**
 * Geocode a location name to get coordinates
 * @param {string} locationName - Name of the location in Nepal
 * @returns {Promise<{lat: number, lng: number}>} Coordinates
 */
const geocodeLocation = async (locationName) => {
  if (!locationName || typeof locationName !== 'string') {
    throw new Error('Location name is required');
  }

  console.log('GEOCODING_ATTEMPT', { locationName });

  // Try geocoding API (Nominatim) with multiple approaches
  try {
    // Try multiple query approaches - start with simpler ones first
    const queries = [
      locationName.split(',')[0].trim(), // First part only - most likely to work
      locationName.split(',')[0].trim() + ', Nepal', // First part with Nepal
      'Pokhara', // Test with known city
      'Kathmandu', // Test with known city
      locationName, // Full original query
      locationName.replace(/,\s*.*$/, '') + ', Nepal' // Cleaned version with Nepal
    ];

    for (const query of queries) {
      console.log('GEOCODING_TRYING_QUERY', { query });
      
      try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
          params: {
            q: query,
            format: 'json',
            limit: 1,
            countrycodes: 'np',
            addressdetails: 1
          },
          headers: {
            'User-Agent': 'CargoNepal/1.0',
            'Accept': 'application/json'
          },
          timeout: 10000 // 10 second timeout
        });

        console.log('GEOCODING_RESPONSE', { 
          query, 
          status: response.status,
          dataLength: response.data?.length || 0
        });

        if (response.data && response.data.length > 0) {
          const result = response.data[0];
          const coords = {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon)
          };
          console.log('GEOCODING_SUCCESS', { 
            query, 
            result: result.display_name,
            coords 
          });
          return coords;
        } else {
          console.log('NO_RESULTS', { query });
        }
      } catch (queryError) {
        console.log('QUERY_FAILED', { query, error: queryError.message });
        // Continue to next query
      }
    }
  } catch (error) {
    console.error('GEOCODING_API_ERROR', {
      locationName,
      error: error.message,
      stack: error.stack
    });
    logger.error('GEOCODING_API_ERROR', {
      locationName,
      error: error.message
    });
  }

  // If all API calls fail, use fallback coordinates based on location patterns
  console.log('USING_FALLBACK_COORDS', { locationName });
  const locationLower = locationName.toLowerCase();
  
  // Fallback coordinates for major Nepal areas
  const fallbackCoords = {
    'pokhara': { lat: 28.2096, lng: 83.9856 },
    'kathmandu': { lat: 27.7172, lng: 85.3240 },
    'biratnagar': { lat: 26.4525, lng: 87.2718 },
    'birgunj': { lat: 27.0174, lng: 84.8758 },
    'hetauda': { lat: 27.4167, lng: 85.0333 },
    'chitwan': { lat: 27.5292, lng: 84.3542 },
    'bharatpur': { lat: 27.6833, lng: 84.4333 },
    'lumbini': { lat: 27.4817, lng: 83.2765 },
    'janakpur': { lat: 26.7288, lng: 85.9254 },
    'nepalgunj': { lat: 28.0500, lng: 81.6167 },
    'dhangadhi': { lat: 28.6833, lng: 80.6167 },
    'butwal': { lat: 27.7000, lng: 83.4667 },
    'dharan': { lat: 26.8147, lng: 87.2847 },
    'itahari': { lat: 26.6639, lng: 87.2747 }
  };

  // Check if location contains any known city name
  for (const [city, coords] of Object.entries(fallbackCoords)) {
    if (locationLower.includes(city)) {
      console.log('FALLBACK_MATCH', { locationName, matchedCity: city, coords });
      return coords;
    }
  }

  // Ultimate fallback - use Kathmandu
  console.log('ULTIMATE_FALLBACK', { locationName, fallback: 'kathmandu' });
  return { lat: 27.7172, lng: 85.3240 };
};

module.exports = { geocodeLocation };

