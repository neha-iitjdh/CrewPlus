/**
 * Menu Page
 *
 * Displays all products with filtering by category.
 *
 * Features:
 * - Category tabs (All, Pizza, Drinks, Breads)
 * - Product grid
 * - Add to cart functionality
 */
import { useState, useEffect } from 'react';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/products/ProductCard';
import toast from 'react-hot-toast';
import './Menu.css';

const Menu = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');

  const { addToCart } = useCart();

  // Categories for filter tabs
  const categories = [
    { id: 'all', name: 'All' },
    { id: 'pizza', name: 'Pizzas' },
    { id: 'drink', name: 'Drinks' },
    { id: 'bread', name: 'Breads' }
  ];

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Use /products endpoint which returns flat array
      const response = await api.get('/products');
      // API returns { success, data: { products, pagination } }
      setProducts(response.data?.products || []);
    } catch (error) {
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter products by category
  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory);

  // Handle add to cart
  const handleAddToCart = async (productId, quantity, size) => {
    try {
      setAddingId(productId);
      await addToCart(productId, quantity, size);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error(error.message || 'Failed to add to cart');
    } finally {
      setAddingId(null);
    }
  };

  if (loading) {
    return (
      <div className="menu-page">
        <div className="loading">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="menu-page">
      <div className="menu-container">
        {/* Header */}
        <div className="menu-header">
          <h1>Our Menu</h1>
          <p>Fresh ingredients, amazing taste</p>
        </div>

        {/* Category Tabs */}
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="no-products">
              No products found in this category.
            </div>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onAddToCart={handleAddToCart}
                loading={addingId === product._id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Menu;
