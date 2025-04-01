"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "./auth-context"
import { 
  getWords, 
  getLearningWords, 
  getMasteredWords,
  addWord as apiAddWord,
  updateWord as apiUpdateWord,
  markAsLearned as apiMarkAsLearned,
  unmarkAsLearned as apiUnmarkAsLearned,
  updateConfidence as apiUpdateConfidence
} from "../services/wordService"

export interface Word {
  id: number
  word: string
  meaning: string
  context?: string
  exampleSentence?: string
  exampleSentenceTranslation?: string
  confidence: number // 1-5
  learned: boolean // true if fully learned, false if still learning
  last_practiced?: string // ISO date string
  language: string
  userId?: number // Add userId to associate words with users
  
  // SM-2 spaced repetition fields
  ease_factor?: number // Starts at 2.5, adjusted based on performance
  interval?: number // Current interval in days
  repetitions?: number // Number of successful reviews in a row
  next_review_date?: string // Date string for next review
  
  // History tracking for reviews
  history?: Array<{
    date: string; // ISO date string
    quality: number; // Quality rating 1-5
  }>;
}

interface WordBankContextType {
  learningWords: Word[]
  learnedWords: Word[]
  loading: boolean
  addWord: (word: Omit<Word, "id" | "last_practiced">) => Promise<{ success: boolean; message?: string }>
  updateWord: (id: number, updates: Partial<Omit<Word, "id">>) => Promise<{ success: boolean; message?: string }>
  updateConfidence: (id: number, confidence: number) => Promise<{ success: boolean; message?: string }>
  markAsLearned: (id: number) => Promise<{ success: boolean; message?: string }>
  unmarkAsLearned: (id: number) => Promise<{ success: boolean; message?: string }>
  deleteWord: (id: number) => Promise<{ success: boolean; message?: string }>
  getWordStatus: (word: string) => { inBank: boolean; confidence: number; learned: boolean; meaning?: string } | null
  scheduleReview: (id: number, quality: number) => void
  getWordsForReview: () => { today: Word[], tomorrow: Word[], later: Word[] }
}

const WordBankContext = createContext<WordBankContextType | undefined>(undefined)

