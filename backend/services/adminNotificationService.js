const Notification = require('../models/NotificationModel');
const Admin = require('../models/AdminModel');
const emailService = require('./emailService');
const logger = require('../utils/logger');

/**
 * Unified Admin Notification Service
 * Creates notifications for all admin users with real-time socket integration
 */

// Socket instance for real-time notifications
let io = null;

/**
 * Initialize socket.io instance for real-time notifications
 */
const initializeSocket = (socketIo) => {
  io = socketIo;
};

/**
 * Create notification for all admin users
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.type - Type of notification
 * @param {string} notificationData.message - Custom notification message (optional)
 * @param {Object} notificationData.relatedUserId - Related user ID
 * @param {string} notificationData.relatedUserModel - Related user model (Owner, Customer, Truck, Booking)
 * @param {string} notificationData.userName - User name for message
 * @param {string} notificationData.actionUrl - Action URL for admin
 * @param {string} notificationData.priority - Priority level (low, medium, high)
 * @param {Object} notificationData.metadata - Additional metadata
 */
const createAdminNotification = async (notificationData) => {
  try {
    // Get all admin users
    const admins = await Admin.find({ role: 'admin' });
    
    if (admins.length === 0) {
      return;
    }

    // Generate notification content based on type
    let message, title, actionUrl;
    switch (notificationData.type) {
      // User Registration Events
      case 'new_owner':
        title = 'New Owner Registration';
        message = `New owner "${notificationData.userName}" has registered and is awaiting verification.`;
        actionUrl = `/admin/verification/owner/${notificationData.relatedUserId}`;
        break;
      case 'new_customer':
        title = 'New Customer Registration';
        message = `New customer "${notificationData.userName}" has registered and is awaiting verification.`;
        actionUrl = `/admin/verification/customer/${notificationData.relatedUserId}`;
        break;
      
      // Truck Events
      case 'new_truck':
        title = 'New Truck Registration';
        message = `New truck has been registered by owner "${notificationData.userName}" and is awaiting verification.`;
        actionUrl = `/admin/verification/truck/${notificationData.relatedUserId}`;
        break;
      case 'truck_updated':
        title = 'Truck Updated';
        message = `Truck has been updated by owner "${notificationData.userName}".`;
        actionUrl = `/admin/fleet`;
        break;
      case 'truck_deleted':
        title = 'Truck Deleted';
        message = `Truck has been deleted by owner "${notificationData.userName}".`;
        actionUrl = `/admin/fleet`;
        break;
      
      // Booking Events
      case 'new_booking':
        title = 'New Booking';
        message = `New booking #${notificationData.metadata?.bookingNumber} created by ${notificationData.userName}.`;
        actionUrl = `/admin/bookings`;
        break;
      case 'booking_cancelled':
        title = 'Booking Cancelled';
        message = `Booking #${notificationData.metadata?.bookingNumber} has been cancelled.`;
        actionUrl = `/admin/bookings`;
        break;
      case 'booking_updated':
        title = 'Booking Updated';
        message = `Booking #${notificationData.metadata?.bookingNumber} status has been updated.`;
        actionUrl = `/admin/bookings`;
        break;
      
      // Payment Events
      case 'payment_completed':
        title = 'Payment Completed';
        message = `Payment completed for booking #${notificationData.metadata?.bookingNumber}.`;
        actionUrl = `/admin/bookings`;
        break;
      case 'payment_failed':
        title = 'Payment Failed';
        message = `Payment failed for booking #${notificationData.metadata?.bookingNumber}.`;
        actionUrl = `/admin/bookings`;
        break;
      
      // Review Events
      case 'new_review':
        title = 'New Review';
        message = `New review posted for truck by ${notificationData.userName}.`;
        actionUrl = `/admin/reviews`;
        break;
      case 'review_reported':
        title = 'Review Reported';
        message = `A review has been reported and requires attention.`;
        actionUrl = `/admin/reviews`;
        break;
      
      // Verification Events
      case 'verification_request':
        title = 'Verification Request';
        message = `${notificationData.userName} is requesting verification.`;
        actionUrl = `/admin/verification/${notificationData.relatedUserModel?.toLowerCase()}/${notificationData.relatedUserId}`;
        break;
      case 'verification_granted':
        title = 'Verification Granted';
        message = `Verification granted to ${notificationData.userName}.`;
        actionUrl = `/admin/users`;
        break;
      case 'verification_revoked':
        title = 'Verification Revoked';
        message = `Verification revoked for ${notificationData.userName}.`;
        actionUrl = `/admin/users`;
        break;
      
      // Contact Events
      case 'contact_form':
        title = 'New Contact Form';
        message = `New contact form from ${notificationData.userName}: ${notificationData.metadata?.subject}`;
        actionUrl = `/admin/bookings`;
        break;
      
      // System Events
      case 'system_alert':
        title = 'System Alert';
        message = notificationData.message || 'System requires attention.';
        actionUrl = `/admin/settings`;
        break;
      case 'maintenance':
        title = 'Maintenance Notice';
        message = notificationData.message || 'Scheduled maintenance.';
        actionUrl = `/admin/settings`;
        break;
      
      default:
        title = 'New Notification';
        message = notificationData.message || 'New system notification.';
        actionUrl = notificationData.actionUrl || `/admin/dashboard`;
        break;
    }

    // Create notification for each admin
    const notifications = admins.map(admin => ({
      userId: admin._id,
      userRole: 'admin',
      title,
      message,
      type: notificationData.type,
      relatedUserId: notificationData.relatedUserId,
      relatedUserModel: notificationData.relatedUserModel,
      relatedId: notificationData.relatedId,
      truckId: notificationData.truckId,
      actionUrl: actionUrl || notificationData.actionUrl,
      priority: notificationData.priority || 'medium',
      read: false,
      metadata: notificationData.metadata || {},
      createdAt: new Date()
    }));

    
    // Insert all notifications
    const result = await Notification.insertMany(notifications);
    
    // Emit real-time notifications to all admins
    if (io) {
      admins.forEach(admin => {
        const notification = notifications.find(n => n.userId.toString() === admin._id.toString());
        if (notification) {
          io.to(`admin_${admin._id}`).emit('new_notification', notification);
        }
      });
    }

    // Send email alerts for high priority notifications
    const highPriorityNotifications = notifications.filter(n => n.priority === 'high');
    if (highPriorityNotifications.length > 0) {
      await sendEmailAlerts(highPriorityNotifications, admins);
    }

    return result;
  } catch (error) {
    logger.error('ADMIN_NOTIFICATION_CREATE_FAILED', {
      error: error.message,
      notificationData
    });
    throw error;
  }
};

