# Frontend-Backend Integration Guide

This document outlines how to integrate the Next.js frontend with the Django backend for the Language Learning App.

## API Integration

The Django backend (located in the `backend/` folder) provides RESTful API endpoints for all the functionalities. Here's how to connect the frontend to these endpoints:

### 1. Environment Configuration

Create a `.env.local` file in the root of your Next.js project with:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

For production:

```
NEXT_PUBLIC_API_URL=https://your-production-domain.com/api
```

### 2. API Client Setup

Create an API client in `lib/api.js`:

```javascript
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add authentication interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
```

### 3. Authentication

Update the authentication context to use the API:

```javascript
// contexts/AuthContext.js
import { createContext, useState, useEffect } from "react";
import api from "../lib/api";
import { useRouter } from "next/router";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (token) {
        try {
          const response = await api.get("/auth/user/");
          setUser(response.data);
        } catch (error) {
          localStorage.removeItem("auth_token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      const response = await api.post("/auth/login/", { username, password });
      localStorage.setItem("auth_token", response.data.token);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.non_field_errors?.[0] || "Login failed",
      };
    }
  };

  // Register function
  const register = async (username, email, password) => {
    try {
      const response = await api.post("/auth/register/", {
        username,
        email,
        password,
      });
      localStorage.setItem("auth_token", response.data.token);
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          Object.values(error.response?.data || {}).flat()[0] ||
          "Registration failed",
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post("/auth/logout/");
    } finally {
      localStorage.removeItem("auth_token");
      setUser(null);
      router.push("/login");
    }
  };

  // Update user's daily goal
  const updateDailyGoal = async (goal) => {
    try {
      const response = await api.put("/auth/update-goal/", {
        daily_goal: goal,
      });
      setUser({ ...user, daily_goal: response.data.daily_goal });
      return { success: true };
    } catch (error) {
      return { success: false, message: "Failed to update goal" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateDailyGoal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
```

### 4. API Services

Create separate service modules for each feature:

#### Stories Service

```javascript
// services/storyService.js
import api from "../lib/api";

export const getStories = async (params = {}) => {
  try {
    const response = await api.get("/stories/", { params });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to fetch stories",
    };
  }
};

export const getStory = async (id) => {
  try {
    const response = await api.get(`/stories/${id}/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to fetch story",
    };
  }
};

export const getUserLibrary = async () => {
  try {
    const response = await api.get("/library/");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to fetch library",
    };
  }
};

export const addStoryToLibrary = async (storyId) => {
  try {
    const response = await api.post(`/stories/${storyId}/add_to_library/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to add story to library",
    };
  }
};

export const createStory = async (storyData) => {
  try {
    const response = await api.post("/stories/", storyData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to create story",
    };
  }
};
```

#### Word Bank Service

```javascript
// services/wordService.js
import api from "../lib/api";

export const getWords = async () => {
  try {
    const response = await api.get("/words/");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to fetch words",
    };
  }
};

export const getLearningWords = async () => {
  try {
    const response = await api.get("/words/learning/");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to fetch learning words",
    };
  }
};

export const getMasteredWords = async () => {
  try {
    const response = await api.get("/words/mastered/");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to fetch mastered words",
    };
  }
};

export const addWord = async (wordData) => {
  try {
    const response = await api.post("/words/", wordData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to add word",
    };
  }
};

export const updateWord = async (id, wordData) => {
  try {
    const response = await api.put(`/words/${id}/`, wordData);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to update word",
    };
  }
};

export const updateConfidence = async (id, level) => {
  try {
    const response = await api.post(`/words/${id}/update_confidence/`, {
      level,
    });
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to update confidence",
    };
  }
};

export const markAsLearned = async (id) => {
  try {
    const response = await api.post(`/words/${id}/mark_as_learned/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to mark as learned",
    };
  }
};

export const unmarkAsLearned = async (id) => {
  try {
    const response = await api.post(`/words/${id}/unmark_as_learned/`);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to unmark as learned",
    };
  }
};
```

#### Statistics Service

```javascript
// services/statsService.js
import api from "../lib/api";

export const getUserSummary = async () => {
  try {
    const response = await api.get("/stats/user_summary/");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to fetch user summary",
    };
  }
};

export const getActivityHistory = async () => {
  try {
    const response = await api.get("/stats/activity_history/");
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || "Failed to fetch activity history",
    };
  }
};
```

### 5. Component Integration

Update your components to use the API services. For example, the reading mode component:

```javascript
// components/reading-mode.tsx
import { useState, useEffect } from "react";
import { getStory } from "../services/storyService";
import { addWord, updateConfidence } from "../services/wordService";

// ... existing component code

// Inside component
useEffect(() => {
  const loadStory = async () => {
    setLoading(true);
    const result = await getStory(storyId);
    if (result.success) {
      setSelectedStory(result.data);
    } else {
      setError("Failed to load story");
    }
    setLoading(false);
  };

  if (storyId) {
    loadStory();
  }
}, [storyId]);

// Handle saving word
const handleSaveWord = async () => {
  if (!selectedWord.meaning) {
    setWarningOpen(true);
    return;
  }

  const wordData = {
    word: selectedWord.text,
    meaning: selectedWord.meaning,
    context: selectedWord.context || "",
    language: selectedStory.language,
    confidence: selectedWord.confidence || 1,
  };

  const result = await addWord(wordData);
  if (result.success) {
    // Update UI with saved word
    setIsSaved(true);
    toast.success("Word saved to your word bank!");
  } else {
    toast.error("Failed to save word");
  }
};

// Handle confidence update
const handleConfidenceChange = async (level) => {
  if (selectedWord.id) {
    const result = await updateConfidence(selectedWord.id, level);
    if (result.success) {
      setSelectedWord({
        ...selectedWord,
        confidence: level,
        learned: level === 5 ? true : selectedWord.learned,
      });
    }
  } else {
    setSelectedWord({
      ...selectedWord,
      confidence: level,
    });
  }
};

// ... rest of component
```

## Authentication Flow

1. When a user logs in or registers, store the auth token in localStorage
2. Include the token in all API requests
3. Handle token expiration and unauthorized requests
4. Redirect unauthenticated users to login page

## Deployment Considerations

1. Set appropriate CORS settings on the backend for your frontend domain
2. Ensure proper environment variables are set in production
3. Consider using a proxy in production to avoid CORS issues
4. Use HTTPS for all API communications

## Error Handling

Implement consistent error handling throughout the application:

```javascript
try {
  // API call
} catch (error) {
  if (error.response?.status === 401) {
    // Handle unauthorized
    logout();
    router.push("/login");
  } else if (error.response?.data) {
    // Show specific error from API
    toast.error(Object.values(error.response.data).flat()[0]);
  } else {
    // Show generic error
    toast.error("An error occurred. Please try again.");
  }
}
```
