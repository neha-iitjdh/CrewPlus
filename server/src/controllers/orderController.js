/**
 * Order Controller
 *
 * Checkout flow:
 * 1. Validate cart has items
 * 2. Check all items have sufficient stock
 * 3. Calculate totals (with optional coupon)
 * 4. Create order with item snapshots
 * 5. Deduct inventory
 * 6. Clear cart
 * 7. Return order confirmation
 */
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { ORDER_STATUS } = require('../config/constants');

/**
 * @desc    Create new order (checkout)
 * @route   POST /api/orders
 * @access  Public (with session) or Private
 */
const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'];
  const {
    type,           // 'delivery' or 'carryout'
    paymentMethod,  // 'cash', 'card', 'online'
    deliveryAddress,
    customerInfo,
    couponCode      // optional
  } = req.body;

  // Validate required fields
  if (!type || !paymentMethod || !customerInfo) {
    throw new ApiError(400, 'Missing required order information');
  }

  if (type === 'delivery' && !deliveryAddress) {
    throw new ApiError(400, 'Delivery address required for delivery orders');
  }

  // Get cart
  const cart = await Cart.getCart(userId, sessionId);
  await cart.populate('items.product');

  if (!cart.items || cart.items.length === 0) {
    throw new ApiError(400, 'Cart is empty');
  }

  // Validate stock for all items
  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isAvailable) {
      throw new ApiError(400, `${product?.name || 'Product'} is no longer available`);
    }

    if (!product.hasStock(item.quantity)) {
      throw new ApiError(400, `Insufficient stock for ${product.name}`);
    }
  }

  // Prepare order items (snapshot cart data)
  const orderItems = cart.items.map(item => ({
    product: item.product._id,
    name: item.product.name,
    quantity: item.quantity,
    size: item.size,
    price: item.price,
    customizations: item.customizations,
    notes: item.notes
  }));

  // Calculate subtotal first (needed for coupon validation)
  const tempTotals = Order.calculateTotals(orderItems, type, 0);

  // Validate and apply coupon if provided
  let discount = 0;
  let couponData = null;

  if (couponCode) {
    const couponResult = await Coupon.validateCoupon(
      couponCode,
      tempTotals.subtotal,
      userId
    );

    if (!couponResult.valid) {
      throw new ApiError(400, couponResult.message);
    }

    discount = couponResult.discount;
    couponData = {
      code: couponResult.coupon.code,
      discount: discount
    };

    // Mark coupon as used
    await couponResult.coupon.markAsUsed(userId);
  }

  // Calculate final totals with discount
  const totals = Order.calculateTotals(orderItems, type, discount);

  // Create order with retry for order number collision
  let order;
  let retries = 3;

  while (retries > 0) {
    try {
      const orderNumber = await Order.generateOrderNumber();
      order = await Order.create({
        orderNumber,
        user: userId,
        sessionId: userId ? undefined : sessionId,
        items: orderItems,
        ...totals,
        type,
        paymentMethod,
        deliveryAddress: type === 'delivery' ? deliveryAddress : undefined,
        customerInfo,
        coupon: couponData,
        estimatedDelivery: new Date(Date.now() + 45 * 60 * 1000) // 45 mins from now
      });
      break; // Success, exit loop
    } catch (err) {
      if (err.code === 11000 && retries > 1) {
        // Duplicate key error, retry with new number
        retries--;
        continue;
      }
      throw err; // Other error or out of retries
    }
  }

  // Deduct inventory
  for (const item of cart.items) {
    await item.product.deductInventory(item.quantity);
  }

  // Clear cart
  await cart.clearCart();

  res.status(201).json(
    new ApiResponse(201, { order }, 'Order placed successfully')
  );
});

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private (owner or admin)
 */
const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Check ownership (unless admin)
  if (req.user.role !== 'ADMIN') {
    const isOwner = order.user?.toString() === req.user._id.toString();
    if (!isOwner) {
      throw new ApiError(403, 'Not authorized to view this order');
    }
  }

  res.json(new ApiResponse(200, { order }));
});

/**
 * @desc    Get current user's orders
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;

  const query = { user: req.user._id };
  if (status) query.status = status;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(query)
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  res.json(
    new ApiResponse(200, {
      orders,
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
 * @desc    Track order by order number (public)
 * @route   GET /api/orders/track/:orderNumber
 * @access  Public
 */
const trackOrder = asyncHandler(async (req, res) => {
  const { orderNumber } = req.params;

  const order = await Order.findOne({ orderNumber });

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Return limited info for public tracking
  res.json(
    new ApiResponse(200, {
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        type: order.type,
        items: order.items.map(i => ({
          name: i.name,
          quantity: i.quantity,
          size: i.size
        })),
        total: order.total,
        estimatedDelivery: order.estimatedDelivery,
        createdAt: order.createdAt
      }
    })
  );
});

/**
 * @desc    Cancel order
 * @route   PUT /api/orders/:id/cancel
 * @access  Private (owner or admin)
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Check ownership
  if (req.user.role !== 'ADMIN') {
    const isOwner = order.user?.toString() === req.user._id.toString();
    if (!isOwner) {
      throw new ApiError(403, 'Not authorized');
    }
  }

  // Check if can be cancelled
  if (!order.canTransitionTo(ORDER_STATUS.CANCELLED)) {
    throw new ApiError(400, `Cannot cancel order with status: ${order.status}`);
  }

  // Restore inventory
  for (const item of order.items) {
    const product = await Product.findById(item.product);
    if (product) {
      await product.addInventory(item.quantity);
    }
  }

  // Update status
  await order.updateStatus(ORDER_STATUS.CANCELLED);

  res.json(new ApiResponse(200, { order }, 'Order cancelled'));
});

/**
 * @desc    Get all orders (Admin)
 * @route   GET /api/orders
 * @access  Private/Admin
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { status, type, page = 1, limit = 20 } = req.query;

  const query = {};
  if (status) query.status = status;
  if (type) query.type = type;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await Order.find(query)
    .populate('user', 'name email')
    .sort('-createdAt')
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(query);

  res.json(
    new ApiResponse(200, {
      orders,
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
 * @desc    Update order status (Admin)
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!status || !Object.values(ORDER_STATUS).includes(status)) {
    throw new ApiError(400, 'Invalid status');
  }

  const order = await Order.findById(req.params.id);

  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (!order.canTransitionTo(status)) {
    throw new ApiError(400, `Cannot transition from ${order.status} to ${status}`);
  }

  await order.updateStatus(status);

  res.json(new ApiResponse(200, { order }, `Order status updated to ${status}`));
});

/**
 * @desc    Get order analytics (Admin)
 * @route   GET /api/orders/admin/analytics
 * @access  Private/Admin
 */
const getAnalytics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const analytics = await Order.getAnalytics(startDate, endDate);

  res.json(new ApiResponse(200, { analytics }));
});

module.exports = {
  createOrder,
  getOrder,
  getMyOrders,
  trackOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
  getAnalytics
};
