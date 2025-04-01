import api from '../lib/api';

export const getWords = async () => {
    try {
        const response = await api.get('/words/');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to fetch words' };
    }
};

export const getLearningWords = async () => {
    try {
        const response = await api.get('/words/learning/');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to fetch learning words' };
    }
};

export const getMasteredWords = async () => {
    try {
        const response = await api.get('/words/mastered/');
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to fetch mastered words' };
    }
};

export const getWord = async (id) => {
    try {
        const response = await api.get(`/words/${id}/`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to fetch word' };
    }
};

export const addWord = async (wordData) => {
    try {
        const response = await api.post('/words/', wordData);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to add word' };
    }
};

export const updateWord = async (id, wordData) => {
    try {
        const response = await api.put(`/words/${id}/`, wordData);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to update word' };
    }
};

export const deleteWord = async (id) => {
    try {
        await api.delete(`/words/${id}/`);
        return { success: true };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to delete word' };
    }
};

export const updateConfidence = async (id, level) => {
    try {
        const response = await api.post(`/words/${id}/update_confidence/`, { level });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to update confidence' };
    }
};

export const markAsLearned = async (id) => {
    try {
        const response = await api.post(`/words/${id}/mark_as_learned/`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to mark as learned' };
    }
};

export const unmarkAsLearned = async (id) => {
    try {
        const response = await api.post(`/words/${id}/unmark_as_learned/`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: error.response?.data || 'Failed to unmark as learned' };
    }
}; 