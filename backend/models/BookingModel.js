const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  truck: { type: mongoose.Schema.Types.ObjectId, ref: 'Truck', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },

  capacityTons: { type: Number, required: true },   // example: 15

  pickup: {
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },
  dropoff: {
    address: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },

  // Time-based booking for conflict detection
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  estimatedDuration: { type: Number }, // in hours

  distanceKm: { type: Number },
  price: { type: Number },

  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'in_transit', 'completed', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending'
  },

  notes: { type: String }
}, { timestamps: true });

// Index for efficient conflict detection
BookingSchema.index({ truck: 1, startTime: 1, endTime: 1 });
BookingSchema.index({ status: 1 });

// Validation for time logic
BookingSchema.pre('save', function(next) {
  if (this.startTime >= this.endTime) {
    next(new Error('End time must be after start time'));
  } else {
    next();
  }
});

// Auto-manage truck availability when booking status changes
BookingSchema.pre('save', async function(next) {
  // Only run if status is being modified
  if (!this.isModified('status')) {
    return next();
  }

  try {
    const Truck = require('./TruckModel');
    const truck = await Truck.findById(this.truck);
    
    if (!truck) {
      return next(new Error('Truck not found'));
    }

    // Set truck unavailable when booking is accepted or in transit
    if (this.status === 'accepted' || this.status === 'in_transit') {
      truck.available = false;
      await truck.save();
    }
    // Set truck available when booking is completed or cancelled
    else if (this.status === 'completed' || this.status === 'cancelled') {
      // Check if there are any other active bookings for this truck
      const Booking = require('./BookingModel');
      const activeBookings = await Booking.find({
        truck: this.truck,
        status: { $in: ['pending', 'accepted', 'in_transit'] },
        _id: { $ne: this._id }
      });
      
      // Only set truck to available if no other active bookings exist
      if (activeBookings.length === 0) {
        truck.available = true;
        await truck.save();
      }
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Booking', BookingSchema);
