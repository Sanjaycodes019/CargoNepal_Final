const mongoose = require('mongoose');

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, default: 'admin' },

  // Profile information
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  
  // Profile image fields
  profileImageUrl: { type: String, default: '' },
  profileImagePublicId: { type: String, default: '' },

  // OTP / Email Verification fields
  isVerified: { type: Boolean, default: false },
  otp: { type: String, select: false },        // hashed OTP
  otpExpires: { type: Date, select: false },   // expiry timestamp
  
  // Verification Badge field (separate from OTP verification)
  verificationBadge: { type: Boolean, default: true },
  
  // Password reset fields
  resetOtp: { type: String, select: false },   // hashed reset OTP
  resetOtpExpires: { type: Date, select: false } // reset OTP expiry timestamp
}, { timestamps: true });

// Hide sensitive fields
AdminSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.otp;
  delete obj.otpExpires;
  delete obj.resetOtp;
  delete obj.resetOtpExpires;
  return obj;
};

module.exports = mongoose.model('Admin', AdminSchema);
