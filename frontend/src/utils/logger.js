/**
 * Logging utility with environment-based levels
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

// Get log level from environment
const getLogLevel = () => {
  const envLevel = import.meta.env.VITE_LOG_LEVEL?.toUpperCase();
  const isDevelopment = import.meta.env.DEV;
  
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return LOG_LEVELS[envLevel];
  }
  
  // Default levels based on environment
  return isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR;
};

const currentLogLevel = getLogLevel();

/**
 * Check if message should be logged based on current log level
 */
const shouldLog = (level) => level <= currentLogLevel;

/**
 * Format log message with timestamp and context
 */
const formatMessage = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  const contextStr = Object.keys(context).length > 0 ? ` | ${JSON.stringify(context)}` : '';
  return `[${timestamp}] [${level}] ${message}${contextStr}`;
};

/**
 * Logger object with different log levels
 */
const logger = {
  error: (message, context = {}) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      console.error(formatMessage('ERROR', message, context));
    }
  },

  warn: (message, context = {}) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      console.warn(formatMessage('WARN', message, context));
    }
  },

  info: (message, context = {}) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      console.info(formatMessage('INFO', message, context));
    }
  },

  debug: (message, context = {}) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(formatMessage('DEBUG', message, context));
    }
  },

  trace: (message, context = {}) => {
    if (shouldLog(LOG_LEVELS.TRACE)) {
      console.log(formatMessage('TRACE', message, context));
    }
  },

  // Helper for component-specific logging
  component: (componentName, level, message, context = {}) => {
    const enhancedContext = { component: componentName, ...context };
    logger[level](message, enhancedContext);
  },

  // Helper for API logging
  api: (method, url, status, duration, context = {}) => {
    const apiContext = { 
      method, 
      url, 
      status, 
      duration: `${duration}ms`,
      ...context 
    };
    
    if (status >= 400) {
      logger.error(`API Error: ${method} ${url}`, apiContext);
    } else {
      logger.info(`API: ${method} ${url}`, apiContext);
    }
  },

  // Helper for user actions
  userAction: (action, context = {}) => {
    logger.info(`User Action: ${action}`, context);
  },

  // Helper for performance logging
  performance: (operation, duration, context = {}) => {
    const perfContext = { 
      operation, 
      duration: `${duration}ms`,
      ...context 
    };
    
    if (duration > 1000) {
      logger.warn(`Slow Operation: ${operation}`, perfContext);
    } else {
      logger.debug(`Performance: ${operation}`, perfContext);
    }
  },
};

export default logger;
