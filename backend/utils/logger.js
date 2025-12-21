/**
 * Production-grade logger utility for CargoNepal
 * Structured JSON logging with timestamps and proper error handling
 * 
 * Logging Standards:
 * - Use UPPER_SNAKE_CASE for event names
 * - Always provide a context object as the second parameter
 * - Never log sensitive information (handled by sanitizeData)
 * - Keep logs meaningful and actionable
 */

const { inspect } = require('util');

// ANSI color codes for beautiful console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

// Color mapping for log levels
const LEVEL_COLORS = {
  error: COLORS.red,
  warn: COLORS.yellow,
  info: COLORS.green,
  debug: COLORS.blue
};

// Log levels in order of importance
const LOG_LEVELS = {
  error: 0,  // System errors, failed operations, critical issues
  warn: 1,   // Unexpected but handled issues, security events
  info: 2,   // Important business events, state changes
  debug: 3   // Development and troubleshooting only
};

// Current log level (default: info in production, debug in development)
const CURRENT_LEVEL = LOG_LEVELS[
  (process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')).toLowerCase()
] || LOG_LEVELS.info;

// List of sensitive fields to redact
const SENSITIVE_FIELDS = [
  'password', 'token', 'otp', 'authToken', 'refreshToken', 'authorization',
  'apiKey', 'cardNumber', 'cvv', 'expiry', 'secret', 'privateKey', 'accessToken'
];

/**
 * Validates log data structure and naming
 * @throws {Error} If validation fails
 */
const validateLogData = (level, event, data = {}) => {
  // Validate event name
  if (typeof event !== 'string' || !event.trim()) {
    throw new Error('Log event must be a non-empty string');
  }
  
  // Validate event name format (UPPER_SNAKE_CASE)
  if (!/^[A-Z][A-Z0-9_]*(_[A-Z0-9]+)*$/.test(event)) {
    console.warn(`[LOGGER] Event name '${event}' should be UPPER_SNAKE_CASE`);
  }
  
  // Validate data is an object
  if (data && typeof data !== 'object') {
    throw new Error('Log data must be an object');
  }
  
  // Ensure error objects are properly handled
  if (level === 'error' && !data.error && !(data instanceof Error)) {
    console.warn(`[LOGGER] Error logs should include an 'error' property: ${event}`);
  }
  
  return true;
};

/**
 * Sanitize data to prevent logging sensitive information
 */
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  // Handle error objects
  if (data instanceof Error) {
    return {
      name: data.name,
      message: data.message,
      stack: process.env.NODE_ENV === 'production' ? undefined : data.stack
    };
  }
  
  const sanitized = { ...data };
  
  // Remove sensitive fields
  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    
    // Check if key or any part of it matches sensitive fields
    const isSensitive = SENSITIVE_FIELDS.some(field => 
      lowerKey.includes(field.toLowerCase())
    );
    
    if (isSensitive && sanitized[key] !== undefined) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeData(sanitized[key]);
    }
  });
  
  return sanitized;
};

/**
 * Formats log entry with beautiful structure and colors
 */
const formatLog = (level, event, data = {}) => {
  const timestamp = new Date().toISOString();
  const color = LEVEL_COLORS[level] || COLORS.white;
  
  // Base log entry structure
  const logEntry = {
    timestamp,
    level: level.toUpperCase(),
    event,
    ...(data instanceof Error ? {
      error: {
        name: data.name,
        message: data.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : data.stack,
        code: data.code,
        ...(data.details && { details: data.details })
      }
    } : sanitizeData(data))
  };
  
  // Add request context if available
  if (data.req) {
    const { req, ...restData } = data;
    logEntry.request = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip,
      userId: req.user?.id,
      userRole: req.user?.role,
      requestId: req.id || req.requestId
    };
    Object.assign(logEntry, restData);
  }
  
  // Create beautiful formatted output
  const formattedOutput = formatBeautifulLog(level, event, logEntry);
  
  // Also return JSON for structured logging tools
  const jsonOutput = JSON.stringify(logEntry, (key, value) => {
    if (value === undefined) return undefined;
    
    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : value.stack,
        ...(value.code && { code: value.code }),
        ...(value.details && { details: value.details })
      };
    }
    
    return value;
  });
  
  // In development, show beautiful formatted output
  // In production, use clean JSON for log aggregation tools
  return process.env.NODE_ENV === 'production' ? jsonOutput : formattedOutput;
};

