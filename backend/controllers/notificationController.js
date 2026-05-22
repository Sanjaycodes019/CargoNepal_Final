const Notification = require('../models/NotificationModel');
const { authMiddleware } = require('../middleware/authMiddleware');
const logger = require('../utils/logger');

/**
 * Get all notifications for authenticated admin
 */
const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    logger.error('FETCH_NOTIFICATIONS_ERROR', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
      userType: 'admin'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications'
    });
  }
};

/**
 * Mark a notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Notification.findByIdAndUpdate(id, { read: true });
    
    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

/**
 * Mark all notifications as read for authenticated admin
 */
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

/**
 * Get all notifications for authenticated owner
 */
const getOwnerNotifications = async (req, res) => {
  const { page = 1, limit = 10, type, priority, read, days, search } = req.query;
  const ownerId = req.user.id;
  
  try {

    logger.debug('GET_OWNER_NOTIFICATIONS_REQUEST', {
      ownerId,
      filters: { type, priority, read, days, search },
      page,
      limit
    });

    // Build the base query
    let query = { 
      userId: ownerId, 
      userRole: 'owner' 
    };

    // Add type filter if specified
    if (type && type !== 'all') {
      query.type = type;
    }

    // Add priority filter if specified
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Add read status filter if specified
    if (read !== undefined && read !== 'all') {
      query.read = read === 'true';
    }

    // Add date range filter if specified
    if (days && days !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      query.createdAt = { $gte: daysAgo };
    }

    // Add search filter if specified
    if (search && search.trim()) {
      query.$or = [
        { message: { $regex: search.trim(), $options: 'i' } },
        { type: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    logger.debug('OWNER_NOTIFICATIONS_QUERY', {
      query,
      ownerId
    });

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    logger.debug('OWNER_NOTIFICATIONS_FETCHED', {
      count: notifications.length,
      ownerId,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

    res.json({
      success: true,
      data: {
        notifications: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('GET_OWNER_NOTIFICATIONS_ERROR', {
      error: error.message,
      stack: error.stack,
      ownerId,
      filters: { type, priority, read, days, search },
      page,
      limit
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mark a notification as read for owner
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: ownerId, userRole: 'owner' },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

/**
 * Mark all notifications as read for authenticated owner
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const ownerId = req.user.id;
    
    await Notification.updateMany(
      { userId: ownerId, userRole: 'owner', read: false },
      { read: true }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

/**
 * Get all notifications for authenticated customer
 */
const getCustomerNotifications = async (req, res) => {
  const { page = 1, limit = 10, type, priority, read, days, search } = req.query;
  const customerId = req.user.id;
  
  try {

    logger.debug('GET_CUSTOMER_NOTIFICATIONS_REQUEST', {
      customerId,
      filters: { type, priority, read, days, search },
      page,
      limit
    });

    // Build the base query
    let query = { 
      userId: customerId, 
      userRole: 'customer' 
    };

    // Add type filter if specified
    if (type && type !== 'all') {
      query.type = type;
    }

    // Add priority filter if specified
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Add read status filter if specified
    if (read !== undefined && read !== 'all') {
      query.read = read === 'true';
    }

    // Add date range filter if specified
    if (days && days !== 'all') {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(days));
      query.createdAt = { $gte: daysAgo };
    }

    // Add search filter if specified
    if (search && search.trim()) {
      query.$or = [
        { message: { $regex: search.trim(), $options: 'i' } },
        { type: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    logger.debug('CUSTOMER_NOTIFICATIONS_QUERY', {
      query,
      customerId
    });

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);

    logger.debug('CUSTOMER_NOTIFICATIONS_FETCHED', {
      count: notifications.length,
      customerId,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

    res.json({
      success: true,
      data: {
        notifications: notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    logger.error('GET_CUSTOMER_NOTIFICATIONS_ERROR', {
      error: error.message,
      stack: error.stack,
      customerId,
      filters: { type, priority, read, days, search },
      page,
      limit
    });
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Mark a notification as read for customer
 */
const markCustomerNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.user.id;
    
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: customerId, userRole: 'customer' },
      { read: true },
      { new: true }
    );
    
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read'
    });
  }
};

/**
 * Mark all notifications as read for authenticated customer
 */
const markAllCustomerNotificationsAsRead = async (req, res) => {
  try {
    const customerId = req.user.id;
    
    await Notification.updateMany(
      { userId: customerId, userRole: 'customer', read: false },
      { read: true }
    );
    
    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getOwnerNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getCustomerNotifications,
  markCustomerNotificationAsRead,
  markAllCustomerNotificationsAsRead
};
