const { body, param, query, validationResult } = require('express-validator');
const { BadRequestError } = require('../utils/errorHandler');

// Common validation rules
const nameValidation = body('name')
  .trim()
  .notEmpty().withMessage('Name is required')
  .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters');

const emailValidation = body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Please provide a valid email')
  .normalizeEmail();

const passwordValidation = body('password')
  .notEmpty().withMessage('Password is required')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
  .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
  .matches(/\d/).withMessage('Password must contain at least one number');

const phoneValidation = body('phone')
  .optional({ checkFalsy: true })
  .isMobilePhone().withMessage('Please provide a valid phone number');

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push({ [err.path]: err.msg }));
  
  throw new BadRequestError('Validation failed', {
    errors: extractedErrors,
    statusCode: 422
  });
};

// Auth validations
const registerValidation = [
  nameValidation,
  emailValidation,
  passwordValidation,
  phoneValidation,
  validate
];

const loginValidation = [
  emailValidation,
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const otpValidation = [
  emailValidation,
  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isNumeric().withMessage('OTP must be a number')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validate
];

// Booking validations
const createBookingValidation = [
  body('truckId')
    .notEmpty().withMessage('Truck ID is required')
    .isMongoId().withMessage('Invalid truck ID format'),
  body('pickup')
    .isObject().withMessage('Pickup information is required')
    .custom((value) => {
      if (!value.address) throw new Error('Pickup address is required');
      if (!value.lat || !value.lng) {
        throw new Error('Pickup coordinates are required');
      }
      if (isNaN(value.lat) || isNaN(value.lng)) {
        throw new Error('Pickup coordinates must be numbers');
      }
      return true;
    }),
  body('dropoff')
    .isObject().withMessage('Dropoff information is required')
    .custom((value) => {
      if (!value.address) throw new Error('Dropoff address is required');
      if (!value.lat || !value.lng) {
        throw new Error('Dropoff coordinates are required');
      }
      if (isNaN(value.lat) || isNaN(value.lng)) {
        throw new Error('Dropoff coordinates must be numbers');
      }
      return true;
    }),
  body('startTime')
    .notEmpty().withMessage('Start time is required')
    .isISO8601().withMessage('Invalid start time format')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),
  body('endTime')
    .notEmpty().withMessage('End time is required')
    .isISO8601().withMessage('Invalid end time format')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('capacityTons')
    .notEmpty().withMessage('Capacity is required')
    .isFloat({ min: 0.1 }).withMessage('Capacity must be greater than 0'),
  validate
];

// ID parameter validation
const idParamValidation = [
  param('id')
    .notEmpty().withMessage('ID is required')
    .isMongoId().withMessage('Invalid ID format'),
  validate
];

// Pagination validation
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  validate
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  otpValidation,
  createBookingValidation,
  idParamValidation,
  paginationValidation
};
