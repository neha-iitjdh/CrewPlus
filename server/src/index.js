require('dotenv').config();
const http = require('http');
const connectDB = require('./config/db');
const app = require('./app');
const { initializeSocket } = require('./socket');

// Connect to database
connectDB();

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
initializeSocket(server);

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

module.exports = { app, server };
