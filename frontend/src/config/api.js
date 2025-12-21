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
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    VERIFY_OTP: `${API_BASE_URL}/auth/verify-otp`,
    RESEND_OTP: `${API_BASE_URL}/auth/resend-otp`,
    REQUEST_PASSWORD_RESET: `${API_BASE_URL}/auth/request-password-reset`,
    VERIFY_RESET_OTP: `${API_BASE_URL}/auth/verify-reset-otp`,
    RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`
  },
  
  // Trucks
  TRUCKS: {
    GET_ALL: `${API_BASE_URL}/trucks`,
    GET_BY_ID: (id) => `${API_BASE_URL}/trucks/${id}`,
    CREATE: `${API_BASE_URL}/trucks`,
    UPDATE: (id) => `${API_BASE_URL}/trucks/${id}`,
    DELETE: (id) => `${API_BASE_URL}/trucks/${id}`,
    GET_OWNER_TRUCKS: `${API_BASE_URL}/trucks/owner`,
    GET_AVAILABLE: `${API_BASE_URL}/trucks/available`
  },
  
  // Bookings
  BOOKINGS: {
    CREATE: `${API_BASE_URL}/bookings`,
    GET_BY_ID: (id) => `${API_BASE_URL}/bookings/${id}`,
    UPDATE_STATUS: (id) => `${API_BASE_URL}/bookings/${id}/status`,
    GET_CUSTOMER_BOOKINGS: `${API_BASE_URL}/bookings/customer`,
    GET_OWNER_BOOKINGS: `${API_BASE_URL}/bookings/owner`,
    GET_ALL_BOOKINGS: `${API_BASE_URL}/bookings`
  },
  
  // Users
  USERS: {
    GET_PROFILE: `${API_BASE_URL}/users/profile`,
    UPDATE_PROFILE: `${API_BASE_URL}/users/profile`,
    UPLOAD_IMAGE: `${API_BASE_URL}/users/upload-image`,
    CHANGE_PASSWORD: `${API_BASE_URL}/users/change-password`
  },
  
  // Admin
  ADMIN: {
    GET_DASHBOARD: `${API_BASE_URL}/admin/dashboard`,
    GET_USERS: `${API_BASE_URL}/admin/users`,
    VERIFY_USER: (id) => `${API_BASE_URL}/admin/users/${id}/verify`,
    GET_BOOKINGS: `${API_BASE_URL}/admin/bookings`,
    GET_TRUCKS: `${API_BASE_URL}/admin/trucks`,
    GET_NOTIFICATIONS: `${API_BASE_URL}/admin/notifications`
  },
  
  // Owner
  OWNER: {
    GET_DASHBOARD: `${API_BASE_URL}/owner/dashboard`,
    GET_BOOKINGS: `${API_BASE_URL}/owner/bookings`,
    GET_NOTIFICATIONS: `${API_BASE_URL}/owner/notifications`
  },
  
  // Customer
  CUSTOMER: {
    GET_DASHBOARD: `${API_BASE_URL}/customer/dashboard`,
    GET_BOOKINGS: `${API_BASE_URL}/customer/bookings`
  },
  
  // Contact
  CONTACT: {
    SEND_MESSAGE: `${API_BASE_URL}/contact`,
    GET_MESSAGES: `${API_BASE_URL}/contact/messages`
  },
  
  // Notifications
  NOTIFICATIONS: {
    GET_ALL: `${API_BASE_URL}/notifications`,
    MARK_READ: (id) => `${API_BASE_URL}/notifications/${id}/read`,
    MARK_ALL_READ: `${API_BASE_URL}/notifications/mark-all-read`
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
