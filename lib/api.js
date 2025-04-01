import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add authentication interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Streak related functions
export const updateUserStreak = async () => {
    try {
        const response = await api.post('/auth/update-streak/');
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data || 'Failed to update streak'
        };
    }
};

export default api; 