/**
 * Send email alerts for critical notifications
 */
const sendEmailAlerts = async (notifications, admins) => {
  try {
    for (const admin of admins) {
      const adminNotifications = notifications.filter(n => n.userId.toString() === admin._id.toString());
      if (adminNotifications.length > 0) {
        await emailService.sendAdminNotificationAlert(admin.email, adminNotifications);
      }
    }
  } catch (error) {
    logger.error('ADMIN_NOTIFICATION_EMAIL_FAILED', {
      error: error.message,
      adminEmails
    });
  }
};

/**
 * Create bulk notifications for multiple events
 */
const createBulkNotifications = async (notificationDataArray) => {
  try {
    const results = await Promise.all(
      notificationDataArray.map(data => createAdminNotification(data))
    );
    return results;
  } catch (error) {
    logger.error('ADMIN_NOTIFICATION_BULK_CREATE_FAILED', {
      error: error.message,
      notifications: notifications.length
    });
    throw error;
  }
};

/**
 * Get notification statistics
 */
const getNotificationStats = async () => {
  try {
    const stats = await Notification.aggregate([
      { $match: { userRole: 'admin' } },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: { $sum: { $cond: ['$read', 0, 1] } }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    return stats;
  } catch (error) {
    logger.error('ADMIN_NOTIFICATION_STATS_FAILED', {
      error: error.message
    });
    return [];
  }
};

module.exports = {
  createAdminNotification,
  createBulkNotifications,
  getNotificationStats,
  initializeSocket
};
