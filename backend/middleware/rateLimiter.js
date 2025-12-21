const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate limiter for authentication endpoints
 * Limits requests to 5 per 15 minutes per IP address
 */
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res, next, options) => {
    logger.warn('RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.path,
      method: req.method,
      userAgent: req.get('user-agent')
    });
    res.status(options.statusCode).json(options.message);
  }
});

/**
 * Rate limiter for public API endpoints
 * Limits requests to 100 per 15 minutes per IP address
 */
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    logger.warn('API_RATE_LIMIT_EXCEEDED', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(options.statusCode).json(options.message);
  }
});

module.exports = {
  authLimiter,
  apiLimiter
};
