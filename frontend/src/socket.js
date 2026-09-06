import { io } from 'socket.io-client';

let rawSocketUrl = import.meta.env.VITE_SOCKET_URL;
if (!rawSocketUrl || rawSocketUrl.includes('qchat-backend.onrender.com')) {
  rawSocketUrl = 'https://qchat-backend-8tbz.onrender.com';
} else if (rawSocketUrl.includes('localhost') && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
  rawSocketUrl = 'https://qchat-backend-8tbz.onrender.com';
}
if (rawSocketUrl && !rawSocketUrl.startsWith('http://') && !rawSocketUrl.startsWith('https://')) {
  rawSocketUrl = `https://${rawSocketUrl}`;
}
rawSocketUrl = rawSocketUrl.replace(/\/+$/, '').replace(/\/api$/, '');
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

