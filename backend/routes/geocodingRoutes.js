const express = require('express');
const router = express.Router();
const { getLocationCoordinates } = require('../controllers/geocodingController');

// GET /api/geocoding/coordinates?location=<location_name>
router.get('/coordinates', getLocationCoordinates);

module.exports = router;
