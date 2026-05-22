const Booking = require('../models/BookingModel');
const Notification = require('../models/NotificationModel');
const emailService = require('../services/emailService');

// Simulate payment
const simulatePayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('owner', 'name email')
      .populate('truck', 'title');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check ownership
    if (booking.customer._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (booking.status === 'declined' || booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot pay for declined or cancelled booking' });
    }

    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'Booking already paid' });
    }

    // Simulate payment - in real app, this would call payment gateway
    booking.paymentStatus = 'paid';
    await booking.save();

    // Create notification for owner
    await Notification.create({
      userId: booking.owner._id,
      userRole: 'owner',
      message: `Payment received for booking from ${booking.customer.name}`,
      type: 'payment',
      relatedId: booking._id
    });

    // Create notification for customer
    await Notification.create({
      userId: booking.customer._id,
      userRole: 'customer',
      message: `Payment completed for your booking of ${booking.truck.title}`,
      type: 'payment',
      relatedId: booking._id
    });

    if (booking?.customer?.email) {
      try {
        await emailService.sendPaymentCompletedEmailToCustomer({
          to: booking.customer.email,
          customerName: booking.customer.name,
          ownerName: booking.owner?.name,
          truckTitle: booking.truck?.title,
          bookingId: booking._id,
          pickupAddress: booking.pickup?.address,
          dropoffAddress: booking.dropoff?.address,
          price: booking.price,
        });
      } catch (emailError) {
        logger.error('PAYMENT_EMAIL_ERROR', {
          type: 'customer_confirmation',
          error: emailError.message,
          stack: emailError.stack,
          bookingId: booking?._id,
          customerEmail: booking?.customer?.email
        });
      }
    }

    if (booking?.owner?.email) {
      try {
        await emailService.sendPaymentReceivedEmailToOwner({
          to: booking.owner.email,
          ownerName: booking.owner.name,
          customerName: booking.customer?.name,
          truckTitle: booking.truck?.title,
          bookingId: booking._id,
          pickupAddress: booking.pickup?.address,
          dropoffAddress: booking.dropoff?.address,
          price: booking.price,
        });
      } catch (emailError) {
        logger.error('PAYMENT_EMAIL_ERROR', {
          type: 'owner_notification',
          error: emailError.message,
          stack: emailError.stack,
          bookingId: booking?._id,
          ownerEmail: booking?.owner?.email
        });
      }
    }

    // Emit real-time notifications
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${booking.owner._id}`).emit('notification', {
        message: `Payment received for booking from ${booking.customer.name}`,
        type: 'payment',
      });
      io.to(`user-${booking.customer._id}`).emit('notification', {
        message: `Payment completed for your booking of ${booking.truck.title}`,
        type: 'payment',
      });
      io.to(`user-${booking.owner._id}`).emit('booking_updated', { booking });
      io.to(`user-${booking.customer._id}`).emit('booking_updated', { booking });
    }

    res.json({
      success: true,
      data: booking,
      message: 'Payment processed successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { simulatePayment };

