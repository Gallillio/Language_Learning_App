"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

// Define user type
export interface User {
  id: number;
  username: string;
  email: string;
  streak_count?: number;
  daily_goal?: number;
  last_activity_date?: string;
}

// Auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (username: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  // Initialize auth state from localStorage token
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          // Verify the token and get user data
          const response = await api.get('/auth/user/');
          setUser(response.data);
        } catch (error) {
          console.error('Authentication error:', error);
          localStorage.removeItem('auth_token');
          setUser(null);
        }
      }
      setIsLoading(false);
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/login/', { username, password });
      
      // Save the auth token
      localStorage.setItem('auth_token', response.data.token);
      
      // Set the user state
      setUser(response.data.user);
      
      // Use hard navigation instead of router.push
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
      return { success: true };
    } catch (error: any) {
      // Handle different error response formats
      let message = 'Invalid username or password';
      
      if (error.response) {
        if (error.response.data?.non_field_errors) {
          message = error.response.data.non_field_errors[0];
        } else if (error.response.data?.detail) {
          message = error.response.data.detail;
        } else if (error.response.data?.error) {
          message = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          message = error.response.data;
        } else if (Object.keys(error.response.data).length > 0) {
          const firstErrorField = Object.keys(error.response.data)[0];
          const errorValue = error.response.data[firstErrorField];
          message = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        }
      }
      
      return { 
        success: false,
        message
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Register function
  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/register/', { 
        username, 
        email, 
        password 
      });
      
      // Save the auth token
      localStorage.setItem('auth_token', response.data.token);
      
      // Set the user state
      setUser(response.data.user);
      
      // Use hard navigation instead of router.push
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
      
      return { success: true };
    } catch (error: any) {
      // Handle different error response formats
      let message = 'Registration failed. Please try again.';
      
      if (error.response) {
        if (error.response.data?.non_field_errors) {
          message = error.response.data.non_field_errors[0];
        } else if (error.response.data?.detail) {
          message = error.response.data.detail;
        } else if (error.response.data?.error) {
          message = error.response.data.error;
        } else if (typeof error.response.data === 'string') {
          message = error.response.data;
        } else if (Object.keys(error.response.data).length > 0) {
          const firstErrorField = Object.keys(error.response.data)[0];
          const errorValue = error.response.data[firstErrorField];
          message = Array.isArray(errorValue) ? errorValue[0] : errorValue;
        }
      }
      
      return {
        success: false,
        message
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      setIsLoading(true);
      // Call the logout endpoint
      await api.post('/auth/logout/');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear token and user state
      localStorage.removeItem('auth_token');
      setUser(null);
      
      // Use hard navigation instead of router.push
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
      
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook for using auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 