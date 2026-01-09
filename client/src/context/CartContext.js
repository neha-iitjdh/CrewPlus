/**
 * Cart Context
 *
 * Manages shopping cart state.
 *
 * Supports both:
 * - Guest users (cart stored with sessionId)
 * - Logged-in users (cart tied to user account)
 *
 * When guest logs in, carts are merged automatically by backend.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

/**
 * Generate or get session ID for guest cart
 *
 * Stored in localStorage so cart persists across page refresh.
 */
const getSessionId = () => {
  let sessionId = localStorage.getItem('sessionId');

  if (!sessionId) {
    // Generate UUID-like ID (timestamp + random)
    sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', sessionId);
  }

  return sessionId;
};

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itemCount, setItemCount] = useState(0);

  /**
   * Fetch cart from backend
   *
   * Called on mount and when auth state changes.
   * Backend knows who we are from token or sessionId header.
   */
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);

      // Ensure session ID exists for guests
      if (!isAuthenticated) {
        getSessionId();
      }

      const response = await api.get('/cart');
      // API returns { success, data: { cart } } - axios interceptor gives us { cart }
      const cartData = response.data?.cart || response.data;
      setCart(cartData);
      setItemCount(cartData?.items?.length || 0);
    } catch (error) {
      // Cart might not exist yet - that's okay
      setCart(null);
      setItemCount(0);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch cart on mount and when user changes
  useEffect(() => {
    fetchCart();
  }, [fetchCart, user]);

  /**
   * Add item to cart
   *
   * POST /api/cart/items
   */
  const addToCart = async (productId, quantity = 1, size = 'medium', customizations = [], notes = '') => {
    const response = await api.post('/cart/items', {
      productId,
      quantity,
      size,
      customizations,
      notes
    });

    const cartData = response.data?.cart || response.data;
    setCart(cartData);
    setItemCount(cartData?.items?.length || 0);

    return response;
  };

  /**
   * Update item quantity
   *
   * PUT /api/cart/items/:itemId
   */
  const updateQuantity = async (itemId, quantity) => {
    const response = await api.put(`/cart/items/${itemId}`, { quantity });

    const cartData = response.data?.cart || response.data;
    setCart(cartData);
    setItemCount(cartData?.items?.length || 0);

    return response;
  };

  /**
   * Remove item from cart
   *
   * DELETE /api/cart/items/:itemId
   */
  const removeFromCart = async (itemId) => {
    const response = await api.delete(`/cart/items/${itemId}`);

    const cartData = response.data?.cart || response.data;
    setCart(cartData);
    setItemCount(cartData?.items?.length || 0);

    return response;
  };

  /**
   * Clear entire cart
   *
   * DELETE /api/cart
   */
  const clearCart = async () => {
    await api.delete('/cart');
    setCart(null);
    setItemCount(0);
  };

  /**
   * Merge guest cart with user cart after login
   *
   * POST /api/cart/merge
   */
  const mergeCart = async () => {
    const sessionId = localStorage.getItem('sessionId');

    if (sessionId && isAuthenticated) {
      try {
        const response = await api.post('/cart/merge', { sessionId });
        const cartData = response.data?.cart || response.data;
        setCart(cartData);
        setItemCount(cartData?.items?.length || 0);
      } catch (error) {
        // Merge failed - just fetch current cart
        await fetchCart();
      }
    }
  };

  // Calculate totals
  const subtotal = cart?.subtotal || 0;
  const total = cart?.total || 0;

  const value = {
    cart,
    loading,
    itemCount,
    subtotal,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    mergeCart,
    refreshCart: fetchCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

/**
 * Custom Hook: useCart
 */
export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }

  return context;
};

export default CartContext;