/**
 * Formats log entry with beautiful colors and structure like Prettier
 */
const formatBeautifulLog = (level, event, logEntry) => {
  const color = LEVEL_COLORS[level] || COLORS.white;
  const timestamp = logEntry.timestamp;
  const levelStr = `${color}${level.toUpperCase()}${COLORS.reset}`;
  const eventStr = `${COLORS.bright}${event}${COLORS.reset}`;
  
  // Extract main properties for clean display
  const { timestamp: _, level: __, event: ___, ...data } = logEntry;
  
  // Format data beautifully
  let dataStr = '';
  if (Object.keys(data).length > 0) {
    const formattedData = inspect(data, { 
      colors: true, 
      depth: 10, 
      compact: false,
      breakLength: 80,
      maxArrayLength: 10
    });
    dataStr = `\n${COLORS.gray}${formattedData}${COLORS.reset}`;
  }
  
  return `${COLORS.gray}${timestamp}${COLORS.reset} [${levelStr}] ${eventStr}${dataStr}`;
};

/**
 * Base logging function that handles all log levels
 */
const log = (level, event, data = {}) => {
  try {
    // Skip if log level is not enabled
    if (CURRENT_LEVEL < LOG_LEVELS[level]) return;
    
    // Validate log data
    validateLogData(level, event, data);
    
    // Format and write the log
    const output = formatLog(level, event, data) + '\n';
    const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
    
    // Write to stream asynchronously to avoid blocking
    if (stream.write(output) === false) {
      // If the stream is full, we'll lose this log rather than block
      process.nextTick(() => {
        stream.write(`[LOGGER] Dropped log due to backpressure: ${event}\n`);
      });
    }
  } catch (error) {
    // Log to stderr if there's an issue with the logger itself
    process.stderr.write(`[LOGGER] Failed to log event '${event}': ${error.message}\n`);
  }
};

const logger = {
  /**
   * Log informational messages for business events
   * @param {string} event - Business event name in UPPER_SNAKE_CASE
   * @param {Object} data - Contextual data about the event
   */
  info: (event, data = {}) => log('info', event, data),
  
  /**
   * Log warning messages for potential issues
   * @param {string} event - Warning event name in UPPER_SNAKE_CASE
   * @param {Object} data - Contextual data about the warning
   */
  warn: (event, data = {}) => log('warn', event, data),
  
  /**
   * Log error messages for exceptions and failures
   * @param {string} event - Error event name in UPPER_SNAKE_CASE
   * @param {Error|Object} data - Error object or context data
   */
  error: (event, data = {}) => {
    // If first argument is an Error, normalize it
    if (event instanceof Error) {
      return log('error', 'UNHANDLED_ERROR', { error: event });
    }
    
    // If second argument is an Error, extract its properties
    if (data instanceof Error) {
      const { message, stack, name, ...rest } = data;
      return log('error', event, {
        error: { name, message, stack },
        ...rest
      });
    }
    
    return log('error', event, data);
  },
  
  /**
   * Log debug information (development only)
   * @param {string} event - Debug event name in UPPER_SNAKE_CASE
   * @param {Object} data - Debug information
   */
  debug: (event, data = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      log('debug', event, data);
    }
  },
  
  /**
   * Log HTTP request details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {number} responseTime - Response time in milliseconds
   */
  http: (req, res, responseTime) => {
    const { method, originalUrl, ip, user, id: requestId } = req;
    const statusCode = res.statusCode;
    const responseTimeMs = Math.round(responseTime);
    
    // Only log slow requests or errors in production
    const isSlow = responseTimeMs > 1000;
    const isError = statusCode >= 400;
    
    if (isError || isSlow || process.env.NODE_ENV !== 'production') {
      const logData = {
        req: { ...req, user: undefined }, // Will be added by formatLog
        method,
        path: originalUrl,
        status: statusCode,
        responseTime: responseTimeMs,
        ip,
        userAgent: req.get('user-agent'),
        userId: user?.id,
        userRole: user?.role,
        requestId
      };
      
      if (statusCode >= 500) {
        logger.error('HTTP_SERVER_ERROR', logData);
      } else if (statusCode >= 400) {
        logger.warn('HTTP_CLIENT_ERROR', logData);
      } else if (isSlow) {
        logger.warn('SLOW_RESPONSE', logData);
      } else if (process.env.NODE_ENV !== 'production') {
        logger.info('HTTP_REQUEST', logData);
      }
    }
  }
};

module.exports = logger;
