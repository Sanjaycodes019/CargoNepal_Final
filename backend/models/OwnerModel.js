const mongoose = require('mongoose');

const OwnerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  
  companyName: { type: String, default: '' },
  experienceYears: { type: Number, default: 0 },
  bio: { type: String, default: '' },
  profileImageUrl: { type: String, default: null },
  
  trucks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Truck' }],
  role: { type: String, default: 'owner' },

  // OTP / Email Verification fields
  isVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },        // hashed OTP
  otpExpires: { type: Date, select: false },   // expiry timestamp
  
  // Verification Badge field (separate from OTP verification)
  verificationBadge: { type: Boolean, default: false },
  
  // Password reset fields
  resetOtp: { type: String, select: false },   // hashed reset OTP
  resetOtpExpires: { type: Date, select: false } // reset OTP expiry timestamp
}, { timestamps: true });

// Hide sensitive fields when converting to JSON
OwnerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.resetOtp;
  delete obj.resetOtpExpires;
  return obj;
};

module.exports = mongoose.model('Owner', OwnerSchema);
