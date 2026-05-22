const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userService = require('./userService');
const emailService = require('./emailService');
const otpUtils = require('../utils/otpUtils');
const logger = require('../utils/logger');

/**
 * Register a new user and send OTP
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Registration result
 */
const registerUser = async (userData) => {
  const { name, email, password, phone, address, role } = userData;

  // Get appropriate user model
  const UserModel = userService.getUserModelByRole(role);

  // Check if user already exists
  const exists = await userService.userExists(email, role);
  if (exists) {
    throw new Error('This email is already registered. Please use a different email or login to your existing account.');
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Generate and hash OTP
  const otp = otpUtils.generateOTP();
  const otpHash = await otpUtils.hashOTP(otp);
  const otpExpires = otpUtils.getOTPExpirationTime();

  // Create user
  const user = await UserModel.create({
    name,
    email,
    passwordHash,
    phone,
    address,
    role,
    otp: otpHash,
    otpExpires,
    isVerified: false,
  });

  // Send OTP email
  try {
    await emailService.sendOTPEmail(email, otp);
    return { user, emailSent: true };
  } catch (emailError) {
    return { user, emailSent: false, emailError };
  }
};

/**
 * Verify OTP for user
 * @param {string} email - User email
 * @param {string} otp - OTP code to verify
 * @returns {Promise<Object>} Verification result
 */
const verifyUserOTP = async (email, otp) => {
  // Find user with OTP fields
  const { user, userType } = await userService.findUserByEmail(email, true);

  if (!user) {
    throw new Error('User not found with this email address');
  }

  // Check if already verified
  if (user.isVerified) {
    return { verified: true, alreadyVerified: true, user, userType };
  }

  // Check if OTP exists
  if (!user.otp) {
    throw new Error('No OTP found for this user. Please request a new OTP.');
  }

  // Check if OTP expired
  if (otpUtils.isOTPExpired(user.otpExpires)) {
    logger.warn('OTP_VERIFICATION_FAILED', {
      email,
      reason: 'expired'
    });
    throw new Error('OTP has expired. Please request a new OTP.');
  }

  // Verify OTP
  const isValid = await otpUtils.compareOTP(otp, user.otp);
  if (!isValid) {
    logger.warn('OTP_VERIFICATION_FAILED', {
      email,
      reason: 'invalid'
    });
    throw new Error('Incorrect OTP. Please check and try again.');
  }

  // Mark user as verified and clear OTP
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  return { verified: true, user, userType };
};

/**
 * Resend OTP to user
 * @param {string} email - User email
 * @returns {Promise<Object>} Resend result
 */
const resendUserOTP = async (email) => {
  // Find user with OTP fields
  const { user, userType } = await userService.findUserByEmail(email, true);

  if (!user) {
    throw new Error('User not found with this email address');
  }

  // Check if already verified
  if (user.isVerified) {
    return { alreadyVerified: true };
  }

  // Generate new OTP
  const otp = otpUtils.generateOTP();
  const otpHash = await otpUtils.hashOTP(otp);
  const otpExpires = otpUtils.getOTPExpirationTime();

  // Update user with new OTP
  user.otp = otpHash;
  user.otpExpires = otpExpires;
  await user.save();

  // Send OTP email
  await emailService.sendOTPEmail(email, otp);

  return { success: true };
};

/**
 * Authenticate user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Authentication result with user and token
 */
const authenticateUser = async (email, password) => {
  // Find user
  const { user, userType } = await userService.findUserByEmail(email, false);

  if (!user) {
    logger.warn('LOGIN_FAILED', {
      email,
      reason: 'user_not_found'
    });
    throw new Error('Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    logger.warn('LOGIN_FAILED', {
      email,
      reason: 'invalid_password'
    });
    throw new Error('Invalid email or password');
  }

  // Check email verification
  if (!user.isVerified) {
    throw { message: 'Email not verified. Please verify your email with OTP before logging in.', requireVerification: true };
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  logger.info('LOGIN_SUCCESS', {
    userId: user._id,
    email,
    role: userType
  });

  return {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone || null,
      address: user.address || null,
    },
  };
};

/**
 * Request password reset - Send OTP to user's email
 * @param {string} email - User email
 * @returns {Promise<Object>} Reset request result
 */
const requestPasswordReset = async (email) => {
  // Find user with reset OTP fields
  const { user, userType } = await userService.findUserByEmail(email, false, true);

  if (!user) {
    throw new Error('User not found with this email address');
  }

  // Generate reset OTP
  const resetOtp = otpUtils.generateOTP();
  const resetOtpHash = await otpUtils.hashOTP(resetOtp);
  const resetOtpExpires = otpUtils.getOTPExpirationTime();

  // Update user with reset OTP
  user.resetOtp = resetOtpHash;
  user.resetOtpExpires = resetOtpExpires;
  await user.save();

  // Send password reset email
  await emailService.sendPasswordResetEmail(email, resetOtp);

  return { success: true, email, userType };
};

/**
 * Verify password reset OTP
 * @param {string} email - User email
 * @param {string} otp - OTP code to verify
 * @returns {Promise<Object>} Verification result
 */
const verifyPasswordResetOTP = async (email, otp) => {
  // Find user with reset OTP fields
  const { user, userType } = await userService.findUserByEmail(email, false, true);

  if (!user) {
    throw new Error('User not found with this email address');
  }

  // Check if reset OTP exists
  if (!user.resetOtp) {
    throw new Error('No password reset code found. Please request a new one.');
  }

  // Check if reset OTP expired
  if (otpUtils.isOTPExpired(user.resetOtpExpires)) {
    throw new Error('Password reset code has expired. Please request a new one.');
  }

  // Verify reset OTP
  const isValid = await otpUtils.compareOTP(otp, user.resetOtp);
  if (!isValid) {
    throw new Error('Incorrect reset code. Please check and try again.');
  }

  return { verified: true, user, userType };
};

/**
 * Reset user password after OTP verification
 * @param {string} email - User email
 * @param {string} newPassword - New password
 * @returns {Promise<Object>} Reset result
 */
const resetPassword = async (email, newPassword) => {
  // Find user
  const { user, userType } = await userService.findUserByEmail(email, false);

  if (!user) {
    throw new Error('User not found with this email address');
  }

  // Validate password length
  if (!newPassword || newPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 10);

  // Update password and clear reset OTP fields
  user.passwordHash = passwordHash;
  user.resetOtp = undefined;
  user.resetOtpExpires = undefined;
  await user.save();

  logger.info('PASSWORD_RESET_SUCCESS', {
    userId: user._id,
    email,
    role: userType
  });

  return { success: true, email, userType };
};

module.exports = {
  registerUser,
  verifyUserOTP,
  resendUserOTP,
  authenticateUser,
  requestPasswordReset,
  verifyPasswordResetOTP,
  resetPassword,
};

