/**
 * Home Page
 *
 * Landing page with:
 * - Hero section with CTA
 * - Featured products
 * - About section
 */
import { Link } from 'react-router-dom';
import { FaClock, FaTruck, FaStar } from 'react-icons/fa';
import './Home.css';

const Home = () => {
  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Delicious Pizza, <br />Delivered Hot</h1>
          <p>
            Handcrafted pizzas made with fresh ingredients,
            delivered right to your doorstep in 30 minutes or less.
          </p>
          <div className="hero-buttons">
            <Link to="/menu" className="btn btn-primary btn-lg">
              Order Now
            </Link>
            <Link to="/menu" className="btn btn-outline btn-lg">
              View Menu
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img
            src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600"
            alt="Delicious Pizza"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="feature">
          <FaClock className="feature-icon" />
          <h3>Fast Delivery</h3>
          <p>30 minutes or it's free</p>
        </div>
        <div className="feature">
          <FaStar className="feature-icon" />
          <h3>Best Quality</h3>
          <p>Fresh ingredients only</p>
        </div>
        <div className="feature">
          <FaTruck className="feature-icon" />
          <h3>Free Delivery</h3>
          <p>On orders over 500</p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>First Order? Get 50% Off!</h2>
          <p>Use code <strong>WELCOME50</strong> at checkout</p>
          <Link to="/menu" className="btn btn-primary btn-lg">
            Claim Offer
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
