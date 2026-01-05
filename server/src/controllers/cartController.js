/**
 * Cart Controller
 *
 * Handles cart operations for both guests and logged-in users.
 *
 * Session ID Flow:
 * 1. Frontend generates sessionId and stores in sessionStorage
 * 2. Sends sessionId in header: x-session-id
 * 3. Backend uses sessionId to find/create guest cart
 * 4. On login, frontend calls /merge to combine carts
 */
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Helper: Get user ID or session ID from request
 */
const getCartIdentifier = (req) => {
  const userId = req.user?._id;
  const sessionId = req.headers['x-session-id'];

  if (!userId && !sessionId) {
    throw new ApiError(400, 'Session ID required for guest cart');
  }

  return { userId, sessionId };
};

/**
 * @desc    Get current cart
 * @route   GET /api/cart
 * @access  Public (with session) or Private
 */
const getCart = asyncHandler(async (req, res) => {
  const { userId, sessionId } = getCartIdentifier(req);

  const cart = await Cart.getCart(userId, sessionId);

  // Populate product details
  await cart.populate('items.product');

  res.json(new ApiResponse(200, { cart }));
});

/**
 * @desc    Add item to cart
 * @route   POST /api/cart/items
 * @access  Public (with session) or Private
 *
 * Body: {
 *   productId: string,
 *   quantity: number,
 *   size: string,
 *   customizations: [{ name, price }],
 *   notes: string
 * }
 */
const addToCart = asyncHandler(async (req, res) => {
  const { userId, sessionId } = getCartIdentifier(req);
  const { productId, quantity = 1, size = 'medium', customizations = [], notes } = req.body;

  // Validate product exists and is available
  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(404, 'Product not found');
  }

  if (!product.isAvailable) {
    throw new ApiError(400, 'Product is not available');
  }

  // Check stock
  if (!product.hasStock(quantity)) {
    throw new ApiError(400, `Only ${product.inventory} items available`);
  }

  // Get price for selected size
  const price = product.getPrice(size);

  // Get or create cart
  const cart = await Cart.getCart(userId, sessionId);

  // Add item
  await cart.addItem({
    productId,
    quantity,
    size,
    price,
    customizations,
    notes
  });

  // Populate for response
  await cart.populate('items.product');

  res.status(201).json(
    new ApiResponse(201, { cart }, 'Item added to cart')
  );
});

/**
 * @desc    Update cart item quantity
 * @route   PUT /api/cart/items/:itemId
 * @access  Public (with session) or Private
 *
 * Body: { quantity: number }
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { userId, sessionId } = getCartIdentifier(req);
  const { itemId } = req.params;
  const { quantity } = req.body;

  if (quantity === undefined) {
    throw new ApiError(400, 'Quantity is required');
  }

  const cart = await Cart.getCart(userId, sessionId);

  // Find the item to check stock
  const item = cart.items.id(itemId);
  if (!item) {
    throw new ApiError(404, 'Item not found in cart');
  }

  // Check stock if increasing quantity
  if (quantity > item.quantity) {
    const product = await Product.findById(item.product);
    if (!product.hasStock(quantity)) {
      throw new ApiError(400, `Only ${product.inventory} items available`);
    }
  }

  // Update quantity (removes if <= 0)
  await cart.updateItemQuantity(itemId, quantity);

  await cart.populate('items.product');

  res.json(new ApiResponse(200, { cart }, 'Cart updated'));
});

/**
 * @desc    Remove item from cart
 * @route   DELETE /api/cart/items/:itemId
 * @access  Public (with session) or Private
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const { userId, sessionId } = getCartIdentifier(req);
  const { itemId } = req.params;

  const cart = await Cart.getCart(userId, sessionId);

  await cart.removeItem(itemId);

  await cart.populate('items.product');

  res.json(new ApiResponse(200, { cart }, 'Item removed'));
});

/**
 * @desc    Clear entire cart
 * @route   DELETE /api/cart
 * @access  Public (with session) or Private
 */
const clearCart = asyncHandler(async (req, res) => {
  const { userId, sessionId } = getCartIdentifier(req);

  const cart = await Cart.getCart(userId, sessionId);

  await cart.clearCart();

  res.json(new ApiResponse(200, { cart }, 'Cart cleared'));
});

/**
 * @desc    Merge guest cart into user cart (after login)
 * @route   POST /api/cart/merge
 * @access  Private
 *
 * Body: { sessionId: string }
 *
 * Called by frontend after successful login:
 * 1. User was browsing as guest, added items
 * 2. User logs in
 * 3. Frontend calls this to merge guest cart into user cart
 */
const mergeCart = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.body;

  if (!sessionId) {
    throw new ApiError(400, 'Session ID is required');
  }

  const cart = await Cart.mergeGuestCart(userId, sessionId);

  if (cart) {
    await cart.populate('items.product');
  }

  res.json(
    new ApiResponse(200, { cart }, cart ? 'Carts merged' : 'No guest cart to merge')
  );
});

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  mergeCart
};
