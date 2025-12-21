class ApiError extends Error {
  constructor(message, statusCode, details = {}) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends ApiError {
  constructor(message = 'Bad Request', details = {}) {
    super(message, 400, details);
  }
}

class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized', details = {}) {
    super(message, 401, details);
  }
}

class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden', details = {}) {
    super(message, 403, details);
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Not Found', details = {}) {
    super(message, 404, details);
  }
}

class ValidationError extends ApiError {
  constructor(message = 'Validation Error', errors = []) {
    super(message, 422, { errors });
  }
}

class ConflictError extends ApiError {
  constructor(message = 'Conflict', details = {}) {
    super(message, 409, details);
  }
}

const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error(err);

  // Handle validation errors from express-validator
  if (err.name === 'ValidationError' || err.name === 'ValidatorError') {
    const errors = {};
    for (const field in err.errors) {
      errors[field] = err.errors[field].message;
    }
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(Object.keys(err.details).length > 0 && { details: err.details })
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
      error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
    });
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists`,
      field
    });
  }

  // Handle MongoDB validation errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`
    });
  }

  // Handle other unhandled errors
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message, stack: err.stack })
  });
};

module.exports = {
  errorHandler,
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
  ConflictError
};
