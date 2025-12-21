const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  userRole: { type: String, enum: ['admin', 'owner', 'customer'], required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['booking', 'system', 'payment', 'review', 'new_truck', 'new_owner', 'new_customer', 'verification_request', 'verification_granted'], default: 'booking' },
  relatedId: { type: mongoose.Schema.Types.ObjectId }, // booking ID, etc.
  truckId: { type: mongoose.Schema.Types.ObjectId }, // truck ID for review notifications
  relatedUserId: { type: mongoose.Schema.Types.ObjectId }, // user ID for registration notifications
  relatedUserModel: { type: String, enum: ['Owner', 'Customer', 'Truck'] }, // model name for registration notifications
  actionUrl: { type: String }, // URL for admin to take action
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for better query performance
NotificationSchema.index({ userRole: 1, type: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', NotificationSchema);

