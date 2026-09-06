import { io } from 'socket.io-client';

let rawSocketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
if (rawSocketUrl && !rawSocketUrl.startsWith('http://') && !rawSocketUrl.startsWith('https://')) {
  rawSocketUrl = `https://${rawSocketUrl}`;
}
const SOCKET_URL = rawSocketUrl;

let socket = null;

export const getSocket = () => {
  const token = localStorage.getItem('qchat_token');
  if (!socket && token) {
    socket = io(SOCKET_URL, {
      auth: { token },
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('[Socket] Connected with ID:', socket.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
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

