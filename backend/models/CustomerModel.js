const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String },
  address: { type: String },
  role: { type: String, default: 'customer' },
  profileImageUrl: { type: String, default: null },

  // OTP / verification fields
  isVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },        // hashed OTP, don't return by default
  otpExpires: { type: Date, select: false },   // expiry timestamp
  
  // Verification Badge field (separate from OTP verification)
  verificationBadge: { type: Boolean, default: false },
  
  // Password reset fields
  resetOtp: { type: String, select: false },   // hashed reset OTP
  resetOtpExpires: { type: Date, select: false } // reset OTP expiry timestamp
}, { timestamps: true });

// Optional: helper method to hide sensitive fields when converting to JSON
CustomerSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.resetOtp;
  delete obj.resetOtpExpires;
  return obj;
};

module.exports = mongoose.model('Customer', CustomerSchema);
