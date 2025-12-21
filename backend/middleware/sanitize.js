const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const logger = require('../utils/logger');

// Create a DOMPurify instance for server-side XSS protection
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

/**
 * Sanitizes request data to prevent XSS and NoSQL injection attacks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sanitize = [
  // Remove any keys that start with $ or . to prevent NoSQL injection
  mongoSanitize({
    onSanitize: ({ req, key }) => {
      logger.warn('MongoDB injection attempt detected', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        key: key
      });
    },
    replaceWith: '_'
  }),

  // Sanitize data to prevent XSS attacks
  xss(),

  // Custom XSS protection for nested objects and arrays
  (req, res, next) => {
    const sanitizeObject = (obj) => {
      if (!obj) return obj;
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => 
          typeof item === 'object' ? sanitizeObject(item) : DOMPurify.sanitize(String(item))
        );
      }
      
      // Handle objects
      if (typeof obj === 'object') {
        const sanitized = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            sanitized[key] = sanitizeObject(obj[key]);
          }
        }
        return sanitized;
      }
      
      // Handle primitive values
      return DOMPurify.sanitize(String(obj));
    };

    // Sanitize request body, query, and params
    if (req.body) req.body = sanitizeObject(req.body);
    if (req.query) req.query = sanitizeObject(req.query);
    if (req.params) req.params = sanitizeObject(req.params);

    next();
  }
];

module.exports = sanitize;
