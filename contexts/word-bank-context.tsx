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
import { FSRS, Rating, Card, SchedulingInfo } from "fsrs.js"

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
  
  // FSRS fields
  due?: string // Due date as ISO string
  stability?: number // Memory stability value 
  difficulty?: number // Card difficulty value (0.0 - 1.0)
  elapsed_days?: number // Days since last review
  scheduled_days?: number // Days until next review
  reps?: number // Number of repetitions
  lapses?: number // Number of review failures (Again ratings)
  state?: number // Card state (0=New, 1=Learning, 2=Review, 3=Relearning)
  last_review?: string // Date of last review as ISO string
  interval?: number // Current interval in days (for compatibility)
  next_review_date?: string // Date string for next review (legacy)
  repetitions?: number // Number of successful reviews (legacy)
  
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

// Initialize the FSRS algorithm with default parameters
const fsrs = new FSRS();

// Convert our quality rating to FSRS Rating
// Again = 1 -> FSRS.Rating.Again (1)
// Hard = 2 -> FSRS.Rating.Hard (2)
// Good = 3 -> FSRS.Rating.Good (3)
// Easy = 4 -> FSRS.Rating.Easy (4)
const qualityToFsrsRating = (quality: number): Rating => {
  switch (quality) {
    case 1: return Rating.Again;
    case 2: return Rating.Hard;
    case 3: return Rating.Good;
    case 4: return Rating.Easy;
    default: return Rating.Good;
  }
};

// Convert FSRS Rating to our quality rating for history and backward compatibility
const fsrsRatingToQuality = (rating: Rating): number => {
  switch (rating) {
    case Rating.Again: return 1;
    case Rating.Hard: return 2;
    case Rating.Good: return 3;
    case Rating.Easy: return 4;
    default: return 3;
  }
};

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

  // Schedule a review for a word using FSRS algorithm
  const scheduleReview = (id: number, quality: number) => {
    if (!user) return;
    
    // Find the word in either list
    const learningWord = learningWords.find(w => w.id === id);
    const learnedWord = learnedWords.find(w => w.id === id);
    const word = learningWord || learnedWord;
    
    if (!word) return;
    
    const now = new Date();
    const rating = qualityToFsrsRating(quality);
    
    try {
      // Create a card object with FSRS parameters using object literal instead of constructor
      const card = {
        due: word.due ? new Date(word.due) : now,
        stability: word.stability ?? 0,
        difficulty: word.difficulty ?? 0.3,
        elapsed_days: word.elapsed_days ?? 0,
        scheduled_days: word.scheduled_days ?? 0,
        reps: word.reps ?? 0,
        lapses: word.lapses ?? 0,
        state: word.state ?? 0,
        last_review: word.last_review ? new Date(word.last_review) : now
      };
      
      // Get scheduling information from FSRS
      const result = fsrs.repeat(card, now);
      
      // The result has structure like: { 1: SchedulingInfo, 2: SchedulingInfo, ... }
      // We need to extract the SchedulingInfo for our rating
      const schedulingInfo = result[rating];
      
      if (!schedulingInfo) {
        throw new Error("FSRS scheduling failed to return info for the given rating");
      }
      
      // The updated card is in schedulingInfo.card
      const nextCard = schedulingInfo.card;
      
      // Calculate interval in days for display/compatibility
      let intervalInDays = 0;
      if (nextCard.due) {
        intervalInDays = Math.round((nextCard.due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      // Update learning state based on scheduling
      // If due date is more than 21 days in the future, consider it "learned"
      const isLearned = intervalInDays > 21;
      
      // Create history entry for this review
      const historyEntry = {
        date: now.toISOString(),
        quality: quality
      };
      
      // Update the word with FSRS parameters and history
      const updates: Partial<Word> = {
        due: nextCard.due.toISOString(),
        stability: nextCard.stability,
        difficulty: nextCard.difficulty,
        elapsed_days: nextCard.elapsed_days,
        scheduled_days: nextCard.scheduled_days,
        reps: nextCard.reps,
        lapses: nextCard.lapses,
        state: nextCard.state,
        last_review: now.toISOString(),
        
        // For compatibility with existing code
        interval: intervalInDays,
        repetitions: nextCard.reps,
        next_review_date: nextCard.due.toISOString(),
        last_practiced: now.toISOString(),
        confidence: quality,
        learned: isLearned,
        
        // Append new history entry
        history: [...(word.history || []), historyEntry]
      };
      
      // Apply updates to the word in the appropriate list
      updateWord(id, updates);
    } catch (error) {
      console.error("Error scheduling with FSRS:", error);
      // Fallback to a simple scheduling algorithm if FSRS fails
      const fallbackInterval = quality * 2; // Simple interval based on quality
      const fallbackDueDate = new Date(now);
      fallbackDueDate.setDate(fallbackDueDate.getDate() + fallbackInterval);
      
      const updates: Partial<Word> = {
        due: fallbackDueDate.toISOString(),
        last_review: now.toISOString(),
        last_practiced: now.toISOString(),
        interval: fallbackInterval,
        confidence: quality,
        history: [...(word.history || []), { date: now.toISOString(), quality }]
      };
      
      updateWord(id, updates);
    }
  };

  // Get words for review based on their scheduled due dates
  const getWordsForReview = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    
    // Combine both lists for processing
    const allWords = [...learningWords, ...learnedWords];
    
    // Filter words into appropriate review groups based on FSRS due dates
    const todayWords = allWords.filter(word => {
      if (!word.due) return true; // New words with no due date go to today
      
      const dueDate = new Date(word.due);
      return dueDate <= now; // Due now or overdue
    });
    
    // Words due within the next 60 minutes should also appear in today's review
    const shortTermWords = allWords.filter(word => {
      if (!word.due) return false;
      
      const dueDate = new Date(word.due);
      // Words due within the next hour but not yet due
      return dueDate > now && 
             dueDate <= new Date(now.getTime() + 60 * 60 * 1000);
    });
    
    // Words due later today (after an hour but before midnight)
    const laterTodayWords = allWords.filter(word => {
      if (!word.due) return false;
      
      const dueDate = new Date(word.due);
      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
      
      // End of today (midnight)
      const endOfToday = new Date(now);
      endOfToday.setHours(23, 59, 59, 999);
      
      return dueDate > oneHourLater && dueDate <= endOfToday;
    });
    
    // Words due tomorrow
    const tomorrowWords = allWords.filter(word => {
      if (!word.due) return false;
      
      const dueDate = new Date(word.due);
      
      // Start of tomorrow
      const startOfTomorrow = new Date(now);
      startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
      startOfTomorrow.setHours(0, 0, 0, 0);
      
      // End of tomorrow
      const endOfTomorrow = new Date(startOfTomorrow);
      endOfTomorrow.setHours(23, 59, 59, 999);
      
      return dueDate >= startOfTomorrow && dueDate <= endOfTomorrow;
    });
    
    // Words due after tomorrow
    const laterWords = allWords.filter(word => {
      if (!word.due) return false;
      
      const dueDate = new Date(word.due);
      
      // Start of day after tomorrow
      const dayAfterTomorrow = new Date(now);
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      dayAfterTomorrow.setHours(0, 0, 0, 0);
      
      return dueDate >= dayAfterTomorrow;
    });
    
    // Combine today, shortTerm and later today words for immediate review
    return {
      today: [...todayWords, ...shortTermWords],
      tomorrow: [...laterTodayWords, ...tomorrowWords],
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

