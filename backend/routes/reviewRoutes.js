const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');
const { createReview, getTruckReviews, deleteReview } = require('../controllers/reviewController');

// Public route - get reviews for a truck
router.get('/truck/:id', getTruckReviews);

// Protected route - create review (customer only)
router.post('/', authMiddleware, authorize('customer'), createReview);

// Protected route - delete review (owner only)
router.delete('/:id', authMiddleware, authorize('owner'), deleteReview);

module.exports = router;

