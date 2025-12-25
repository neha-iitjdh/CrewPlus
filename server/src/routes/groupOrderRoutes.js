const express = require('express');
const router = express.Router();
const {
  createGroupOrder,
  getGroupOrder,
  joinGroupOrder,
  leaveGroupOrder,
  addItem,
  updateItem,
  removeItem,
  toggleReady,
  lockGroupOrder,
  unlockGroupOrder,
  setSplitType,
  getSplit,
  checkoutGroupOrder,
  getMyGroupOrders,
  cancelGroupOrder
} = require('../controllers/groupOrderController');
const { protect, optionalAuth } = require('../middleware/auth');

// Public routes (with optional auth)
router.get('/:code', optionalAuth, getGroupOrder);
router.post('/:code/join', optionalAuth, joinGroupOrder);
router.post('/:code/leave', optionalAuth, leaveGroupOrder);
router.post('/:code/items', optionalAuth, addItem);
router.put('/:code/items/:itemId', optionalAuth, updateItem);
router.delete('/:code/items/:itemId', optionalAuth, removeItem);
router.put('/:code/ready', optionalAuth, toggleReady);
router.get('/:code/split', optionalAuth, getSplit);

// Protected routes (require authentication)
router.post('/', protect, createGroupOrder);
router.get('/', protect, getMyGroupOrders);
router.put('/:code/lock', protect, lockGroupOrder);
router.put('/:code/unlock', protect, unlockGroupOrder);
router.put('/:code/split', protect, setSplitType);
router.post('/:code/checkout', protect, checkoutGroupOrder);
router.delete('/:code', protect, cancelGroupOrder);

module.exports = router;
