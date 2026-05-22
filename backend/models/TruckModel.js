const mongoose = require('mongoose');

const TruckSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Owner', required: true },
  title: { type: String, required: true },
  type: { type: String },
  capacityTons: { type: Number },
  ratePerKm: { type: Number, default: 25 },

  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      index: '2dsphere'
    },
    address: { type: String }
  },

  available: { type: Boolean, default: true },
  ownerTurnedOff: { type: Boolean, default: false }, // Owner manually turned off truck
  description: { type: String },
  imageUrl: { type: String },
  
  // Availability date ranges
  availableFrom: { type: Date },
  availableUntil: { type: Date },
  
  // Verification status for trucks
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Truck', TruckSchema);
