const mongoose = require('mongoose');

const userPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Track order history patterns
  favoriteCategories: [{
    category: String,
    orderCount: { type: Number, default: 0 },
    lastOrdered: Date
  }],
  favoriteProducts: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    orderCount: { type: Number, default: 0 },
    lastOrdered: Date
  }],
  preferredSizes: {
    small: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    large: { type: Number, default: 0 },
    extra_large: { type: Number, default: 0 }
  },
  // Dietary preferences (user-set)
  dietaryPreferences: {
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    glutenFree: { type: Boolean, default: false },
    spicy: { type: Boolean, default: false }
  },
  // Favorite customizations
  favoriteCustomizations: [{
    customization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customization'
    },
    useCount: { type: Number, default: 0 }
  }],
  // Order timing patterns
  orderPatterns: {
    weekdayOrders: { type: Number, default: 0 },
    weekendOrders: { type: Number, default: 0 },
    lunchOrders: { type: Number, default: 0 },     // 11am - 2pm
    dinnerOrders: { type: Number, default: 0 },    // 5pm - 9pm
    lateNightOrders: { type: Number, default: 0 }  // 9pm - 12am
  },
  // Average order value
  averageOrderValue: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  lastRecommendation: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for quick lookup
userPreferenceSchema.index({ user: 1 });

// Update preferences after an order
userPreferenceSchema.methods.updateFromOrder = async function(order) {
  const orderDate = new Date(order.createdAt || Date.now());
  const hour = orderDate.getHours();
  const dayOfWeek = orderDate.getDay();

  // Update order timing patterns
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    this.orderPatterns.weekendOrders++;
  } else {
    this.orderPatterns.weekdayOrders++;
  }

  if (hour >= 11 && hour < 14) {
    this.orderPatterns.lunchOrders++;
  } else if (hour >= 17 && hour < 21) {
    this.orderPatterns.dinnerOrders++;
  } else if (hour >= 21 || hour < 2) {
    this.orderPatterns.lateNightOrders++;
  }

  // Update average order value
  this.totalOrders++;
  const currentTotal = this.averageOrderValue * (this.totalOrders - 1);
  this.averageOrderValue = (currentTotal + order.total) / this.totalOrders;

  // Update favorite products and categories
  for (const item of order.items) {
    // Update product favorites
    const productIndex = this.favoriteProducts.findIndex(
      fp => fp.product && fp.product.toString() === item.product.toString()
    );
    if (productIndex >= 0) {
      this.favoriteProducts[productIndex].orderCount += item.quantity;
      this.favoriteProducts[productIndex].lastOrdered = orderDate;
    } else {
      this.favoriteProducts.push({
        product: item.product,
        orderCount: item.quantity,
        lastOrdered: orderDate
      });
    }

    // Update size preferences
    if (item.size && this.preferredSizes[item.size] !== undefined) {
      this.preferredSizes[item.size] += item.quantity;
    }

    // Update customization favorites
    if (item.customizations && item.customizations.length > 0) {
      for (const customization of item.customizations) {
        const customIndex = this.favoriteCustomizations.findIndex(
          fc => fc.customization && fc.customization.toString() === customization.customization.toString()
        );
        if (customIndex >= 0) {
          this.favoriteCustomizations[customIndex].useCount++;
        } else {
          this.favoriteCustomizations.push({
            customization: customization.customization,
            useCount: 1
          });
        }
      }
    }
  }

  // Sort favorites by count and keep top 20
  this.favoriteProducts.sort((a, b) => b.orderCount - a.orderCount);
  if (this.favoriteProducts.length > 20) {
    this.favoriteProducts = this.favoriteProducts.slice(0, 20);
  }

  this.favoriteCustomizations.sort((a, b) => b.useCount - a.useCount);
  if (this.favoriteCustomizations.length > 20) {
    this.favoriteCustomizations = this.favoriteCustomizations.slice(0, 20);
  }

  return this.save();
};

// Get most preferred size
userPreferenceSchema.methods.getPreferredSize = function() {
  const sizes = this.preferredSizes;
  let maxCount = 0;
  let preferredSize = 'medium';

  for (const [size, count] of Object.entries(sizes)) {
    if (count > maxCount) {
      maxCount = count;
      preferredSize = size;
    }
  }

  return preferredSize;
};

// Get time of day preference
userPreferenceSchema.methods.getTimePreference = function() {
  const patterns = this.orderPatterns;
  const timePrefs = {
    lunch: patterns.lunchOrders,
    dinner: patterns.dinnerOrders,
    lateNight: patterns.lateNightOrders
  };

  let maxCount = 0;
  let preference = 'dinner';

  for (const [time, count] of Object.entries(timePrefs)) {
    if (count > maxCount) {
      maxCount = count;
      preference = time;
    }
  }

  return preference;
};

module.exports = mongoose.model('UserPreference', userPreferenceSchema);
