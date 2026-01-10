/**
 * Footer Component
 *
 * Site footer with links and info.
 * Stays at bottom of page.
 */
import { Link } from 'react-router-dom';
import { FaPizzaSlice, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Brand Section */}
        <div className="footer-section">
          <div className="footer-brand">
            <FaPizzaSlice className="footer-icon" />
            <span>CrewPlus</span>
          </div>
          <p className="footer-tagline">
            Delicious pizzas delivered hot and fresh to your doorstep.
          </p>
        </div>

        {/* Quick Links */}
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/menu">Menu</Link></li>
            <li><Link to="/cart">Cart</Link></li>
            <li><Link to="/orders">My Orders</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </ul>
        </div>

        {/* Contact Info */}
        <div className="footer-section">
          <h4>Contact Us</h4>
          <ul className="contact-list">
            <li>
              <FaPhone />
              <span>+91 99999 99999</span>
            </li>
            <li>
              <FaEnvelope />
              <span>order@crewplus.com</span>
            </li>
            <li>
              <FaMapMarkerAlt />
              <span>Jodhpur, Rajasthan</span>
            </li>
          </ul>
        </div>

        {/* Hours */}
        <div className="footer-section">
          <h4>Hours</h4>
          <p>Monday - Sunday</p>
          <p className="hours">11:00 AM - 11:00 PM</p>
        </div>
      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} CrewPlus. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
