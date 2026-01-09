/**
 * Auth Context
 *
 * React Context = Way to share data across components without prop drilling.
 *
 * This context provides:
 * - Current user state
 * - Login/Register/Logout functions
 * - Loading state
 *
 * Any component can access auth state by using useAuth() hook.
 */
import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

// Create the context (like creating a "channel" to broadcast data)
const AuthContext = createContext(null);

/**
 * Auth Provider Component
 *
 * Wraps the app and provides auth state to all children.
 * Think of it as a "broadcaster" that all components can tune into.
 */
export const AuthProvider = ({ children }) => {
  // User state - null means not logged in
  const [user, setUser] = useState(null);
  // Loading state - true while checking if user is logged in
  const [loading, setLoading] = useState(true);

  /**
   * Check if user is already logged in on app start
   *
   * If token exists in localStorage, verify it's still valid
   * by fetching current user from backend.
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          // GET /api/auth/me - returns current user if token valid
          const response = await api.get('/auth/me');
          // API returns { success, data: { user } }
          const userData = response.data?.user || response.data;
          setUser(userData);
        } catch (error) {
          // Token invalid or expired - clear storage
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }

      setLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Register new user
   *
   * POST /api/auth/register
   * Returns token and user data on success
   */
  const register = async (userData) => {
    const response = await api.post('/auth/register', userData);

    // API returns { success, data: { token, user } }
    const { token, user: userInfo } = response.data;

    // Store token in localStorage (persists across page refresh)
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userInfo));

    // Update state
    setUser(userInfo);

    return response;
  };

  /**
   * Login existing user
   *
   * POST /api/auth/login
   * Returns token and user data on success
   */
  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });

    // API returns { success, data: { token, user } }
    const { token, user: userInfo } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userInfo));

    setUser(userInfo);

    return response;
  };

  /**
   * Logout user
   *
   * Clear token and user from storage and state.
   * No API call needed - just forget the token.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  /**
   * Update user profile
   */
  const updateProfile = async (updates) => {
    const response = await api.put('/auth/profile', updates);
    // API returns { success, data: { user } }
    const userData = response.data?.user || response.data;
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    return response;
  };

  // Value object provided to all consumers
  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    register,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom Hook: useAuth
 *
 * Convenient way to access auth context.
 * Instead of: const auth = useContext(AuthContext)
 * We can use: const { user, login } = useAuth()
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default AuthContext;
