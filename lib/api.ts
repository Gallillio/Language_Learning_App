import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
});

// Add token to all requests if available
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Create API methods for streak functionality
export const updateUserStreak = async () => {
  try {
    const response = await api.post('/auth/update-streak/');
    return response.data;
  } catch (error) {
    console.error('Error updating streak:', error);
    throw error;
  }
};

export default api; 