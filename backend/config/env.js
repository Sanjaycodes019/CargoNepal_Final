/**
 * Centralized Environment Variables Configuration
 * 
 * CHANGE HERE ONLY if you add new env variables
 * This ensures all environment variables are accessed consistently
 */

const {
  MONGO_URI,
  JWT_SECRET,
  MAIL_USER,
  MAIL_PASS,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLIENT_URL,
  NODE_ENV,
  PORT,
  DEFAULT_RATE_PER_KM,
  OPENCAGE_API_KEY,
  NOMINATIM_API_URL,
  OPENCAGE_API_URL
} = process.env;

/**
 * Validate required environment variables
 * @throws {Error} If required variables are missing
 */
const validateEnv = () => {
  const required = [
    'MONGO_URI',
    'JWT_SECRET',
    'MAIL_USER',
    'MAIL_PASS',
    'CLIENT_URL'
  ];

  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};

/**
 * Get environment-specific configuration
 */
const config = {
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
  
  // Database
  database: {
    uri: MONGO_URI
  },
  
  // JWT
  jwt: {
    secret: JWT_SECRET,
    expiresIn: process.env.NODE_ENV === 'production' ? '30d' : '7d'
  },
  
  // Email
  email: {
    user: MAIL_USER,
    pass: MAIL_PASS
  },
  
  // Cloudinary
  cloudinary: {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET
  },
  
  // Frontend
  frontend: {
    url: CLIENT_URL
  },
  
  // Server
  server: {
    port: PORT || (process.env.NODE_ENV === 'production' ? undefined : 3000)
  },
  
  // Business logic
  business: {
    defaultRatePerKm: DEFAULT_RATE_PER_KM || 25
  },
  
  // External APIs
  apis: {
    nominatim: {
      url: NOMINATIM_API_URL || 'https://nominatim.openstreetmap.org/search'
    },
    opencage: {
      url: OPENCAGE_API_URL || 'https://api.opencagedata.com/geocode/v1/json',
      key: OPENCAGE_API_KEY
    }
  }
};

module.exports = {
  MONGO_URI,
  JWT_SECRET,
  MAIL_USER,
  MAIL_PASS,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  CLIENT_URL,
  NODE_ENV,
  PORT,
  DEFAULT_RATE_PER_KM,
  OPENCAGE_API_KEY,
  NOMINATIM_API_URL,
  OPENCAGE_API_URL,
  validateEnv,
  config
};
