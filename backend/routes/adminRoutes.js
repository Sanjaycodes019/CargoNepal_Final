const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
  getUsers,
  getCustomerById,
  updateUser,
  deleteUser,
  getAllBookings,
  updateBooking,
  getAllTrucks,
  getTruckById,
  updateTruck,
  deleteTruck,
  updateSettings,
  getDashboardStats,
  getAnalytics,
  updateAdminProfile,
  toggleUserVerification,
  toggleTruckVerification,
  toggleUserVerificationBadge,
  getAdminNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationStats
} = require('../controllers/adminController');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(authorize('admin'));

router.get('/users', getUsers);
router.get('/owners/:id', getCustomerById); // Reuse getCustomerById for owners (same user structure)
router.get('/customers/:id', getCustomerById);
router.put('/user/:id', updateUser);
router.delete('/user/:id', deleteUser);
router.get('/bookings', getAllBookings);
router.put('/booking/:id', updateBooking);
router.get('/trucks', getAllTrucks);
router.get('/trucks/:id', getTruckById);
router.put('/truck/:id', updateTruck);
router.delete('/truck/:id', deleteTruck);
router.put('/settings', updateSettings);
router.get('/stats', getDashboardStats);
router.get('/analytics', getAnalytics);
router.put('/profile', upload.single('profileImage'), updateAdminProfile);
router.put('/verify-user/:id', toggleUserVerification);
router.put('/verify-truck/:id', toggleTruckVerification);
router.put('/verification-badge/:id', toggleUserVerificationBadge);

// Notification routes
router.get('/notifications', getAdminNotifications);
router.get('/notifications/stats', getNotificationStats);
router.put('/notifications/:id/read', markNotificationAsRead);
router.put('/notifications/mark-all-read', markAllNotificationsAsRead);

module.exports = router;

