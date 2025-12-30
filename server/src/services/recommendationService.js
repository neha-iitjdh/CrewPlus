const Product = require('../models/Product');
const Order = require('../models/Order');
const UserPreference = require('../models/UserPreference');

class RecommendationService {
  /**
   * Get personalized recommendations for a user
   */
  async getRecommendations(userId, limit = 6) {
    try {
      // Get or create user preferences
      let preferences = await UserPreference.findOne({ user: userId })
        .populate('favoriteProducts.product')
        .populate('favoriteCustomizations.customization');

      if (!preferences) {
        preferences = await UserPreference.create({ user: userId });
      }

      // Get all available products
      const allProducts = await Product.find({ isAvailable: true });

      // Score each product based on user preferences
      const scoredProducts = await this.scoreProducts(allProducts, preferences);

      // Sort by score and return top recommendations
      scoredProducts.sort((a, b) => b.score - a.score);

      // Add variety - don't just return most ordered items
      const recommendations = this.diversifyRecommendations(scoredProducts, preferences, limit);

      return recommendations;
    } catch (error) {
      console.error('Recommendation error:', error);
      // Fall back to popular items
      return this.getPopularItems(limit);
    }
  }

  /**
   * Score products based on user preferences
   */
  async scoreProducts(products, preferences) {
    const now = new Date();
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isLunch = hour >= 11 && hour < 14;
    const isDinner = hour >= 17 && hour < 21;
    const isLateNight = hour >= 21 || hour < 2;

    // Get favorite product IDs for quick lookup
    const favoriteProductIds = new Set(
      preferences.favoriteProducts
        .filter(fp => fp.product)
        .map(fp => fp.product._id?.toString() || fp.product.toString())
    );

    // Get order counts for favorites
    const orderCounts = new Map(
      preferences.favoriteProducts
        .filter(fp => fp.product)
        .map(fp => [fp.product._id?.toString() || fp.product.toString(), fp.orderCount])
    );

    return products.map(product => {
      let score = 0;
      const productId = product._id.toString();
      const reasons = [];

      // Base score from product popularity
      score += Math.min(product.orderCount || 0, 100) / 10;

      // Boost if it's a favorite
      if (favoriteProductIds.has(productId)) {
        const orderCount = orderCounts.get(productId) || 0;
        score += Math.min(orderCount * 5, 50);
        reasons.push('Based on your previous orders');
      }

      // Category preference boost
      const categoryPref = preferences.favoriteCategories?.find(
        fc => fc.category === product.category
      );
      if (categoryPref) {
        score += Math.min(categoryPref.orderCount * 2, 20);
        reasons.push(`You love ${product.category}`);
      }

      // Time-based recommendations
      if (isLateNight && product.category === 'sides') {
        score += 15;
        reasons.push('Perfect for late night');
      }
      if (isDinner && product.category === 'pizza') {
        score += 10;
        reasons.push('Dinner favorite');
      }
      if (isLunch && product.category === 'combo') {
        score += 10;
        reasons.push('Great for lunch');
      }

      // Dietary preferences
      if (preferences.dietaryPreferences?.vegetarian && product.tags?.includes('vegetarian')) {
        score += 25;
        reasons.push('Vegetarian friendly');
      }
      if (preferences.dietaryPreferences?.spicy && product.tags?.includes('spicy')) {
        score += 20;
        reasons.push('Spicy, just how you like it');
      }

      // Price preference (recommend items close to average order value)
      const avgItemValue = preferences.averageOrderValue / Math.max(preferences.totalOrders, 1) || 15;
      const priceDiff = Math.abs(product.price - avgItemValue);
      if (priceDiff < 5) {
        score += 10;
      }

      // Novelty boost - recommend items user hasn't tried
      if (!favoriteProductIds.has(productId) && product.isAvailable) {
        score += 5;
        if (reasons.length === 0) {
          reasons.push('Try something new!');
        }
      }

      // Rating boost
      if (product.rating) {
        score += product.rating * 2;
        if (product.rating >= 4.5) {
          reasons.push('Highly rated');
        }
      }

      return {
        product,
        score,
        reason: reasons[0] || 'Recommended for you'
      };
    });
  }

