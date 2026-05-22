const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Log all errors with appropriate log levels
  if (statusCode >= 500) {
    // Server errors (5xx)
    logger.error('SERVER_ERROR', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      statusCode,
      ...(err.details && { details: err.details })
    });
  } else if (statusCode >= 400) {
    // Client errors (4xx)
    logger.warn('CLIENT_ERROR', {
      error: err.message,
      path: req.path,
      method: req.method,
      statusCode,
      ...(err.details && { details: err.details })
    });
  } else {
    // Other errors (should be rare)
    logger.info('APPLICATION_ERROR', {
      error: err.message,
      path: req.path,
      method: req.method,
      statusCode
    });
  }

  // Prepare error response
  const errorResponse = { 
    success: false,
    message: isProduction && statusCode >= 500 ? 'Internal Server Error' : err.message
  };

  // Handle specific error types with appropriate messages
  if (err.name === 'CastError') {
    errorResponse.message = 'Invalid resource ID';
  } else if (err.code === 11000) {
    errorResponse.message = 'Duplicate field value entered';
  } else if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    errorResponse.message = messages.join(' ');
    if (!isProduction) {
      errorResponse.errors = err.errors;
    }
  } else if (err.name === 'JsonWebTokenError') {
    errorResponse.message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    errorResponse.message = 'Token expired';
  }

  // Include additional error details in development
  if (!isProduction) {
    errorResponse.stack = err.stack;
    if (err.errors) {
      errorResponse.errors = err.errors;
    }
  }

  // Ensure no stack traces are sent in production
  if (isProduction) {
    delete errorResponse.stack;
  }

  res.status(statusCode).json(errorResponse);
};

module.exports = errorHandler;
