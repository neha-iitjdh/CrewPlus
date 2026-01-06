/**
 * Coupon Routes
 *
 * Public: validate (for checkout)
 * Admin: full CRUD
 */
const express = require('express');
const router = express.Router();
const { protect, optionalAuth, isAdmin } = require('../middleware/auth');
const {
  validateCoupon,
  getAllCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus
} = require('../controllers/couponController');

// Public: Validate coupon (optional auth to check per-user limits)
router.post('/validate', optionalAuth, validateCoupon);

// Admin routes
router.get('/', protect, isAdmin, getAllCoupons);
router.get('/:id', protect, isAdmin, getCoupon);
router.post('/', protect, isAdmin, createCoupon);
router.put('/:id', protect, isAdmin, updateCoupon);
router.delete('/:id', protect, isAdmin, deleteCoupon);
router.put('/:id/toggle', protect, isAdmin, toggleCouponStatus);

module.exports = router;
