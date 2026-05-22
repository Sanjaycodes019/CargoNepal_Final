const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Import customer-specific controllers
const { getMyBookings, cancelBooking, updateProfile } = require('../controllers/customerController');

// Import the searchTrucks function from truckController
const { searchTrucks } = require('../controllers/truckController');

// Import notification functions
const { getCustomerNotifications, markCustomerNotificationAsRead, markAllCustomerNotificationsAsRead } = require('../controllers/notificationController');

// All routes require authentication and customer role
router.use(authMiddleware);
router.use(authorize('customer'));

// Customer routes
router.get('/bookings', getMyBookings);
router.put('/bookings/:id/cancel', cancelBooking);
router.put('/profile', upload.single('profileImage'), updateProfile);

// FIXED: Use searchTrucks from truckController instead of searchTrucksByRoute
router.post('/search-trucks', searchTrucks);

// Notification routes
router.get('/notifications', getCustomerNotifications);
router.put('/notifications/:id/read', markCustomerNotificationAsRead);
router.put('/notifications/mark-all-read', markAllCustomerNotificationsAsRead);

module.exports = router;
