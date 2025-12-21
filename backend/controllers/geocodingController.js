const axios = require('axios');

// Geocoding using OpenCage API
const getLocationCoordinates = async (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location parameter is required'
      });
    }

    const apiKey = process.env.OPENCAGE_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        message: 'OpenCage API key not configured'
      });
    }

    // OpenCage API endpoint
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(location)}&key=${apiKey}&limit=1`;
    
    const response = await axios.get(url);
    
    if (response.data && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const coordinates = {
        lat: result.geometry.lat,
        lng: result.geometry.lng,
        formatted: result.formatted
      };
      
      res.json({
        success: true,
        data: coordinates
      });
    } else {
      res.json({
        success: false,
        message: 'Location not found'
      });
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting location coordinates'
    });
  }
};

module.exports = {
  getLocationCoordinates
};
