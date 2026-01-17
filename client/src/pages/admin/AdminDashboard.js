/**
 * Admin Dashboard
 *
 * Main admin page with:
 * - Quick stats (orders, revenue)
 * - Navigation to manage orders/products
 * - Recent orders list
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaShoppingBag, FaRupeeSign, FaBoxes, FaUsers } from 'react-icons/fa';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch analytics and recent orders in parallel
      const [analyticsRes, ordersRes] = await Promise.all([
        api.get('/orders/admin/analytics'),
        api.get('/orders?limit=5')
      ]);

      // API returns { analytics: {...} }
      setStats(analyticsRes.data?.analytics || analyticsRes.data);
      setRecentOrders(ordersRes.data?.orders || []);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        <h1>Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon orders">
              <FaShoppingBag />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats?.totalOrders || 0}</span>
              <span className="stat-label">Total Orders</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon revenue">
              <FaRupeeSign />
            </div>
            <div className="stat-info">
              <span className="stat-value">{formatCurrency(stats?.totalRevenue)}</span>
              <span className="stat-label">Total Revenue</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <FaBoxes />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats?.pendingOrders || 0}</span>
              <span className="stat-label">Pending Orders</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon today">
              <FaUsers />
            </div>
            <div className="stat-info">
              <span className="stat-value">{stats?.todayOrders || 0}</span>
              <span className="stat-label">Today's Orders</span>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="quick-links">
          <Link to="/admin/orders" className="quick-link">
            <FaShoppingBag />
            <span>Manage Orders</span>
          </Link>
          <Link to="/admin/products" className="quick-link">
            <FaBoxes />
            <span>Manage Products</span>
          </Link>
        </div>

        {/* Recent Orders */}
        <div className="recent-orders">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <Link to="/admin/orders">View All</Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="no-data">No orders yet</p>
          ) : (
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id}>
                    <td>
                      <Link to={`/admin/orders/${order._id}`}>
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td>{order.customerInfo?.name || 'Guest'}</td>
                    <td>
                      <span className={`status-badge status-${order.status}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>{formatCurrency(order.total)}</td>
                    <td>{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