export function WordBankProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [learningWords, setLearningWords] = useState<Word[]>([])
  const [learnedWords, setLearnedWords] = useState<Word[]>([])
  const [loading, setLoading] = useState(true)

  // Load words from localStorage on mount and when user changes
  useEffect(() => {
    if (user) {
      // Load user-specific words from localStorage
      try {
        const storedLearningWords = localStorage.getItem(`learning_words_${user.id}`);
        const storedLearnedWords = localStorage.getItem(`learned_words_${user.id}`);
        
        if (storedLearningWords) {
          setLearningWords(JSON.parse(storedLearningWords));
        }
        
        if (storedLearnedWords) {
          setLearnedWords(JSON.parse(storedLearnedWords));
        }
      } catch (error) {
        console.error('Error loading words from localStorage:', error);
      }
    } else {
      // Clear words when no user is logged in
      setLearningWords([]);
      setLearnedWords([]);
    }
    
    setLoading(false);
  }, [user]);

  // Save words to localStorage whenever they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(`learning_words_${user.id}`, JSON.stringify(learningWords));
      localStorage.setItem(`learned_words_${user.id}`, JSON.stringify(learnedWords));
    }
  }, [user, learningWords, learnedWords]);

  // Add a new word to the backend and update local state
  const addWord = async (wordData: Omit<Word, "id" | "last_practiced">) => {
    try {
      if (!user) {
        return { success: false, message: 'You must be logged in to add words' };
      }
      
      // Create a new word with a unique ID and user ID
      const newWord: Word = {
        ...wordData,
        id: Date.now(), // Simple ID generation for demo
        userId: user.id, // Associate with the current user
        last_practiced: new Date().toISOString(),
      };
      
      if (newWord.learned) {
        setLearnedWords(prev => [...prev, newWord]);
      } else {
        setLearningWords(prev => [...prev, newWord]);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error adding word:', error);
      return { success: false, message: 'An error occurred while adding the word' };
    }
  };

  // Update a word in the backend and local state
  const updateWord = async (id: number, updates: Partial<Omit<Word, "id">>) => {
    try {
      if (!user) {
        return { success: false, message: 'You must be logged in to update words' };
      }

      // Find the original word in either list
      const originalWord = learningWords.find(w => w.id === id) || learnedWords.find(w => w.id === id);
      
      if (!originalWord) {
        return { success: false, message: 'Word not found' };
      }
      
      // Merge the original word with the updates
      const updatedWord = { ...originalWord, ...updates };
      
      // Handle based on learned status
      if (updatedWord.learned) {
        // Remove from learning if it was there
        setLearningWords(prev => prev.filter(w => w.id !== id));
        
        // Update in learned list or add if not there
        setLearnedWords(prev => {
          const exists = prev.some(w => w.id === id);
          if (exists) {
            return prev.map(w => w.id === id ? updatedWord : w);
          } else {
            return [...prev, updatedWord];
          }
        });
      } else {
        // Remove from learned if it was there
        setLearnedWords(prev => prev.filter(w => w.id !== id));
        
        // Update in learning list or add if not there
        setLearningWords(prev => {
          const exists = prev.some(w => w.id === id);
          if (exists) {
            return prev.map(w => w.id === id ? updatedWord : w);
          } else {
            return [...prev, updatedWord];
          }
        });
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating word:', error);
      return { success: false, message: 'An error occurred while updating the word' };
    }
  };

  // Update confidence level in the backend and local state
  const updateConfidence = async (id: number, confidence: number) => {
    try {
      if (!user) {
        return { success: false, message: 'You must be logged in to update confidence' };
      }

      // Find the word in learning or learned words
      const learningWord = learningWords.find(w => w.id === id);
      const learnedWord = learnedWords.find(w => w.id === id);
      
      if (!learningWord && !learnedWord) {
        return { success: false, message: 'Word not found' };
      }
      
      // If word exists, update it
      const word = learningWord || learnedWord;
      // Don't automatically mark as learned based on confidence level
      const updatedWord = { ...word!, confidence };
      
      // Update the word in the appropriate list without changing its learned status
      if (word!.learned) {
        // Update in learned words
        setLearnedWords(prev => prev.map(w => w.id === id ? updatedWord : w));
      } else {
        // Update in learning words
        setLearningWords(prev => prev.map(w => w.id === id ? updatedWord : w));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating confidence:', error);
      return { success: false, message: 'An error occurred while updating confidence' };
    }
  };

  // Mark word as learned
  const markAsLearned = async (id: number) => {
    try {
      if (!user) {
        return { success: false, message: 'You must be logged in to mark words as learned' };
      }

      // Find the word in learning words
      const word = learningWords.find(w => w.id === id);
      
      if (!word) {
        return { success: false, message: 'Word not found in learning words' };
      }
      
      // Update the word to be learned
      const updatedWord = { ...word, learned: true, confidence: 5 };
      
      // Remove from learning words
      setLearningWords(prev => prev.filter(w => w.id !== id));

      // Add to learned words
      setLearnedWords(prev => [...prev, updatedWord]);
      
      return { success: true };
    } catch (error) {
      console.error('Error marking word as learned:', error);
      return { success: false, message: 'An error occurred while marking word as learned' };
    }
  };

  // Unmark word as learned
  const unmarkAsLearned = async (id: number) => {
    try {
      if (!user) {
        return { success: false, message: 'You must be logged in to unmark words' };
      }

      // Find the word in learned words
      const word = learnedWords.find(w => w.id === id);
      
      if (!word) {
        return { success: false, message: 'Word not found in learned words' };
      }
      
      // Update the word as not learned
      const updatedWord = { ...word, learned: false, confidence: 4 }; // Default to confidence 4
      
      // Remove from learned words
      setLearnedWords(prev => prev.filter(w => w.id !== id));
      
      // Add to learning words
      setLearningWords(prev => [...prev, updatedWord]);
      
      return { success: true };
    } catch (error) {
      console.error('Error unmarking word as learned:', error);
      return { success: false, message: 'An error occurred while unmarking word as learned' };
    }
  };

  // Get a specific word's status
  const getWordStatus = (wordText: string) => {
    if (!wordText) return null;
    
    // Check learning words
    const learningWord = learningWords.find(w => w.word && w.word.toLowerCase() === wordText.toLowerCase());
    if (learningWord) {
      return {
        inBank: true,
        confidence: learningWord.confidence,
        learned: false,
        meaning: learningWord.meaning
      };
    }

    // Check learned words
    const learnedWord = learnedWords.find(w => w.word && w.word.toLowerCase() === wordText.toLowerCase());
    if (learnedWord) {
      return {
        inBank: true,
        confidence: learnedWord.confidence,
        learned: true,
        meaning: learnedWord.meaning
      };
    }

    return null;
  };

  // Schedule a review for a word using a simplified SM-2 algorithm
  const scheduleReview = (id: number, quality: number) => {
    if (!user) return;
    
    // Find the word in either list
    const learningWord = learningWords.find(w => w.id === id);
    const learnedWord = learnedWords.find(w => w.id === id);
    const word = learningWord || learnedWord;
    
    if (!word) return;
    
    // Initialize fields if they don't exist
    const repetitions = word.repetitions ?? 0;
    const interval = word.interval ?? 0;
    const history = word.history || [];
    const now = new Date();
    let nextReviewDate = new Date(now);
    let newInterval = interval;
    let newRepetitions = repetitions;
    
    // Check if this is a new card (no previous history)
    const isNewCard = history.length === 0;
    
    if (quality === 1) { // "Again" button
      // For new cards or cards that have never been rated "Good",
      // always set to 1 minute regardless of history
      if (isNewCard || newRepetitions === 0) {
        nextReviewDate.setMinutes(now.getMinutes() + 1);
        newInterval = 0;
        newRepetitions = 0;
      } else {
        // Card has been rated "Good" before, set to 10 minutes
        nextReviewDate.setMinutes(now.getMinutes() + 10);
        newInterval = 0;
        newRepetitions = 0;
      }
    } else { // "Good" button (quality = 4)
      // Increase repetitions for consecutive "Good" ratings
      newRepetitions++;
      
      // Progressive intervals based on consecutive correct answers
      if (newRepetitions === 1) {
        // First "Good" - review in 10 minutes
        nextReviewDate.setMinutes(now.getMinutes() + 10);
        newInterval = 0;
      } else if (newRepetitions === 2) {
        // Second consecutive "Good" - review in 1 day
        nextReviewDate.setDate(now.getDate() + 1);
        newInterval = 1;
      } else if (newRepetitions === 3) {
        // Third consecutive "Good" - review in 3 days
        nextReviewDate.setDate(now.getDate() + 3);
        newInterval = 3;
      } else if (newRepetitions === 4) {
        // Fourth consecutive "Good" - review in 7 days
        nextReviewDate.setDate(now.getDate() + 7);
        newInterval = 7;
      } else if (newRepetitions === 5) {
        // Fifth consecutive "Good" - review in 14 days
        nextReviewDate.setDate(now.getDate() + 14);
        newInterval = 14;
      } else if (newRepetitions === 6) {
        // Sixth consecutive "Good" - review in 30 days
        nextReviewDate.setDate(now.getDate() + 30);
        newInterval = 30;
      } else {
        // More than six consecutive "Good" - double previous interval
        newInterval = interval * 2;
        nextReviewDate.setDate(now.getDate() + newInterval);
      }
    }
    
    // Create history entry for this review
    const historyEntry = {
      date: now.toISOString(),
      quality: quality
    };
    
    // Update the word with history
    const updates = {
      interval: newInterval,
      repetitions: newRepetitions,
      next_review_date: nextReviewDate.toISOString(),
      last_practiced: now.toISOString(),
      confidence: quality, // Keep confidence for backward compatibility
      // Append new history entry to existing history
      history: [...history, historyEntry]
    };
    
    // Apply updates to the word in the appropriate list
    updateWord(id, updates);
  };

  // Get words for review based on their scheduled review dates
  const getWordsForReview = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const dayAfterTomorrow = new Date(now);
    dayAfterTomorrow.setDate(now.getDate() + 2);
    
    // Combine both lists for processing
    const allWords = [...learningWords, ...learnedWords];
    
    // Filter words into appropriate review groups
    const todayWords = allWords.filter(word => {
      if (!word.next_review_date) return true; // New words with no next_review_date go to today
      
      const nextReview = new Date(word.next_review_date);
      return nextReview <= now; // Due now or overdue
    });
    
    const shortTermWords = allWords.filter(word => {
      if (!word.next_review_date) return false;
      
      const nextReview = new Date(word.next_review_date);
      // Words due within the next hour but not yet due
      return nextReview > now && 
             nextReview <= new Date(now.getTime() + 60 * 60 * 1000);
    });
    
    const tomorrowWords = allWords.filter(word => {
      if (!word.next_review_date) return false;
      
      const nextReview = new Date(word.next_review_date);
      const hourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
      // Words due after an hour but before tomorrow
      return nextReview > hourFromNow && nextReview < tomorrow;
    });
    
    const laterWords = allWords.filter(word => {
      if (!word.next_review_date) return false;
      
      const nextReview = new Date(word.next_review_date);
      return nextReview >= tomorrow;
    });
    
    // Combine today and shortTerm words for immediate review
    return {
      today: [...todayWords, ...shortTermWords],
      tomorrow: tomorrowWords,
      later: laterWords
    };
  };

  // Add the deleteWord function to the provider
  const deleteWord = async (id: number) => {
    try {
      if (!user) {
        return { success: false, message: 'You must be logged in to delete words' };
      }

      // Remove from both learning and learned words
      setLearningWords(prev => prev.filter(w => w.id !== id));
      setLearnedWords(prev => prev.filter(w => w.id !== id));
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting word:', error);
      return { success: false, message: 'An error occurred while deleting the word' };
    }
  };

  return (
    <WordBankContext.Provider
      value={{
        learningWords,
        learnedWords,
        loading,
        addWord,
        updateWord,
        updateConfidence,
        markAsLearned,
        unmarkAsLearned,
        deleteWord,
        getWordStatus,
        scheduleReview,
        getWordsForReview,
      }}
    >
      {children}
    </WordBankContext.Provider>
  );
}

export function useWordBank() {
  const context = useContext(WordBankContext)
  if (context === undefined) {
    throw new Error("useWordBank must be used within a WordBankProvider")
  }
  return context
}

