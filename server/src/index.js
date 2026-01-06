/**
 * Server Entry Point
 *
 * This is where everything starts:
 * 1. Load environment variables
 * 2. Connect to database
 * 3. Start server
 */
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`
  ╔═══════════════════════════════════════════╗
  ║    CrewPlus Server                        ║
  ╠═══════════════════════════════════════════╣
  ║  Mode: ${process.env.NODE_ENV?.padEnd(35)}║
  ║  Port: ${PORT.toString().padEnd(35)}║
  ║  Health: http://localhost:${PORT}/api/health  ║
  ╚═══════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
