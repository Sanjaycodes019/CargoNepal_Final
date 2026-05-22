/**
 * Silent logger for batch operations
 * Only logs important events, suppresses progress updates
 */

const logger = {
  info: (event, data = {}) => {
    // Only log important events, not progress
    if (!['BATCH_PROGRESS', 'DB_QUERY'].includes(event)) {
      console.log(`[${new Date().toISOString()}] ${event}`, JSON.stringify(data));
    }
  },
  warn: (event, data = {}) => {
    console.warn(`[${new Date().toISOString()}] WARN: ${event}`, JSON.stringify(data));
  },
  error: (event, data = {}) => {
    console.error(`[${new Date().toISOString()}] ERROR: ${event}`, JSON.stringify(data));
  }
};

module.exports = logger;
