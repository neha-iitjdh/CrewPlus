/**
 * API Service
 *
 * Axios instance configured to talk to our backend.
 *
 * Why centralize API calls?
 * - Single place to configure base URL, headers, timeouts
 * - Interceptors can handle auth tokens automatically
 * - Consistent error handling across all requests
 */
import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Request Interceptor
 *
 * Runs BEFORE every request is sent.
 * We use it to attach the auth token from localStorage.
 */
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Get session ID for guest cart
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      config.headers['x-session-id'] = sessionId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 *
 * Runs AFTER response is received.
 * Handles common errors (401 = logout, etc.)
 */
api.interceptors.response.use(
  (response) => {
    // Return the data directly for convenience
    return response.data;
  },
  (error) => {
    // Extract error message from response
    const message = error.response?.data?.message || error.message || 'Something went wrong';

    // Handle 401 Unauthorized - token expired or invalid
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optionally redirect to login
      window.location.href = '/login';
    }

    // Reject with structured error
    return Promise.reject({ message, status: error.response?.status });
  }
);

export default api;
