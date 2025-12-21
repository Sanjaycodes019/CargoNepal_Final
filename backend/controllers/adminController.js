const Admin = require('../models/AdminModel');
const Owner = require('../models/OwnerModel');
const Customer = require('../models/CustomerModel');
const Truck = require('../models/TruckModel');
const Booking = require('../models/BookingModel');
const Notification = require('../models/NotificationModel');
const { createAdminNotification, getNotificationStats } = require('../services/adminNotificationService');
const emailService = require('../services/emailService');
const axios = require('axios');
const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');
const { getEnhancedTruckStatus } = require('../utils/truckStatusUtils');
const { config } = require('../config/env');


// Get all users
const getUsers = async (req, res) => {
  try {
    const owners = await Owner.find().select('-passwordHash');
    const customers = await Customer.find().select('-passwordHash');
    const admins = await Admin.find().select('-passwordHash');

    // Get statistics for each user
    const ownersWithStats = await Promise.all(
      owners.map(async (owner) => {
        const trucksCount = await Truck.countDocuments({ owner: owner._id });
        const bookingsCount = await Booking.countDocuments({ owner: owner._id });
        return {
          ...owner.toObject(),
          stats: {
            trucks: trucksCount || 0,
            bookings: bookingsCount || 0
          }
        };
      })
    );

    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const bookingsCount = await Booking.countDocuments({ customer: customer._id });
        return {
          ...customer.toObject(),
          stats: {
            bookings: bookingsCount || 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: {
        owners: ownersWithStats,
        customers: customersWithStats,
        admins
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get customer by ID (also handles owners)
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First try to find as customer
    let user = await Customer.findById(id)
      .select('-passwordHash');

    // If not found as customer, try as owner
    if (!user) {
      user = await Owner.findById(id)
        .select('-passwordHash');
      
      // If it's an owner, add stats
      if (user) {
        const trucksCount = await Truck.countDocuments({ owner: user._id });
        const bookingsCount = await Booking.countDocuments({ owner: user._id });
        
        user = {
          ...user.toObject(),
          totalBookings: bookingsCount || 0,
          totalTrucks: trucksCount || 0
        };
      }
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query; // owner, customer, or admin
    const updates = req.body;

    let UserModel;
    if (role === 'owner') {
      UserModel = Owner;
    } else if (role === 'customer') {
      UserModel = Customer;
    } else if (role === 'admin') {
      UserModel = Admin;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role parameter' });
    }

    // Don't allow password updates through this endpoint
    delete updates.passwordHash;
    delete updates.password;

    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select('-passwordHash');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: updatedUser, message: 'User updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.query; // owner, customer, or admin

    let UserModel;
    if (role === 'owner') {
      UserModel = Owner;
    } else if (role === 'customer') {
      UserModel = Customer;
    } else if (role === 'admin') {
      UserModel = Admin;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role parameter' });
    }

    const user = await UserModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // If deleting owner, also delete their trucks
    if (role === 'owner') {
      await Truck.deleteMany({ owner: id });
      await Booking.deleteMany({ owner: id });
    }

    // If deleting customer, delete their bookings
    if (role === 'customer') {
      await Booking.deleteMany({ customer: id });
    }

    await UserModel.findByIdAndDelete(id);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('truck', 'title type capacityTons ratePerKm')
      .populate('owner', 'name email phone verificationBadge')
      .populate('customer', 'name email phone verificationBadge')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update booking (admin)
const updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const booking = await Booking.findById(id)
      .populate('truck', 'title')
      .populate('owner', 'name verificationBadge')
      .populate('customer', 'name verificationBadge');
    
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Validate status if provided
    if (updates.status && !['pending', 'accepted', 'declined', 'in_transit', 'completed', 'cancelled'].includes(updates.status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Validate paymentStatus if provided
    if (updates.paymentStatus && !['pending', 'paid'].includes(updates.paymentStatus)) {
      return res.status(400).json({ success: false, message: 'Invalid payment status' });
    }

    const oldStatus = booking.status;
    const oldPaymentStatus = booking.paymentStatus;

    const updatedBooking = await Booking.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('truck', 'title type')
      .populate('owner', 'name email phone profileImageUrl verificationBadge')
      .populate('customer', 'name email verificationBadge');

    const io = req.app.get('io');

    // Send notifications for status changes
    if (updates.status && updates.status !== oldStatus) {
      if (updates.status === 'accepted') {
        await Notification.create({
          userId: booking.customer._id,
          userRole: 'customer',
          message: `Your booking for ${booking.truck.title} has been accepted!`,
          type: 'booking',
          relatedId: booking._id,
        });
        if (io) {
          io.to(`user-${booking.customer._id}`).emit('notification', {
            message: `Your booking for ${booking.truck.title} has been accepted!`,
            type: 'booking',
          });
        }

        if (updatedBooking?.customer?.email) {
          try {
            await emailService.sendBookingStatusUpdateEmail({
              to: updatedBooking.customer.email,
              customerName: updatedBooking.customer.name,
              truckTitle: updatedBooking.truck?.title,
              status: updates.status,
              bookingId: updatedBooking._id,
              pickupAddress: updatedBooking.pickup?.address,
              dropoffAddress: updatedBooking.dropoff?.address,
              price: updatedBooking.price,
            });
          } catch (emailError) {
            console.error('[EMAIL] Error sending booking accepted email:', emailError.message);
          }
        }
      } else if (updates.status === 'declined') {
        await Notification.create({
          userId: booking.customer._id,
          userRole: 'customer',
          message: `Your booking for ${booking.truck.title} has been declined.`,
          type: 'booking',
          relatedId: booking._id,
        });
        if (io) {
          io.to(`user-${booking.customer._id}`).emit('notification', {
            message: `Your booking for ${booking.truck.title} has been declined.`,
            type: 'booking',
          });
        }
      } else if (updates.status === 'in_transit') {
        await Notification.create({
          userId: booking.customer._id,
          userRole: 'customer',
          message: `Your booking for ${booking.truck.title} is now in transit!`,
          type: 'booking',
          relatedId: booking._id,
        });
        if (io) {
          io.to(`user-${booking.customer._id}`).emit('notification', {
            message: `Your booking for ${booking.truck.title} is now in transit!`,
            type: 'booking',
          });
        }

        if (updatedBooking?.customer?.email) {
          try {
            await emailService.sendBookingStatusUpdateEmail({
              to: updatedBooking.customer.email,
              customerName: updatedBooking.customer.name,
              truckTitle: updatedBooking.truck?.title,
              status: updates.status,
              bookingId: updatedBooking._id,
              pickupAddress: updatedBooking.pickup?.address,
              dropoffAddress: updatedBooking.dropoff?.address,
              price: updatedBooking.price,
            });
          } catch (emailError) {
            console.error('[EMAIL] Error sending booking in transit email:', emailError.message);
          }
        }
      } else if (updates.status === 'completed') {
        await Notification.create({
          userId: booking.customer._id,
          userRole: 'customer',
          message: `Your trip with ${booking.truck.title} is completed! Please write a review to help others.`,
          type: 'review',
          relatedId: booking._id,
          truckId: booking.truck._id,
        });
        if (io) {
          io.to(`user-${booking.customer._id}`).emit('notification', {
            message: `Your trip with ${booking.truck.title} is completed! Please write a review.`,
            type: 'review',
            truckId: booking.truck._id,
          });
        }

        if (updatedBooking?.customer?.email) {
          try {
            await emailService.sendBookingStatusUpdateEmail({
              to: updatedBooking.customer.email,
              customerName: updatedBooking.customer.name,
              truckTitle: updatedBooking.truck?.title,
              status: updates.status,
              bookingId: updatedBooking._id,
              pickupAddress: updatedBooking.pickup?.address,
              dropoffAddress: updatedBooking.dropoff?.address,
              price: updatedBooking.price,
            });
          } catch (emailError) {
            console.error('[EMAIL] Error sending booking completed email:', emailError.message);
          }
        }
      } else if (updates.status === 'cancelled') {
        if (updatedBooking?.customer?.email) {
          try {
            await emailService.sendBookingStatusUpdateEmail({
              to: updatedBooking.customer.email,
              customerName: updatedBooking.customer.name,
              truckTitle: updatedBooking.truck?.title,
              status: updates.status,
              bookingId: updatedBooking._id,
              pickupAddress: updatedBooking.pickup?.address,
              dropoffAddress: updatedBooking.dropoff?.address,
              price: updatedBooking.price,
            });
          } catch (emailError) {
            console.error('[EMAIL] Error sending booking cancelled email to customer:', emailError.message);
          }
        }

        if (updatedBooking?.owner?.email) {
          try {
            await emailService.sendBookingStatusUpdateEmail({
              to: updatedBooking.owner.email,
              customerName: updatedBooking.owner.name,
              truckTitle: updatedBooking.truck?.title,
              status: updates.status,
              bookingId: updatedBooking._id,
              pickupAddress: updatedBooking.pickup?.address,
              dropoffAddress: updatedBooking.dropoff?.address,
              price: updatedBooking.price,
            });
          } catch (emailError) {
            console.error('[EMAIL] Error sending booking cancelled email to owner:', emailError.message);
          }
        }
      }
    }

    // Send notifications for payment status changes
    if (updates.paymentStatus && updates.paymentStatus !== oldPaymentStatus && updates.paymentStatus === 'paid') {
      await Notification.create({
        userId: booking.owner._id,
        userRole: 'owner',
        message: `Payment received for booking from ${booking.customer.name}`,
        type: 'payment',
        relatedId: booking._id,
      });
      await Notification.create({
        userId: booking.customer._id,
        userRole: 'customer',
        message: `Payment completed for your booking of ${booking.truck.title}`,
        type: 'payment',
        relatedId: booking._id,
      });
      if (io) {
        io.to(`user-${booking.owner._id}`).emit('notification', {
          message: `Payment received for booking from ${booking.customer.name}`,
          type: 'payment',
        });
        io.to(`user-${booking.customer._id}`).emit('notification', {
          message: `Payment completed for your booking of ${booking.truck.title}`,
          type: 'payment',
        });
      }

      if (updatedBooking?.customer?.email) {
        try {
          await emailService.sendPaymentCompletedEmailToCustomer({
            to: updatedBooking.customer.email,
            customerName: updatedBooking.customer.name,
            ownerName: updatedBooking.owner?.name,
            truckTitle: updatedBooking.truck?.title,
            bookingId: updatedBooking._id,
            pickupAddress: updatedBooking.pickup?.address,
            dropoffAddress: updatedBooking.dropoff?.address,
            price: updatedBooking.price,
          });
        } catch (emailError) {
          console.error('[EMAIL] Error sending payment confirmation email to customer:', emailError.message);
        }
      }

      if (updatedBooking?.owner?.email) {
        try {
          await emailService.sendPaymentReceivedEmailToOwner({
            to: updatedBooking.owner.email,
            ownerName: updatedBooking.owner.name,
            customerName: updatedBooking.customer?.name,
            truckTitle: updatedBooking.truck?.title,
            bookingId: updatedBooking._id,
            pickupAddress: updatedBooking.pickup?.address,
            dropoffAddress: updatedBooking.dropoff?.address,
            price: updatedBooking.price,
          });
        } catch (emailError) {
          console.error('[EMAIL] Error sending payment received email to owner:', emailError.message);
        }
      }
    }

    if (io) {
      io.to(`user-${booking.customer._id}`).emit('booking_updated', { booking: updatedBooking });
      io.to(`user-${booking.owner._id}`).emit('booking_updated', { booking: updatedBooking });
    }

    res.json({ success: true, data: updatedBooking, message: 'Booking updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all trucks
const getAllTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find()
      .select('title type capacityTons ratePerKm location available description imageUrl owner isVerified createdAt updatedAt')
      .populate('owner', 'name email phone profileImageUrl isVerified verificationBadge')
      .sort({ createdAt: -1 });

    // Add enhanced status to each truck
    const trucksWithEnhancedStatus = await Promise.all(
      trucks.map(async (truck) => {
        const enhancedStatus = await getEnhancedTruckStatus(truck);
        return {
          ...truck.toObject(),
          enhancedStatus
        };
      })
    );

    
    res.json({ success: true, data: trucksWithEnhancedStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update truck (admin)
const updateTruck = async (req, res) => {
  try {
    const { id } = req.params;
    const { locationString, ...rest } = req.body;
    let updateData = { ...rest };

    const truck = await Truck.findById(id);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    if (locationString) {
      const geoRes = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(locationString)}&key=${config.apis.opencage}`
      );

      if (geoRes.data.results.length > 0) {
        updateData.location = {
          address: locationString,
          lat: geoRes.data.results[0].geometry.lat,
          lng: geoRes.data.results[0].geometry.lng
        };
      }
    }

    const updatedTruck = await Truck.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('owner', 'name email phone profileImageUrl verificationBadge');

    res.json({ success: true, data: updatedTruck, message: 'Truck updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete truck (admin)
const deleteTruck = async (req, res) => {
  try {
    const { id } = req.params;

    const truck = await Truck.findById(id);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    // Delete associated bookings
    await Booking.deleteMany({ truck: id });

    // Remove truck from owner's trucks array
    await Owner.findByIdAndUpdate(truck.owner, { $pull: { trucks: id } });

    await Truck.findByIdAndDelete(id);

    res.json({ success: true, message: 'Truck deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update settings (for now, just return current settings)
// In a real app, you'd store these in a Settings model
const updateSettings = async (req, res) => {
  try {
    const { defaultRatePerKm } = req.body;

    if (defaultRatePerKm) {
      process.env.DEFAULT_RATE_PER_KM = defaultRatePerKm.toString();
    }

    res.json({
      success: true,
      data: {
        defaultRatePerKm: process.env.DEFAULT_RATE_PER_KM || 25
      },
      message: 'Settings updated successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await Owner.countDocuments() + await Customer.countDocuments();
    const totalTrucks = await Truck.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const acceptedBookings = await Booking.countDocuments({ status: 'accepted' });
    const inTransitBookings = await Booking.countDocuments({ status: 'in_transit' });
    const activeBookings = await Booking.countDocuments({ status: { $in: ['accepted', 'in_transit'] } });

    // Calculate verified and unverified users
    const verifiedOwners = await Owner.countDocuments({ verificationBadge: true });
    const verifiedCustomers = await Customer.countDocuments({ verificationBadge: true });
    const verifiedUsers = verifiedOwners + verifiedCustomers;
    
    const unverifiedOwners = await Owner.countDocuments({ verificationBadge: false });
    const unverifiedCustomers = await Customer.countDocuments({ verificationBadge: false });
    const unverifiedUsers = unverifiedOwners + unverifiedCustomers;

    // Calculate verified and unverified trucks
    const verifiedTrucks = await Truck.countDocuments({ isVerified: true });
    const unverifiedTrucks = await Truck.countDocuments({ isVerified: false });

    // Calculate pending verifications (trucks waiting for verification)
    const pendingVerifications = await Truck.countDocuments({ isVerified: false });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalTrucks,
        totalBookings,
        pendingVerifications,
        pendingBookings,
        acceptedBookings,
        inTransitBookings,
        activeBookings,
        verifiedUsers,
        unverifiedUsers,
        verifiedTrucks,
        unverifiedTrucks
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get analytics data
const getAnalytics = async (req, res) => {
  try {
    // Get recent activities for the activities section
    const recentActivities = [];
    
    // Get recent user registrations (last 10)
    const recentOwners = await Owner.find()
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    const recentCustomers = await Customer.find()
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent truck registrations (last 10)
    const recentTrucks = await Truck.find()
      .select('title type owner createdAt')
      .populate('owner', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent bookings (last 10)
    const recentBookings = await Booking.find()
      .select('status price createdAt truck customer')
      .populate('truck', 'title')
      .populate('customer', 'name')
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Combine all activities
    recentOwners.forEach(owner => {
      recentActivities.push({
        type: 'user',
        title: `New Owner Registered`,
        description: `${owner.name} (${owner.email}) joined as a truck owner`,
        timestamp: owner.createdAt,
        user: owner
      });
    });
    
    recentCustomers.forEach(customer => {
      recentActivities.push({
        type: 'user',
        title: `New Customer Registered`,
        description: `${customer.name} (${customer.email}) joined as a customer`,
        timestamp: customer.createdAt,
        user: customer
      });
    });
    
    recentTrucks.forEach(truck => {
      recentActivities.push({
        type: 'truck',
        title: `New Truck Added`,
        description: `${truck.title} (${truck.type}) added by ${truck.owner?.name || 'Unknown'}`,
        timestamp: truck.createdAt,
        truck: truck
      });
    });
    
    recentBookings.forEach(booking => {
      recentActivities.push({
        type: 'booking',
        title: `New Booking ${booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}`,
        description: `Booking for ${booking.truck?.title || 'Unknown truck'} by ${booking.customer?.name || 'Unknown customer'} - NPR ${booking.price || 0}`,
        timestamp: booking.createdAt,
        booking: booking
      });
    });
    
    // Sort all activities by timestamp (most recent first)
    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit to 20 most recent activities
    const limitedActivities = recentActivities.slice(0, 20);

    res.json({
      success: true,
      data: {
        recentActivity: limitedActivities
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update admin profile
const updateAdminProfile = async (req, res) => {
  try {
    const updates = req.body;
    
    // Handle profile image upload
    if (req.file) {
      const imageFile = req.file;
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(imageFile.path, {
        folder: 'profiles',
        resource_type: 'image',
        transformation: [
          { width: 500, height: 500, crop: 'fill' },
          { quality: 'auto' }
        ]
      });
      
      // Clean up temporary file
      const fs = require('fs').promises;
      await fs.unlink(imageFile.path);
      
      // Add image URL to updates
      updates.profileImageUrl = result.secure_url;
    }

    const updated = await Admin.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updated
    });
  } catch (error) {
    console.error('Update admin profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle user verification status
const toggleUserVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // owner or customer

    let Model;
    if (role === 'owner') {
      Model = Owner;
    } else if (role === 'customer') {
      Model = Customer;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const user = await Model.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousVerificationStatus = user.isVerified;
    user.isVerified = !user.isVerified;
    await user.save();

    // Create notification for user when profile is verified
    if (user.isVerified && !previousVerificationStatus) {
      try {
        await Notification.create({
          userId: user._id,
          userRole: role,
          message: `Congratulations! Admin has reviewed your profile and you're now verified. Welcome to the verified ${role} community!`,
          type: 'verification_granted',
          relatedId: user._id,
          relatedUserId: user._id,
          relatedUserModel: role === 'owner' ? 'Owner' : 'Customer',
          actionUrl: role === 'owner' ? '/owner/dashboard' : '/customer/dashboard',
          priority: 'high',
          read: false
        });
        logger.info('USER_VERIFICATION_COMPLETED', {
  userId: user._id,
  role,
  action: 'profile_verification'
});
      } catch (notificationError) {
        console.error('[USER_VERIFICATION] Error creating notification:', notificationError);
        // Don't fail the verification if notification fails
      }
    }

    res.json({
      success: true,
      message: `User verification ${user.isVerified ? 'enabled' : 'disabled'} successfully`,
      data: { isVerified: user.isVerified }
    });
  } catch (error) {
    console.error('Toggle user verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle truck verification status
const toggleTruckVerification = async (req, res) => {
  try {
    const { id } = req.params;

    const truck = await Truck.findById(id);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    const previousVerificationStatus = truck.isVerified;
    truck.isVerified = !truck.isVerified;
    await truck.save();

    // Create notification for truck owner when truck is verified
    
    if (truck.isVerified && !previousVerificationStatus) {
      try {
        const notification = await Notification.create({
          userId: truck.owner,
          userRole: 'owner',
          message: `Your truck "${truck.title}" has been verified and is now available for bookings`,
          type: 'verification_granted',
          relatedId: truck._id,
          truckId: truck._id,
          relatedUserId: truck.owner,
          relatedUserModel: 'Truck',
          actionUrl: `/owner/fleet/${truck._id}`,
          priority: 'high',
          read: false
        });
              } catch (notificationError) {
        console.error('[TRUCK_VERIFICATION] Error creating notification:', notificationError);
        // Don't fail the verification if notification fails
      }
    } else {
      // No notification needed
    }

    res.json({
      success: true,
      message: `Truck verification ${truck.isVerified ? 'enabled' : 'disabled'} successfully`,
      data: { isVerified: truck.isVerified }
    });
  } catch (error) {
    console.error('Toggle truck verification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Toggle user verification badge
const toggleUserVerificationBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, verificationBadge } = req.body; // owner, customer, or admin, and the verification badge value

    let Model;
    if (role === 'owner') {
      Model = Owner;
    } else if (role === 'customer') {
      Model = Customer;
    } else if (role === 'admin') {
      Model = Admin;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid role specified' });
    }

    const user = await Model.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousBadgeStatus = user.verificationBadge;
    // Use the verificationBadge value from frontend instead of toggling
    user.verificationBadge = verificationBadge;
    await user.save();

    // Create notification for user when verification badge is granted
    if (user.verificationBadge && !previousBadgeStatus) {
      try {
        await Notification.create({
          userId: user._id,
          userRole: role,
          message: `Congratulations! Admin has granted you the verification badge. Your profile is now officially verified!`,
          type: 'verification_granted',
          relatedId: user._id,
          relatedUserId: user._id,
          relatedUserModel: role === 'owner' ? 'Owner' : role === 'customer' ? 'Customer' : 'Admin',
          actionUrl: role === 'owner' ? '/owner/profile' : role === 'customer' ? '/customer/profile' : '/admin/profile',
          priority: 'high',
          read: false
        });
        logger.info('USER_VERIFICATION_BADGE_COMPLETED', {
  userId: user._id,
  role,
  action: 'verification_badge'
});
      } catch (notificationError) {
        console.error('[USER_VERIFICATION_BADGE] Error creating notification:', notificationError);
        // Don't fail the verification if notification fails
      }
    }

    res.json({
      success: true,
      message: `User verification badge ${user.verificationBadge ? 'enabled' : 'disabled'} successfully`,
      data: { verificationBadge: user.verificationBadge }
    });
  } catch (error) {
    console.error('Toggle user verification badge error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single truck details for admin verification
const getTruckById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const truck = await Truck.findById(id)
      .populate('owner', 'name email phone profileImageUrl verificationBadge companyName experienceYears address');

    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    res.json({
      success: true,
      data: truck
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get admin notifications
const getAdminNotifications = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      type, 
      priority, 
      read, 
      days,
      search
    } = req.query;
    const adminId = req.user.id;

    
    // Build the base query
    let query = { 
      userId: adminId, 
      userRole: 'admin' 
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

    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    
    const total = await Notification.countDocuments(query);

    res.json({
      success: true,
      data: notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('[GET_ADMIN_NOTIFICATIONS] Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId: adminId, userRole: 'admin' },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Mark all notifications as read
const markAllNotificationsAsRead = async (req, res) => {
  try {
    const adminId = req.user.id;

    await Notification.updateMany(
      { userId: adminId, userRole: 'admin', read: false },
      { read: true }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
  getNotificationStats: async (req, res) => {
    try {
      const stats = await getNotificationStats();
      res.json({ success: true, data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
