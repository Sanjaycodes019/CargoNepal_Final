const Review = require('../models/ReviewModel');
const Booking = require('../models/BookingModel');

// Create review
const createReview = async (req, res) => {
  try {
    const { bookingId, truckId, rating, comment } = req.body;

    if (!bookingId || !truckId || !rating) {
      return res.status(400).json({ success: false, message: 'Booking ID, Truck ID, and rating are required' });
    }

    // Check if booking exists and belongs to customer
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.customer.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if review already exists for this booking
    const existingReview = await Review.findOne({ booking: bookingId });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'Review already exists for this booking' });
    }

    const review = await Review.create({
      booking: bookingId,
      customer: req.user.id,
      truck: truckId,
      rating,
      comment
    });

    const populatedReview = await Review.findById(review._id)
      .populate('customer', 'name profileImageUrl verificationBadge')
      .populate('truck', 'title');

    res.status(201).json({
      success: true,
      data: populatedReview,
      message: 'Review created successfully'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get reviews for a truck
const getTruckReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ truck: req.params.id })
      .populate('customer', 'name profileImageUrl verificationBadge')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({ 
      success: true, 
      data: reviews,
      averageRating: avgRating,
      totalReviews: reviews.length
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete review (owner only)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id).populate('truck', 'owner');
    
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    // Check if user is the owner of the truck
    if (review.truck.owner.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createReview, getTruckReviews, deleteReview };

