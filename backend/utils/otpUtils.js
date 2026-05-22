const bcrypt = require('bcryptjs');

/**
 * Generate a random 6-digit OTP
 * @returns {string} 6-digit OTP string
 */
const generateOTP = () => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  return otp;
};

/**
 * Hash an OTP using bcrypt
 * @param {string} otp - Plain text OTP
 * @returns {Promise<string>} Hashed OTP
 */
const hashOTP = async (otp) => {
  return await bcrypt.hash(otp, 10);
};

/**
 * Compare plain OTP with hashed OTP
 * @param {string} plainOTP - Plain text OTP to verify
 * @param {string} hashedOTP - Hashed OTP from database
 * @returns {Promise<boolean>} True if OTP matches
 */
const compareOTP = async (plainOTP, hashedOTP) => {
  return await bcrypt.compare(plainOTP, hashedOTP);
};

/**
 * Calculate OTP expiration time (10 minutes from now)
 * @returns {number} Timestamp in milliseconds
 */
const getOTPExpirationTime = () => {
  return Date.now() + 10 * 60 * 1000; // 10 minutes
};

/**
 * Check if OTP is expired
 * @param {number} otpExpires - Expiration timestamp
 * @returns {boolean} True if expired
 */
const isOTPExpired = (otpExpires) => {
  if (!otpExpires) return true;
  return otpExpires < Date.now();
};

/**
 * Validate OTP format (must be 6 digits)
 * @param {string} otp - OTP to validate
 * @returns {boolean} True if valid format
 */
const validateOTPFormat = (otp) => {
  return /^\d{6}$/.test(otp);
};

module.exports = {
  generateOTP,
  hashOTP,
  compareOTP,
  getOTPExpirationTime,
  isOTPExpired,
  validateOTPFormat,
};

