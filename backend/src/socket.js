const jwt = require('jsonwebtoken');
const User = require('./models/User');

function initSocket(io) {
  // Authentication middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'qchat_quantum_jwt_secret_key_2026_super_safe'
      );

      const user = await User.findById(decoded.userId);
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', async (socket) => {
    const user = socket.user;
    const userId = user._id.toString();

    // Join personal user room
    socket.join(`user:${userId}`);

    // Update user online presence
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: new Date()
      });
      io.emit('presence:update', {
        userId,
        isOnline: true,
        lastSeen: new Date()
      });
    } catch (err) {
      console.error('Error updating presence:', err);
    }

    // Join a chat room
    socket.on('chat:join', (data) => {
      if (data && data.chatId) {
        socket.join(`chat:${data.chatId}`);
      }
    });

    // Leave a chat room
    socket.on('chat:leave', (data) => {
      if (data && data.chatId) {
        socket.leave(`chat:${data.chatId}`);
      }
    });

    // Typing start
    socket.on('typing:start', (data) => {
      if (data && data.chatId) {
        socket.to(`chat:${data.chatId}`).emit('typing:status', {
          chatId: data.chatId,
          userId,
          userName: user.name,
          isTyping: true
        });
      }
    });

    // Typing stop
    socket.on('typing:stop', (data) => {
      if (data && data.chatId) {
        socket.to(`chat:${data.chatId}`).emit('typing:status', {
          chatId: data.chatId,
          userId,
          userName: user.name,
          isTyping: false
        });
      }
    });

    // On disconnect
    socket.on('disconnect', async () => {
      try {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen
        });
        io.emit('presence:update', {
          userId,
          isOnline: false,
          lastSeen
        });
      } catch (err) {
        console.error('Error handling disconnect presence:', err);
      }
    });
  });
}

module.exports = initSocket;

