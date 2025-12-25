const GroupOrder = require('../models/GroupOrder');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { emitToGroup } = require('../socket');

// @desc    Create a new group order
// @route   POST /api/group-orders
// @access  Private
exports.createGroupOrder = asyncHandler(async (req, res) => {
  const { name, maxParticipants } = req.body;

  // Generate unique code
  let code;
  let isUnique = false;
  while (!isUnique) {
    code = GroupOrder.generateCode();
    const existing = await GroupOrder.findOne({ code });
    if (!existing) isUnique = true;
  }

  const groupOrder = await GroupOrder.create({
    code,
    host: req.user._id,
    name: name || `${req.user.name}'s Group Order`,
    maxParticipants: maxParticipants || 10,
    participants: [{
      user: req.user._id,
      name: req.user.name,
      isHost: true,
      items: [],
      isReady: false
    }]
  });

  res.status(201).json({
    success: true,
    message: 'Group order created',
    data: groupOrder
  });
});

// @desc    Get group order by code
// @route   GET /api/group-orders/:code
// @access  Public
exports.getGroupOrder = asyncHandler(async (req, res) => {
  const groupOrder = await GroupOrder.findOne({ code: req.params.code.toUpperCase() })
    .populate('participants.items.product', 'name image')
    .populate('host', 'name');

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  res.json({
    success: true,
    data: groupOrder
  });
});

// @desc    Join a group order
// @route   POST /api/group-orders/:code/join
// @access  Public (with name) or Private
exports.joinGroupOrder = asyncHandler(async (req, res) => {
  const { name, sessionId } = req.body;
  const code = req.params.code.toUpperCase();

  const groupOrder = await GroupOrder.findOne({ code });

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  if (groupOrder.status !== 'active') {
    throw ApiError.badRequest('This group order is no longer accepting participants');
  }

  if (groupOrder.participants.length >= groupOrder.maxParticipants) {
    throw ApiError.badRequest('Group is full');
  }

  // Check if already a participant
  const existingParticipant = groupOrder.getParticipant(
    req.user?._id,
    sessionId
  );

  if (existingParticipant) {
    return res.json({
      success: true,
      message: 'Already in this group',
      data: groupOrder
    });
  }

  const participantData = {
    name: req.user?.name || name,
    isHost: false,
    items: [],
    isReady: false
  };

  if (req.user) {
    participantData.user = req.user._id;
  } else {
    if (!name || !sessionId) {
      throw ApiError.badRequest('Name and sessionId required for guest users');
    }
    participantData.sessionId = sessionId;
  }

  groupOrder.participants.push(participantData);
  await groupOrder.save();

  // Emit real-time update
  emitToGroup(code, 'group-updated', { groupOrder, event: 'participant-joined' });

  res.json({
    success: true,
    message: 'Joined group order',
    data: groupOrder
  });
});

// @desc    Leave a group order
// @route   POST /api/group-orders/:code/leave
// @access  Public
exports.leaveGroupOrder = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const code = req.params.code.toUpperCase();

  const groupOrder = await GroupOrder.findOne({ code });

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  await groupOrder.removeParticipant(req.user?._id, sessionId);

  // Emit real-time update
  emitToGroup(code, 'group-updated', { groupOrder, event: 'participant-left' });

  res.json({
    success: true,
    message: 'Left group order',
    data: groupOrder
  });
});

// @desc    Add item to participant's order
// @route   POST /api/group-orders/:code/items
// @access  Public
exports.addItem = asyncHandler(async (req, res) => {
  const { productId, quantity, size, notes, customizations, sessionId } = req.body;
  const code = req.params.code.toUpperCase();

  const groupOrder = await GroupOrder.findOne({ code });

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  if (groupOrder.status !== 'active') {
    throw ApiError.badRequest('Cannot modify a locked group order');
  }

  const participant = groupOrder.getParticipant(req.user?._id, sessionId);

  if (!participant) {
    throw ApiError.badRequest('You are not a participant in this group');
  }

  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const price = product.sizes?.[size] || product.price;
  let customizationTotal = 0;
  const processedCustomizations = [];

  if (customizations && customizations.length > 0) {
    for (const c of customizations) {
      processedCustomizations.push({
        customization: c.customization,
        name: c.name,
        price: c.price || 0
      });
      customizationTotal += c.price || 0;
    }
  }

  participant.items.push({
    product: productId,
    name: product.name,
    quantity: quantity || 1,
    size: size || 'medium',
    price,
    customizations: processedCustomizations,
    customizationTotal,
    notes
  });

  await groupOrder.save();

  // Emit real-time update
  emitToGroup(code, 'group-updated', { groupOrder, event: 'item-added' });

  res.json({
    success: true,
    message: 'Item added',
    data: groupOrder
  });
});

