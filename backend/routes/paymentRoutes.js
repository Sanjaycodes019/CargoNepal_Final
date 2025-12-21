const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');
const { simulatePayment } = require('../controllers/paymentController');

// Payment simulation (customer only)
router.post('/:id', authMiddleware, authorize('customer'), simulatePayment);

module.exports = router;

