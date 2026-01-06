/**
 * Product Routes
 *
 * Route Organization:
 * - Public routes first (no auth)
 * - Protected routes after (with middleware)
 * - Admin routes at the end
 *
 * Route Order Matters!
 * Specific routes like /menu must come BEFORE /:id
 * Otherwise /menu would be treated as an ID
 */
const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middleware/auth');
const {
  getProducts,
  getMenu,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  updateInventory,
  getAllProductsAdmin,
  getLowStockProducts
} = require('../controllers/productController');

// ===========================================
// PUBLIC ROUTES
// ===========================================

// Get menu grouped by category
router.get('/menu', getMenu);

// Get all products with filters
router.get('/', getProducts);

// ===========================================
// ADMIN ROUTES (must be before /:id)
// ===========================================

// Admin: Get all products including unavailable
router.get('/admin/all', protect, isAdmin, getAllProductsAdmin);

// Admin: Get low stock alerts
router.get('/admin/low-stock', protect, isAdmin, getLowStockProducts);

// Admin: Create product
router.post('/', protect, isAdmin, createProduct);

// Admin: Update product
router.put('/:id', protect, isAdmin, updateProduct);

// Admin: Update inventory
router.put('/:id/inventory', protect, isAdmin, updateInventory);

// Admin: Delete product (soft delete)
router.delete('/:id', protect, isAdmin, deleteProduct);

// ===========================================
// PUBLIC ROUTES (with params - must be last)
// ===========================================

// Get single product (must be after /admin/* routes)
router.get('/:id', getProduct);

module.exports = router;
