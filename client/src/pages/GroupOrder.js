import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupOrder } from '../context/GroupOrderContext';
import { useAuth } from '../context/AuthContext';
import { productsAPI } from '../services/api';
import { FiUsers, FiShare2, FiLock, FiUnlock, FiCheck, FiX, FiPlus, FiMinus, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Loading from '../components/common/Loading';
import './GroupOrder.css';

const GroupOrder = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    groupOrder,
    loading,
    splits,
    fetchGroupOrder,
    joinGroup,
    leaveGroup,
    addItem,
    updateItem,
    removeItem,
    toggleReady,
    lockOrder,
    unlockOrder,
    setSplitType,
    fetchSplits,
    checkout,
    cancelOrder,
    getCurrentParticipant,
    isHost,
  } = useGroupOrder();

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState('medium');
  const [showProducts, setShowProducts] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    type: 'delivery',
    customerInfo: { name: '', email: '', phone: '' },
    deliveryAddress: { street: '', city: '', state: '', zipCode: '' },
    paymentMethod: 'cash',
    notes: ''
  });

  useEffect(() => {
    if (code) {
      loadGroupOrder();
    }
  }, [code]);

  useEffect(() => {
    if (groupOrder) {
      fetchSplits();
    }
  }, [groupOrder?.participants]);

  const loadGroupOrder = async () => {
    try {
      await fetchGroupOrder(code);
    } catch (error) {
      setShowJoinModal(true);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsAPI.getMenu();
      setProducts(response.data || []);
    } catch (error) {
      toast.error('Failed to load menu');
    }
  };

  const handleJoin = async () => {
    try {
      if (!user && !guestName.trim()) {
        toast.error('Please enter your name');
        return;
      }
      await joinGroup(code, guestName.trim() || null);
      setShowJoinModal(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedProduct) return;

    try {
      await addItem(selectedProduct._id, quantity, size, '', []);
      setSelectedProduct(null);
      setQuantity(1);
      setSize('medium');
      setShowProducts(false);
    } catch (error) {
      console.error(error);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    try {
      const result = await checkout(checkoutData);
      navigate(`/orders/${result.order._id}`);
    } catch (error) {
      console.error(error);
    }
  };

  const currentParticipant = getCurrentParticipant();
  const hostUser = isHost();

  if (loading && !groupOrder) {
    return <Loading />;
  }

  if (showJoinModal || !groupOrder) {
    return (
      <div className="group-order-page">
        <div className="join-modal">
          <h2>Join Group Order</h2>
          <p>Enter the group code: <strong>{code}</strong></p>
          {!user && (
            <input
              type="text"
              placeholder="Enter your name"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="guest-name-input"
            />
          )}
          <div className="join-actions">
            <button onClick={handleJoin} className="btn btn-primary">
              Join Group
            </button>
            <button onClick={() => navigate('/')} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group-order-page">
      <div className="group-header">
        <div className="group-info">
          <h1>{groupOrder.name}</h1>
          <div className="group-code">
            <span>Code: <strong>{groupOrder.code}</strong></span>
            <button onClick={handleShare} className="btn-icon" title="Share link">
              <FiShare2 />
            </button>
          </div>
          <div className="group-meta">
            <span className={`status-badge status-${groupOrder.status}`}>
              {groupOrder.status}
            </span>
            <span><FiUsers /> {groupOrder.participants.length}/{groupOrder.maxParticipants}</span>
          </div>
        </div>

        {hostUser && groupOrder.status !== 'ordered' && (
          <div className="host-controls">
            {groupOrder.status === 'active' ? (
              <button onClick={lockOrder} className="btn btn-warning">
                <FiLock /> Lock Order
              </button>
            ) : groupOrder.status === 'locked' && (
              <button onClick={unlockOrder} className="btn btn-secondary">
                <FiUnlock /> Unlock
              </button>
            )}
            <button onClick={() => setShowCheckout(true)} className="btn btn-primary" disabled={groupOrder.status !== 'locked'}>
              <FiShoppingCart /> Checkout
            </button>
            <button onClick={cancelOrder} className="btn btn-danger">
              Cancel Order
            </button>
          </div>
        )}
      </div>

      <div className="group-content">
        <div className="participants-section">
          <h2>Participants</h2>
          <div className="participants-list">
            {groupOrder.participants.map((participant) => (
              <div key={participant._id} className={`participant-card ${participant.isHost ? 'host' : ''}`}>
                <div className="participant-header">
                  <span className="participant-name">
                    {participant.name}
                    {participant.isHost && <span className="host-badge">Host</span>}
                  </span>
                  <span className={`ready-status ${participant.isReady ? 'ready' : ''}`}>
                    {participant.isReady ? <FiCheck /> : <FiX />}
                  </span>
                </div>
                <div className="participant-items">
                  {participant.items.length === 0 ? (
                    <p className="no-items">No items yet</p>
                  ) : (
                    participant.items.map((item) => (
                      <div key={item._id} className="participant-item">
                        <span>{item.quantity}x {item.name} ({item.size})</span>
                        <span>${((item.price + item.customizationTotal) * item.quantity).toFixed(2)}</span>
                        {currentParticipant?._id === participant._id && groupOrder.status === 'active' && (
                          <div className="item-controls">
                            <button onClick={() => updateItem(item._id, item.quantity - 1)}>
                              <FiMinus />
                            </button>
                            <button onClick={() => updateItem(item._id, item.quantity + 1)}>
                              <FiPlus />
                            </button>
                            <button onClick={() => removeItem(item._id)}>
                              <FiTrash2 />
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
                <div className="participant-subtotal">
                  Subtotal: ${participant.subtotal.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="order-actions">
          {groupOrder.status === 'active' && currentParticipant && (
            <>
              <button onClick={() => { loadProducts(); setShowProducts(true); }} className="btn btn-primary btn-lg">
                <FiPlus /> Add Items
              </button>
              <button onClick={toggleReady} className={`btn ${currentParticipant.isReady ? 'btn-secondary' : 'btn-success'}`}>
                {currentParticipant.isReady ? 'Not Ready' : 'Ready'}
              </button>
            </>
          )}
          {!hostUser && (
            <button onClick={leaveGroup} className="btn btn-danger">
              Leave Group
            </button>
          )}
        </div>

        <div className="order-summary">
          <h2>Order Summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${groupOrder.subtotal.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Tax (10%)</span>
            <span>${groupOrder.tax.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${groupOrder.total.toFixed(2)}</span>
          </div>

          {hostUser && (
            <div className="split-options">
              <h3>Split Bill</h3>
              <div className="split-buttons">
                <button
                  onClick={() => setSplitType('equal')}
                  className={`btn ${groupOrder.splitType === 'equal' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  Split Equally
                </button>
                <button
                  onClick={() => setSplitType('by_item')}
                  className={`btn ${groupOrder.splitType === 'by_item' ? 'btn-primary' : 'btn-secondary'}`}
                >
                  By Items
                </button>
              </div>
            </div>
          )}

          {splits.length > 0 && (
            <div className="splits-breakdown">
              <h3>Each Person Pays</h3>
              {splits.map((split) => (
                <div key={split.participantId} className="split-row">
                  <span>{split.name}</span>
                  <span>${split.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showProducts && (
        <div className="modal-overlay" onClick={() => setShowProducts(false)}>
          <div className="modal-content product-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add Item</h2>
            <button className="close-btn" onClick={() => setShowProducts(false)}>&times;</button>

            <div className="products-grid">
              {products.map((category) => (
                <div key={category._id} className="category-section">
                  <h3>{category._id}</h3>
                  <div className="products-list">
                    {category.products.map((product) => (
                      <div
                        key={product._id}
                        className={`product-item ${selectedProduct?._id === product._id ? 'selected' : ''}`}
                        onClick={() => setSelectedProduct(product)}
                      >
                        <span>{product.name}</span>
                        <span>${product.price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {selectedProduct && (
              <div className="product-options">
                <h3>{selectedProduct.name}</h3>
                <div className="option-group">
                  <label>Size</label>
                  <select value={size} onChange={(e) => setSize(e.target.value)}>
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra_large">Extra Large</option>
                  </select>
                </div>
                <div className="option-group">
                  <label>Quantity</label>
                  <div className="quantity-control">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>-</button>
                    <span>{quantity}</span>
                    <button onClick={() => setQuantity(quantity + 1)}>+</button>
                  </div>
                </div>
                <button onClick={handleAddItem} className="btn btn-primary btn-lg">
                  Add to Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showCheckout && (
        <div className="modal-overlay" onClick={() => setShowCheckout(false)}>
          <div className="modal-content checkout-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Checkout</h2>
            <button className="close-btn" onClick={() => setShowCheckout(false)}>&times;</button>

            <form onSubmit={handleCheckout}>
              <div className="form-group">
                <label>Order Type</label>
                <select
                  value={checkoutData.type}
                  onChange={(e) => setCheckoutData({ ...checkoutData, type: e.target.value })}
                >
                  <option value="delivery">Delivery</option>
                  <option value="carryout">Carryout</option>
                </select>
              </div>

              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={checkoutData.customerInfo.name}
                  onChange={(e) => setCheckoutData({
                    ...checkoutData,
                    customerInfo: { ...checkoutData.customerInfo, name: e.target.value }
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={checkoutData.customerInfo.email}
                  onChange={(e) => setCheckoutData({
                    ...checkoutData,
                    customerInfo: { ...checkoutData.customerInfo, email: e.target.value }
                  })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  value={checkoutData.customerInfo.phone}
                  onChange={(e) => setCheckoutData({
                    ...checkoutData,
                    customerInfo: { ...checkoutData.customerInfo, phone: e.target.value }
                  })}
                  required
                />
              </div>

              {checkoutData.type === 'delivery' && (
                <>
                  <div className="form-group">
                    <label>Street Address</label>
                    <input
                      type="text"
                      value={checkoutData.deliveryAddress.street}
                      onChange={(e) => setCheckoutData({
                        ...checkoutData,
                        deliveryAddress: { ...checkoutData.deliveryAddress, street: e.target.value }
                      })}
                      required
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>City</label>
                      <input
                        type="text"
                        value={checkoutData.deliveryAddress.city}
                        onChange={(e) => setCheckoutData({
                          ...checkoutData,
                          deliveryAddress: { ...checkoutData.deliveryAddress, city: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>State</label>
                      <input
                        type="text"
                        value={checkoutData.deliveryAddress.state}
                        onChange={(e) => setCheckoutData({
                          ...checkoutData,
                          deliveryAddress: { ...checkoutData.deliveryAddress, state: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>ZIP Code</label>
                      <input
                        type="text"
                        value={checkoutData.deliveryAddress.zipCode}
                        onChange={(e) => setCheckoutData({
                          ...checkoutData,
                          deliveryAddress: { ...checkoutData.deliveryAddress, zipCode: e.target.value }
                        })}
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Payment Method</label>
                <select
                  value={checkoutData.paymentMethod}
                  onChange={(e) => setCheckoutData({ ...checkoutData, paymentMethod: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">Online</option>
                </select>
              </div>

              <div className="checkout-summary">
                <p>Total: <strong>${groupOrder.total.toFixed(2)}</strong></p>
                {checkoutData.type === 'delivery' && <p>+ $5.00 delivery fee</p>}
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                {loading ? 'Placing Order...' : 'Place Order'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupOrder;
