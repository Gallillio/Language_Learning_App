"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface Word {
  id: number
  word: string
  meaning: string
  exampleSentence?: string
  exampleSentenceTranslation?: string // Add new field
  confidence: number // 1-5
  learned: boolean // true if fully learned, false if still learning
  nextReview?: Date // Date when the word should be reviewed next
}

interface WordBankContextType {
  learningWords: Word[]
  learnedWords: Word[]
  addWord: (word: Omit<Word, "id" | "nextReview">) => void
  updateWord: (id: number, updates: Partial<Omit<Word, "id">>) => void // Add update function
  updateConfidence: (id: number, confidence: number) => void
  markAsLearned: (id: number) => void
  unmarkAsLearned: (id: number, confidence: number) => void // Add new function
  getWordStatus: (word: string) => { inBank: boolean; confidence: number; learned: boolean; meaning?: string } | null
  scheduleReview: (wordId: number, minutes: number) => void
  getWordsForReview: () => { today: Word[]; tomorrow: Word[]; later: Word[] }
}

const WordBankContext = createContext<WordBankContextType | undefined>(undefined)

export function WordBankProvider({ children }: { children: ReactNode }) {
  const [learningWords, setLearningWords] = useState<Word[]>([
    {
      id: 1,
      word: "bonjour",
      meaning: "hello",
      exampleSentence: "Bonjour, comment allez-vous?",
      exampleSentenceTranslation: "Hello, how are you?",
      confidence: 5,
      learned: false,
      nextReview: new Date(),
    },
    {
      id: 2,
      word: "merci",
      meaning: "thank you",
      exampleSentence: "Merci beaucoup pour votre aide.",
      exampleSentenceTranslation: "Thank you very much for your help.",
      confidence: 4,
      learned: false,
      nextReview: new Date(),
    },
    {
      id: 3,
      word: "au revoir",
      meaning: "goodbye",
      exampleSentence: "Au revoir, à demain!",
      exampleSentenceTranslation: "Goodbye, see you tomorrow!",
      confidence: 3,
      learned: false,
      nextReview: new Date(),
    },
    {
      id: 4,
      word: "s'il vous plaît",
      meaning: "please",
      exampleSentence: "S'il vous plaît, pouvez-vous m'aider?",
      exampleSentenceTranslation: "Please, can you help me?",
      confidence: 2,
      learned: false,
      nextReview: new Date(),
    },
    {
      id: 5,
      word: "enchanté",
      meaning: "pleased to meet you",
      exampleSentence: "Enchanté de faire votre connaissance.",
      exampleSentenceTranslation: "Pleased to meet you.",
      confidence: 1,
      learned: false,
      nextReview: new Date(),
    },
    {
      id: 6,
      word: "soleil",
      meaning: "sun",
      exampleSentence: "Le soleil brille aujourd'hui.",
      exampleSentenceTranslation: "The sun is shining today.",
      confidence: 5,
      learned: false,
      nextReview: new Date(Date.now() + 86400000),
    }, // tomorrow
    {
      id: 7,
      word: "marché",
      meaning: "market",
      exampleSentence: "Je vais au marché pour acheter des légumes.",
      exampleSentenceTranslation: "I'm going to the market to buy vegetables.",
      confidence: 4,
      learned: false,
      nextReview: new Date(Date.now() + 86400000),
    }, // tomorrow
    {
      id: 8,
      word: "pain",
      meaning: "bread",
      exampleSentence: "J'achète du pain frais tous les matins.",
      exampleSentenceTranslation: "I buy fresh bread every morning.",
      confidence: 3,
      learned: false,
      nextReview: new Date(Date.now() + 172800000),
    }, // day after tomorrow
    {
      id: 9,
      word: "fromage",
      meaning: "cheese",
      exampleSentence: "La France est connue pour ses fromages.",
      exampleSentenceTranslation: "France is known for its cheeses.",
      confidence: 2,
      learned: false,
      nextReview: new Date(Date.now() + 172800000),
    }, // day after tomorrow
    {
      id: 10,
      word: "belle",
      meaning: "beautiful",
      exampleSentence: "C'est une belle journée.",
      exampleSentenceTranslation: "It's a beautiful day.",
      confidence: 1,
      learned: false,
      nextReview: new Date(Date.now() + 172800000),
    }, // day after tomorrow
  ])

  const [learnedWords, setLearnedWords] = useState<Word[]>([
    {
      id: 101,
      word: "oui",
      meaning: "yes",
      exampleSentence: "Oui, je comprends.",
      exampleSentenceTranslation: "Yes, I understand.",
      confidence: 5,
      learned: true,
    },
    {
      id: 102,
      word: "non",
      meaning: "no",
      exampleSentence: "Non, je ne suis pas d'accord.",
      exampleSentenceTranslation: "No, I don't agree.",
      confidence: 5,
      learned: true,
    },
    {
      id: 103,
      word: "et",
      meaning: "and",
      exampleSentence: "J'aime le café et le thé.",
      exampleSentenceTranslation: "I like coffee and tea.",
      confidence: 5,
      learned: true,
    },
    {
      id: 104,
      word: "dans",
      meaning: "in",
      exampleSentence: "Le livre est dans mon sac.",
      exampleSentenceTranslation: "The book is in my bag.",
      confidence: 5,
      learned: true,
    },
    {
      id: 105,
      word: "le",
      meaning: "the (masculine)",
      exampleSentence: "Le chat dort sur le canapé.",
      exampleSentenceTranslation: "The cat is sleeping on the sofa.",
      confidence: 5,
      learned: true,
    },
    {
      id: 106,
      word: "la",
      meaning: "the (feminine)",
      exampleSentence: "La maison est grande.",
      exampleSentenceTranslation: "The house is big.",
      confidence: 5,
      learned: true,
    },
  ])

  const addWord = (word: Omit<Word, "id" | "nextReview">) => {
    const newWord = {
      ...word,
      id: Date.now(),
      nextReview: new Date(), // Set to review immediately
    }

    if (word.learned) {
      setLearnedWords((prev) => [...prev, newWord as Word])
    } else {
      setLearningWords((prev) => [...prev, newWord as Word])
    }
  }

  // Enhanced updateWord function to update all fields
  const updateWord = (id: number, updates: Partial<Omit<Word, "id">>) => {
    // Check if word is in learning words
    const learningWordIndex = learningWords.findIndex((w) => w.id === id)
    if (learningWordIndex !== -1) {
      const updatedWords = [...learningWords]
      updatedWords[learningWordIndex] = { ...updatedWords[learningWordIndex], ...updates }
      setLearningWords(updatedWords)
      return
    }

    // Check if word is in learned words
    const learnedWordIndex = learnedWords.findIndex((w) => w.id === id)
    if (learnedWordIndex !== -1) {
      const updatedWords = [...learnedWords]
      updatedWords[learnedWordIndex] = { ...updatedWords[learnedWordIndex], ...updates }
      setLearnedWords(updatedWords)
    }
  }

  const updateConfidence = (id: number, confidence: number) => {
    setLearningWords((prev) => prev.map((word) => (word.id === id ? { ...word, confidence } : word)))
  }

  const markAsLearned = (id: number) => {
    const wordToMove = learningWords.find((w) => w.id === id)

    if (wordToMove) {
      // Remove from learning words
      setLearningWords((prev) => prev.filter((w) => w.id !== id))

      // Add to learned words
      setLearnedWords((prev) => [...prev, { ...wordToMove, learned: true, confidence: 5 }])
    }
  }

  // Add unmarkAsLearned function to move words from learned to learning
  const unmarkAsLearned = (id: number, confidence: number) => {
    const wordToMove = learnedWords.find((w) => w.id === id)

    if (wordToMove) {
      // Remove from learned words
      setLearnedWords((prev) => prev.filter((w) => w.id !== id))

      // Add to learning words with specified confidence
      setLearningWords((prev) => [...prev, { ...wordToMove, learned: false, confidence, nextReview: new Date() }])
    }
  }

  const scheduleReview = (wordId: number, minutes: number) => {
    const nextReview = new Date(Date.now() + minutes * 60 * 1000)

    setLearningWords((prev) => prev.map((word) => (word.id === wordId ? { ...word, nextReview } : word)))
  }

  const getWordsForReview = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const dayAfterTomorrow = new Date(tomorrow)
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1)

    const today: Word[] = []
    const tomorrowWords: Word[] = []
    const later: Word[] = []

    learningWords.forEach((word) => {
      if (!word.nextReview) {
        today.push(word)
      } else if (word.nextReview <= now) {
        today.push(word)
      } else if (word.nextReview < tomorrow) {
        today.push(word)
      } else if (word.nextReview < dayAfterTomorrow) {
        tomorrowWords.push(word)
      } else {
        later.push(word)
      }
    })

    return { today, tomorrow: tomorrowWords, later }
  }

  const getWordStatus = (word: string) => {
    // Check if word is in learning words
    const learningWord = learningWords.find((w) => w.word.toLowerCase() === word.toLowerCase())
    if (learningWord) {
      return {
        inBank: true,
        confidence: learningWord.confidence,
        learned: false,
        meaning: learningWord.meaning,
      }
    }

    // Check if word is in learned words
    const learnedWord = learnedWords.find((w) => w.word.toLowerCase() === word.toLowerCase())
    if (learnedWord) {
      return {
        inBank: true,
        confidence: 5,
        learned: true,
        meaning: learnedWord.meaning,
      }
    }

    // Word not found in either bank
    return null
  }

  return (
    <WordBankContext.Provider
      value={{
        learningWords,
        learnedWords,
        addWord,
        updateWord,
        updateConfidence,
        markAsLearned,
        unmarkAsLearned,
        getWordStatus,
        scheduleReview,
        getWordsForReview,
      }}
    >
      {children}
    </WordBankContext.Provider>
  )
}

export function useWordBank() {
  const context = useContext(WordBankContext)
  if (context === undefined) {
    throw new Error("useWordBank must be used within a WordBankProvider")
  }
  return context
}

