/**
 * Order Model
 *
 * Key design decisions:
 * 1. Snapshot item data - prices/names stored, not just references
 *    (products can change, order history must stay accurate)
 * 2. Status workflow - defined transitions
 * 3. Support both user and guest orders
 * 4. Auto-generate readable order numbers
 */
const mongoose = require('mongoose');
const { ORDER_STATUS, TAX_RATE, DELIVERY_FEE } = require('../config/constants');

// Order item schema (snapshot of cart item)
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },

  // Snapshot data (doesn't change even if product changes)
  name: {
    type: String,
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    min: 1
  },

  size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra_large']
  },

  price: {
    type: Number,
    required: true
  },

  customizations: [{
    name: String,
    price: { type: Number, default: 0 }
  }],

  notes: String
}, { _id: false });

// Main order schema
const orderSchema = new mongoose.Schema(
  {
    /**
     * Order Number
     * Format: ORD-YYYYMMDD-XXXX
     * Example: ORD-20250114-0042
     * Human-readable, good for phone orders
     */
    orderNumber: {
      type: String,
      unique: true
    },

    // Either user or sessionId (for guest orders)
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    sessionId: String,

    // Order items (snapshot from cart)
    items: [orderItemSchema],

    // Pricing breakdown
    subtotal: {
      type: Number,
      required: true
    },

    tax: {
      type: Number,
      required: true
    },

    deliveryFee: {
      type: Number,
      default: 0
    },

    discount: {
      type: Number,
      default: 0
    },

    total: {
      type: Number,
      required: true
    },

    // Coupon used (if any)
    coupon: {
      code: String,
      discount: Number
    },

    /**
     * Order Type
     * - delivery: We bring it to you (+delivery fee)
     * - carryout: You pick it up (no fee)
     */
    type: {
      type: String,
      enum: ['delivery', 'carryout'],
      required: true
    },

    /**
     * Order Status Flow:
     * pending → confirmed → preparing → ready → delivered
     *
     * Any status can go to 'cancelled' (except delivered)
     */
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING
    },

    // Payment info
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'online'],
      required: true
    },

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },

    // Delivery address (required if type is 'delivery')
    deliveryAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String
    },

    // Customer info (for guest orders or contact)
    customerInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true }
    },

    // Timestamps
    estimatedDelivery: Date,
    completedAt: Date
  },
  {
    timestamps: true
  }
);

/**
 * Static: Generate unique order number
 *
 * Format: ORD-YYYYMMDD-XXXX
 * Uses timestamp + random to avoid race conditions
 */
orderSchema.statics.generateOrderNumber = async function () {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

  // Find the highest order number for today
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);

  const lastOrder = await this.findOne({
    orderNumber: { $regex: `^ORD-${dateStr}` }
  }).sort({ orderNumber: -1 });

  let nextNum = 1;
  if (lastOrder && lastOrder.orderNumber) {
    const parts = lastOrder.orderNumber.split('-');
    if (parts.length === 3) {
      nextNum = parseInt(parts[2], 10) + 1;
    }
  }

  const sequence = String(nextNum).padStart(4, '0');
  return `ORD-${dateStr}-${sequence}`;
};

/**
 * Method: canTransitionTo
 * Check if status transition is valid
 */
orderSchema.methods.canTransitionTo = function (newStatus) {
  const transitions = {
    [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.READY]: [ORDER_STATUS.DELIVERED, ORDER_STATUS.CANCELLED],
    [ORDER_STATUS.DELIVERED]: [], // Final state
    [ORDER_STATUS.CANCELLED]: []  // Final state
  };

  return transitions[this.status]?.includes(newStatus) || false;
};

/**
 * Method: updateStatus
 * Update order status with validation
 */
orderSchema.methods.updateStatus = async function (newStatus) {
  if (!this.canTransitionTo(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }

  this.status = newStatus;

  // Set completion time for final states
  if (newStatus === ORDER_STATUS.DELIVERED || newStatus === ORDER_STATUS.CANCELLED) {
    this.completedAt = new Date();
  }

  await this.save();
  return this;
};

/**
 * Static: Calculate order totals
 * Helper to calculate pricing from cart items
 */
orderSchema.statics.calculateTotals = function (items, orderType, discountAmount = 0) {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    const customizationTotal = (item.customizations || []).reduce(
      (cSum, c) => cSum + (c.price || 0),
      0
    );
    return sum + (item.price + customizationTotal) * item.quantity;
  }, 0);

  // Calculate tax
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;

  // Delivery fee
  const deliveryFee = orderType === 'delivery' ? DELIVERY_FEE : 0;

  // Total
  const total = Math.round((subtotal + tax + deliveryFee - discountAmount) * 100) / 100;

  return { subtotal, tax, deliveryFee, discount: discountAmount, total };
};

/**
 * Static: Get analytics
 * Aggregate order data for admin dashboard
 */
orderSchema.statics.getAnalytics = async function (startDate, endDate) {
  const match = {};

  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const analytics = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: '$total' },
        avgOrderValue: { $avg: '$total' },
        deliveryOrders: {
          $sum: { $cond: [{ $eq: ['$type', 'delivery'] }, 1, 0] }
        },
        carryoutOrders: {
          $sum: { $cond: [{ $eq: ['$type', 'carryout'] }, 1, 0] }
        }
      }
    }
  ]);

  // Get status breakdown
  const statusBreakdown = await this.aggregate([
    { $match: match },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Count pending orders
  const pendingOrders = await this.countDocuments({ status: 'pending' });

  // Count today's orders
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayOrders = await this.countDocuments({
    createdAt: { $gte: startOfToday }
  });

  return {
    ...(analytics[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      avgOrderValue: 0,
      deliveryOrders: 0,
      carryoutOrders: 0
    }),
    pendingOrders,
    todayOrders,
    statusBreakdown: statusBreakdown.reduce((acc, s) => {
      acc[s._id] = s.count;
      return acc;
    }, {})
  };
};

// Indexes for common queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);
