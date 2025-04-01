"use client";

import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { testUsers, TestUser } from '../lib/test-users';

// Define user type
export interface User {
  id: number;
  username: string;
  email: string;
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
  
  // Initialize auth state from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user:', error);
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<{ success: boolean; message?: string }> => {
    // Find user in test users
    const foundUser = testUsers.find(
      user => (user.username === username || user.email === username) && user.password === password
    );
    
    if (foundUser) {
      // Create user object without the password
      const userData: User = {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email
      };
      
      // Save to state and localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Redirect to homepage after login
      router.push('/');
      
      return { success: true };
    }
    
    return { 
      success: false,
      message: 'Invalid username or password'
    };
  };
  
  // Register function
  const register = async (username: string, email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    // Check if username or email already exists
    const userExists = testUsers.some(
      user => user.username === username || user.email === email
    );
    
    if (userExists) {
      return {
        success: false,
        message: 'Username or email already exists'
      };
    }
    
    // Create new user
    const newUser: TestUser = {
      id: testUsers.length + 1,
      username,
      email,
      password
    };
    
    // Add to test users array (this would normally be a database operation)
    testUsers.push(newUser);
    
    // Create user data for state
    const userData: User = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email
    };
    
    // Update state and localStorage
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Redirect to homepage
    router.push('/');
    
    return { success: true };
  };
  
  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    router.push('/login');
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