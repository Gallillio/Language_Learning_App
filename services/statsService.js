import api from '../lib/api';

export const getUserSummary = async () => {
  try {
    const response = await api.get('/stats/user_summary/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Failed to fetch user summary' };
  }
};

export const getActivityHistory = async () => {
  try {
    const response = await api.get('/stats/activity_history/');
    return { success: true, data: response.data };
  } catch (error) {
    return { success: false, error: error.response?.data || 'Failed to fetch activity history' };
  }
}; 