const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userName = decoded.name;
      } catch (err) {
        // Token invalid, continue as guest
      }
    }
    // Allow connection even without auth (for guests)
    next();
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join a group order room
    socket.on('join-group', (groupCode) => {
      const room = `group:${groupCode.toUpperCase()}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);

      // Notify others in the room
      socket.to(room).emit('participant-joined', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName || 'Guest'
      });
    });

    // Leave a group order room
    socket.on('leave-group', (groupCode) => {
      const room = `group:${groupCode.toUpperCase()}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);

      // Notify others in the room
      socket.to(room).emit('participant-left', {
        socketId: socket.id,
        userId: socket.userId,
        userName: socket.userName || 'Guest'
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Emit to a specific group
const emitToGroup = (groupCode, event, data) => {
  if (io) {
    const room = `group:${groupCode.toUpperCase()}`;
    io.to(room).emit(event, data);
  }
};

// Get io instance
const getIO = () => io;

module.exports = {
  initializeSocket,
  emitToGroup,
  getIO
};
