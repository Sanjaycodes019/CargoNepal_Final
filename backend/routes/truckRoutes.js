const express = require('express');
const router = express.Router();
const { 
  getTrucks, 
  getTruckById, 
  nearestTrucks,
  searchTrucks  // ✅ Import the searchTrucks function
} = require('../controllers/truckController');

// Public routes
router.get('/', getTrucks);
router.get('/:id', getTruckById);

// Search routes
router.post('/nearest', nearestTrucks);
router.post('/search-trucks', searchTrucks);  // ✅ ADD THIS LINE

module.exports = router;
