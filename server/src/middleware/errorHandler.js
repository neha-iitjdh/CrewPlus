/**
 * Global Error Handler Middleware
 *
 * Express knows this is an error handler because it has 4 parameters.
 * All errors thrown in routes end up here.
 *
 * This handles:
 * 1. Our custom ApiError
 * 2. Mongoose validation errors
 * 3. Mongoose duplicate key errors
 * 4. JWT errors
 * 5. Unknown errors
 */
const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log for debugging (in development)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Mongoose bad ObjectId (invalid ID format)
  if (err.name === 'CastError') {
    error = new ApiError(400, 'Invalid ID format');
  }

  // Mongoose duplicate key (e.g., email already exists)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    error = new ApiError(400, `${field} already exists`);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message
    }));
    error = new ApiError(400, 'Validation failed', errors);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token');
  }

  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired');
  }

  // Send response
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    errors: error.errors || []
  });
};

module.exports = errorHandler;
