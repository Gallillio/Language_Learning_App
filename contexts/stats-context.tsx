"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getUserSummary, getActivityHistory } from "../services/statsService"

export interface UserStats {
  total_words: number
  learning_words: number
  mastered_words: number
  confidence_levels: {
    [key: string]: number  // e.g., "1": 10, "2": 5, etc.
  }
  streak_count: number
  daily_goal: number
  today_activity: {
    words_added: number
    words_practiced: number
    words_mastered: number
    stories_read: number
    goal_completed: boolean
  }
}

export interface DailyActivity {
  id: number
  date: string
  words_added: number
  words_practiced: number
  words_mastered: number
  stories_read: number
  time_spent: number
  daily_goal_completed: boolean
}

interface StatsContextType {
  userStats: UserStats | null
  activityHistory: DailyActivity[]
  loading: boolean
  refreshStats: () => Promise<void>
}

const StatsContext = createContext<StatsContextType | undefined>(undefined)

export function StatsProvider({ children }: { children: ReactNode }) {
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [activityHistory, setActivityHistory] = useState<DailyActivity[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch stats on component mount
  useEffect(() => {
    refreshStats()
  }, [])

  // Refresh user stats and activity history
  const refreshStats = async () => {
    setLoading(true)
    try {
      // Get user summary
      const summaryResult = await getUserSummary()
      if (summaryResult.success) {
        setUserStats(summaryResult.data)
      }

      // Get activity history
      const historyResult = await getActivityHistory()
      if (historyResult.success) {
        setActivityHistory(historyResult.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <StatsContext.Provider
      value={{
        userStats,
        activityHistory,
        loading,
        refreshStats,
      }}
    >
      {children}
    </StatsContext.Provider>
  )
}

export function useStats() {
  const context = useContext(StatsContext)
  if (context === undefined) {
    throw new Error("useStats must be used within a StatsProvider")
  }
  return context
} 