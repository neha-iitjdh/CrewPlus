/**
 * Admin Products Page
 *
 * Manage all products:
 * - View product list
 * - Add new products
 * - Edit existing products
 * - Toggle availability
 * - Delete products
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEdit, FaTrash, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import api from '../../services/api';
import toast from 'react-hot-toast';
import './AdminProducts.css';

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'pizza',
    price: '',
    image: '',
    isVegetarian: true,
    isAvailable: true
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Use admin endpoint to get ALL products including unavailable
      const response = await api.get('/products/admin/all');
      setProducts(response.data?.products || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Filter products by category
  const filteredProducts = categoryFilter === 'all'
    ? products
    : products.filter(p => p.category === categoryFilter);

  // Open modal for new product
  const handleAddNew = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      category: 'pizza',
      price: '',
      image: '',
      isVegetarian: true,
      isAvailable: true
    });
    setShowModal(true);
  };

  // Open modal for editing
  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category: product.category,
      price: product.price,
      image: product.image || '',
      isVegetarian: product.isVegetarian,
      isAvailable: product.isAvailable
    });
    setShowModal(true);
  };

  // Save product (create or update)
  const handleSave = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      toast.error('Name and price are required');
      return;
    }

    try {
      setSaving(true);

      const productData = {
        ...formData,
        price: Number(formData.price)
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, productData);
        toast.success('Product updated');
      } else {
        await api.post('/products', productData);
        toast.success('Product created');
      }

      setShowModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  // Toggle availability
  const toggleAvailability = async (product) => {
    try {
      await api.put(`/products/${product._id}`, {
        isAvailable: !product.isAvailable
      });
      toast.success(`${product.name} is now ${!product.isAvailable ? 'available' : 'unavailable'}`);
      fetchProducts();
    } catch (error) {
      toast.error('Failed to update availability');
    }
  };

  // Delete product
  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await api.delete(`/products/${product._id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₹${amount?.toFixed(0) || 0}`;
  };

  const categories = [
    { value: 'all', label: 'All Products' },
    { value: 'pizza', label: 'Pizzas' },
    { value: 'drink', label: 'Drinks' },
    { value: 'bread', label: 'Breads' }
  ];

  return (
    <div className="admin-products">
      <div className="admin-container">
        <div className="page-header">
          <h1>Manage Products</h1>
          <div className="header-actions">
            <Link to="/admin" className="back-link">← Back to Dashboard</Link>
            <button className="btn btn-primary add-btn" onClick={handleAddNew}>
              <FaPlus /> Add Product
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="filters">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`filter-btn ${categoryFilter === cat.value ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat.value)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="loading">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-products">No products found</div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product._id} className={`product-card ${!product.isAvailable ? 'unavailable' : ''}`}>
                <div className="product-image">
                  {product.image ? (
                    <img src={product.image} alt={product.name} />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                  <span className={`veg-badge ${product.isVegetarian ? 'veg' : 'non-veg'}`}>
                    {product.isVegetarian ? 'VEG' : 'NON-VEG'}
                  </span>
                </div>
                <div className="product-info">
                  <h3>{product.name}</h3>
                  <p className="category">{product.category}</p>
                  <p className="price">{formatCurrency(product.price)}</p>
                  <p className={`availability ${product.isAvailable ? 'available' : 'not-available'}`}>
                    {product.isAvailable ? 'Available' : 'Unavailable'}
                  </p>
                </div>
                <div className="product-actions">
                  <button
                    className="action-btn toggle"
                    onClick={() => toggleAvailability(product)}
                    title={product.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                  >
                    {product.isAvailable ? <FaToggleOn /> : <FaToggleOff />}
                  </button>
                  <button
                    className="action-btn edit"
                    onClick={() => handleEdit(product)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(product)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Margherita Pizza"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Classic cheese pizza with fresh basil"
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="pizza">Pizza</option>
                      <option value="drink">Drink</option>
                      <option value="bread">Bread</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Price (₹) *</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="199"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Image URL</label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="https://example.com/pizza.jpg"
                  />
                </div>

                <div className="form-row checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isVegetarian}
                      onChange={(e) => setFormData({ ...formData, isVegetarian: e.target.checked })}
                    />
                    <span>Vegetarian</span>
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    />
                    <span>Available</span>
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : (editingProduct ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;
