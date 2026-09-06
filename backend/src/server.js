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
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'QChat Node.js Orchestrator Backend',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date()
  });
});

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

// 1. Listen immediately so cloud platforms (Render) detect open port without delay
server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] QChat backend listening on http://0.0.0.0:${PORT}`);
});

// 2. Connect to MongoDB in background with short timeout
async function connectDb() {
  const isProd = process.env.NODE_ENV === 'production';
  if (isProd && !process.env.MONGO_URI) {
    console.warn('[Database] WARNING: MONGO_URI is not defined in production environment!');
  }

  try {
    await mongoose.connect(primaryUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[Database] MongoDB connected successfully to ${primaryUri.replace(/:[^:@]+@/, ':***@')}`);
  } catch (err) {
    console.warn(`[Database] Primary connection failed (${err.message})`);
    if (!isProd) {
      try {
        await mongoose.connect(fallbackUri, { serverSelectionTimeoutMS: 3000 });
        console.log(`[Database] Connected to fallback MongoDB at ${fallbackUri}`);
      } catch (fallbackErr) {
        console.error('[Database] Both primary and fallback connection failed:', fallbackErr.message);
      }
    }
  }
}

connectDb();

// 3. Keep-alive heartbeat to keep Render free-tier containers warm & responsive
function startKeepAlive() {
  const axios = require('axios');
  const qdsUrl = process.env.NODE_ENV === 'production' ? 'https://qchat-qds-core.onrender.com' : 'http://localhost:8000';
  
  const pingQds = async () => {
    try {
      await axios.get(`${qdsUrl}/health`, { timeout: 15000 });
      console.log('[Heartbeat] Pinged QDS microservice keep-alive successfully');
    } catch (e) {
      console.warn('[Heartbeat] QDS keep-alive ping status:', e.message);
    }
  };

  // Trigger initial warmup after 5 seconds
  setTimeout(pingQds, 5000);

  // Ping every 10 minutes to prevent Render 15-min idle spin down
  setInterval(pingQds, 10 * 60 * 1000);
}

if (process.env.NODE_ENV === 'production') {
  startKeepAlive();
}

module.exports = { app, server };

