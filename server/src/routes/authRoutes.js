/**
 * Auth Routes
 *
 * Routes define URL endpoints and connect them to controllers.
 * Think of routes as a "menu" of available endpoints.
 *
 * Pattern:
 *   router.METHOD('/path', middleware?, controller)
 */
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getAllUsers
} = require('../controllers/authController');

// Public routes (no auth needed)
router.post('/register', register);
router.post('/login', login);

// Protected routes (must be logged in)
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/password', protect, changePassword);

// Admin routes
router.get('/users', protect, isAdmin, getAllUsers);

module.exports = router;
