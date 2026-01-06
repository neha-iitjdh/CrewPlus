/**
 * Express Application
 *
 * This is where we configure Express:
 * 1. Set up middleware (runs on every request)
 * 2. Mount routes
 * 3. Handle errors
 *
 * Middleware Order Matters!
 * Request flows through middleware in order defined.
 */
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { apiDocs, generateDocsHTML } = require('./docs/apiDocs');

const app = express();

// ===========================================
// MIDDLEWARE
// ===========================================

/**
 * CORS - Cross-Origin Resource Sharing
 *
 * By default, browsers block requests from different origins.
 * Our frontend (port 3000) needs to talk to backend (port 5000).
 * CORS headers tell browser "this is allowed".
 */
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://crew-plus.vercel.app',
  'http://localhost:3000',
  'http://localhost',
  'http://127.0.0.1'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true // Allow cookies/auth headers
}));

/**
 * Body Parsers
 *
 * Express doesn't parse request body by default.
 * These middleware parse JSON and form data.
 */
app.use(express.json()); // Parse JSON: { "name": "John" }
app.use(express.urlencoded({ extended: true })); // Parse forms: name=John

/**
 * Morgan - HTTP Request Logger
 *
 * Logs every request for debugging:
 * GET /api/auth/me 200 12.345 ms
 */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined')); // More detailed logs for production
}

// ===========================================
// ROUTES
// ===========================================

// Health check (useful for deployment)
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Documentation - Interactive HTML docs
app.get('/api/docs', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}/api`;
  res.send(generateDocsHTML(baseUrl));
});

// API Documentation - JSON format
app.get('/api/docs/json', (req, res) => {
  res.json(apiDocs);
});

// API routes
app.use('/api', routes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to CrewPlus API',
    version: '1.0.0'
  });
});

// ===========================================
// ERROR HANDLING
// ===========================================

// 404 handler - no route matched
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler - catches all errors
app.use(errorHandler);

module.exports = app;
