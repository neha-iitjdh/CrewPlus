/**
 * ProductCard Component
 *
 * Displays a single product with:
 * - Image
 * - Name, description, price
 * - Size selector
 * - Add to cart button
 *
 * This is a "presentational" component - it receives data via props
 * and calls functions passed from parent.
 */
import { useState } from 'react';
import { FaShoppingCart, FaFire, FaLeaf } from 'react-icons/fa';
import './ProductCard.css';

const ProductCard = ({ product, onAddToCart, loading }) => {
  const [selectedSize, setSelectedSize] = useState('medium');
  const [quantity, setQuantity] = useState(1);

  // Get price for selected size
  // Only use size prices for pizza category, others use base price
  const getPrice = () => {
    if (product.category === 'pizza' && product.sizes && product.sizes[selectedSize] && product.sizes[selectedSize].price > 0) {
      return product.sizes[selectedSize].price;
    }
    return product.price || 0;
  };

  // Available sizes for this product
  const availableSizes = product.sizes
    ? Object.entries(product.sizes)
        .filter(([_, data]) => data.available)
        .map(([size]) => size)
    : [];

  const handleAddToCart = () => {
    onAddToCart(product._id, quantity, selectedSize);
  };

  return (
    <div className="product-card">
      {/* Image */}
      <div className="product-image">
        <img src={product.image} alt={product.name} />

        {/* Tags */}
        <div className="product-tags">
          {product.isVegetarian && (
            <span className="tag tag-veg">
              <FaLeaf /> Veg
            </span>
          )}
          {product.isSpicy && (
            <span className="tag tag-spicy">
              <FaFire /> Spicy
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-description">{product.description}</p>

        {/* Rating */}
        {product.rating && (
          <div className="product-rating">
            <span className="stars">{'★'.repeat(Math.floor(product.rating.average))}</span>
            <span className="rating-text">
              {product.rating.average} ({product.rating.count})
            </span>
          </div>
        )}

        {/* Size Selector */}
        {availableSizes.length > 0 && (
          <div className="size-selector">
            {availableSizes.map((size) => (
              <button
                key={size}
                className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                onClick={() => setSelectedSize(size)}
              >
                {size.charAt(0).toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {/* Price & Add to Cart */}
        <div className="product-footer">
          <div className="product-price">
            <span className="price-label">Price</span>
            <span className="price-value">₹{getPrice()}</span>
          </div>

          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={loading || !product.isAvailable}
          >
            <FaShoppingCart />
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
