const mongoose = require('mongoose');
const logger = require('./silentLogger');

// Progress tracking
const progress = {
  total: 0,
  processed: 0,
  updated: 0,
  errors: 0,
  lastLog: 0
};

/**
 * Log progress at intervals
 */
function logProgress(force = false) {
  const now = Date.now();
  if (force || now - progress.lastLog > 5000) {
    const percent = progress.total > 0 
      ? Math.round((progress.processed / progress.total) * 100) 
      : 0;
    
    logger.info('BATCH_PROGRESS', {
      model: progress.modelName,
      processed: progress.processed,
      total: progress.total,
      updated: progress.updated,
      errors: progress.errors,
      progress: `${percent}%`
    });
    
    progress.lastLog = now;
  }
}

/**
 * Safely connects to MongoDB and returns the connection
 */
async function connectToDatabase(mongoUri) {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    logger.info('DB_CONNECTION_ESTABLISHED', {
      host: mongoose.connection.host,
      name: mongoose.connection.name
    });

    return mongoose.connection;
  } catch (error) {
    logger.error('DB_CONNECTION_FAILED', { error: error.message });
    process.exit(1);
  }
}

/**
 * Safely closes the database connection
 */
async function closeConnection() {
  try {
    await mongoose.disconnect();
    logger.info('DB_CONNECTION_CLOSED');
  } catch (error) {
    logger.error('DB_DISCONNECTION_FAILED', { error: error.message });
    process.exit(1);
  }
}

/**
 * Processes documents in batches with minimal logging
 */
async function processInBatches(Model, query, handler, options = {}) {
  const {
    batchSize = 100,
    dryRun = true,
    select = '_id',
    sort = { _id: 1 },
    logInterval = 5000
  } = options;

  // Reset progress
  Object.assign(progress, {
    modelName: Model.modelName,
    total: await Model.countDocuments(query),
    processed: 0,
    updated: 0,
    errors: 0,
    lastLog: 0
  });

  logger.info('BATCH_PROCESS_START', {
    model: Model.modelName,
    total: progress.total,
    dryRun
  });

  let lastId = null;
  let hasMore = true;
  const startTime = Date.now();

  while (hasMore) {
    const batchQuery = { ...query };
    if (lastId) {
      batchQuery._id = { $gt: lastId };
    }

    try {
      const docs = await Model.find(batchQuery)
        .select(select)
        .sort(sort)
        .limit(batchSize)
        .lean()
        .exec();

      if (docs.length === 0) {
        hasMore = false;
        break;
      }

      // Process batch
      for (const doc of docs) {
        try {
          const result = await handler(doc, { dryRun });
          progress.processed++;
          
          if (result?.updated) {
            progress.updated++;
          }
        } catch (error) {
          progress.errors++;
          logger.error('PROCESS_ERROR', {
            model: Model.modelName,
            id: doc._id,
            error: error.message
          });
        }

        lastId = doc._id;
      }

      // Log progress at intervals
      logProgress();
      
    } catch (error) {
      progress.errors++;
      logger.error('BATCH_ERROR', {
        model: Model.modelName,
        error: error.message,
        lastProcessedId: lastId
      });
      
      if (!lastId) break; // Can't continue if we can't get the first batch
      lastId = mongoose.Types.ObjectId(lastId); // Try to continue from last ID
    }
  }

  // Final progress log
  const duration = (Date.now() - startTime) / 1000;
  logger.info('BATCH_PROCESS_COMPLETE', {
    model: Model.modelName,
    processed: progress.processed,
    updated: progress.updated,
    errors: progress.errors,
    duration: `${duration.toFixed(2)}s`,
    rate: `${(progress.processed / duration).toFixed(2)} docs/s`
  });

  return {
    processed: progress.processed,
    updated: progress.updated,
    errors: progress.errors
  };
}

module.exports = {
  connectToDatabase,
  closeConnection,
  processInBatches
};
