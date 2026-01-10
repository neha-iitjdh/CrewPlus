/**
 * Layout Component
 *
 * Wrapper that provides consistent structure:
 * - Navbar at top
 * - Main content (children)
 * - Footer at bottom
 *
 * Uses CSS flexbox trick to keep footer at bottom
 * even when content is short.
 */
import Navbar from './Navbar';
import Footer from './Footer';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
