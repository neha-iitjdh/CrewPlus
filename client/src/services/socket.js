import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (token = null) => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => socket;

export const joinGroupRoom = (groupCode) => {
  if (socket?.connected) {
    socket.emit('join-group', groupCode);
  }
};

export const leaveGroupRoom = (groupCode) => {
  if (socket?.connected) {
    socket.emit('leave-group', groupCode);
  }
};

export const onGroupUpdate = (callback) => {
  if (socket) {
    socket.on('group-updated', callback);
  }
};

export const offGroupUpdate = (callback) => {
  if (socket) {
    socket.off('group-updated', callback);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initializeSocket,
  getSocket,
  joinGroupRoom,
  leaveGroupRoom,
  onGroupUpdate,
  offGroupUpdate,
  disconnectSocket,
};
