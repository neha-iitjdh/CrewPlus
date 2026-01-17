/**
 * Admin Orders Page
 *
 * Manage all orders:
 * - View order list with filters
 * - Update order status
 * - View order details
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaCheck, FaTimes } from 'react-icons/fa';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = filter !== 'all' ? `?status=${filter}` : '';
      const response = await api.get(`/orders${params}`);
      setOrders(response.data?.orders || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Update order status
  const updateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await api.put(`/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setUpdatingId(null);
    }
  };

  // Get next status options
  const getNextStatuses = (currentStatus) => {
    const flow = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['out_for_delivery', 'delivered'],
      out_for_delivery: ['delivered'],
      delivered: [],
      cancelled: []
    };
    return flow[currentStatus] || [];
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

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount?.toFixed(0) || 0}`;
  };

  const statusFilters = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'ready', label: 'Ready' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  return (
    <div className="admin-orders">
      <div className="admin-container">
        <div className="page-header">
          <h1>Manage Orders</h1>
          <Link to="/admin" className="back-link">← Back to Dashboard</Link>
        </div>

        {/* Filters */}
        <div className="filters">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              className={`filter-btn ${filter === f.value ? 'active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="loading">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="no-orders">No orders found</div>
        ) : (
          <div className="orders-table-container">
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td className="order-number">{order.orderNumber}</td>
                    <td>
                      <div className="customer-info">
                        <span className="customer-name">{order.customerInfo?.name}</span>
                        <span className="customer-phone">{order.customerInfo?.phone}</span>
                      </div>
                    </td>
                    <td>{order.items?.length || 0} items</td>
                    <td className="order-total">{formatCurrency(order.total)}</td>
                    <td className="order-type">{order.type}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="order-date">{formatDate(order.createdAt)}</td>
                    <td>
                      <div className="actions">
                        <Link to={`/orders/${order._id}`} className="action-btn view">
                          <FaEye />
                        </Link>
                        {getNextStatuses(order.status).map((status) => (
                          <button
                            key={status}
                            className={`action-btn ${status === 'cancelled' ? 'cancel' : 'approve'}`}
                            onClick={() => updateStatus(order._id, status)}
                            disabled={updatingId === order._id}
                            title={status.replace('_', ' ')}
                          >
                            {status === 'cancelled' ? <FaTimes /> : <FaCheck />}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