  /**
   * Ensure variety in recommendations
   */
  diversifyRecommendations(scoredProducts, preferences, limit) {
    const recommendations = [];
    const categories = new Set();
    const favoriteProductIds = new Set(
      preferences.favoriteProducts
        .filter(fp => fp.product)
        .map(fp => fp.product._id?.toString() || fp.product.toString())
    );

    // First, add top favorites (max 2)
    let favoritesAdded = 0;
    for (const item of scoredProducts) {
      if (favoritesAdded >= 2) break;
      if (favoriteProductIds.has(item.product._id.toString())) {
        recommendations.push(item);
        categories.add(item.product.category);
        favoritesAdded++;
      }
    }

    // Then add top scored items from different categories
    for (const item of scoredProducts) {
      if (recommendations.length >= limit) break;
      if (recommendations.find(r => r.product._id.toString() === item.product._id.toString())) {
        continue;
      }

      // Ensure category diversity
      if (categories.size < 3 || !categories.has(item.product.category)) {
        recommendations.push(item);
        categories.add(item.product.category);
      }
    }

    // Fill remaining slots with highest scored items
    for (const item of scoredProducts) {
      if (recommendations.length >= limit) break;
      if (!recommendations.find(r => r.product._id.toString() === item.product._id.toString())) {
        recommendations.push(item);
      }
    }

    return recommendations.slice(0, limit);
  }

  /**
   * Get popular items (fallback for new users)
   */
  async getPopularItems(limit = 6) {
    const popularItems = await Order.getPopularItems(limit * 2);

    const products = await Product.find({
      _id: { $in: popularItems.map(item => item._id) },
      isAvailable: true
    });

    return products.slice(0, limit).map(product => ({
      product,
      score: 50,
      reason: 'Customer favorite'
    }));
  }

  /**
   * Get "You might also like" recommendations based on cart/order items
   */
  async getSimilarItems(productIds, limit = 4) {
    const products = await Product.find({ _id: { $in: productIds } });
    const categories = [...new Set(products.map(p => p.category))];

    // Find similar items in same categories
    const similarItems = await Product.find({
      _id: { $nin: productIds },
      category: { $in: categories },
      isAvailable: true
    }).limit(limit * 2);

    // Find complementary items (e.g., sides for pizza)
    const complementaryCategories = this.getComplementaryCategories(categories);
    const complementaryItems = await Product.find({
      category: { $in: complementaryCategories },
      isAvailable: true
    }).limit(limit);

    // Mix similar and complementary items
    const result = [];
    for (let i = 0; result.length < limit; i++) {
      if (i < similarItems.length) {
        result.push({
          product: similarItems[i],
          reason: 'Similar to items in your cart'
        });
      }
      if (result.length < limit && i < complementaryItems.length) {
        result.push({
          product: complementaryItems[i],
          reason: 'Goes great with your order'
        });
      }
      if (i >= Math.max(similarItems.length, complementaryItems.length)) break;
    }

    return result;
  }

  /**
   * Get complementary categories
   */
  getComplementaryCategories(categories) {
    const complementMap = {
      pizza: ['sides', 'drinks', 'desserts'],
      sides: ['drinks', 'pizza'],
      drinks: ['sides', 'desserts'],
      desserts: ['drinks'],
      combo: ['drinks', 'desserts']
    };

    const complementary = new Set();
    for (const category of categories) {
      const complements = complementMap[category] || [];
      complements.forEach(c => complementary.add(c));
    }

    // Remove categories already in cart
    categories.forEach(c => complementary.delete(c));

    return [...complementary];
  }

  /**
   * Update user preferences after order
   */
  async updatePreferencesFromOrder(userId, order) {
    try {
      let preferences = await UserPreference.findOne({ user: userId });
      if (!preferences) {
        preferences = await UserPreference.create({ user: userId });
      }
      await preferences.updateFromOrder(order);
      return preferences;
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  }

  /**
   * Get trending items (recently popular)
   */
  async getTrendingItems(limit = 6) {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const recentPopular = await Order.aggregate([
      { $match: { createdAt: { $gte: oneWeekAgo } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalQuantity: { $sum: '$items.quantity' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit }
    ]);

    const productIds = recentPopular.map(item => item._id);
    const products = await Product.find({
      _id: { $in: productIds },
      isAvailable: true
    });

    return products.map(product => ({
      product,
      reason: 'Trending this week'
    }));
  }
}

module.exports = new RecommendationService();
