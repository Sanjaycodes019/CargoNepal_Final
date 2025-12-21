import { io } from 'socket.io-client';
import logger from './logger';

let socket = null;

export const initSocket = (userId) => {
  if (!socket && userId) {
    // Get socket URL from environment variable
    const socketUrl = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';
    
    socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      logger.debug('Connected to server', { userId });
      socket.emit('join-room', userId);
    });

    socket.on('disconnect', () => {
      logger.debug('Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      logger.error('Socket connection error', { error: error.message });
    });
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

