import { createContext, useState, useEffect } from 'react';
import logger from '../utils/logger.js';
import { handleError } from '../utils/errorHandler.js';
import axiosInstance from '../utils/axiosInstance';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axiosInstance.post('/auth/login', { email, password });
      
      if (response.data.success && response.data.data) {
        const { token, user: userData } = response.data.data;
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        return { success: true, data: userData };
      } else {
        return {
          success: false,
          message: response.data.message || 'Login failed',
          requireVerification: response.data.requireVerification || false
        };
      }
    } catch (error) {
      logger.error('Login error', { error, email });
      const errorResponse = error.response?.data;
      return {
        success: false,
        message: errorResponse?.message || error.message || 'Login failed. Please check your connection.',
        requireVerification: errorResponse?.requireVerification || false
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axiosInstance.post('/auth/register', userData);
      
      // ✨ UPDATED: Registration now returns email for OTP verification
      // Backend doesn't send token anymore until email is verified
      if (response.data.success) {
        return { 
          success: true, 
          data: response.data.data, // Contains { email }
          message: response.data.message 
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Registration failed'
        };
      }
    } catch (error) {
      logger.error('Registration error', { error, formData });
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Registration failed. Please check your connection.'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateUser = (newUserData) => {
    setUser(newUserData);
    localStorage.setItem('user', JSON.stringify(newUserData));
  };

  const value = {
    user,
    login,
    register,
    logout,
    updateUser,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isOwner: user?.role === 'owner',
    isCustomer: user?.role === 'customer'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
