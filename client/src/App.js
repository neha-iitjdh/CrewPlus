/**
 * App.js - Root Component
 *
 * This is where we:
 * 1. Set up providers (Auth, Cart) that wrap the entire app
 * 2. Configure routes with React Router
 * 3. Add global components (Layout, Toaster)
 *
 * Component Tree:
 * <AuthProvider>
 *   <CartProvider>
 *     <Router>
 *       <Layout>
 *         <Routes... />
 *       </Layout>
 *     </Router>
 *   </CartProvider>
 * </AuthProvider>
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Context Providers
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

// Layout & Common
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Menu from './pages/Menu';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminProducts from './pages/admin/AdminProducts';

// Global Styles
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#333',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#4caf50',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#e63946',
                  secondary: '#fff',
                },
              },
            }}
          />

          {/* Main Layout with Navbar & Footer */}
          <Layout>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes - Require Login */}
              <Route path="/checkout" element={
                <ProtectedRoute><Checkout /></ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute><Orders /></ProtectedRoute>
              } />
              <Route path="/orders/:id" element={
                <ProtectedRoute><OrderDetail /></ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute><Profile /></ProtectedRoute>
              } />

              {/* Admin Routes - Require Admin Role */}
              <Route path="/admin" element={
                <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute adminOnly><AdminOrders /></ProtectedRoute>
              } />
              <Route path="/admin/products" element={
                <ProtectedRoute adminOnly><AdminProducts /></ProtectedRoute>
              } />

              {/* 404 - Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

/**
 * Simple 404 Page
 */
const NotFound = () => (
  <div style={{
    textAlign: 'center',
    padding: '80px 20px',
    minHeight: 'calc(100vh - 200px)'
  }}>
    <h1 style={{ fontSize: '4rem', color: '#e63946' }}>404</h1>
    <p style={{ fontSize: '1.2rem', color: '#666' }}>Page not found</p>
  </div>
);

export default App;
