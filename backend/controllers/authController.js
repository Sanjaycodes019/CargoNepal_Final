const authService = require('../services/authService');
const userService = require('../services/userService');
const otpUtils = require('../utils/otpUtils');
const { createAdminNotification } = require('../services/adminNotificationService');
const logger = require('../utils/logger');

// ============================================================================
// REGISTER - Create new user and send OTP
// ============================================================================

const register = async (req, res) => {
  const { name, email, password, phone, address, role } = req.body;

  logger.info('REGISTER_REQUEST', { email, role });

  try {
    // Validate required fields
    if (!name || !email || !password || !role) {
      logger.warn('REGISTER_VALIDATION_FAILED', { 
        error: 'Missing required fields',
        required: ['name', 'email', 'password', 'role']
      });
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, password, role'
      });
    }

    // Validate role
    if (!['customer', 'owner', 'admin'].includes(role)) {
      logger.warn('REGISTER_INVALID_ROLE', { role });
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be one of: customer, owner, admin'
      });
    }

    // Register user
    const { user, emailSent, emailError } = await authService.registerUser({
      name,
      email,
      password,
      phone,
      address,
      role
    });

    if (emailSent) {
      // Create admin notification for new user registration
      try {
        const newUser = await userService.getUserByEmail(email);
        await createAdminNotification({
          type: `new_${role}`,
          relatedUserId: newUser._id,
          relatedUserModel: role.charAt(0).toUpperCase() + role.slice(1), // Owner, Customer
          userName: newUser.name,
          actionUrl: `/admin/verification/${role}/${newUser._id}`
        });
      } catch (notificationError) {
        logger.error('ADMIN_NOTIFICATION_FAILED', {
          context: 'user_registration',
          error: notificationError.message,
          stack: process.env.NODE_ENV === 'development' ? notificationError.stack : undefined
        });
      }

      return res.status(201).json({
        success: true,
        message: 'Registration successful. OTP has been sent to your email.',
        data: { email, role }
      });
    } else {
      return res.status(201).json({
        success: true,
        message: 'Registration successful, but OTP email failed to send. Please use resend OTP.',
        data: { email, role },
        emailError: true
      });
    }

  } catch (error) {
    logger.error('REGISTRATION_FAILED', {
      email,
      error: error.message,
      statusCode: error.message.includes('already exists') ? 400 : 500,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    const statusCode = error.message.includes('already exists') ? 400 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error during registration'
    });
  }
};

// ============================================================================
// VERIFY OTP - Verify user's email with OTP code
// ============================================================================

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;

  logger.info('VERIFY_OTP_REQUEST', { email });

  try {
    // Validate input
    if (!email || !otp) {
      logger.warn('VERIFY_OTP_VALIDATION_FAILED', { 
        error: 'Missing required fields',
        required: ['email', 'otp']
      });
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Validate OTP format
    if (!otpUtils.validateOTPFormat(otp)) {
      logger.warn('INVALID_OTP_FORMAT', { otp: '***' });
      return res.status(400).json({
        success: false,
        message: 'OTP must be a 6-digit number'
      });
    }

    // Verify OTP
    const { verified, alreadyVerified, user, userType } = await authService.verifyUserOTP(email, otp);

    if (alreadyVerified) {
      return res.json({
        success: true,
        message: 'Email is already verified. You can proceed to login.',
        data: { email, verified: true }
      });
    }

    // Create admin notification for new user registration
    if (verified && user && userType !== 'admin') {
      try {
        await createAdminNotification({
          type: `new_${userType}`,
          relatedUserId: user._id,
          relatedUserModel: userType.charAt(0).toUpperCase() + userType.slice(1), // Owner, Customer
          userName: user.name,
          actionUrl: `/admin/verification/${userType}/${user._id}`
        });
        logger.info('ADMIN_NOTIFICATION_CREATED', { 
          userType, 
          userId: user._id,
          userName: user.name 
        });
      } catch (notificationError) {
        logger.error('ADMIN_NOTIFICATION_FAILED', {
          context: 'otp_verification',
          error: notificationError.message,
          stack: process.env.NODE_ENV === 'development' ? notificationError.stack : undefined
        });
        // Don't fail the registration if notification fails
      }
    }

    return res.json({
      success: true,
      message: 'Email verified successfully. You can now login.',
      data: {
        email: user.email,
        role: userType,
        verified: true
      }
    });

  } catch (error) {
    logger.error('OTP_VERIFICATION_FAILED', {
      email,
      error: error.message,
      statusCode: error.message.includes('not found') ? 404 : 400,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    const statusCode = error.message.includes('not found') ? 404 : 400;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error during OTP verification'
    });
  }
};

// ============================================================================
// RESEND OTP - Generate and send new OTP to user
// ============================================================================

