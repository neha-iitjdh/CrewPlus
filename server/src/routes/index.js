/**
 * Routes Index
 *
 * Combines all route files into one.
 * Makes app.js cleaner - just import this one file.
 */
const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const couponRoutes = require('./couponRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);

module.exports = router;
