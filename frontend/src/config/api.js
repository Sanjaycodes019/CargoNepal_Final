/**
 * Centralized API Configuration
 * 
 * CHANGE HERE ONLY if you add new API endpoints
 * This ensures all API URLs are accessed consistently
 */

// CHANGE HERE ONLY
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * API endpoints configuration
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: `${API_BASE_URL}/api/auth/register`,
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    VERIFY_OTP: `${API_BASE_URL}/api/auth/verify-otp`,
    RESEND_OTP: `${API_BASE_URL}/api/auth/resend-otp`,
    REQUEST_PASSWORD_RESET: `${API_BASE_URL}/api/auth/request-password-reset`,
    VERIFY_RESET_OTP: `${API_BASE_URL}/api/auth/verify-reset-otp`,
    RESET_PASSWORD: `${API_BASE_URL}/api/auth/reset-password`
  },
  
  // Trucks
  TRUCKS: {
    GET_ALL: `${API_BASE_URL}/api/trucks`,
    GET_BY_ID: (id) => `${API_BASE_URL}/api/trucks/${id}`,
    CREATE: `${API_BASE_URL}/api/trucks`,
    UPDATE: (id) => `${API_BASE_URL}/api/trucks/${id}`,
    DELETE: (id) => `${API_BASE_URL}/api/trucks/${id}`,
    GET_OWNER_TRUCKS: `${API_BASE_URL}/api/trucks/owner`,
    GET_AVAILABLE: `${API_BASE_URL}/api/trucks/available`
  },
  
  // Bookings
  BOOKINGS: {
    CREATE: `${API_BASE_URL}/api/bookings`,
    GET_BY_ID: (id) => `${API_BASE_URL}/api/bookings/${id}`,
    UPDATE_STATUS: (id) => `${API_BASE_URL}/api/bookings/${id}/status`,
    GET_CUSTOMER_BOOKINGS: `${API_BASE_URL}/api/bookings/customer`,
    GET_OWNER_BOOKINGS: `${API_BASE_URL}/api/bookings/owner`,
    GET_ALL_BOOKINGS: `${API_BASE_URL}/api/bookings`
  },
  
  // Users
  USERS: {
    GET_PROFILE: `${API_BASE_URL}/api/users/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/api/users/profile`,
    UPLOAD_IMAGE: `${API_BASE_URL}/api/users/upload-image`,
    CHANGE_PASSWORD: `${API_BASE_URL}/api/users/change-password`
  },
  
  // Admin
  ADMIN: {
    GET_DASHBOARD: `${API_BASE_URL}/api/admin/dashboard`,
    GET_USERS: `${API_BASE_URL}/api/admin/users`,
    VERIFY_USER: (id) => `${API_BASE_URL}/api/admin/users/${id}/verify`,
    GET_BOOKINGS: `${API_BASE_URL}/api/admin/bookings`,
    GET_TRUCKS: `${API_BASE_URL}/api/admin/trucks`,
    GET_NOTIFICATIONS: `${API_BASE_URL}/api/admin/notifications`
  },
  
  // Owner
  OWNER: {
    GET_DASHBOARD: `${API_BASE_URL}/api/owner/dashboard`,
    GET_BOOKINGS: `${API_BASE_URL}/api/owner/bookings`,
    GET_NOTIFICATIONS: `${API_BASE_URL}/api/owner/notifications`
  },
  
  // Customer
  CUSTOMER: {
    GET_DASHBOARD: `${API_BASE_URL}/api/customer/dashboard`,
    GET_BOOKINGS: `${API_BASE_URL}/api/customer/bookings`
  },
  
  // Contact
  CONTACT: {
    SEND_MESSAGE: `${API_BASE_URL}/api/contact`,
    GET_MESSAGES: `${API_BASE_URL}/api/contact/messages`
  },
  
  // Notifications
  NOTIFICATIONS: {
    GET_ALL: `${API_BASE_URL}/api/notifications`,
    MARK_READ: (id) => `${API_BASE_URL}/api/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/api/notifications/mark-all-read`
  }
};

/**
 * Default request configuration
 */
export const API_CONFIG = {
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important for CORS and cookies
};

/**
 * Validate API configuration
 */
export const validateApiConfig = () => {
  if (!API_BASE_URL) {
    console.error('VITE_API_BASE_URL is not defined');
    return false;
  }
  
  try {
    new URL(API_BASE_URL);
    return true;
  } catch (error) {
    console.error('VITE_API_BASE_URL is not a valid URL:', API_BASE_URL);
    return false;
  }
};
