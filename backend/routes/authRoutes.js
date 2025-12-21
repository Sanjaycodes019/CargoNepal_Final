const express = require('express');
const router = express.Router();
const { body } = require('express-validator');

// Import controllers
const {
  register,
  login,
  verifyOTP,
  resendOTP,
  getMe,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
} = require('../controllers/authController');

// Import middleware
const { authMiddleware } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validators');

// Validation middleware
const validateEmail = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  validate
];

const validateOTP = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('otp')
    .notEmpty().withMessage('OTP is required')
    .isNumeric().withMessage('OTP must be a number')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  validate
];

// Apply rate limiting and validation to authentication endpoints
// AUTH ROUTES
router.post('/register', authLimiter, [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['customer', 'owner', 'admin']).withMessage('Invalid role'),
  body('phone')
    .optional({ checkFalsy: true })
    .isMobilePhone().withMessage('Please provide a valid phone number'),
  validate
], register);

router.post('/login', authLimiter, [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validate
], login);

router.post('/verify-otp', authLimiter, validateOTP, verifyOTP);
router.post('/resend-otp', authLimiter, validateEmail, resendOTP);

// PASSWORD RESET ROUTES
router.post('/forgot-password', authLimiter, validateEmail, forgotPassword);
router.post('/verify-reset-otp', authLimiter, validateOTP, verifyResetOTP);
router.post('/reset-password', authLimiter, [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('newPassword')
    .notEmpty().withMessage('New password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/\d/).withMessage('Password must contain at least one number'),
  validate
], resetPassword);

// AUTHORIZED USER ROUTE - No rate limiting for authenticated requests
router.get('/me', authMiddleware, getMe);

module.exports = router;