const resendOTP = async (req, res) => {
  const { email } = req.body;

  logger.info('RESEND_OTP_REQUEST', { email });

  try {
    // Validate input
    if (!email) {
      logger.warn('RESEND_OTP_VALIDATION_FAILED', { 
        error: 'Email is required'
      });
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Resend OTP
    const { alreadyVerified } = await authService.resendUserOTP(email);

    if (alreadyVerified) {
      return res.json({
        success: true,
        message: 'Email is already verified. No need to resend OTP.'
      });
    }

    return res.json({
      success: true,
      message: 'New OTP has been sent to your email successfully.'
    });

  } catch (error) {
    logger.error('RESEND_OTP_FAILED', {
      email,
      error: error.message,
      statusCode: error.message.includes('not found') ? 404 : 500,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error during OTP resend'
    });
  }
};

// ============================================================================
// LOGIN - Authenticate user (requires email verification)
// ============================================================================

const login = async (req, res) => {
  const { email, password } = req.body;

  logger.info('LOGIN_ATTEMPT', { email });

  try {
    // Validate input
    if (!email || !password) {
      logger.warn('LOGIN_VALIDATION_FAILED', { 
        error: 'Missing credentials',
        required: ['email', 'password']
      });
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Authenticate user
    const { token, user } = await authService.authenticateUser(email, password);

    logger.info('LOGIN_SUCCESSFUL', { 
      userId: user._id,
      role: user.role 
    });

    return res.json({
      success: true,
      message: 'Login successful',
      data: { token, user: { id: user._id, email: user.email, role: user.role } }
    });

  } catch (error) {
    // Handle verification requirement
    if (error.requireVerification) {
      logger.warn('LOGIN_VERIFICATION_REQUIRED', { 
        email,
        message: 'Email verification required'
      });
      return res.status(403).json({
        success: false,
        message: error.message,
        requireVerification: true
      });
    }

    logger.error('LOGIN_FAILED', {
      email,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    const statusCode = error.message.includes('Invalid') ? 401 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error during login'
    });
  }
};

// ============================================================================
// GET ME - Get current authenticated user
// ============================================================================

const getMe = async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  logger.debug('GET_ME_REQUEST', { userId, userRole });

  try {
    const options = {
      select: '-passwordHash',
      populate: userRole === 'owner' ? 'trucks' : undefined
    };

    const user = await userService.findUserById(userId, userRole, options);

    if (!user) {
      logger.warn('GET_ME_USER_NOT_FOUND', { userId, userRole });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: user
    });

  } catch (error) {
    logger.error('GET_ME_ERROR', { 
      userId, 
      userRole, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Internal server error'
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

// ============================================================================
// FORGOT PASSWORD - Request password reset OTP
// ============================================================================

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  logger.info('FORGOT_PASSWORD_REQUEST', { email });

  try {
    // Validate input
    if (!email) {
      logger.warn('FORGOT_PASSWORD_VALIDATION_FAILED', { error: 'Email missing' });
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Request password reset
    await authService.requestPasswordReset(email);

    return res.json({
      success: true,
      message: 'Password reset code has been sent to your email.'
    });

  } catch (error) {
    logger.error('FORGOT_PASSWORD_ERROR', { 
      email, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error during password reset request'
    });
  }
};

// ============================================================================
// VERIFY RESET OTP - Verify password reset OTP
// ============================================================================

const verifyResetOTP = async (req, res) => {
  const { email, otp } = req.body;

  logger.info('VERIFY_RESET_OTP_REQUEST', { email });

  try {
    // Validate input
    if (!email || !otp) {
      logger.warn('VERIFY_RESET_OTP_VALIDATION_FAILED', { 
        error: 'Missing email or OTP',
        missing: [
          !email && 'email',
          !otp && 'otp'
        ].filter(Boolean)
      });
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    // Validate OTP format
    if (!otpUtils.validateOTPFormat(otp)) {
      logger.warn('VERIFY_RESET_OTP_INVALID_FORMAT', { email, otp });
      return res.status(400).json({
        success: false,
        message: 'OTP must be a 6-digit number'
      });
    }

    // Verify reset OTP
    const { verified, user, userType } = await authService.verifyPasswordResetOTP(email, otp);

    return res.json({
      success: true,
      message: 'Reset code verified successfully. You can now set a new password.',
      data: {
        email: user.email,
        role: userType,
        verified: true
      }
    });

  } catch (error) {
    logger.error('VERIFY_RESET_OTP_ERROR', { 
      email, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    const statusCode = error.message.includes('not found') ? 404 : 400;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error during reset OTP verification'
    });
  }
};

// ============================================================================
// RESET PASSWORD - Set new password after OTP verification
// ============================================================================

const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  logger.info('RESET_PASSWORD_REQUEST', { email });

  try {
    // Validate input
    if (!email || !otp || !newPassword) {
      logger.warn('RESET_PASSWORD_VALIDATION_FAILED', { 
        error: 'Missing required fields',
        missing: [
          !email && 'email',
          !otp && 'otp',
          !newPassword && 'newPassword'
        ].filter(Boolean)
      });
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    // Validate password length
    if (newPassword.length < 6) {
      logger.warn('RESET_PASSWORD_TOO_SHORT', { email });
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    // Verify OTP first
    await authService.verifyPasswordResetOTP(email, otp);

    // Reset password
    await authService.resetPassword(email, newPassword);

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    logger.error('RESET_PASSWORD_ERROR', { 
      email, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    const statusCode = error.message.includes('not found') ? 404 : 
                       error.message.includes('expired') || error.message.includes('Incorrect') ? 400 : 500;
    
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Internal server error during password reset'
    });
  }
};

// ============================================================================
// CHECK EMAIL - Check if email already exists across all user types
// ============================================================================

const checkEmail = async (req, res) => {
  const { email } = req.query;

  logger.info('CHECK_EMAIL_REQUEST', { email });

  try {
    // Validate input
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Check if email exists across all user models
    const exists = await userService.userExists(email, 'registration_check');

    return res.json({
      success: true,
      exists,
      message: exists ? 'Email already registered' : 'Email available'
    });

  } catch (error) {
    logger.error('CHECK_EMAIL_ERROR', {
      email,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error during email check'
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  register,
  login,
  verifyOTP,
  resendOTP,
  getMe,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  checkEmail,
};
