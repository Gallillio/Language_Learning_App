"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { updateUserStreak } from '@/lib/api';

// Key for tracking streak update in localStorage
const STREAK_UPDATED_KEY = 'streak_updated_today';

export function useStreak() {
  const { user } = useAuth();
  const [streakCount, setStreakCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize streak count from user data
    if (user?.streak_count !== undefined) {
      setStreakCount(user.streak_count);
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Check if we need to update the streak
    const checkAndUpdateStreak = async () => {
      // If no user is logged in, don't do anything
      if (!user) return;

      // Check if we already updated the streak today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const lastUpdated = localStorage.getItem(STREAK_UPDATED_KEY);

      // If we haven't updated the streak today, update it
      if (lastUpdated !== today) {
        try {
          setIsLoading(true);
          const result = await updateUserStreak();
          
          if (result.success && result.data) {
            // Update the streak count in our hook state
            setStreakCount(result.data.streak_count);
            // Mark that we've updated the streak today
            localStorage.setItem(STREAK_UPDATED_KEY, today);
          } else {
            setError('Failed to update streak');
          }
        } catch (err) {
          console.error('Error updating streak:', err);
          setError('Error updating streak');
        } finally {
          setIsLoading(false);
        }
      }
    };

    // Run the check when the component mounts and user is available
    checkAndUpdateStreak();
  }, [user]); // Only run when user changes (login/logout)

  return { 
    streakCount, 
    isLoading, 
    error 
  };
} 