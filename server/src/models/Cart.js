/**
 * Cart Model
 *
 * Two types of carts:
 * 1. Guest Cart - identified by sessionId (browser session)
 * 2. User Cart - identified by user ObjectId
 *
 * Cart Items contain:
 * - Product reference
 * - Quantity
 * - Selected size
 * - Price at time of adding (important! prices can change)
 * - Customizations (toppings, etc.)
 * - Notes ("extra cheese please")
 */
const mongoose = require('mongoose');
const { TAX_RATE } = require('../config/constants');

// Schema for individual cart items
const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },

  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra_large'],
    default: 'medium'
  },

  /**
   * Price snapshot
   * We store the price at time of adding because:
   * - Product prices can change
   * - Cart should show what customer expected to pay
   */
  price: {
    type: Number,
    required: true
  },

  /**
   * Customizations (we'll build this model later)
   * For now, store as embedded objects
   */
  customizations: [{
    name: String,
    price: { type: Number, default: 0 }
  }],

  notes: {
    type: String,
    maxlength: 200
  }
}, {
  _id: true // Each item gets its own ID for updating/removing
});

// Main cart schema
const cartSchema = new mongoose.Schema(
  {
    /**
     * Either user OR sessionId must exist
     * - user: for logged-in users
     * - sessionId: for guests
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    sessionId: {
      type: String
    },

    items: [cartItemSchema],

    // Calculated totals
    subtotal: {
      type: Number,
      default: 0
    },

    tax: {
      type: Number,
      default: 0
    },

    total: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

/**
 * Pre-save Hook: Calculate totals
 *
 * Runs before saving to update subtotal, tax, total
 */
cartSchema.pre('save', function () {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => {
    // Item total = (base price + customizations) * quantity
    const customizationTotal = item.customizations.reduce(
      (cSum, c) => cSum + (c.price || 0),
      0
    );
    const itemTotal = (item.price + customizationTotal) * item.quantity;
    return sum + itemTotal;
  }, 0);

  // Calculate tax (10%)
  this.tax = Math.round(this.subtotal * TAX_RATE * 100) / 100;

  // Calculate total
  this.total = Math.round((this.subtotal + this.tax) * 100) / 100;
  // Mongoose v9+ - no next() needed for sync hooks
});

/**
 * Method: addItem
 * Add a product to cart or increase quantity if exists
 */
cartSchema.methods.addItem = async function (productData) {
  const { productId, quantity = 1, size, price, customizations = [], notes } = productData;

  // Check if item with same product AND size already exists
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString() &&
            item.size === size &&
            JSON.stringify(item.customizations) === JSON.stringify(customizations)
  );

  if (existingItemIndex > -1) {
    // Item exists - increase quantity
    this.items[existingItemIndex].quantity += quantity;
  } else {
    // New item - add to cart
    this.items.push({
      product: productId,
      quantity,
      size,
      price,
      customizations,
      notes
    });
  }

  await this.save();
  return this;
};

/**
 * Method: updateItemQuantity
 */
cartSchema.methods.updateItemQuantity = async function (itemId, quantity) {
  const item = this.items.id(itemId);

  if (!item) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or less
    this.items.pull(itemId);
  } else {
    item.quantity = quantity;
  }

  await this.save();
  return this;
};

/**
 * Method: removeItem
 */
cartSchema.methods.removeItem = async function (itemId) {
  this.items.pull(itemId);
  await this.save();
  return this;
};

/**
 * Method: clearCart
 */
cartSchema.methods.clearCart = async function () {
  this.items = [];
  await this.save();
  return this;
};

/**
 * Static Method: getCart
 * Find or create cart for user or session
 */
cartSchema.statics.getCart = async function (userId, sessionId) {
  let cart;

  if (userId) {
    // Find by user ID
    cart = await this.findOne({ user: userId }).populate('items.product');
  } else if (sessionId) {
    // Find by session ID
    cart = await this.findOne({ sessionId }).populate('items.product');
  }

  // Create new cart if not found
  if (!cart) {
    cart = await this.create({
      user: userId || undefined,
      sessionId: userId ? undefined : sessionId
    });
  }

  return cart;
};

/**
 * Static Method: mergeGuestCart
 * When guest logs in, merge their cart into user cart
 */
cartSchema.statics.mergeGuestCart = async function (userId, sessionId) {
  const guestCart = await this.findOne({ sessionId }).populate('items.product');

  if (!guestCart || guestCart.items.length === 0) {
    return null; // Nothing to merge
  }

  // Get or create user cart
  let userCart = await this.findOne({ user: userId });

  if (!userCart) {
    // No user cart - just convert guest cart to user cart
    guestCart.user = userId;
    guestCart.sessionId = undefined;
    await guestCart.save();
    return guestCart;
  }

  // Merge items from guest cart to user cart
  for (const guestItem of guestCart.items) {
    await userCart.addItem({
      productId: guestItem.product._id || guestItem.product,
      quantity: guestItem.quantity,
      size: guestItem.size,
      price: guestItem.price,
      customizations: guestItem.customizations,
      notes: guestItem.notes
    });
  }

  // Delete guest cart
  await guestCart.deleteOne();

  return userCart;
};

// Indexes
cartSchema.index({ user: 1 });
cartSchema.index({ sessionId: 1 });

module.exports = mongoose.model('Cart', cartSchema);
