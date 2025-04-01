import api from '../lib/api';

export const getStories = async (params = {}) => {
    try {
        const response = await api.get('/stories/', { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to fetch stories' };
    }
};

export const getStory = async (id) => {
    try {
        const response = await api.get(`/stories/${id}/`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to fetch story' };
    }
};

export const getUserLibrary = async () => {
    try {
        const response = await api.get('/library/');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to fetch library' };
    }
};

export const addStoryToLibrary = async (storyId) => {
    try {
        const response = await api.post(`/stories/${storyId}/add_to_library/`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to add story to library' };
    }
};

export const createStory = async (storyData) => {
    try {
        const response = await api.post('/stories/', storyData);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to create story' };
    }
};

export const updateStory = async (id, storyData) => {
    try {
        const response = await api.put(`/stories/${id}/`, storyData);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to update story' };
    }
};

export const deleteStory = async (id) => {
    try {
        await api.delete(`/stories/${id}/`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to delete story' };
    }
}; 