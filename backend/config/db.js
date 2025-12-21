const mongoose = require('mongoose');
const logger = require('../utils/logger');
const { config, validateEnv } = require('./env');

const connectDB = async () => {
  try {
    // Validate required environment variables
    validateEnv();
    
    const mongoURI = config.database.uri;
    
    const conn = await mongoose.connect(mongoURI);
    logger.info('DB_CONNECTION_SUCCESS', {
      host: conn.connection.host,
      database: conn.connection.name
    });
  } catch (error) {
    logger.error('DB_CONNECTION_FAILED', {
      error: error.message,
      reason: 'connection_error'
    });
    process.exit(1);
  }
};

module.exports = connectDB;

