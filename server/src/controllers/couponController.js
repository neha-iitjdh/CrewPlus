/**
 * Coupon Controller
 *
 * Public: Validate coupon at checkout
 * Admin: Full CRUD operations
 */
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @desc    Validate coupon (used during checkout)
 * @route   POST /api/coupons/validate
 * @access  Public (with optional auth)
 *
 * Body: { code: string, subtotal: number }
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, subtotal } = req.body;
  const userId = req.user?._id;

  if (!code) {
    throw new ApiError(400, 'Coupon code is required');
  }

  if (!subtotal || subtotal <= 0) {
    throw new ApiError(400, 'Valid subtotal is required');
  }

  const result = await Coupon.validateCoupon(code, subtotal, userId);

  if (!result.valid) {
    throw new ApiError(400, result.message);
  }

  res.json(
    new ApiResponse(200, {
      code: result.coupon.code,
      type: result.coupon.type,
      discount: result.discount,
      message: result.message
    })
  );
});

/**
 * @desc    Get all coupons (Admin)
 * @route   GET /api/coupons
 * @access  Private/Admin
 */
const getAllCoupons = asyncHandler(async (req, res) => {
  const { active, page = 1, limit = 20 } = req.query;

  const query = {};
  if (active === 'true') query.isActive = true;
  if (active === 'false') query.isActive = false;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const coupons = await Coupon.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Coupon.countDocuments(query);

  res.json(
    new ApiResponse(200, {
      coupons,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  );
});

/**
 * @desc    Get single coupon (Admin)
 * @route   GET /api/coupons/:id
 * @access  Private/Admin
 */
const getCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }

  res.json(new ApiResponse(200, { coupon }));
});

/**
 * @desc    Create coupon (Admin)
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    type,
    value,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    userUsageLimit,
    validFrom,
    validUntil,
    description
  } = req.body;

  // Validate percentage is <= 100
  if (type === 'percentage' && value > 100) {
    throw new ApiError(400, 'Percentage discount cannot exceed 100%');
  }

  const coupon = await Coupon.create({
    code,
    type,
    value,
    minOrderAmount,
    maxDiscount,
    usageLimit,
    userUsageLimit,
    validFrom,
    validUntil,
    description
  });

  res.status(201).json(
    new ApiResponse(201, { coupon }, 'Coupon created successfully')
  );
});

/**
 * @desc    Update coupon (Admin)
 * @route   PUT /api/coupons/:id
 * @access  Private/Admin
 */
const updateCoupon = asyncHandler(async (req, res) => {
  let coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }

  // Don't allow changing code (could break references)
  delete req.body.code;
  delete req.body.usedCount;
  delete req.body.usedBy;

  coupon = await Coupon.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  res.json(new ApiResponse(200, { coupon }, 'Coupon updated'));
});

/**
 * @desc    Delete coupon (Admin)
 * @route   DELETE /api/coupons/:id
 * @access  Private/Admin
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }

  await coupon.deleteOne();

  res.json(new ApiResponse(200, null, 'Coupon deleted'));
});

/**
 * @desc    Toggle coupon active status (Admin)
 * @route   PUT /api/coupons/:id/toggle
 * @access  Private/Admin
 */
const toggleCouponStatus = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  res.json(
    new ApiResponse(200, { coupon },
      `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}`
    )
  );
});

module.exports = {
  validateCoupon,
  getAllCoupons,
  getCoupon,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus
};
