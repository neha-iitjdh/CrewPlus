/**
 * Cart Routes
 *
 * Uses optionalAuth middleware:
 * - If user is logged in, req.user is set
 * - If guest, req.user is null but route still works
 *
 * Guest identification via x-session-id header
 */
const express = require('express');
const router = express.Router();
const { optionalAuth, protect } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart
} = require('../controllers/cartController');

// All cart routes use optionalAuth (works for guests and users)
router.get('/', optionalAuth, getCart);
router.post('/items', optionalAuth, addToCart);
router.put('/items/:itemId', optionalAuth, updateCartItem);
router.delete('/items/:itemId', optionalAuth, removeFromCart);
router.delete('/', optionalAuth, clearCart);

// Merge requires authentication (user must be logged in)
router.post('/merge', protect, mergeCart);

module.exports = router;
