/**
 * Authentication Middleware
 *
 * How JWT Auth Works:
 * 1. Client sends: Authorization: Bearer <token>
 * 2. Middleware extracts token
 * 3. Verifies token with secret key
 * 4. Finds user from token payload
 * 5. Attaches user to request object
 * 6. Route handler can access req.user
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect - Require authentication
 *
 * Use on routes that need logged-in users:
 *   router.get('/profile', protect, getProfile);
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    throw new ApiError(401, 'Not authorized, no token');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user and attach to request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      throw new ApiError(401, 'User not found');
    }

    if (!req.user.isActive) {
      throw new ApiError(401, 'Account is deactivated');
    }

    next();
  } catch (error) {
    throw new ApiError(401, 'Not authorized, token failed');
  }
});

/**
 * Optional Auth - Attach user if token exists, but don't require it
 *
 * Use for routes that work for both guests and logged-in users:
 *   router.get('/cart', optionalAuth, getCart);
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
    } catch (error) {
      // Token invalid, but that's okay - continue as guest
      req.user = null;
    }
  }

  next();
});

/**
 * Authorize - Restrict to specific roles
 *
 * Use after protect to restrict by role:
 *   router.delete('/users/:id', protect, authorize('ADMIN'), deleteUser);
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ApiError(403, 'Not authorized for this action');
    }
    next();
  };
};

/**
 * isAdmin - Shorthand for admin-only routes
 */
const isAdmin = authorize('ADMIN');

module.exports = { protect, optionalAuth, authorize, isAdmin };
