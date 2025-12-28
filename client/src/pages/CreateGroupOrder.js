import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroupOrder } from '../context/GroupOrderContext';
import { useAuth } from '../context/AuthContext';
import { FiUsers, FiArrowRight } from 'react-icons/fi';
import './CreateGroupOrder.css';

const CreateGroupOrder = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createGroupOrder, joinGroup, loading } = useGroupOrder();

  const [mode, setMode] = useState('create'); // 'create' or 'join'
  const [name, setName] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [joinCode, setJoinCode] = useState('');
  const [guestName, setGuestName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=/group-order/create');
      return;
    }

    try {
      const groupOrder = await createGroupOrder(name || undefined, maxParticipants);
      navigate(`/group-order/${groupOrder.code}`);
    } catch (error) {
      console.error(error);
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;

    try {
      await joinGroup(joinCode.trim().toUpperCase(), !user ? guestName.trim() : null);
      navigate(`/group-order/${joinCode.trim().toUpperCase()}`);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="create-group-page">
      <div className="create-group-container">
        <div className="group-hero">
          <FiUsers className="hero-icon" />
          <h1>Group Order</h1>
          <p>Order together with friends and split the bill easily!</p>
        </div>

        <div className="mode-tabs">
          <button
            className={`tab ${mode === 'create' ? 'active' : ''}`}
            onClick={() => setMode('create')}
          >
            Create Group
          </button>
          <button
            className={`tab ${mode === 'join' ? 'active' : ''}`}
            onClick={() => setMode('join')}
          >
            Join Group
          </button>
        </div>

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="group-form">
            {!user && (
              <div className="login-notice">
                <p>You need to be logged in to create a group order.</p>
                <button
                  type="button"
                  onClick={() => navigate('/login?redirect=/group-order/create')}
                  className="btn btn-primary"
                >
                  Login to Continue
                </button>
              </div>
            )}

            {user && (
              <>
                <div className="form-group">
                  <label>Group Name (Optional)</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={`${user.name}'s Group Order`}
                  />
                </div>

                <div className="form-group">
                  <label>Max Participants</label>
                  <select
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>{n} people</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Group Order'}
                  <FiArrowRight />
                </button>
              </>
            )}
          </form>
        ) : (
          <form onSubmit={handleJoin} className="group-form">
            <div className="form-group">
              <label>Group Code</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-letter code"
                maxLength={6}
                className="code-input"
                required
              />
            </div>

            {!user && (
              <div className="form-group">
                <label>Your Name</label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading || !joinCode.trim()}>
              {loading ? 'Joining...' : 'Join Group'}
              <FiArrowRight />
            </button>
          </form>
        )}

        <div className="group-features">
          <h2>How it works</h2>
          <div className="features-grid">
            <div className="feature">
              <span className="feature-number">1</span>
              <h3>Create or Join</h3>
              <p>Start a new group or join with a code shared by friends</p>
            </div>
            <div className="feature">
              <span className="feature-number">2</span>
              <h3>Add Your Items</h3>
              <p>Everyone adds their favorite pizzas to the shared cart</p>
            </div>
            <div className="feature">
              <span className="feature-number">3</span>
              <h3>Review Together</h3>
              <p>See everyone's orders in real-time as they're added</p>
            </div>
            <div className="feature">
              <span className="feature-number">4</span>
              <h3>Split the Bill</h3>
              <p>Choose to split equally or pay for your own items</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupOrder;
