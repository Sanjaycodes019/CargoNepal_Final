const Admin = require('../models/AdminModel');
const Owner = require('../models/OwnerModel');
const Customer = require('../models/CustomerModel');
const logger = require('../utils/logger');

/**
 * Find user by email across all user collections
 * @param {string} email - User email address
 * @param {boolean} includeOtp - Whether to include OTP fields in query
 * @returns {Promise<{user: Object|null, userType: string|null}>} User object and type
 */
const findUserByEmail = async (email, includeOtp = false, includeResetOtp = false) => {
  let selectFields = '';
  if (includeOtp) selectFields += '+otp +otpExpires ';
  if (includeResetOtp) selectFields += '+resetOtp +resetOtpExpires';
  selectFields = selectFields.trim();
  
  let user = null;
  let userType = null;

  // Try Admin first
  user = selectFields ? await Admin.findOne({ email }).select(selectFields) : await Admin.findOne({ email });
  if (user) {
    userType = 'admin';
    return { user, userType };
  }

  // Try Owner
  user = selectFields ? await Owner.findOne({ email }).select(selectFields) : await Owner.findOne({ email });
  if (user) {
    userType = 'owner';
    return { user, userType };
  }

  // Try Customer
  user = selectFields ? await Customer.findOne({ email }).select(selectFields) : await Customer.findOne({ email });
  if (user) {
    userType = 'customer';
    return { user, userType };
  }

  return { user: null, userType: null };
};

/**
 * Get user model based on role
 * @param {string} role - User role (admin, owner, customer)
 * @returns {Object} Mongoose model
 */
const getUserModelByRole = (role) => {
  switch (role) {
    case 'admin':
      return Admin;
    case 'owner':
      return Owner;
    case 'customer':
      return Customer;
    default:
      throw new Error(`Invalid role: ${role}`);
  }
};

/**
 * Find user by ID based on role
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @param {Object} options - Query options (select, populate, etc.)
 * @returns {Promise<Object|null>} User object
 */
const findUserById = async (userId, role, options = {}) => {
  const UserModel = getUserModelByRole(role);
  let query = UserModel.findById(userId);

  if (options.select) {
    query = query.select(options.select);
  }

  if (options.populate) {
    query = query.populate(options.populate);
  }

  const user = await query;
  return user;
};

/**
 * Check if user with email exists across all user models
 * @param {string} email - User email
 * @param {string} role - User role (for logging purposes)
 * @returns {Promise<boolean>} True if user exists
 */
const userExists = async (email, role) => {
  // Check across all user models to prevent duplicate emails
  const adminUser = await Admin.findOne({ email });
  if (adminUser) {
    logger.warn('REGISTRATION_DUPLICATE_EMAIL', { 
      email, 
      existingRole: 'admin', 
      attemptedRole: role 
    });
    return true;
  }

  const ownerUser = await Owner.findOne({ email });
  if (ownerUser) {
    logger.warn('REGISTRATION_DUPLICATE_EMAIL', { 
      email, 
      existingRole: 'owner', 
      attemptedRole: role 
    });
    return true;
  }

  const customerUser = await Customer.findOne({ email });
  if (customerUser) {
    logger.warn('REGISTRATION_DUPLICATE_EMAIL', { 
      email, 
      existingRole: 'customer', 
      attemptedRole: role 
    });
    return true;
  }

  return false;
};

module.exports = {
  findUserByEmail,
  getUserModelByRole,
  findUserById,
  userExists,
};

