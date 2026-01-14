/**
 * Checkout Page
 *
 * Final step before order is placed.
 * Collects:
 * - Delivery/Pickup selection
 * - Delivery address (if delivery)
 * - Payment method
 * - Coupon code
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTruck, FaStore, FaTag } from 'react-icons/fa';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Checkout.css';

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState('delivery');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // Backend enum: cash, card, online
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(null);
  const [loading, setLoading] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  // Delivery address - pre-filled from user profile
  const [address, setAddress] = useState({
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    zipCode: user?.address?.zipCode || ''
  });

  // Calculate totals
  const subtotal = cart?.subtotal || 0;
  const deliveryFee = orderType === 'delivery' && subtotal < 500 ? 50 : 0;
  const discount = couponApplied?.discount || 0;
  const total = subtotal + deliveryFee - discount;

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Enter a coupon code');
      return;
    }

    try {
      setApplyingCoupon(true);
      const response = await api.post('/coupons/validate', {
        code: couponCode,
        subtotal
      });

      if (response.data?.valid) {
        setCouponApplied({
          code: couponCode.toUpperCase(),
          discount: response.data.discount
        });
        toast.success(`Coupon applied! You save ₹${response.data.discount}`);
      } else {
        toast.error(response.data?.message || 'Invalid coupon');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to apply coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  // Remove coupon
  const handleRemoveCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
  };

  // Place order
  const handlePlaceOrder = async () => {
    // Validation
    if (orderType === 'delivery') {
      if (!address.street || !address.city || !address.state || !address.zipCode) {
        toast.error('Please fill in complete delivery address');
        return;
      }
    }

    try {
      setLoading(true);

      const orderData = {
        type: orderType,
        paymentMethod,
        couponCode: couponApplied?.code,
        deliveryAddress: orderType === 'delivery' ? address : undefined,
        customerInfo: {
          name: user.name,
          phone: user.phone,
          email: user.email
        }
      };

      const response = await api.post('/orders', orderData);

      // Clear cart after successful order
      await clearCart();

      toast.success('Order placed successfully!');

      // Redirect to order confirmation
      navigate(`/orders/${response.data.order._id}`);
    } catch (error) {
      toast.error(error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  // Redirect if cart is empty
  if (!cart || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <h1>Checkout</h1>

        <div className="checkout-layout">
          {/* Left Column - Forms */}
          <div className="checkout-forms">
            {/* Order Type */}
            <div className="checkout-section">
              <h2>Order Type</h2>
              <div className="order-type-options">
                <button
                  className={`type-option ${orderType === 'delivery' ? 'active' : ''}`}
                  onClick={() => setOrderType('delivery')}
                >
                  <FaTruck />
                  <span>Delivery</span>
                </button>
                <button
                  className={`type-option ${orderType === 'carryout' ? 'active' : ''}`}
                  onClick={() => setOrderType('carryout')}
                >
                  <FaStore />
                  <span>Pickup</span>
                </button>
              </div>
            </div>

            {/* Delivery Address */}
            {orderType === 'delivery' && (
              <div className="checkout-section">
                <h2>Delivery Address</h2>
                <div className="address-form">
                  <div className="form-group">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={address.street}
                      onChange={(e) => setAddress({ ...address, street: e.target.value })}
                      placeholder="123 Main Street, Apt 4B"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="Mumbai"
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        value={address.state}
                        onChange={(e) => setAddress({ ...address, state: e.target.value })}
                        placeholder="Maharashtra"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      value={address.zipCode}
                      onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                      placeholder="400001"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Payment Method */}
            <div className="checkout-section">
              <h2>Payment Method</h2>
              <div className="payment-options">
                <label className={`payment-option ${paymentMethod === 'cash' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={paymentMethod === 'cash'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Cash on Delivery</span>
                </label>
                <label className={`payment-option ${paymentMethod === 'card' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>Card Payment</span>
                </label>
                <label className={`payment-option ${paymentMethod === 'online' ? 'active' : ''}`}>
                  <input
                    type="radio"
                    name="payment"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  />
                  <span>UPI / Online</span>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="order-summary-section">
            <div className="order-summary">
              <h2>Order Summary</h2>

              {/* Cart Items */}
              <div className="summary-items">
                {cart.items.map((item) => (
                  <div key={item._id} className="summary-item">
                    <span className="item-name">
                      {item.product.name} ({item.size}) x {item.quantity}
                    </span>
                    <span className="item-price">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="coupon-section">
                {couponApplied ? (
                  <div className="coupon-applied">
                    <FaTag />
                    <span>{couponApplied.code}</span>
                    <button onClick={handleRemoveCoupon}>Remove</button>
                  </div>
                ) : (
                  <div className="coupon-input">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="Enter coupon code"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={applyingCoupon}
                    >
                      {applyingCoupon ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="summary-row">
                  <span>Delivery</span>
                  <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
                </div>
                {discount > 0 && (
                  <div className="summary-row discount">
                    <span>Discount</span>
                    <span>-₹{discount}</span>
                  </div>
                )}
                <div className="summary-row total">
                  <span>Total</span>
                  <span>₹{total}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                className="btn btn-primary btn-block place-order-btn"
                onClick={handlePlaceOrder}
                disabled={loading}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