// @desc    Update item in participant's order
// @route   PUT /api/group-orders/:code/items/:itemId
// @access  Public
exports.updateItem = asyncHandler(async (req, res) => {
  const { quantity, sessionId } = req.body;
  const { code, itemId } = req.params;

  const groupOrder = await GroupOrder.findOne({ code: code.toUpperCase() });

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  if (groupOrder.status !== 'active') {
    throw ApiError.badRequest('Cannot modify a locked group order');
  }

  const participant = groupOrder.getParticipant(req.user?._id, sessionId);

  if (!participant) {
    throw ApiError.badRequest('You are not a participant in this group');
  }

  const item = participant.items.id(itemId);
  if (!item) {
    throw ApiError.notFound('Item not found');
  }

  if (quantity <= 0) {
    participant.items.pull(itemId);
  } else {
    item.quantity = quantity;
  }

  await groupOrder.save();

  // Emit real-time update
  emitToGroup(code, 'group-updated', { groupOrder, event: 'item-updated' });

  res.json({
    success: true,
    message: 'Item updated',
    data: groupOrder
  });
});

// @desc    Remove item from participant's order
// @route   DELETE /api/group-orders/:code/items/:itemId
// @access  Public
exports.removeItem = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const { code, itemId } = req.params;

  const groupOrder = await GroupOrder.findOne({ code: code.toUpperCase() });

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  if (groupOrder.status !== 'active') {
    throw ApiError.badRequest('Cannot modify a locked group order');
  }

  const participant = groupOrder.getParticipant(req.user?._id, sessionId);

  if (!participant) {
    throw ApiError.badRequest('You are not a participant in this group');
  }

  participant.items.pull(itemId);
  await groupOrder.save();

  // Emit real-time update
  emitToGroup(code, 'group-updated', { groupOrder, event: 'item-removed' });

  res.json({
    success: true,
    message: 'Item removed',
    data: groupOrder
  });
});

// @desc    Toggle participant ready status
// @route   PUT /api/group-orders/:code/ready
// @access  Public
exports.toggleReady = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  const code = req.params.code.toUpperCase();

  const groupOrder = await GroupOrder.findOne({ code });

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  const participant = groupOrder.getParticipant(req.user?._id, sessionId);

  if (!participant) {
    throw ApiError.badRequest('You are not a participant in this group');
  }

  participant.isReady = !participant.isReady;
  await groupOrder.save();

  // Emit real-time update
  emitToGroup(code, 'group-updated', { groupOrder, event: 'ready-toggled' });

  res.json({
    success: true,
    message: participant.isReady ? 'Marked as ready' : 'Marked as not ready',
    data: groupOrder
  });
});

// @desc    Lock group order (host only)
// @route   PUT /api/group-orders/:code/lock
// @access  Private (Host only)
exports.lockGroupOrder = asyncHandler(async (req, res) => {
  const code = req.params.code.toUpperCase();

  const groupOrder = await GroupOrder.findOne({ code });

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  if (groupOrder.host.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the host can lock the group order');
  }

  groupOrder.status = 'locked';
  await groupOrder.save();

  // Emit real-time update
  emitToGroup(code, 'group-updated', { groupOrder, event: 'order-locked' });

  res.json({
    success: true,
    message: 'Group order locked',
    data: groupOrder
  });
});

// @desc    Unlock group order (host only)
// @route   PUT /api/group-orders/:code/unlock
// @access  Private (Host only)
exports.unlockGroupOrder = asyncHandler(async (req, res) => {
  const code = req.params.code.toUpperCase();

  const groupOrder = await GroupOrder.findOne({ code });

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  if (groupOrder.host.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the host can unlock the group order');
  }

  if (groupOrder.status === 'ordered') {
    throw ApiError.badRequest('Cannot unlock an order that has already been placed');
  }

  groupOrder.status = 'active';
  await groupOrder.save();

  // Emit real-time update
  emitToGroup(code, 'group-updated', { groupOrder, event: 'order-unlocked' });

  res.json({
    success: true,
    message: 'Group order unlocked',
    data: groupOrder
  });
});

