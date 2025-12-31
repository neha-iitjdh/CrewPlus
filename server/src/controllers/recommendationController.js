const recommendationService = require('../services/recommendationService');
const UserPreference = require('../models/UserPreference');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');

// @desc    Get personalized recommendations
// @route   GET /api/recommendations
// @access  Private
exports.getRecommendations = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  const recommendations = await recommendationService.getRecommendations(
    req.user._id,
    limit
  );

  res.json({
    success: true,
    data: recommendations
  });
});

// @desc    Get popular/trending items (for non-logged-in users)
// @route   GET /api/recommendations/popular
// @access  Public
exports.getPopularItems = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  const popularItems = await recommendationService.getPopularItems(limit);

  res.json({
    success: true,
    data: popularItems
  });
});

// @desc    Get trending items
// @route   GET /api/recommendations/trending
// @access  Public
exports.getTrendingItems = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 6;

  const trendingItems = await recommendationService.getTrendingItems(limit);

  res.json({
    success: true,
    data: trendingItems
  });
});

// @desc    Get similar/complementary items
// @route   POST /api/recommendations/similar
// @access  Public
exports.getSimilarItems = asyncHandler(async (req, res) => {
  const { productIds } = req.body;
  const limit = parseInt(req.query.limit) || 4;

  if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
    throw ApiError.badRequest('Product IDs are required');
  }

  const similarItems = await recommendationService.getSimilarItems(
    productIds,
    limit
  );

  res.json({
    success: true,
    data: similarItems
  });
});

// @desc    Get user preferences
// @route   GET /api/recommendations/preferences
// @access  Private
exports.getPreferences = asyncHandler(async (req, res) => {
  let preferences = await UserPreference.findOne({ user: req.user._id })
    .populate('favoriteProducts.product', 'name image price')
    .populate('favoriteCustomizations.customization', 'name type');

  if (!preferences) {
    preferences = await UserPreference.create({ user: req.user._id });
  }

  res.json({
    success: true,
    data: preferences
  });
});

// @desc    Update dietary preferences
// @route   PUT /api/recommendations/preferences/dietary
// @access  Private
exports.updateDietaryPreferences = asyncHandler(async (req, res) => {
  const { vegetarian, vegan, glutenFree, spicy } = req.body;

  let preferences = await UserPreference.findOne({ user: req.user._id });

  if (!preferences) {
    preferences = await UserPreference.create({ user: req.user._id });
  }

  preferences.dietaryPreferences = {
    vegetarian: vegetarian || false,
    vegan: vegan || false,
    glutenFree: glutenFree || false,
    spicy: spicy || false
  };

  await preferences.save();

  res.json({
    success: true,
    message: 'Dietary preferences updated',
    data: preferences
  });
});

// @desc    Get quick reorder suggestions
// @route   GET /api/recommendations/reorder
// @access  Private
exports.getReorderSuggestions = asyncHandler(async (req, res) => {
  const preferences = await UserPreference.findOne({ user: req.user._id })
    .populate('favoriteProducts.product');

  if (!preferences || preferences.favoriteProducts.length === 0) {
    return res.json({
      success: true,
      data: []
    });
  }

  // Get top 5 most ordered items that are still available
  const reorderSuggestions = preferences.favoriteProducts
    .filter(fp => fp.product && fp.product.isAvailable)
    .slice(0, 5)
    .map(fp => ({
      product: fp.product,
      orderCount: fp.orderCount,
      lastOrdered: fp.lastOrdered,
      reason: `Ordered ${fp.orderCount} times`
    }));

  res.json({
    success: true,
    data: reorderSuggestions
  });
});
