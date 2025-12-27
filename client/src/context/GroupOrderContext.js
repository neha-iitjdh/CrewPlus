import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { groupOrdersAPI, getSessionId } from '../services/api';
import { initializeSocket, joinGroupRoom, leaveGroupRoom, onGroupUpdate, offGroupUpdate } from '../services/socket';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const GroupOrderContext = createContext();

export const useGroupOrder = () => {
  const context = useContext(GroupOrderContext);
  if (!context) {
    throw new Error('useGroupOrder must be used within a GroupOrderProvider');
  }
  return context;
};

export const GroupOrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [groupOrder, setGroupOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [splits, setSplits] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('token');
    initializeSocket(token);
  }, [user]);

  // Handle real-time updates
  useEffect(() => {
    const handleGroupUpdate = (data) => {
      console.log('Group update received:', data.event);
      setGroupOrder(data.groupOrder);
      if (data.splits) {
        setSplits(data.splits);
      }

      // Show toast notifications for certain events
      switch (data.event) {
        case 'participant-joined':
          toast.success('A new participant joined!');
          break;
        case 'participant-left':
          toast('A participant left the group', { icon: '👋' });
          break;
        case 'order-locked':
          toast('Order has been locked by host', { icon: '🔒' });
          break;
        case 'order-unlocked':
          toast('Order has been unlocked', { icon: '🔓' });
          break;
        case 'order-placed':
          toast.success('Order has been placed!');
          break;
        case 'order-cancelled':
          toast.error('Group order has been cancelled');
          break;
        default:
          break;
      }
    };

    onGroupUpdate(handleGroupUpdate);

    return () => {
      offGroupUpdate(handleGroupUpdate);
    };
  }, []);

  // Create a new group order
  const createGroupOrder = useCallback(async (name, maxParticipants) => {
    setLoading(true);
    try {
      const response = await groupOrdersAPI.create({ name, maxParticipants });
      setGroupOrder(response.data);
      joinGroupRoom(response.data.code);
      toast.success('Group order created!');
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Failed to create group order');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Join a group order
  const joinGroup = useCallback(async (code, name = null) => {
    setLoading(true);
    try {
      const sessionId = getSessionId();
      const response = await groupOrdersAPI.join(code, { name, sessionId });
      setGroupOrder(response.data);
      joinGroupRoom(code);
      toast.success('Joined group order!');
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Failed to join group order');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Leave a group order
  const leaveGroup = useCallback(async () => {
    if (!groupOrder) return;

    setLoading(true);
    try {
      const sessionId = getSessionId();
      await groupOrdersAPI.leave(groupOrder.code, { sessionId });
      leaveGroupRoom(groupOrder.code);
      setGroupOrder(null);
      setSplits([]);
      toast.success('Left group order');
    } catch (error) {
      toast.error(error.message || 'Failed to leave group order');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [groupOrder]);

  // Fetch group order by code
  const fetchGroupOrder = useCallback(async (code) => {
    setLoading(true);
    try {
      const response = await groupOrdersAPI.getGroupOrder(code);
      setGroupOrder(response.data);
      joinGroupRoom(code);
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Group order not found');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add item to group order
  const addItem = useCallback(async (productId, quantity, size, notes, customizations) => {
    if (!groupOrder) return;

    try {
      const sessionId = getSessionId();
      const response = await groupOrdersAPI.addItem(groupOrder.code, {
        productId,
        quantity,
        size,
        notes,
        customizations,
        sessionId
      });
      setGroupOrder(response.data);
      toast.success('Item added!');
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Failed to add item');
      throw error;
    }
  }, [groupOrder]);

  // Update item quantity
  const updateItem = useCallback(async (itemId, quantity) => {
    if (!groupOrder) return;

    try {
      const sessionId = getSessionId();
      const response = await groupOrdersAPI.updateItem(groupOrder.code, itemId, {
        quantity,
        sessionId
      });
      setGroupOrder(response.data);
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Failed to update item');
      throw error;
    }
  }, [groupOrder]);

  // Remove item
  const removeItem = useCallback(async (itemId) => {
    if (!groupOrder) return;

    try {
      const sessionId = getSessionId();
      const response = await groupOrdersAPI.removeItem(groupOrder.code, itemId, { sessionId });
      setGroupOrder(response.data);
      toast.success('Item removed');
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Failed to remove item');
      throw error;
    }
  }, [groupOrder]);

  // Toggle ready status
  const toggleReady = useCallback(async () => {
    if (!groupOrder) return;

    try {
      const sessionId = getSessionId();
      const response = await groupOrdersAPI.toggleReady(groupOrder.code, { sessionId });
      setGroupOrder(response.data);
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
      throw error;
    }
  }, [groupOrder]);

  // Lock group order (host only)
  const lockOrder = useCallback(async () => {
    if (!groupOrder) return;

    try {
      const response = await groupOrdersAPI.lock(groupOrder.code);
      setGroupOrder(response.data);
      toast.success('Order locked');
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Failed to lock order');
      throw error;
    }
  }, [groupOrder]);

  // Unlock group order (host only)
  const unlockOrder = useCallback(async () => {
    if (!groupOrder) return;

    try {
      const response = await groupOrdersAPI.unlock(groupOrder.code);
      setGroupOrder(response.data);
      toast.success('Order unlocked');
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Failed to unlock order');
      throw error;
    }
  }, [groupOrder]);

  // Set split type (host only)
  const setSplitType = useCallback(async (splitType) => {
    if (!groupOrder) return;

    try {
      const response = await groupOrdersAPI.setSplitType(groupOrder.code, splitType);
      setGroupOrder(response.data.groupOrder);
      setSplits(response.data.splits);
      toast.success('Split type updated');
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Failed to update split type');
      throw error;
    }
  }, [groupOrder]);

  // Get split calculation
  const fetchSplits = useCallback(async () => {
    if (!groupOrder) return;

    try {
      const response = await groupOrdersAPI.getSplit(groupOrder.code);
      setSplits(response.data.splits);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch splits:', error);
      throw error;
    }
  }, [groupOrder]);

  // Checkout group order (host only)
  const checkout = useCallback(async (orderData) => {
    if (!groupOrder) return;

    setLoading(true);
    try {
      const response = await groupOrdersAPI.checkout(groupOrder.code, orderData);
      setGroupOrder(response.data.groupOrder);
      setSplits(response.data.splits);
      toast.success('Order placed successfully!');
      return response.data;
    } catch (error) {
      toast.error(error.message || 'Failed to place order');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [groupOrder]);

  // Cancel group order (host only)
  const cancelOrder = useCallback(async () => {
    if (!groupOrder) return;

    try {
      await groupOrdersAPI.cancel(groupOrder.code);
      leaveGroupRoom(groupOrder.code);
      setGroupOrder(null);
      setSplits([]);
      toast.success('Group order cancelled');
    } catch (error) {
      toast.error(error.message || 'Failed to cancel order');
      throw error;
    }
  }, [groupOrder]);

  // Clear group order state
  const clearGroupOrder = useCallback(() => {
    if (groupOrder) {
      leaveGroupRoom(groupOrder.code);
    }
    setGroupOrder(null);
    setSplits([]);
  }, [groupOrder]);

  // Get current participant
  const getCurrentParticipant = useCallback(() => {
    if (!groupOrder) return null;

    const sessionId = getSessionId();
    return groupOrder.participants.find(p =>
      (user && p.user === user._id) ||
      (!user && p.sessionId === sessionId)
    );
  }, [groupOrder, user]);

  // Check if current user is host
  const isHost = useCallback(() => {
    if (!groupOrder || !user) return false;
    return groupOrder.host._id === user._id || groupOrder.host === user._id;
  }, [groupOrder, user]);

  const value = {
    groupOrder,
    loading,
    splits,
    createGroupOrder,
    joinGroup,
    leaveGroup,
    fetchGroupOrder,
    addItem,
    updateItem,
    removeItem,
    toggleReady,
    lockOrder,
    unlockOrder,
    setSplitType,
    fetchSplits,
    checkout,
    cancelOrder,
    clearGroupOrder,
    getCurrentParticipant,
    isHost,
  };

  return (
    <GroupOrderContext.Provider value={value}>
      {children}
    </GroupOrderContext.Provider>
  );
};

export default GroupOrderContext;