// @desc    Set split type (host only)
// @route   PUT /api/group-orders/:code/split
// @access  Private (Host only)
exports.setSplitType = asyncHandler(async (req, res) => {
  const { splitType } = req.body;
  const code = req.params.code.toUpperCase();

  const groupOrder = await GroupOrder.findOne({ code });

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  if (groupOrder.host.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the host can change split type');
  }

  groupOrder.splitType = splitType;
  await groupOrder.save();

  const splits = groupOrder.calculateSplit();

  // Emit real-time update
  emitToGroup(code, 'group-updated', { groupOrder, event: 'split-changed', splits });

  res.json({
    success: true,
    message: 'Split type updated',
    data: {
      groupOrder,
      splits
    }
  });
});

// @desc    Get split calculation
// @route   GET /api/group-orders/:code/split
// @access  Public
exports.getSplit = asyncHandler(async (req, res) => {
  const code = req.params.code.toUpperCase();

  const groupOrder = await GroupOrder.findOne({ code })
    .populate('participants.items.product', 'name image');

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  const splits = groupOrder.calculateSplit();

  res.json({
    success: true,
    data: {
      splitType: groupOrder.splitType,
      total: groupOrder.total,
      splits
    }
  });
});

// @desc    Place the group order (host only)
// @route   POST /api/group-orders/:code/checkout
// @access  Private (Host only)
exports.checkoutGroupOrder = asyncHandler(async (req, res) => {
  const { type, customerInfo, deliveryAddress, paymentMethod, notes } = req.body;
  const code = req.params.code.toUpperCase();

  const groupOrder = await GroupOrder.findOne({ code })
    .populate('participants.items.product');

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  if (groupOrder.host.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the host can place the order');
  }

  if (groupOrder.status === 'ordered') {
    throw ApiError.badRequest('This group order has already been placed');
  }

  // Combine all items from all participants
  const allItems = [];
  groupOrder.participants.forEach(participant => {
    participant.items.forEach(item => {
      allItems.push({
        product: item.product._id || item.product,
        name: item.name,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
        customizations: item.customizations,
        customizationTotal: item.customizationTotal,
        notes: item.notes ? `[${participant.name}] ${item.notes}` : `[${participant.name}]`
      });
    });
  });

  if (allItems.length === 0) {
    throw ApiError.badRequest('Cannot place an empty order');
  }

  // Calculate delivery fee
  const deliveryFee = type === 'delivery' ? 5.00 : 0;

  // Create the order
  const order = await Order.create({
    user: req.user._id,
    items: allItems,
    subtotal: groupOrder.subtotal,
    tax: groupOrder.tax,
    deliveryFee,
    total: groupOrder.total + deliveryFee,
    type,
    customerInfo,
    deliveryAddress: type === 'delivery' ? deliveryAddress : undefined,
    paymentMethod,
    notes: notes ? `[Group Order: ${groupOrder.code}] ${notes}` : `[Group Order: ${groupOrder.code}]`,
    estimatedDelivery: new Date(Date.now() + (type === 'delivery' ? 45 : 20) * 60 * 1000)
  });

  // Update group order status
  groupOrder.status = 'ordered';
  groupOrder.orderPlaced = order._id;
  await groupOrder.save();

  // Emit real-time update
  emitToGroup(code, 'group-updated', { groupOrder, event: 'order-placed', order });

  res.status(201).json({
    success: true,
    message: 'Group order placed successfully',
    data: {
      order,
      groupOrder,
      splits: groupOrder.calculateSplit()
    }
  });
});

// @desc    Get user's group orders
// @route   GET /api/group-orders
// @access  Private
exports.getMyGroupOrders = asyncHandler(async (req, res) => {
  const groupOrders = await GroupOrder.find({
    $or: [
      { host: req.user._id },
      { 'participants.user': req.user._id }
    ]
  })
    .sort({ createdAt: -1 })
    .populate('host', 'name')
    .limit(20);

  res.json({
    success: true,
    data: groupOrders
  });
});

// @desc    Cancel group order (host only)
// @route   DELETE /api/group-orders/:code
// @access  Private (Host only)
exports.cancelGroupOrder = asyncHandler(async (req, res) => {
  const code = req.params.code.toUpperCase();

  const groupOrder = await GroupOrder.findOne({ code });

  if (!groupOrder) {
    throw ApiError.notFound('Group order not found');
  }

  if (groupOrder.host.toString() !== req.user._id.toString()) {
    throw ApiError.forbidden('Only the host can cancel the group order');
  }

  if (groupOrder.status === 'ordered') {
    throw ApiError.badRequest('Cannot cancel an order that has already been placed');
  }

  groupOrder.status = 'cancelled';
  await groupOrder.save();

  // Emit real-time update
  emitToGroup(code, 'group-updated', { groupOrder, event: 'order-cancelled' });

  res.json({
    success: true,
    message: 'Group order cancelled',
    data: groupOrder
  });
});
