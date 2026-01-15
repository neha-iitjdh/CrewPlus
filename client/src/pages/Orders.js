/**
 * Orders Page
 *
 * Shows user's order history.
 * Can click on an order to see details.
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaBox, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import api from '../services/api';
import toast from 'react-hot-toast';
import './Orders.css';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Backend route is /orders/my-orders
      const response = await api.get('/orders/my-orders');
      setOrders(response.data?.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Status badge color
  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      confirmed: '#2196f3',
      preparing: '#9c27b0',
      ready: '#4caf50',
      out_for_delivery: '#00bcd4',
      delivered: '#4caf50',
      cancelled: '#f44336'
    };
    return colors[status] || '#999';
  };

  // Status icon
  const getStatusIcon = (status) => {
    if (status === 'delivered') return <FaCheckCircle />;
    if (status === 'cancelled') return <FaTimesCircle />;
    return <FaClock />;
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="orders-page">
        <div className="loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="orders-container">
        <h1>My Orders</h1>

        {orders.length === 0 ? (
          <div className="no-orders">
            <FaBox className="no-orders-icon" />
            <h2>No orders yet</h2>
            <p>Start ordering delicious pizzas!</p>
            <Link to="/menu" className="btn btn-primary">
              Browse Menu
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              <Link
                key={order._id}
                to={`/orders/${order._id}`}
                className="order-card"
              >
                <div className="order-header">
                  <div className="order-number">
                    <span className="label">Order</span>
                    <span className="value">{order.orderNumber}</span>
                  </div>
                  <div
                    className="order-status"
                    style={{ background: getStatusColor(order.status) }}
                  >
                    {getStatusIcon(order.status)}
                    <span>{order.status.replace('_', ' ')}</span>
                  </div>
                </div>

                <div className="order-items">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <span key={idx} className="order-item">
                      {item.name} x {item.quantity}
                    </span>
                  ))}
                  {order.items.length > 3 && (
                    <span className="more-items">
                      +{order.items.length - 3} more
                    </span>
                  )}
                </div>

                <div className="order-footer">
                  <span className="order-date">{formatDate(order.createdAt)}</span>
                  <span className="order-total">₹{order.total}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
