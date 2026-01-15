/**
 * Order Detail Page
 *
 * Shows full details of a single order:
 * - Order status with timeline
 * - Items ordered
 * - Delivery address
 * - Payment info
 */
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaClock, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import './OrderDetail.css';

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data?.order);
    } catch (error) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Order status steps
  const statusSteps = [
    { key: 'pending', label: 'Pending' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready' },
    { key: 'out_for_delivery', label: 'Out for Delivery' },
    { key: 'delivered', label: 'Delivered' }
  ];

  // Get current step index
  const getCurrentStep = () => {
    if (order?.status === 'cancelled') return -1;
    return statusSteps.findIndex(s => s.key === order?.status);
  };

  if (loading) {
    return (
      <div className="order-detail-page">
        <div className="loading">Loading order...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="not-found">Order not found</div>
      </div>
    );
  }

  const currentStep = getCurrentStep();

  return (
    <div className="order-detail-page">
      <div className="order-detail-container">
        {/* Back Link */}
        <Link to="/orders" className="back-link">
          <FaArrowLeft /> Back to Orders
        </Link>

        {/* Order Header */}
        <div className="order-detail-header">
          <div>
            <h1>Order {order.orderNumber}</h1>
            <p className="order-date">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <div className={`order-status-badge status-${order.status}`}>
            {order.status.replace('_', ' ')}
          </div>
        </div>

        {/* Status Timeline */}
        {order.status !== 'cancelled' && (
          <div className="status-timeline">
            {statusSteps.map((step, index) => (
              <div
                key={step.key}
                className={`timeline-step ${index <= currentStep ? 'completed' : ''} ${index === currentStep ? 'current' : ''}`}
              >
                <div className="step-icon">
                  {index <= currentStep ? <FaCheckCircle /> : <FaClock />}
                </div>
                <span className="step-label">{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="cancelled-notice">
            This order has been cancelled.
          </div>
        )}

        <div className="order-detail-content">
          {/* Items */}
          <div className="detail-section">
            <h2>Order Items</h2>
            <div className="order-items-list">
              {order.items.map((item, idx) => (
                <div key={idx} className="order-item-row">
                  <div className="item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-size">Size: {item.size}</span>
                  </div>
                  <div className="item-qty">x {item.quantity}</div>
                  <div className="item-price">₹{item.price * item.quantity}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Info */}
          {order.type === 'delivery' && order.deliveryAddress && (
            <div className="detail-section">
              <h2>Delivery Address</h2>
              <div className="address-info">
                <FaMapMarkerAlt />
                <div>
                  <p>{order.deliveryAddress.street}</p>
                  <p>{order.deliveryAddress.city}, {order.deliveryAddress.state}</p>
                  <p>{order.deliveryAddress.zipCode}</p>
                </div>
              </div>
            </div>
          )}

          {/* Contact Info */}
          {order.customerInfo && (
            <div className="detail-section">
              <h2>Contact Info</h2>
              <div className="contact-info">
                <p><strong>{order.customerInfo.name}</strong></p>
                <p><FaPhone /> {order.customerInfo.phone}</p>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="detail-section">
            <h2>Payment Summary</h2>
            <div className="payment-summary">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>₹{order.subtotal}</span>
              </div>
              <div className="summary-row">
                <span>Delivery Fee</span>
                <span>{order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee}`}</span>
              </div>
              {order.discount > 0 && (
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{order.total}</span>
              </div>
              <div className="payment-method">
                <span>Payment Method:</span>
                <span className="method">{order.paymentMethod?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
