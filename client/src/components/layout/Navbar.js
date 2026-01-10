/**
 * Navbar Component
 *
 * Top navigation bar present on all pages.
 *
 * Features:
 * - Logo/brand link to home
 * - Navigation links (Menu, Cart)
 * - Auth buttons (Login/Register or User menu)
 * - Cart icon with item count badge
 */
import { Link, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSignOutAlt, FaPizzaSlice } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <FaPizzaSlice className="brand-icon" />
          <span>CrewPlus</span>
        </Link>

        {/* Navigation Links */}
        <div className="navbar-links">
          <Link to="/menu" className="nav-link">Menu</Link>

          {/* Cart with badge */}
          <Link to="/cart" className="nav-link cart-link">
            <FaShoppingCart />
            {itemCount > 0 && (
              <span className="cart-badge">{itemCount}</span>
            )}
          </Link>

          {/* Auth Section */}
          {isAuthenticated ? (
            <div className="user-menu">
              <Link to="/orders" className="nav-link">My Orders</Link>

              {isAdmin && (
                <Link to="/admin" className="nav-link admin-link">Admin</Link>
              )}

              <div className="user-dropdown">
                <button className="user-btn">
                  <FaUser />
                  <span>{user?.name?.split(' ')[0]}</span>
                </button>
                <div className="dropdown-content">
                  <Link to="/profile">Profile</Link>
                  <button onClick={handleLogout}>
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign Up</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
