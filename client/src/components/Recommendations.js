import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { recommendationsAPI } from '../services/api';
import { FiStar, FiPlus, FiTrendingUp, FiHeart, FiRefreshCw } from 'react-icons/fi';
import toast from 'react-hot-toast';
import './Recommendations.css';

const Recommendations = ({ type = 'personalized', title, productIds = [] }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [type, isAuthenticated, productIds]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      let response;

      switch (type) {
        case 'personalized':
          if (isAuthenticated) {
            response = await recommendationsAPI.getRecommendations(6);
          } else {
            response = await recommendationsAPI.getPopular(6);
          }
          break;
        case 'trending':
          response = await recommendationsAPI.getTrending(6);
          break;
        case 'popular':
          response = await recommendationsAPI.getPopular(6);
          break;
        case 'similar':
          if (productIds.length > 0) {
            response = await recommendationsAPI.getSimilar(productIds, 4);
          }
          break;
        case 'reorder':
          if (isAuthenticated) {
            response = await recommendationsAPI.getReorderSuggestions();
          }
          break;
        default:
          response = await recommendationsAPI.getPopular(6);
      }

      if (response?.data) {
        setRecommendations(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product) => {
    try {
      await addToCart(product._id, 1, 'medium');
      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'trending':
        return <FiTrendingUp />;
      case 'reorder':
        return <FiRefreshCw />;
      case 'personalized':
        return <FiHeart />;
      default:
        return <FiStar />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case 'personalized':
        return isAuthenticated ? 'Recommended for You' : 'Popular Items';
      case 'trending':
        return 'Trending This Week';
      case 'popular':
        return 'Customer Favorites';
      case 'similar':
        return 'You Might Also Like';
      case 'reorder':
        return 'Order Again';
      default:
        return 'Recommendations';
    }
  };

  if (loading) {
    return (
      <div className="recommendations-section">
        <div className="recommendations-header">
          <h2>{getIcon()} {getTitle()}</h2>
        </div>
        <div className="recommendations-loading">
          <div className="loading-spinner"></div>
          <p>Finding the best picks for you...</p>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <div className="recommendations-section">
      <div className="recommendations-header">
        <h2>{getIcon()} {getTitle()}</h2>
        <button onClick={fetchRecommendations} className="refresh-btn" title="Refresh">
          <FiRefreshCw />
        </button>
      </div>

      <div className="recommendations-grid">
        {recommendations.map((item, index) => (
          <div key={item.product?._id || index} className="recommendation-card">
            <div className="recommendation-image">
              {item.product?.image ? (
                <img src={item.product.image} alt={item.product.name} />
              ) : (
                <div className="placeholder-image">
                  <FiStar />
                </div>
              )}
              {item.reason && (
                <span className="recommendation-badge">{item.reason}</span>
              )}
            </div>
            <div className="recommendation-info">
              <h3>{item.product?.name}</h3>
              <p className="recommendation-description">
                {item.product?.description?.substring(0, 60)}
                {item.product?.description?.length > 60 ? '...' : ''}
              </p>
              <div className="recommendation-footer">
                <span className="recommendation-price">
                  ${item.product?.price?.toFixed(2)}
                </span>
                <button
                  onClick={() => handleAddToCart(item.product)}
                  className="add-btn"
                  title="Add to cart"
                >
                  <FiPlus />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommendations;
