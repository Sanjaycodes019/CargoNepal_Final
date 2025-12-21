const axios = require('axios');
const Owner = require('../models/OwnerModel');
const Truck = require('../models/TruckModel');
const Booking = require('../models/BookingModel');
const Notification = require('../models/NotificationModel');
const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');
const { createAdminNotification } = require('../services/adminNotificationService');
const { config } = require('../config/env');
const fs = require('fs');
const util = require('util');
const unlinkFile = util.promisify(fs.unlink);
const { getEnhancedTruckStatus } = require('../utils/truckStatusUtils');
const emailService = require('../services/emailService');


// -----------------------------
// GET OWNER'S TRUCKS
// -----------------------------
const getMyTrucks = async (req, res) => {
  try {
    const trucks = await Truck.find({ owner: req.user.id })
      .select('title type capacityTons ratePerKm location available description imageUrl owner isVerified createdAt updatedAt')
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


// -----------------------------
// ADD TRUCK (with image upload)
// -----------------------------
const addTruck = async (req, res) => {
  try {
    const imageFile = req.file;
    const { title, type, capacityTons, ratePerKm, locationString, available, description } = req.body;

    if (!title) return res.status(400).json({ success: false, message: "Title is required" });
    if (!locationString) return res.status(400).json({ success: false, message: "Location is required" });

    // Check if owner is verified
    const owner = await Owner.findById(req.user.id);
    if (!owner || !owner.isVerified) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is not verified yet. Only verified owners can add trucks.' 
      });
    }

    // 🌍 Geocode Address
    const geoRes = await axios.get(
      `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(locationString)}&key=${config.apis.opencage}`
    );
    const geo = geoRes.data.results[0];
    if (!geo) return res.status(400).json({ success: false, message: "Invalid location" });
    const location = {
      lat: geo.geometry.lat,
      lng: geo.geometry.lng,
      address: geo.formatted
    };

    let imageUrl = undefined;
    if (imageFile) {
      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(imageFile.path, {
        folder: 'trucks',
        resource_type: 'image',
      });
      imageUrl = uploadResult.secure_url;
      // Remove temp file
      await unlinkFile(imageFile.path);
    }

    const truck = await Truck.create({
      owner: req.user.id,
      title,
      type,
      capacityTons,
      ratePerKm: ratePerKm || 25,
      location,
      available: available ?? true,
      description,
      imageUrl,
    });
    await Owner.findByIdAndUpdate(req.user.id, { $push: { trucks: truck._id } });

    // Create admin notification for new truck registration
    try {
      // Get owner details to include correct name
      const owner = await Owner.findById(req.user.id);
      
      if (owner) {
        await createAdminNotification({
          type: 'new_truck',
          relatedUserId: truck._id,
          relatedUserModel: 'Truck',
          truckId: truck._id,
          userName: owner.name,
          metadata: {
            truckTitle: title,
            truckId: truck._id.toString()
          }
        });
        logger.info('TRUCK_ADDED_NOTIFICATION', {
  truckId: newTruck._id,
  title,
  ownerId: owner._id,
  ownerName: owner.name
});
      }
    } catch (notificationError) {
      logger.error('ADMIN_NOTIFICATION_ERROR', {
        context: 'add_truck',
        error: notificationError.message,
        stack: notificationError.stack,
        truckId: truck?._id,
        ownerId: req.user?.id
      });
      // Don't fail the truck creation if notification fails
    }

    res.status(201).json({ success: true, data: truck, message: "Truck added successfully" });
  } catch (error) {
    // Cleanup temp file if present
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try { await unlinkFile(req.file.path); } catch {}
    }
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// UPDATE TRUCK
// -----------------------------
const updateTruck = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);
    if (!truck) return res.status(404).json({ success: false, message: "Truck not found" });

    if (truck.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    const imageFile = req.file;
    const { title, type, capacityTons, ratePerKm, locationString, available, description } = req.body;

    // Handle image upload if provided
    let imageUrl = truck.imageUrl; // Keep existing image URL by default
    const removeImage = req.body.removeImage === 'true';
    
    if (imageFile) {
      // If a new image is uploaded, delete old image from Cloudinary if exists
      if (truck.imageUrl) {
        const match = truck.imageUrl.match(/trucks\/([^\.\/]+)\.[a-zA-Z0-9]+$/);
        if (match && match[1]) {
          const publicId = `trucks/${match[1]}`;
          try {
            await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
          } catch (cloudErr) {
            logger.error('CLOUDINARY_DELETE_ERROR', {
              context: 'update_truck_image',
              error: cloudErr.message,
              publicId: publicId,
              truckId: req.params.id
            });
          }
        }
      }

      // Upload new image to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(imageFile.path, {
        folder: 'trucks',
        resource_type: 'image',
      });
      imageUrl = uploadResult.secure_url;
      
      // Remove temp file
      await unlinkFile(imageFile.path);
    } else if (removeImage && truck.imageUrl) {
      // Only remove image if no new image is uploaded and removeImage flag is set
      const match = truck.imageUrl.match(/trucks\/([^\.\/]+)\.[a-zA-Z0-9]+$/);
      if (match && match[1]) {
        const publicId = `trucks/${match[1]}`;
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        } catch (cloudErr) {
          console.error('Cloudinary delete error:', cloudErr.message);
        }
      }
      imageUrl = null; // Remove image URL
    }

    // Handle location update if provided
    let location = truck.location;
    if (locationString) {
      const geoRes = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(locationString)}&key=${config.apis.opencage}`
      );

      const geo = geoRes.data.results[0];
      if (geo) {
        location = {
          lat: geo.geometry.lat,
          lng: geo.geometry.lng,
          address: geo.formatted
        };
      }
    }

    // Update truck with new data
    const updatedTruck = await Truck.findByIdAndUpdate(
      req.params.id,
      {
        title: title || truck.title,
        type: type || truck.type,
        capacityTons: capacityTons || truck.capacityTons,
        ratePerKm: ratePerKm || truck.ratePerKm,
        location,
        available: available !== undefined ? available : truck.available,
        description: description || truck.description,
        imageUrl
      },
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updatedTruck });
  } catch (error) {
    // Cleanup temp file if present
    if (req.file && req.file.path) {
      try { await unlinkFile(req.file.path); } catch {}
    }
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// TOGGLE TRUCK AVAILABILITY
// -----------------------------
const toggleTruckAvailability = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);

    if (!truck) return res.status(404).json({ success: false, message: "Truck not found" });

    if (truck.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    truck.available = !truck.available;
    await truck.save();

    res.json({ success: true, message: "Truck availability updated", data: truck });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// DELETE TRUCK
// -----------------------------
const deleteTruck = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);

    if (!truck) return res.status(404).json({ success: false, message: "Truck not found" });
    if (truck.owner.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    // Delete truck image from Cloudinary if exists
    if (truck.imageUrl) {
      // Extract public_id from imageUrl (format: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/trucks/<public_id>.<ext>)
      const match = truck.imageUrl.match(/trucks\/([^\.\/]+)\.[a-zA-Z0-9]+$/);
      if (match && match[1]) {
        const publicId = `trucks/${match[1]}`;
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        } catch (cloudErr) {
          // Log but do not block deletion
          console.error('Cloudinary delete error:', cloudErr.message);
        }
      }
    }

    await Truck.findByIdAndDelete(req.params.id);
    await Owner.findByIdAndUpdate(req.user.id, { $pull: { trucks: truck._id } });

    // Create admin notification for truck deletion
    try {
      const owner = await Owner.findById(req.user.id);
      
      if (owner) {
        await createAdminNotification({
          type: 'truck_deleted',
          relatedUserId: truck._id,
          relatedUserModel: 'Truck',
          truckId: truck._id,
          userName: owner.name,
          metadata: {
            truckTitle: truck.title,
            truckId: truck._id.toString()
          }
        });
        logger.info('TRUCK_DELETED_NOTIFICATION', {
  truckId: truck._id,
  truckTitle: truck.title,
  ownerId: owner._id,
  ownerName: owner.name
});
      }
    } catch (notificationError) {
      logger.error('ADMIN_NOTIFICATION_ERROR', {
        context: 'delete_truck',
        error: notificationError.message,
        stack: notificationError.stack,
        truckId: req.params.id,
        ownerId: req.user?.id
      });
      // Don't fail the truck deletion if notification fails
    }

    res.json({ success: true, message: "Truck and image deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// GET OWNER BOOKINGS
// -----------------------------
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ owner: req.user.id })
      .populate("truck", "title type capacityTons ratePerKm imageUrl")
      .populate("customer", "name email phone")
      .populate("owner", "name email phone")
      .sort({ createdAt: -1 });

    
    res.json({ success: true, data: bookings });

  } catch (error) {
    logger.error('GET_MY_BOOKINGS_ERROR', {
      error: error.message,
      stack: error.stack,
      ownerId: req.user?.id
    });
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// UPDATE BOOKING STATUS
// -----------------------------
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id)
      .populate("truck", "title")
      .populate("customer", "name email")
      .populate("owner", "name");

    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    if (booking.owner._id.toString() !== req.user.id)
      return res.status(403).json({ success: false, message: "Not authorized" });

    if (!["accepted", "declined", "in_transit", "completed"].includes(status))
      return res.status(400).json({ success: false, message: "Invalid status" });

    // Check if payment is completed before allowing status update to 'in_transit'
    if (status === 'in_transit' && booking.paymentStatus !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot start trip until payment is completed" 
      });
    }

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    const updatedBooking = await Booking.findById(req.params.id)
      .populate("truck")
      .populate("customer")
      .populate("owner");

    const io = req.app.get("io");

    // Create notifications based on status change
    if (status === "accepted") {
      // Notify customer
      await Notification.create({
        userId: booking.customer._id,
        userRole: "customer",
        message: `Your booking for ${booking.truck.title} has been accepted!`,
        type: "booking",
        relatedId: booking._id,
      });

      if (status !== oldStatus && updatedBooking?.customer?.email) {
        try {
          await emailService.sendBookingStatusUpdateEmail({
            to: updatedBooking.customer.email,
            customerName: updatedBooking.customer.name,
            truckTitle: updatedBooking.truck?.title,
            status,
            bookingId: updatedBooking._id,
            pickupAddress: updatedBooking.pickup?.address,
            dropoffAddress: updatedBooking.dropoff?.address,
            price: updatedBooking.price,
          });
        } catch (emailError) {
          logger.error('BOOKING_EMAIL_ERROR', {
            type: 'owner_booking_accepted',
            error: emailError.message,
            stack: emailError.stack,
            bookingId: updatedBooking?._id,
            ownerId: req.user?.id,
            customerId: updatedBooking?.customer?._id
          });
        }
      }
      if (io) {
        io.to(`user-${booking.customer._id}`).emit("notification", {
          message: `Your booking for ${booking.truck.title} has been accepted!`,
          type: "booking",
        });
      }
    } else if (status === "declined") {
      // Notify customer
      await Notification.create({
        userId: booking.customer._id,
        userRole: "customer",
        message: `Your booking for ${booking.truck.title} has been declined.`,
        type: "booking",
        relatedId: booking._id,
      });
      if (io) {
        io.to(`user-${booking.customer._id}`).emit("notification", {
          message: `Your booking for ${booking.truck.title} has been declined.`,
          type: "booking",
        });
      }
    } else if (status === "in_transit") {
      // Notify customer
      await Notification.create({
        userId: booking.customer._id,
        userRole: "customer",
        message: `Your booking for ${booking.truck.title} is now in transit!`,
        type: "booking",
        relatedId: booking._id,
      });

      if (status !== oldStatus && updatedBooking?.customer?.email) {
        try {
          await emailService.sendBookingStatusUpdateEmail({
            to: updatedBooking.customer.email,
            customerName: updatedBooking.customer.name,
            truckTitle: updatedBooking.truck?.title,
            status,
            bookingId: updatedBooking._id,
            pickupAddress: updatedBooking.pickup?.address,
            dropoffAddress: updatedBooking.dropoff?.address,
            price: updatedBooking.price,
          });
        } catch (emailError) {
          logger.error('BOOKING_EMAIL_ERROR', {
            type: 'booking_in_transit',
            error: emailError.message,
            stack: emailError.stack,
            bookingId: updatedBooking?._id,
            ownerId: req.user?.id,
            customerId: updatedBooking?.customer?._id
          });
        }
      }
      if (io) {
        io.to(`user-${booking.customer._id}`).emit("notification", {
          message: `Your booking for ${booking.truck.title} is now in transit!`,
          type: "booking",
        });
      }
    } else if (status === "completed") {
      // Notify customer with review prompt
      await Notification.create({
        userId: booking.customer._id,
        userRole: "customer",
        message: `Your trip with ${booking.truck.title} is completed! Please write a review to help others.`,
        type: "review",
        relatedId: booking._id,
        truckId: booking.truck._id,
      });

      if (status !== oldStatus && updatedBooking?.customer?.email) {
        try {
          await emailService.sendBookingStatusUpdateEmail({
            to: updatedBooking.customer.email,
            customerName: updatedBooking.customer.name,
            truckTitle: updatedBooking.truck?.title,
            status,
            bookingId: updatedBooking._id,
            pickupAddress: updatedBooking.pickup?.address,
            dropoffAddress: updatedBooking.dropoff?.address,
            price: updatedBooking.price,
          });
        } catch (emailError) {
          logger.error('BOOKING_EMAIL_ERROR', {
            type: 'booking_completed',
            error: emailError.message,
            stack: emailError.stack,
            bookingId: updatedBooking?._id,
            ownerId: req.user?.id,
            customerId: updatedBooking?.customer?._id
          });
        }
      }
      if (io) {
        io.to(`user-${booking.customer._id}`).emit("notification", {
          message: `Your trip with ${booking.truck.title} is completed! Please write a review.`,
          type: "review",
          truckId: booking.truck._id,
        });
      }
    }

    // Emit booking update
    if (io) {
      io.to(`user-${booking.customer._id}`).emit("booking_updated", { booking: updatedBooking });
      io.to(`user-${req.user.id}`).emit("booking_updated", { booking: updatedBooking });
    }

    res.json({ success: true, data: updatedBooking, message: "Status updated" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// -----------------------------
// UPDATE OWNER PROFILE
// -----------------------------
const updateProfile = async (req, res) => {
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
      await unlinkFile(imageFile.path);
      
      // Add image URL to updates
      updates.profileImageUrl = result.secure_url;
    }

    const updated = await Owner.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ success: true, data: updated, message: "Profile updated successfully" });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// -----------------------------
// GET TRUCK DETAIL BY ID
// -----------------------------
const getTruckDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerId = req.user.id;

    // Find truck that belongs to this owner
    const truck = await Truck.findOne({ _id: id, owner: ownerId })
      .populate('owner', 'name email phone profileImageUrl verificationBadge companyName experienceYears address');

    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found or you do not have permission to view it' });
    }

    res.json({
      success: true,
      data: truck
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// EXPORT
module.exports = {
  getMyTrucks,
  addTruck,
  updateTruck,
  deleteTruck,
  getMyBookings,
  updateBookingStatus,
  updateProfile,
  toggleTruckAvailability,
  getTruckDetail,
};
