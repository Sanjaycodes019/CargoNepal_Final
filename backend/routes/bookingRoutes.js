const express = require('express');
const router = express.Router();
const { body, query, param, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');
const { 
  createBooking, 
  checkBookingConflicts, 
  getTruckAvailability,
  getUserBookings,
  updateBooking,
  cancelBooking,
  getBookingById,
  runScheduledJob,
  getEnhancedStatus
} = require('../controllers/bookingController');
const { generateInvoice } = require('../controllers/invoiceController');
const { createBookingValidation, idParamValidation, paginationValidation } = require('../middleware/validators');

// Create booking requires customer authentication
router.post(
  '/', 
  authMiddleware, 
  authorize('customer'), 
  createBookingValidation, 
  createBooking
);

// Check booking conflicts (validation endpoint)
router.get(
  '/check-conflicts', 
  authMiddleware, 
  [
    query('truckId')
      .notEmpty().withMessage('Truck ID is required')
      .isMongoId().withMessage('Invalid truck ID format'),
    query('startTime')
      .notEmpty().withMessage('Start time is required')
      .isISO8601().withMessage('Invalid start time format'),
    query('endTime')
      .notEmpty().withMessage('End time is required')
      .isISO8601().withMessage('Invalid end time format')
      .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.query.startTime)) {
          throw new Error('End time must be after start time');
        }
        return true;
      }),
    (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed',
          errors: errors.array()
        });
      }
      next();
    }
  ],
  checkBookingConflicts
);

// Get truck availability slots
router.get(
  '/availability/:truckId', 
  authMiddleware, 
  [
    param('truckId')
      .notEmpty().withMessage('Truck ID is required')
      .isMongoId().withMessage('Invalid truck ID format'),
    query('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format'),
    query('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  getTruckAvailability
);

// Get user bookings (customer, owner, admin)
router.get(
  '/my-bookings', 
  authMiddleware, 
  paginationValidation, 
  getUserBookings
);

// Update booking
router.put(
  '/:bookingId', 
  authMiddleware, 
  [
    param('bookingId')
      .notEmpty().withMessage('Booking ID is required')
      .isMongoId().withMessage('Invalid booking ID format'),
    body('status')
      .optional()
      .isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Invalid status'),
    body('startTime')
      .optional()
      .isISO8601().withMessage('Invalid start time format'),
    body('endTime')
      .optional()
      .isISO8601().withMessage('Invalid end time format')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    next();
  },
  updateBooking
);

// Cancel booking
router.delete(
  '/:bookingId', 
  authMiddleware, 
  idParamValidation, 
  cancelBooking
);

// Get booking by ID
router.get(
  '/:id',
  authMiddleware,
  idParamValidation,
  getBookingById
);

// Generate invoice (accessible to customer and owner of the booking)
router.get(
  '/:id/invoice', 
  authMiddleware, 
  idParamValidation, 
  generateInvoice
);

// ============================================================================
// NEW ENDPOINTS FOR AUTOMATIC TRUCK AVAILABILITY
// ============================================================================

// Run scheduled job to update expired bookings (admin only)
router.post(
  '/scheduled-job/update-expired',
  authMiddleware,
  authorize('admin'),
  runScheduledJob
);

// Get enhanced truck status with booking information
router.get(
  '/truck-status/:truckId',
  authMiddleware,
  getEnhancedStatus
);

module.exports = router;

