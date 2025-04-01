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
  scheduleReview: (id: number, minutes: number) => void
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
      const updatedWord = { ...word!, confidence, learned: confidence >= 5 };
      
      // If word became fully learned (confidence 5)
      if (updatedWord.learned) {
        // Remove from learning words
        setLearningWords(prev => prev.filter(w => w.id !== id));
        
        // Add to learned words
        setLearnedWords(prev => {
          const exists = prev.some(w => w.id === id);
          return exists 
            ? prev.map(w => w.id === id ? updatedWord : w)
            : [...prev, updatedWord];
        });
      } else {
        // Update in learning words
        setLearningWords(prev => prev.map(w => w.id === id ? updatedWord : w));
        
        // Remove from learned words if it was there
        setLearnedWords(prev => prev.filter(w => w.id !== id));
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

  // Schedule a review for a word
  const scheduleReview = (id: number, minutes: number) => {
    console.log(`Scheduling review for word ID ${id} in ${minutes} minutes`);
    // In a real implementation, we would update the last_practiced date
    // and store the next review time, but for now we'll just log it
  };

  // Get words for review
  const getWordsForReview = () => {
    // Return dummy groups for now - this would normally be based on review dates
    return {
      today: [...learningWords].slice(0, 5),
      tomorrow: [...learningWords].slice(5, 10), 
      later: [...learnedWords].slice(0, 5)
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

