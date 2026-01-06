/**
 * Order Routes
 *
 * Mixed access levels:
 * - Public: track order by number
 * - Optional auth: create order (guests can order)
 * - Private: view own orders
 * - Admin: manage all orders
 */
const express = require('express');
const router = express.Router();
const { protect, optionalAuth, isAdmin } = require('../middleware/auth');
const {
  createOrder,
  getOrder,
  getMyOrders,
  trackOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getAnalytics
} = require('../controllers/orderController');

// ===========================================
// PUBLIC ROUTES
// ===========================================

// Track order by order number (no auth needed)
router.get('/track/:orderNumber', trackOrder);

// ===========================================
// ADMIN ROUTES (must be before /:id to avoid conflicts)
// ===========================================

// Get analytics
router.get('/admin/analytics', protect, isAdmin, getAnalytics);

// Get all orders
router.get('/', protect, isAdmin, getAllOrders);

// Update order status
router.put('/:id/status', protect, isAdmin, updateOrderStatus);

// ===========================================
// AUTHENTICATED ROUTES
// ===========================================

// Create order (works for guests with sessionId too)
router.post('/', optionalAuth, createOrder);

// Get my orders (requires login)
router.get('/my-orders', protect, getMyOrders);

// Get single order (owner or admin)
router.get('/:id', protect, getOrder);

// Cancel order (owner or admin)
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
