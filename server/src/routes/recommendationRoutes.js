const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  getPopularItems,
  getTrendingItems,
  getSimilarItems,
  getPreferences,
  updateDietaryPreferences,
  getReorderSuggestions
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/popular', getPopularItems);
router.get('/trending', getTrendingItems);
router.post('/similar', getSimilarItems);

// Protected routes (require authentication)
router.get('/', protect, getRecommendations);
router.get('/preferences', protect, getPreferences);
router.put('/preferences/dietary', protect, updateDietaryPreferences);
router.get('/reorder', protect, getReorderSuggestions);

module.exports = router;
