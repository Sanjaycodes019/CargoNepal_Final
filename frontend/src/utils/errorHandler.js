/**
 * Comprehensive error handling utility
 */

import logger from './logger.js';

/**
 * Error types for better categorization
 */
export const ERROR_TYPES = {
  NETWORK: 'NETWORK',
  API: 'API',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  NOT_FOUND: 'NOT_FOUND',
  SERVER: 'SERVER',
  CLIENT: 'CLIENT',
  TIMEOUT: 'TIMEOUT',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Custom error class with enhanced information
 */
export class AppError extends Error {
  constructor(message, type = ERROR_TYPES.UNKNOWN, statusCode = 500, context = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.context = context;
    this.timestamp = new Date().toISOString();
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Network error handler
 */
export const handleNetworkError = (error) => {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return new AppError(
      'Request timed out. Please check your connection and try again.',
      ERROR_TYPES.TIMEOUT,
      408,
      { originalError: error.message }
    );
  }

  if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
    return new AppError(
      'Network connection lost. Please check your internet connection.',
      ERROR_TYPES.NETWORK,
      0,
      { originalError: error.message }
    );
  }

  return new AppError(
    'Network error occurred. Please try again.',
    ERROR_TYPES.NETWORK,
    0,
    { originalError: error.message }
  );
};

/**
 * API error handler
 */
export const handleApiError = (error) => {
  const status = error.response?.status;
  const data = error.response?.data;
  const message = data?.message || error.message;

  switch (status) {
    case 400:
      return new AppError(
        message || 'Invalid request. Please check your input.',
        ERROR_TYPES.VALIDATION,
        400,
        { response: data }
      );
    
    case 401:
      return new AppError(
        message || 'Authentication required. Please login.',
        ERROR_TYPES.AUTHENTICATION,
        401,
        { response: data }
      );
    
    case 403:
      return new AppError(
        message || 'You do not have permission to perform this action.',
        ERROR_TYPES.AUTHORIZATION,
        403,
        { response: data }
      );
    
    case 404:
      return new AppError(
        message || 'The requested resource was not found.',
        ERROR_TYPES.NOT_FOUND,
        404,
        { response: data }
      );
    
    case 422:
      return new AppError(
        message || 'Invalid data provided.',
        ERROR_TYPES.VALIDATION,
        422,
        { response: data }
      );
    
    case 500:
    case 502:
    case 503:
    case 504:
      return new AppError(
        message || 'Server error occurred. Please try again later.',
        ERROR_TYPES.SERVER,
        status,
        { response: data }
      );
    
    default:
      return new AppError(
        message || 'An unexpected error occurred.',
        ERROR_TYPES.API,
        status || 500,
        { response: data }
      );
  }
};

/**
 * Main error handler that categorizes and processes errors
 */
export const handleError = (error, context = {}) => {
  // Log the error
  logger.error('Error occurred', {
    message: error.message,
    type: error.type || ERROR_TYPES.UNKNOWN,
    statusCode: error.statusCode,
    stack: error.stack,
    context,
  });

  // Handle different error types
  if (error.response) {
    // API error (axios response error)
    return handleApiError(error);
  } else if (error.request) {
    // Network error (request made but no response)
    return handleNetworkError(error);
  } else if (error instanceof AppError) {
    // Already processed app error
    return error;
  } else {
    // Unknown error
    return new AppError(
      error.message || 'An unexpected error occurred.',
      ERROR_TYPES.UNKNOWN,
      500,
      { originalError: error.message, ...context }
    );
  }
};

/**
 * Async error wrapper for try-catch blocks
 */
export const withErrorHandling = async (fn, context = {}) => {
  try {
    const result = await fn();
    return { success: true, data: result };
  } catch (error) {
    const processedError = handleError(error, context);
    return { success: false, error: processedError };
  }
};

/**
 * React error boundary fallback component helper
 */
export const getErrorFallbackMessage = (error) => {
  switch (error.type) {
    case ERROR_TYPES.NETWORK:
      return {
        title: 'Connection Error',
        message: 'Please check your internet connection and try again.',
        action: 'Retry'
      };
    
    case ERROR_TYPES.AUTHENTICATION:
      return {
        title: 'Authentication Required',
        message: 'Please login to continue.',
        action: 'Login'
      };
    
    case ERROR_TYPES.AUTHORIZATION:
      return {
        title: 'Access Denied',
        message: 'You do not have permission to access this page.',
        action: 'Go Back'
      };
    
    case ERROR_TYPES.NOT_FOUND:
      return {
        title: 'Page Not Found',
        message: 'The page you are looking for does not exist.',
        action: 'Go Home'
      };
    
    default:
      return {
        title: 'Something went wrong',
        message: 'An unexpected error occurred. Please try again.',
        action: 'Retry'
      };
  }
};

export default {
  AppError,
  ERROR_TYPES,
  handleError,
  withErrorHandling,
  getErrorFallbackMessage,
  handleNetworkError,
  handleApiError,
};
