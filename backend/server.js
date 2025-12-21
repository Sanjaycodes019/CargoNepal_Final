const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { initializeSocket } = require('./services/adminNotificationService');
const logger = require('./utils/logger');
const { config, validateEnv } = require('./config/env');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load env vars - Don't crash if .env is missing (Render uses dashboard env vars)
try {
  const result = dotenv.config({ path: path.resolve(__dirname, '.env') });
  if (result.error && process.env.NODE_ENV !== 'production') {
    logger.warn('ENV_FILE_NOT_FOUND', { message: 'No .env file found - using environment variables from system' });
  }
} catch (error) {
  logger.info('SERVER_STARTUP', { 
    mode: 'production',
    message: 'Using platform environment variables' 
  });
}

// Validate required environment variables
try {
  validateEnv();
} catch (error) {
  logger.error('CONFIGURATION_ERROR', { 
    message: error.message,
    action: 'Please set environment variables in Render dashboard or create .env file locally'
  });
  process.exit(1);
}

const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https://*.cloudinary.com'],
      connectSrc: ["'self'", config.frontend.url, 'https://*.cloudinary.com'],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable for now as it might break some features
  crossOriginOpenerPolicy: { policy: 'same-origin' },
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: { maxAge: 15552000, includeSubDomains: true },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'no-referrer' },
  xssFilter: true,
}));

// Enable CORS with specific configuration
app.use(cors({
  origin: config.frontend.url,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Total-Count'],
  maxAge: 600
}));

// Body parser middleware with size limit
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Input sanitization middleware
const sanitize = require('./middleware/sanitize');
app.use(sanitize);

// Apply API rate limiting to all routes (except excluded ones)
const apiExcludedPaths = ['/health', '/api-docs'];
app.use((req, res, next) => {
  // Skip rate limiting for excluded paths
  if (apiExcludedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Add security headers for API responses
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  // Apply rate limiting
  return apiLimiter(req, res, next);
});

// Public stats endpoint (no authentication required)
app.get('/api/public/stats', async (req, res) => {
  try {
    const Owner = require('./models/OwnerModel');
    const Customer = require('./models/CustomerModel');
    const Truck = require('./models/TruckModel');
    const Booking = require('./models/BookingModel');

    const totalUsers = await Owner.countDocuments() + await Customer.countDocuments();
    const totalTrucks = await Truck.countDocuments();
    const totalBookings = await Booking.countDocuments();

    res.json({
      success: true,
      data: {
        totalTrucks,
        totalCustomers: totalUsers,
        totalBookings
      }
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/owner', require('./routes/ownerRoutes'));
app.use('/api/customer', require('./routes/customerRoutes'));
app.use('/api/trucks', require('./routes/truckRoutes'));
app.use('/api/bookings', require('./routes/bookingRoutes'));
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/utils', require('./routes/utilsRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/geocoding', require('./routes/geocodingRoutes'));

// HTTP request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 500) {
      logger.error('HTTP_REQUEST_ERROR', {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
        userId: req.user?.id,
        userRole: req.user?.role
      });
    }
  });

  next();
});

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// Health check / Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'CargoNepal API is running',
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      trucks: '/api/trucks',
      bookings: '/api/bookings',
      reviews: '/api/reviews',
      payments: '/api/payments',
      notifications: '/api/notifications'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = config.server.port;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: config.frontend.url,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  // Only log connection errors
  socket.on('error', (error) => {
    logger.error('SOCKET_ERROR', { 
      socketId: socket.id,
      error: error.message
    });
  });
  
  // Join user room based on their ID
  socket.on('join-room', (userId) => {
    socket.join(`user-${userId}`);
  });
  
  // Join admin room for admin users
  socket.on('join-admin-room', (adminId) => {
    socket.join(`admin_${adminId}`);
  });
  
  // Handle booking updates (critical business event)
  socket.on('booking-update', (data) => {
    io.to(`user-${data.userId}`).emit('booking-status-change', data);
    logger.info('BOOKING_STATUS_UPDATE', {
      bookingId: data.bookingId,
      userId: data.userId,
      status: data.status
    });
  });
  
  // Handle new notification (critical for admin monitoring)
  socket.on('new-notification', (data) => {
    io.to(`user-${data.userId}`).emit('notification', data);
  });
});

// Initialize admin notification service with socket instance
initializeSocket(io);

// Make io accessible to routes
app.set('io', io);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SERVER_SHUTDOWN_INITIATED', { 
    signal: 'SIGTERM',
    message: 'Shutting down HTTP server' 
  });
  server.close(() => {
    logger.info('SERVER_SHUTDOWN_COMPLETE', { 
      message: 'HTTP server closed' 
    });
  });
});

// ================================
// DEPLOYMENT: PORT Configuration
// ================================
// Render will automatically set PORT environment variable
// Local development uses PORT from .env file (default: 3000)

server.listen(PORT, () => {
  logger.info('SERVER_STARTED', { 
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    message: 'Server is running and ready to accept connections'
  });
});
