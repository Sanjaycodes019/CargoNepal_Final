const express = require('express');
const router = express.Router();
const { calculateBookingDistance, geocodeLocationEndpoint } = require('../controllers/utilsController');

// Geocode location endpoint
router.get('/geocode', geocodeLocationEndpoint);

// Calculate booking distance and price (for preview)
router.post('/bookings/calculate', calculateBookingDistance);

module.exports = router;

