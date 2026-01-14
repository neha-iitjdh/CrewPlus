/**
 * Cart Page
 *
 * Shows cart items with:
 * - Item list with quantity controls
 * - Order summary
 * - Coupon input
 * - Checkout button
 */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaMinus, FaPlus, FaShoppingBag } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Cart.css';

const Cart = () => {
  const { cart, loading, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [updatingId, setUpdatingId] = useState(null);

  // Handle quantity change
  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdatingId(itemId);
      await updateQuantity(itemId, newQuantity);
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle remove item
  const handleRemove = async (itemId) => {
    try {
      setUpdatingId(itemId);
      await removeFromCart(itemId);
      toast.success('Item removed');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle checkout
  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast('Please login to checkout', { icon: '👤' });
      navigate('/login', { state: { from: { pathname: '/checkout' } } });
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return (
      <div className="cart-page">
        <div className="loading">Loading cart...</div>
      </div>
    );
  }

  // Empty cart - use optional chaining to safely check items
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="empty-cart">
          <FaShoppingBag className="empty-icon" />
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>
          <Link to="/menu" className="btn btn-primary">
            Browse Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-container">
        <h1>Your Cart</h1>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            {cart.items.map((item) => (
              <div key={item._id} className="cart-item">
                <img
                  src={item.product.image}
                  alt={item.product.name}
                  className="item-image"
                />

                <div className="item-details">
                  <h3>{item.product.name}</h3>
                  <p className="item-size">Size: {item.size}</p>
                  <p className="item-price">₹{item.price}</p>
                </div>

                <div className="item-actions">
                  {/* Quantity Controls */}
                  <div className="quantity-controls">
                    <button
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                      disabled={updatingId === item._id || item.quantity <= 1}
                    >
                      <FaMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                      disabled={updatingId === item._id}
                    >
                      <FaPlus />
                    </button>
                  </div>

                  {/* Subtotal */}
                  <div className="item-subtotal">
                    ₹{item.price * item.quantity}
                  </div>

                  {/* Remove Button */}
                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item._id)}
                    disabled={updatingId === item._id}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{cart.subtotal}</span>
            </div>

            <div className="summary-row">
              <span>Delivery</span>
              <span>{cart.subtotal >= 500 ? 'FREE' : '₹50'}</span>
            </div>

            <div className="summary-row total">
              <span>Total</span>
              <span>₹{cart.total}</span>
            </div>

            <button
              className="btn btn-primary btn-block checkout-btn"
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>

            <Link to="/menu" className="continue-shopping">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
