"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useWordBank, type Word } from "@/contexts/word-bank-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { FSRS, Rating } from "fsrs.js"
import {
  ArrowRight,
  RotateCcw,
  Clock,
  CalendarDays,
  BarChart4,
  Brain,
  ThumbsDown,
  ThumbsUp,
  CheckCircle2,
  Timer
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

export default function FlashCardsMode() {
  // State for cards and UI
  const [isFlipped, setIsFlipped] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewComplete, setReviewComplete] = useState(false)
  const [cardStack, setCardStack] = useState<Word[]>([])
  const [pendingReviews, setPendingReviews] = useState<{word: Word, dueTime: Date}[]>([])
  const [totalCards, setTotalCards] = useState(0)
  const [reviewedCount, setReviewedCount] = useState(0)
  const [showStats, setShowStats] = useState(false)
  const [statsData, setStatsData] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0
  })

  // Timer ref for checking pending reviews
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Get word bank context
  const { getWordsForReview, scheduleReview } = useWordBank()

  // Initialize FSRS for predictions
  const fsrs = new FSRS()
  
  // Load cards
  useEffect(() => {
    const words = getWordsForReview().today
    setCardStack(words)
    setTotalCards(words.length)
    return () => {
      // Clean up timer on unmount
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [getWordsForReview])

  // Set up interval to check for pending reviews
  useEffect(() => {
    // Check every 5 seconds if there are cards due for re-review
    timerRef.current = setInterval(() => {
      const now = new Date()
      
      // Find cards that are due for review
      const dueCards = pendingReviews.filter(item => item.dueTime <= now)
      
      if (dueCards.length > 0) {
        // Add due cards back to the review stack
        setCardStack(prevStack => [...prevStack, ...dueCards.map(item => item.word)])
        
        // Remove these cards from pending reviews
        setPendingReviews(prev => prev.filter(item => item.dueTime > now))
        
        // Update total cards count
        setTotalCards(prev => prev + dueCards.length)
      }
    }, 5000)
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [pendingReviews])

  // Handler to flip the card
  const handleFlip = () => {
    if (cardStack.length === 0) return
    setIsFlipped(!isFlipped)
  }

  // Get the current card
  const currentCard = cardStack[currentIndex]
  
  // Calculate when cards will be shown again based on rating
  const getPredictedInterval = (rating: Rating): { text: string, dueDate: Date | null } => {
    if (!currentCard) return { text: "", dueDate: null }
    
    try {
      const now = new Date()
      
      // Create a card object for prediction
      const card = {
        due: currentCard.due ? new Date(currentCard.due) : now,
        stability: currentCard.stability ?? 0,
        difficulty: currentCard.difficulty ?? 0.3,
        elapsed_days: currentCard.elapsed_days ?? 0,
        scheduled_days: currentCard.scheduled_days ?? 0,
        reps: currentCard.reps ?? 0,
        lapses: currentCard.lapses ?? 0,
        state: currentCard.state ?? 0,
        last_review: currentCard.last_review ? new Date(currentCard.last_review) : now
      }
      
      // Get prediction from FSRS
      const result = fsrs.repeat(card, now)
      const prediction = result[rating]?.card
      
      if (!prediction || !prediction.due) return { text: "unknown", dueDate: null }
      
      // Calculate the time difference
      const diff = prediction.due.getTime() - now.getTime()
      const diffMinutes = Math.floor(diff / (1000 * 60))
      
      // Format nicely
      let text = "unknown"
      if (diffMinutes < 1) text = "< 1 min"
      else if (diffMinutes < 60) text = `${diffMinutes} min`
      else if (diffMinutes < 60 * 24) {
        const hours = Math.floor(diffMinutes / 60)
        text = `${hours} ${hours === 1 ? 'hour' : 'hours'}`
      }
      else if (diffMinutes < 60 * 24 * 30) {
        const days = Math.floor(diffMinutes / (60 * 24))
        text = `${days} ${days === 1 ? 'day' : 'days'}`
      }
      else if (diffMinutes < 60 * 24 * 365) {
        const months = Math.floor(diffMinutes / (60 * 24 * 30))
        text = `${months} ${months === 1 ? 'month' : 'months'}`
      }
      else {
        const years = Math.floor(diffMinutes / (60 * 24 * 365))
        text = `${years} ${years === 1 ? 'year' : 'years'}`
      }
      
      return { text, dueDate: prediction.due }
    } catch (error) {
      console.error("Prediction error:", error)
      return { text: "unknown", dueDate: null }
    }
  }
  
  // Check if session is truly complete (no cards left to review and no pending reviews)
  const isSessionComplete = () => {
    return cardStack.length === 0 && pendingReviews.length === 0
  }
  
  // Handle rating a card
  const handleRate = (quality: number) => {
    if (!currentCard) return
    
    // Update stats
    setStatsData(prev => {
      const key = quality === 1 ? 'again' : quality === 2 ? 'hard' : quality === 3 ? 'good' : 'easy'
      return { ...prev, [key]: prev[key] + 1 }
    })
    
    // Increment reviewed count
    setReviewedCount(prev => prev + 1)
    
    // Schedule the review
    scheduleReview(currentCard.id, quality)
    
    // Check if this card should be reviewed again in this session
    const rating = quality === 1 ? Rating.Again : 
                   quality === 2 ? Rating.Hard : 
                   quality === 3 ? Rating.Good : Rating.Easy
    
    const prediction = getPredictedInterval(rating)
    
    // If the card is due within 15 minutes, add it to pending reviews
    const predictionDueDate = prediction.dueDate;
    if (predictionDueDate) {
      const now = new Date()
      const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000)
      
      if (predictionDueDate <= fifteenMinutesLater) {
        // Now we're using the narrowed type that TypeScript recognizes as Date (not Date | null)
        setPendingReviews(prev => [...prev, { 
          word: currentCard,
          dueTime: predictionDueDate
        }])
      }
    }
    
    // Remove the current card from the stack
    const updatedStack = [...cardStack]
    updatedStack.splice(currentIndex, 1)
    setCardStack(updatedStack)
    
    // Reset flip state
      setIsFlipped(false)
    
    // Move to the next card or end session if done
    if (updatedStack.length > 0) {
      // If we removed the last card, go back to the beginning
      if (currentIndex >= updatedStack.length) {
        setCurrentIndex(0)
      }
      // Otherwise stay at the same index (which now points to the next card)
    } else {
      // Check if there are pending reviews
      if (pendingReviews.length > 0) {
        // Show a message that we're waiting for cards to be due
        setReviewComplete(false)
        // The interval will add cards back when they're due
      } else {
        // All done!
        setReviewComplete(true)
      }
    }
  }
  
  // Formatting helpers
  const formatDifficulty = (difficulty?: number) => {
    if (difficulty === undefined) return "Medium"
    const pct = Math.round((difficulty || 0.5) * 100)
    if (pct < 30) return "Easy"
    if (pct < 70) return "Medium"
    return "Difficult"
  }
  
  const getDifficultyColor = (difficulty?: number) => {
    if (difficulty === undefined) return "bg-blue-500"
    const pct = Math.round((difficulty || 0.5) * 100)
    if (pct < 30) return "bg-green-500" 
    if (pct < 70) return "bg-amber-500"
    return "bg-red-500"
  }
  
  // Waiting screen for pending reviews
  if (cardStack.length === 0 && pendingReviews.length > 0) {
    // Find the next card's due time
    const sortedReviews = [...pendingReviews].sort((a, b) => 
      a.dueTime.getTime() - b.dueTime.getTime()
    )
    
    const nextDueTime = sortedReviews[0].dueTime
    const now = new Date()
    const waitTimeMs = Math.max(0, nextDueTime.getTime() - now.getTime())
    const waitTimeSeconds = Math.ceil(waitTimeMs / 1000)
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 max-w-md">
          <Timer className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Cards Coming Soon</h2>
          <p className="text-gray-600 mb-6">
            {pendingReviews.length} card{pendingReviews.length > 1 ? 's' : ''} will be ready for review soon.
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-blue-700">
              Next card in: <span className="font-bold">{waitTimeSeconds} seconds</span>
            </p>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            The cards you marked for quick review will appear here when they're due.
          </p>
          
          <Button variant="outline" onClick={() => window.location.reload()}>
            Restart Session
          </Button>
        </div>
      </div>
    )
  }
  
  // If there are no cards to review
  if (cardStack.length === 0 && pendingReviews.length === 0 && !reviewComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 max-w-md">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">All Done!</h2>
          <p className="text-gray-600 mb-6">
            You've completed all your reviews for today. Check back later for more cards.
          </p>
          <Button onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    )
  }
  
  // If review is complete
  if (reviewComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 max-w-md">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Review Complete!</h2>
          <p className="text-gray-600 mb-6">
            You've reviewed all {reviewedCount} cards in this session.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-100 p-4 rounded-lg">
              <ThumbsDown className="h-5 w-5 text-red-500 mb-1 mx-auto" />
              <p className="text-sm text-gray-700">Again: {statsData.again}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <ThumbsUp className="h-5 w-5 text-orange-500 mb-1 mx-auto" />
              <p className="text-sm text-gray-700">Hard: {statsData.hard}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <ThumbsUp className="h-5 w-5 text-green-500 mb-1 mx-auto" />
              <p className="text-sm text-gray-700">Good: {statsData.good}</p>
            </div>
            <div className="bg-gray-100 p-4 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-blue-500 mb-1 mx-auto" />
              <p className="text-sm text-gray-700">Easy: {statsData.easy}</p>
            </div>
          </div>
          
          <Button onClick={() => window.location.reload()}>
            Start New Session
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Progress bar */}
      <div className="mb-4 flex items-center gap-2">
        <Progress value={(reviewedCount / (totalCards + pendingReviews.length)) * 100} className="h-2" />
        <span className="text-sm text-gray-500">
          {reviewedCount}/{totalCards + pendingReviews.length}
        </span>
        
        {pendingReviews.length > 0 && (
          <span className="text-xs text-blue-500 ml-2">
            + {pendingReviews.length} pending
                    </span>
        )}
                  </div>

      {/* Card */}
      <div className="perspective-1000 my-8 h-[400px]">
                  <motion.div
          className="w-full h-full cursor-pointer relative"
                    onClick={handleFlip}
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5 }}
                    style={{ transformStyle: "preserve-3d" }}
                  >
          {/* Front of card */}
          <div 
            className={`absolute w-full h-full backface-hidden rounded-xl p-8 flex flex-col 
              ${isFlipped ? 'opacity-0' : 'opacity-100'} bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl`}
          >
            <div className="flex justify-between mb-4">
              <div className="text-xs flex items-center gap-1">
                <Brain className="h-3 w-3" />
                <span>Difficulty: {formatDifficulty(currentCard?.difficulty)}</span>
              </div>
              <div className="text-xs flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Rep #{currentCard?.reps || 0}</span>
                        </div>
                      </div>
            
            <div className="flex-grow flex flex-col items-center justify-center">
              <h2 className="text-4xl font-bold mb-8 text-center">{currentCard?.word}</h2>
              
              {currentCard?.exampleSentence && (
                <p className="text-lg italic mb-4 text-center max-w-md">
                  "{currentCard.exampleSentence}"
                        </p>
                      )}
            </div>

            <p className="text-center text-white/70 text-sm mt-8">Tap to reveal meaning</p>
                    </div>

          {/* Back of card */}
                    <div
            className={`absolute w-full h-full backface-hidden rounded-xl p-8 flex flex-col 
              ${isFlipped ? 'opacity-100' : 'opacity-0'} bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-xl`}
                      style={{ transform: "rotateY(180deg)" }}
                    >
            <div className="flex justify-between mb-4">
              <div className="text-xs flex items-center gap-1">
                <BarChart4 className="h-3 w-3" />
                <span>Stability: {(currentCard?.stability || 0).toFixed(1)}</span>
              </div>
              <div className="text-xs flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                <span>State: {currentCard?.state === 0 ? 'New' : 
                  currentCard?.state === 1 ? 'Learning' : 
                  currentCard?.state === 2 ? 'Review' : 'Relearning'}</span>
                        </div>
                      </div>
            
            <div className="flex-grow flex flex-col items-center justify-center">
              <h3 className="text-xl font-medium mb-2 text-white/80">{currentCard?.word}</h3>
              <p className="text-3xl font-bold mb-6 text-center">{currentCard?.meaning}</p>
              
              {currentCard?.exampleSentence && (
                <div className="mt-2 text-center max-w-md">
                  <p className="text-lg italic">{currentCard.exampleSentence}</p>
                  {currentCard?.exampleSentenceTranslation && (
                    <p className="text-base mt-1">{currentCard.exampleSentenceTranslation}</p>
                          )}
                        </div>
                      )}
            </div>

            <p className="text-center text-white/70 text-sm mt-8">Tap to return to question</p>
                    </div>
                  </motion.div>
                </div>

      {/* Rating buttons */}
      <AnimatePresence>
        {isFlipped && (
          <motion.div 
            className="grid grid-cols-4 gap-3 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Button 
              variant="outline" 
              className="flex flex-col h-auto py-3 border-red-300 hover:bg-red-50 hover:text-red-600"
              onClick={() => handleRate(1)}
            >
              <span className="text-red-500 font-bold">Again</span>
              <span className="text-xs mt-1 text-gray-500">({getPredictedInterval(Rating.Again).text})</span>
            </Button>
            
                  <Button
                    variant="outline"
              className="flex flex-col h-auto py-3 border-orange-300 hover:bg-orange-50 hover:text-orange-600"
              onClick={() => handleRate(2)}
                  >
              <span className="text-orange-500 font-bold">Hard</span>
              <span className="text-xs mt-1 text-gray-500">({getPredictedInterval(Rating.Hard).text})</span>
                  </Button>

                  <Button
                    variant="outline"
              className="flex flex-col h-auto py-3 border-green-300 hover:bg-green-50 hover:text-green-600"
              onClick={() => handleRate(3)}
                  >
              <span className="text-green-500 font-bold">Good</span>
              <span className="text-xs mt-1 text-gray-500">({getPredictedInterval(Rating.Good).text})</span>
                  </Button>
            
            <Button 
              variant="outline" 
              className="flex flex-col h-auto py-3 border-blue-300 hover:bg-blue-50 hover:text-blue-600"
              onClick={() => handleRate(4)}
            >
              <span className="text-blue-500 font-bold">Easy</span>
              <span className="text-xs mt-1 text-gray-500">({getPredictedInterval(Rating.Easy).text})</span>
                      </Button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* FSRS Info */}
      <div className="mt-6 px-4 py-3 bg-gray-50 rounded-lg text-sm text-gray-600">
        <div className="flex items-start gap-2">
          <Timer className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium">FSRS Spaced Repetition</h4>
            <p className="text-xs mt-1">
              This system uses AI to predict when you'll forget and schedules reviews at the optimal time.
              The algorithm adapts to your learning habits to maximize memory retention with minimal reviews.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}