/**
 * Product Model
 *
 * Key concepts:
 * - Nested objects for size-based pricing
 * - Virtuals: computed properties (not stored in DB)
 * - Methods: functions you can call on documents
 * - Indexes: speed up queries on frequently searched fields
 */
const mongoose = require('mongoose');
const { CATEGORIES, SIZES } = require('../config/constants');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },

    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: Object.values(CATEGORIES),
        message: 'Category must be pizza, drink, or bread'
      }
    },

    /**
     * Base price - used when no size is selected
     * For drinks/bread that don't have sizes
     */
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },

    /**
     * Size-based pricing
     *
     * Example:
     * sizes: {
     *   small: { price: 199, available: true },
     *   medium: { price: 299, available: true },
     *   large: { price: 399, available: true },
     *   extra_large: { price: 499, available: false }
     * }
     */
    sizes: {
      small: {
        price: { type: Number, default: 0 },
        available: { type: Boolean, default: true }
      },
      medium: {
        price: { type: Number, default: 0 },
        available: { type: Boolean, default: true }
      },
      large: {
        price: { type: Number, default: 0 },
        available: { type: Boolean, default: true }
      },
      extra_large: {
        price: { type: Number, default: 0 },
        available: { type: Boolean, default: true }
      }
    },

    image: {
      type: String,
      default: '' // URL to product image
    },

    /**
     * Ingredients list
     * Useful for displaying and allergy info
     */
    ingredients: [{
      type: String,
      trim: true
    }],

    // Dietary flags
    isVegetarian: {
      type: Boolean,
      default: false
    },

    isSpicy: {
      type: Boolean,
      default: false
    },

    /**
     * Availability toggle
     * Instead of deleting products, we mark them unavailable
     * This preserves order history that references this product
     */
    isAvailable: {
      type: Boolean,
      default: true
    },

    /**
     * Inventory Management
     * Track stock to prevent overselling
     */
    inventory: {
      type: Number,
      default: 100,
      min: [0, 'Inventory cannot be negative']
    },

    /**
     * Rating system
     * average: calculated from all ratings
     * count: number of ratings received
     */
    rating: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0 }
    },

    /**
     * Tags for search/filtering
     * e.g., ['bestseller', 'new', 'featured']
     */
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },  // Include virtuals in JSON output
    toObject: { virtuals: true }
  }
);

/**
 * Virtual: inStock
 *
 * Virtuals are computed properties - not stored in DB.
 * Calculated on-the-fly when accessed.
 *
 * A product is "in stock" if:
 * 1. It's marked as available AND
 * 2. Inventory is greater than 0
 */
productSchema.virtual('inStock').get(function () {
  return this.isAvailable && this.inventory > 0;
});

/**
 * Method: hasStock
 * Check if enough inventory for a given quantity
 */
productSchema.methods.hasStock = function (quantity = 1) {
  return this.inventory >= quantity;
};

/**
 * Method: deductInventory
 * Reduce inventory when order is placed
 */
productSchema.methods.deductInventory = async function (quantity) {
  if (!this.hasStock(quantity)) {
    throw new Error(`Insufficient stock for ${this.name}`);
  }
  this.inventory -= quantity;
  await this.save();
};

/**
 * Method: addInventory
 * Increase inventory (restock or order cancellation)
 */
productSchema.methods.addInventory = async function (quantity) {
  this.inventory += quantity;
  await this.save();
};

/**
 * Method: getPrice
 * Get price for a specific size, or base price
 */
productSchema.methods.getPrice = function (size) {
  if (size && this.sizes[size] && this.sizes[size].price > 0) {
    return this.sizes[size].price;
  }
  return this.price;
};

/**
 * Index: Improve query performance
 *
 * Compound index on category + isAvailable
 * Speeds up: "Find all available pizzas"
 */
productSchema.index({ category: 1, isAvailable: 1 });

/**
 * Text index for search
 * Allows: Product.find({ $text: { $search: "pepperoni" } })
 */
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
