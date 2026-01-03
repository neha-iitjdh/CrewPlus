/**
 * Coupon Model
 *
 * Two types of discounts:
 * 1. Percentage: "20% off" - value is percentage (20)
 * 2. Fixed: "₹100 off" - value is amount (100)
 *
 * Validation rules:
 * - Must be active
 * - Within date range
 * - Under usage limits
 * - Order meets minimum amount
 */
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    /**
     * Coupon code
     * Stored uppercase for case-insensitive matching
     * Example: SAVE20, WELCOME50
     */
    code: {
      type: String,
      required: [true, 'Coupon code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: [3, 'Code must be at least 3 characters'],
      maxlength: [20, 'Code cannot exceed 20 characters']
    },

    /**
     * Discount type
     * - percentage: value is % off (e.g., 20 = 20% off)
     * - fixed: value is amount off (e.g., 100 = ₹100 off)
     */
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true
    },

    /**
     * Discount value
     * For percentage: 0-100
     * For fixed: any positive number
     */
    value: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [0, 'Value cannot be negative']
    },

    /**
     * Minimum order amount to use coupon
     * Example: Coupon only valid on orders ≥ ₹500
     */
    minOrderAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    /**
     * Maximum discount cap (for percentage coupons)
     * Example: 20% off, max ₹200
     * Prevents huge discounts on large orders
     */
    maxDiscount: {
      type: Number,
      default: null
    },

    /**
     * Global usage limit
     * Total times this coupon can be used
     * null = unlimited
     */
    usageLimit: {
      type: Number,
      default: null
    },

    /**
     * How many times coupon has been used
     */
    usedCount: {
      type: Number,
      default: 0
    },

    /**
     * Per-user usage limit
     * How many times one user can use this coupon
     * null = unlimited per user
     */
    userUsageLimit: {
      type: Number,
      default: 1
    },

    /**
     * Track which users have used this coupon
     */
    usedBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      count: {
        type: Number,
        default: 1
      }
    }],

    /**
     * Validity period
     */
    validFrom: {
      type: Date,
      default: Date.now
    },

    validUntil: {
      type: Date,
      required: [true, 'Expiry date is required']
    },

    /**
     * Active toggle
     * Admin can disable coupon without deleting
     */
    isActive: {
      type: Boolean,
      default: true
    },

    /**
     * Description for admin reference
     */
    description: {
      type: String,
      maxlength: 200
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

/**
 * Virtual: isValid
 * Quick check if coupon is currently valid
 */
couponSchema.virtual('isValid').get(function () {
  const now = new Date();
  return (
    this.isActive &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
});

/**
 * Virtual: remainingUses
 * How many times coupon can still be used
 */
couponSchema.virtual('remainingUses').get(function () {
  if (this.usageLimit === null) return null; // Unlimited
  return Math.max(0, this.usageLimit - this.usedCount);
});

/**
 * Method: canBeUsedBy
 * Check if specific user can use this coupon
 */
couponSchema.methods.canBeUsedBy = function (userId) {
  if (!this.isValid) return false;

  // Check per-user limit
  if (userId && this.userUsageLimit !== null) {
    const userUsage = this.usedBy.find(
      u => u.user.toString() === userId.toString()
    );
    if (userUsage && userUsage.count >= this.userUsageLimit) {
      return false;
    }
  }

  return true;
};

/**
 * Method: calculateDiscount
 * Calculate discount for given subtotal
 */
couponSchema.methods.calculateDiscount = function (subtotal) {
  if (!this.isValid) return 0;

  // Check minimum order
  if (subtotal < this.minOrderAmount) return 0;

  let discount;

  if (this.type === 'percentage') {
    discount = (subtotal * this.value) / 100;

    // Apply max discount cap
    if (this.maxDiscount !== null && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    // Fixed discount
    discount = this.value;
  }

  // Discount cannot exceed subtotal
  return Math.min(discount, subtotal);
};

/**
 * Method: markAsUsed
 * Record coupon usage
 */
couponSchema.methods.markAsUsed = async function (userId) {
  this.usedCount += 1;

  if (userId) {
    const existingUsage = this.usedBy.find(
      u => u.user.toString() === userId.toString()
    );

    if (existingUsage) {
      existingUsage.count += 1;
    } else {
      this.usedBy.push({ user: userId, count: 1 });
    }
  }

  await this.save();
};

/**
 * Static: validateCoupon
 * Full validation including user check
 */
couponSchema.statics.validateCoupon = async function (code, subtotal, userId) {
  const coupon = await this.findOne({ code: code.toUpperCase() });

  if (!coupon) {
    return { valid: false, message: 'Invalid coupon code' };
  }

  if (!coupon.isActive) {
    return { valid: false, message: 'Coupon is not active' };
  }

  const now = new Date();
  if (now < coupon.validFrom) {
    return { valid: false, message: 'Coupon is not yet valid' };
  }

  if (now > coupon.validUntil) {
    return { valid: false, message: 'Coupon has expired' };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached' };
  }

  if (subtotal < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount is ₹${coupon.minOrderAmount}`
    };
  }

  if (!coupon.canBeUsedBy(userId)) {
    return { valid: false, message: 'You have already used this coupon' };
  }

  const discount = coupon.calculateDiscount(subtotal);

  return {
    valid: true,
    coupon,
    discount,
    message: `Coupon applied! You save ₹${discount}`
  };
};

// Indexes
// Note: code already has unique:true which creates an index automatically
couponSchema.index({ isActive: 1, validUntil: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
