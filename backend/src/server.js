const path = require('path');
const http = require('http');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const initSocket = require('./socket');
const authRoutes = require('./routes/authRoutes');
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');
const securityRoutes = require('./routes/securityRoutes');
const mediaRoutes = require('./routes/mediaRoutes');

const app = express();
const server = http.createServer(app);

// Socket.io initialization with CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Attach io instance to app for use in controllers
app.set('io', io);
initSocket(io);

// Middleware
app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/media', mediaRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'QChat Node.js Orchestrator Backend',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

// Database connection & Server start
const PORT = process.env.PORT || 5000;
const primaryUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27018/qchat';
const fallbackUri = 'mongodb://127.0.0.1:27018/qchat';

async function connectDb() {
  try {
    await mongoose.connect(primaryUri);
    console.log(`[Database] MongoDB connected successfully to ${primaryUri}`);
  } catch (err) {
    console.warn(`[Database] Primary connection failed (${err.message}). Trying fallback: ${fallbackUri}`);
    try {
      await mongoose.connect(fallbackUri);
      console.log(`[Database] Connected to fallback MongoDB at ${fallbackUri}`);
    } catch (fallbackErr) {
      console.error('[Database] Both primary and fallback connection failed:', fallbackErr.message);
    }
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] QChat backend listening on http://0.0.0.0:${PORT}`);
  });
}

connectDb();

module.exports = { app, server };

