"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getStories, getUserLibrary, addStoryToLibrary } from "../services/storyService"

export interface Story {
  id: number
  title: string
  content: string
  author: {
    id: number
    username: string
  }
  language: string
  difficulty: string
  tags: string
  created_at: string
  updated_at: string
  slug: string
}

interface StoryContextType {
  stories: Story[]
  userLibrary: Story[]
  loading: boolean
  fetchStories: (filter?: Record<string, any>) => Promise<void>
  fetchUserLibrary: () => Promise<void>
  addToLibrary: (storyId: number) => Promise<{ success: boolean; message?: string }>
}

const StoryContext = createContext<StoryContextType | undefined>(undefined)

export function StoryProvider({ children }: { children: ReactNode }) {
  const [stories, setStories] = useState<Story[]>([])
  const [userLibrary, setUserLibrary] = useState<Story[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch stories on component mount
  useEffect(() => {
    fetchStories()
    fetchUserLibrary()
  }, [])

  // Fetch stories from the API
  const fetchStories = async (filter?: Record<string, any>) => {
    setLoading(true)
    try {
      const result = await getStories(filter || {})
      if (result.success) {
        setStories(result.data)
      }
    } catch (error) {
      console.error('Error fetching stories:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch user's library
  const fetchUserLibrary = async () => {
    setLoading(true)
    try {
      const result = await getUserLibrary()
      if (result.success) {
        setUserLibrary(result.data)
      }
    } catch (error) {
      console.error('Error fetching user library:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add a story to user's library
  const addToLibrary = async (storyId: number) => {
    try {
      const result = await addStoryToLibrary(storyId)
      if (result.success) {
        // Find the story in the stories list
        const story = stories.find(s => s.id === storyId)
        if (story && !userLibrary.some(s => s.id === storyId)) {
          setUserLibrary(prev => [...prev, story])
        }
        return { success: true }
      }
      return { success: false, message: result.error || 'Failed to add story to library' }
    } catch (error) {
      console.error('Error adding story to library:', error)
      return { success: false, message: 'An error occurred' }
    }
  }

  return (
    <StoryContext.Provider
      value={{
        stories,
        userLibrary,
        loading,
        fetchStories,
        fetchUserLibrary,
        addToLibrary,
      }}
    >
      {children}
    </StoryContext.Provider>
  )
}

export function useStories() {
  const context = useContext(StoryContext)
  if (context === undefined) {
    throw new Error("useStories must be used within a StoryProvider")
  }
  return context
} 