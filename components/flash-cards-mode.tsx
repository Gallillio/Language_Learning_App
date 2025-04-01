"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Clock, Calendar, CalendarDays, Star, Edit, Trash2, Info, History as HistoryIcon } from "lucide-react"
import { useWordBank, type Word } from "@/contexts/word-bank-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Update the component signature to accept props
export default function FlashCardsMode({
  state = { activeTab: "today" },
  setState = () => {},
}: {
  state?: { activeTab: string }
  setState?: (state: { activeTab: string }) => void
} = {}) {
  // Replace the activeTab state with a derived state from props
  const [activeTab, setActiveTab] = useState(state.activeTab)

  // Update the tab change handler
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setState({ activeTab: value })
  }

  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [reviewGroups, setReviewGroups] = useState<{ today: Word[]; tomorrow: Word[]; later: Word[] }>({
    today: [],
    tomorrow: [],
    later: [],
  })
  const { scheduleReview, getWordsForReview, updateWord, deleteWord } = useWordBank()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [editedMeaning, setEditedMeaning] = useState("")
  const [editedExampleSentence, setEditedExampleSentence] = useState("")
  const [editedExampleSentenceTranslation, setEditedExampleSentenceTranslation] = useState("")
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [historyWord, setHistoryWord] = useState<Word | null>(null)

  useEffect(() => {
    // Get words for review
    const groups = getWordsForReview()
    setReviewGroups(groups)
    setCurrentCardIndex(0)
    setIsFlipped(false)
  }, [getWordsForReview])
  
  // Add an effect to ensure currentCardIndex is valid
  useEffect(() => {
    // Reset currentCardIndex if it's out of bounds
    if (reviewGroups.today.length === 0) {
      setCurrentCardIndex(0);
    } else if (currentCardIndex >= reviewGroups.today.length) {
      setCurrentCardIndex(reviewGroups.today.length - 1);
    }
  }, [reviewGroups.today, currentCardIndex]);

  const handleFlip = () => {
    // Only flip if there are cards to review
    if (reviewGroups.today.length === 0 || !reviewGroups.today[currentCardIndex]) return;
    setIsFlipped(!isFlipped);
  }

  const handleAgain = () => {
    // Safety check to ensure there are cards to review
    if (reviewGroups.today.length === 0 || !reviewGroups.today[currentCardIndex]) return;

    const currentWord = reviewGroups.today[currentCardIndex];

    // Schedule for review with quality 1 (Again)
    scheduleReview(currentWord.id, 1);

    // Remove the current card from today's stack temporarily
    const updatedToday = [...reviewGroups.today];
    updatedToday.splice(currentCardIndex, 1);

    setReviewGroups({
      ...reviewGroups,
      today: updatedToday,
    });

    // Check if this was the last card
    if (updatedToday.length > 0) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex >= updatedToday.length ? 0 : currentCardIndex);
      }, 300);
    } else {
      // No more cards for now
      setCurrentCardIndex(0);
      setIsFlipped(false);
    }

    // Set up a timer to refresh the review groups after a minute
    // This will bring back the card that was just marked as "Again"
    setTimeout(() => {
      const updatedGroups = getWordsForReview();
      setReviewGroups(updatedGroups);
    }, 65 * 1000); // 65 seconds to ensure the 1-minute delay has passed
  };

  const handleGood = () => {
    // Safety check to ensure there are cards to review
    if (reviewGroups.today.length === 0 || !reviewGroups.today[currentCardIndex]) return;

    const currentWord = reviewGroups.today[currentCardIndex];

    // Schedule for review with quality 4 (Good)
    scheduleReview(currentWord.id, 4);

    // Remove the card from today's review if it's not scheduled for immediate review
    const wasFirstGood = (currentWord.repetitions ?? 0) === 0;
    
    if (wasFirstGood) {
      // For first "Good", it will be scheduled in 10 minutes, so keep it in the review stack
      // but move to the next card
      if (currentCardIndex < reviewGroups.today.length - 1) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentCardIndex(currentCardIndex + 1);
        }, 300);
      } else {
        // Refresh the review groups
        const groups = getWordsForReview();
        setReviewGroups(groups);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    } else {
      // For later "Good" ratings, remove from today's stack
      const updatedToday = [...reviewGroups.today];
      updatedToday.splice(currentCardIndex, 1);

      setReviewGroups({
        ...reviewGroups,
        today: updatedToday,
      });

      // Move to next card or reset if this was the last card
      if (updatedToday.length > 0) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentCardIndex(currentCardIndex >= updatedToday.length ? 0 : currentCardIndex);
        }, 300);
      } else {
        // No more cards for today
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    }
  };

  const getConfidenceColor = (confidence: number, learned: boolean) => {
    if (learned) return "text-green-600"

    switch (confidence) {
      case 1:
        return "text-red-500"
      case 2:
        return "text-orange-500"
      case 3:
        return "text-amber-500"
      case 4:
        return "text-blue-500"
      case 5:
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  const getConfidenceBadgeClass = (confidence: number, learned: boolean) => {
    const baseClass = "flex items-center gap-1 px-2 py-1 rounded-full font-bold text-white"

    if (learned) return `${baseClass} bg-green-600`

    switch (confidence) {
      case 1:
        return `${baseClass} bg-red-500`
      case 2:
        return `${baseClass} bg-orange-500`
      case 3:
        return `${baseClass} bg-amber-500`
      case 4:
        return `${baseClass} bg-blue-500`
      case 5:
        return `${baseClass} bg-green-500`
      default:
        return `${baseClass} bg-gray-500`
    }
  }

  const handleEditClick = (word: Word, e?: React.MouseEvent) => {
    if (e) e.stopPropagation() // Prevent card flip if event is provided
    setEditingWord(word)
    setEditedMeaning(word.meaning)
    setEditedExampleSentence(word.exampleSentence || "")
    setEditedExampleSentenceTranslation(word.exampleSentenceTranslation || "")
    setIsEditDialogOpen(true)
  }

  const handleHistoryClick = (word: Word, e?: React.MouseEvent) => {
    if (e) e.stopPropagation() // Prevent card flip if event is provided
    setHistoryWord(word)
    setIsHistoryDialogOpen(true)
  }

  // Format the next review date in a user-friendly way
  const formatNextReview = (dateString?: string) => {
    if (!dateString) return "Not scheduled";
    
    const reviewDate = new Date(dateString);
    const now = new Date();
    const diffTime = reviewDate.getTime() - now.getTime();
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffMinutes <= 0) return "Now";
    if (diffMinutes < 60) return `${diffMinutes} minutes`;
    if (diffMinutes < 120) return `1 hour`;
    if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)} hours`;
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 7) return `${diffDays} days`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
    return `${Math.floor(diffDays / 30)} months`;
  }
  
  // Display interval information in a user-friendly way
  const formatInterval = (interval?: number) => {
    if (!interval) {
      // For intervals under 1 day, check if there's a next_review_date and calculate minutes
      const currentWord = reviewGroups.today[currentCardIndex];
      if (currentWord?.next_review_date) {
        const reviewDate = new Date(currentWord.next_review_date);
        const now = new Date();
        const diffMinutes = Math.ceil((reviewDate.getTime() - now.getTime()) / (1000 * 60));
        
        if (diffMinutes <= 0) return "Now";
        if (diffMinutes < 60) return `${diffMinutes} minutes`;
        if (diffMinutes < 120) return `1 hour`;
        if (diffMinutes < 24 * 60) return `${Math.floor(diffMinutes / 60)} hours`;
      }
      return "New card";
    }
    
    if (interval === 1) return "1 day";
    if (interval < 7) return `${interval} days`;
    if (interval < 30) return `${Math.floor(interval / 7)} weeks`;
    if (interval < 365) return `${Math.floor(interval / 30)} months`;
    return `${Math.floor(interval / 365)} years`;
  }

  const handleSaveEdit = () => {
    if (editingWord) {
      updateWord(editingWord.id, {
        meaning: editedMeaning,
        exampleSentence: editedExampleSentence,
        exampleSentenceTranslation: editedExampleSentenceTranslation,
      })

      // Update the current card if it's the one being edited
      if (reviewGroups.today.length > 0 && reviewGroups.today[currentCardIndex].id === editingWord.id) {
        const updatedToday = [...reviewGroups.today]
        updatedToday[currentCardIndex] = {
          ...updatedToday[currentCardIndex],
          meaning: editedMeaning,
          exampleSentence: editedExampleSentence,
          exampleSentenceTranslation: editedExampleSentenceTranslation,
        }
        setReviewGroups({
          ...reviewGroups,
          today: updatedToday,
        })
      }

      setIsEditDialogOpen(false)
      setEditingWord(null)
    }
  }

  const handleDeleteClick = (word: Word, e?: React.MouseEvent) => {
    if (e) e.stopPropagation() // Prevent card flip if event is provided
    setConfirmDeleteId(word.id)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (confirmDeleteId) {
      await deleteWord(confirmDeleteId)
      
      // Refresh the review groups
      const groups = getWordsForReview()
      setReviewGroups(groups)
      
      // Reset current card if needed
      if (reviewGroups.today.length <= currentCardIndex) {
        setCurrentCardIndex(0)
      }
      
      setIsDeleteDialogOpen(false)
      setConfirmDeleteId(null)
    }
  }

  // Get a human-readable description of a quality rating
  const getQualityDescription = (quality: number) => {
    switch (quality) {
      case 1: return "Again";
      case 2: return "Hard";
      case 3: return "Hard";
      case 4: return "Good";
      case 5: return "Easy";
      default: return "Unknown";
    }
  }

  // Get the color class for a quality rating
  const getQualityColorClass = (quality: number) => {
    switch (quality) {
      case 1: return "text-red-500";
      case 2: 
      case 3: return "text-orange-500";
      case 4: return "text-green-500";
      case 5: return "text-blue-500";
      default: return "text-gray-500";
    }
  }

  return (
    <div className="flex flex-col items-center py-8">
      <h2 className="text-3xl font-bold text-center mb-6 text-primary">Flash Cards</h2>

      <div className="w-full max-w-3xl mb-8">
        {/* Update the Tabs component */}
        <Tabs defaultValue="today" className="w-full" onValueChange={handleTabChange} value={activeTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Today ({reviewGroups.today.length})
            </TabsTrigger>
            <TabsTrigger value="tomorrow" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> Tomorrow ({reviewGroups.tomorrow.length})
            </TabsTrigger>
            <TabsTrigger value="later" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" /> Later ({reviewGroups.later.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today">
            {reviewGroups.today.length === 0 ? (
              <Card className="w-full p-8 text-center">
                <p className="text-muted-foreground mb-4">No cards to review today!</p>
                <p>You've completed all your reviews for today. Check back later or review upcoming cards.</p>
              </Card>
            ) : (
              <div className="w-full max-w-2xl mx-auto perspective-1000">
                <div className="relative mb-8">
                  <div className="text-center mb-4">
                    <span className="text-sm text-muted-foreground">
                      Card {currentCardIndex + 1} of {reviewGroups.today.length}
                    </span>
                  </div>

                  {reviewGroups.today[currentCardIndex] ? (
                    <motion.div
                      className="w-full h-96 cursor-pointer"
                      onClick={handleFlip}
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6 }}
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      {/* Front of card (shown first) */}
                      <div
                        className={`absolute w-full h-full backface-hidden rounded-xl p-8 flex flex-col justify-center items-center
                          ${isFlipped ? "opacity-0" : "opacity-100"} bg-gradient-to-br from-blue-400 to-purple-500 text-white shadow-xl`}
                      >
                        <div className="absolute top-4 right-4">
                          <div
                            className={getConfidenceBadgeClass(
                              reviewGroups.today[currentCardIndex].confidence,
                              reviewGroups.today[currentCardIndex].learned,
                            )}
                          >
                            <span>{reviewGroups.today[currentCardIndex].confidence}/5</span>
                            <Star className="h-4 w-4 fill-current" />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 left-20 text-white hover:bg-white/20"
                          onClick={(e) => handleDeleteClick(reviewGroups.today[currentCardIndex], e)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 left-12 text-white hover:bg-white/20"
                          onClick={(e) => handleEditClick(reviewGroups.today[currentCardIndex], e)}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 left-4 text-white hover:bg-white/20"
                          onClick={(e) => handleHistoryClick(reviewGroups.today[currentCardIndex], e)}
                        >
                          <HistoryIcon className="h-5 w-5" />
                        </Button>
                        <h3 className="text-4xl font-bold mb-4">{reviewGroups.today[currentCardIndex].word}</h3>

                        {/* Show example sentence in French on front */}
                        {reviewGroups.today[currentCardIndex].exampleSentence && (
                          <p className="text-lg italic mb-8 text-center">
                            "{reviewGroups.today[currentCardIndex].exampleSentence}"
                          </p>
                        )}

                        <p className="text-sm mt-4 text-blue-100">Click to flip</p>
                      </div>

                      {/* Back of card (shown after flip) */}
                      <div
                        className={`absolute w-full h-full backface-hidden rounded-xl p-8 flex flex-col justify-center items-center
                          ${isFlipped ? "opacity-100" : "opacity-0"} bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-xl`}
                        style={{ transform: "rotateY(180deg)" }}
                      >
                        <div className="absolute top-4 right-4">
                          <div
                            className={getConfidenceBadgeClass(
                              reviewGroups.today[currentCardIndex].confidence,
                              reviewGroups.today[currentCardIndex].learned,
                            )}
                          >
                            <span>{reviewGroups.today[currentCardIndex].confidence}/5</span>
                            <Star className="h-4 w-4 fill-current" />
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 left-20 text-white hover:bg-white/20"
                          onClick={(e) => handleDeleteClick(reviewGroups.today[currentCardIndex], e)}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 left-12 text-white hover:bg-white/20"
                          onClick={(e) => handleEditClick(reviewGroups.today[currentCardIndex], e)}
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-4 left-4 text-white hover:bg-white/20"
                          onClick={(e) => handleHistoryClick(reviewGroups.today[currentCardIndex], e)}
                        >
                          <HistoryIcon className="h-5 w-5" />
                        </Button>
                        <h3 className="text-4xl font-bold mb-2">{reviewGroups.today[currentCardIndex].word}</h3>
                        <p className="text-2xl mb-4">{reviewGroups.today[currentCardIndex].meaning}</p>

                        {/* Show example sentence and translation on back */}
                        {reviewGroups.today[currentCardIndex].exampleSentence && (
                          <div className="mb-4 text-center">
                            <p className="text-lg italic">"{reviewGroups.today[currentCardIndex].exampleSentence}"</p>
                            {reviewGroups.today[currentCardIndex].exampleSentenceTranslation && (
                              <p className="text-md mt-1">
                                "{reviewGroups.today[currentCardIndex].exampleSentenceTranslation}"
                              </p>
                            )}
                          </div>
                        )}
                        
                        {/* SM-2 information */}
                        <div className="flex flex-col items-center mt-2 mb-2 text-xs text-white/80">
                          <div className="flex items-center gap-1 mb-1">
                            <Info className="h-3 w-3" />
                            <span>Current interval: {formatInterval(reviewGroups.today[currentCardIndex].interval)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Next review: {formatNextReview(reviewGroups.today[currentCardIndex].next_review_date)}</span>
                          </div>
                        </div>

                        <p className="text-sm mt-2 text-pink-100">Click to flip back</p>
                      </div>
                    </motion.div>
                  ) : (
                    <Card className="w-full p-8 text-center">
                      <p className="text-muted-foreground mb-4">No card found!</p>
                      <p>There was an issue loading this card. Please refresh the page or check back later.</p>
                    </Card>
                  )}
                </div>

                {/* Answer buttons and spaced repetition information - only show when card is flipped and a card exists */}
                {isFlipped && reviewGroups.today.length > 0 && reviewGroups.today[currentCardIndex] && (
                  <>
                    <div className="flex justify-center gap-4">
                      <Button
                        variant="outline"
                        onClick={handleAgain}
                        className="flex-1 border-red-300 hover:bg-red-50 hover:text-red-600"
                        title="I don't know this word well yet"
                      >
                        Again
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleGood}
                        className="flex-1 border-green-300 hover:bg-green-50 hover:text-green-600"
                        title="I remember this word well"
                      >
                        Good
                      </Button>
                    </div>
                    
                    <div className="mt-4 p-4 bg-slate-100 rounded-md text-xs text-slate-600">
                      <h4 className="font-bold mb-1 flex items-center gap-1">
                        <Info className="h-3 w-3" /> About Spaced Repetition
                      </h4>
                      <p className="mb-1">
                        This flashcard system uses a simplified spaced repetition algorithm to optimize your learning:
                      </p>
                      <ul className="list-disc pl-4 space-y-1">
                        <li><span className="text-red-500 font-bold">Again</span>: Shows the card again in 1 minute (or 10 minutes if you previously rated it "Good")</li>
                        <li><span className="text-green-500 font-bold">Good</span>: Gradually increases intervals as you consistently remember a word (10 min → 1 day → 3 days → 7 days → etc.)</li>
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tomorrow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewGroups.tomorrow.length === 0 ? (
                <Card className="w-full p-8 text-center col-span-2">
                  <p className="text-muted-foreground mb-4">No cards scheduled for tomorrow!</p>
                </Card>
              ) : (
                reviewGroups.tomorrow.map((word) => (
                  <Card key={word.id} className="p-4 relative">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{word.word}</h3>
                      <div className={getConfidenceBadgeClass(word.confidence, word.learned)}>
                        <span>{word.confidence}/5</span>
                        <Star className={`h-4 w-4 fill-current`} />
                      </div>
                    </div>
                    <p>{word.meaning}</p>
                    {word.exampleSentence && <p className="text-sm italic mt-2">"{word.exampleSentence}"</p>}
                    {word.exampleSentenceTranslation && (
                      <p className="text-sm mt-1">"{word.exampleSentenceTranslation}"</p>
                    )}
                    <div className="mt-2 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleHistoryClick(word)}>
                        <HistoryIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(word)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(word)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="later">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviewGroups.later.length === 0 ? (
                <Card className="w-full p-8 text-center col-span-2">
                  <p className="text-muted-foreground mb-4">No cards scheduled for later!</p>
                </Card>
              ) : (
                reviewGroups.later.map((word) => (
                  <Card key={word.id} className="p-4 relative">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-lg">{word.word}</h3>
                      <div className={getConfidenceBadgeClass(word.confidence, word.learned)}>
                        <span>{word.confidence}/5</span>
                        <Star className={`h-4 w-4 fill-current`} />
                      </div>
                    </div>
                    <p>{word.meaning}</p>
                    {word.exampleSentence && <p className="text-sm italic mt-2">"{word.exampleSentence}"</p>}
                    {word.exampleSentenceTranslation && (
                      <p className="text-sm mt-1">"{word.exampleSentenceTranslation}"</p>
                    )}
                    <div className="mt-2 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => handleHistoryClick(word)}>
                        <HistoryIcon className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleEditClick(word)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(word)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Word Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Word</DialogTitle>
            <DialogDescription>Update the information for this word.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="word" className="text-right">
                Word
              </Label>
              <Input id="word" value={editingWord?.word || ""} disabled className="col-span-3 bg-gray-100" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="meaning" className="text-right">
                Meaning
              </Label>
              <Input
                id="meaning"
                value={editedMeaning}
                onChange={(e) => setEditedMeaning(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="example" className="text-right">
                Example
              </Label>
              <Textarea
                id="example"
                value={editedExampleSentence}
                onChange={(e) => setEditedExampleSentence(e.target.value)}
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="translation" className="text-right">
                Translation
              </Label>
              <Textarea
                id="translation"
                value={editedExampleSentenceTranslation}
                onChange={(e) => setEditedExampleSentenceTranslation(e.target.value)}
                className="col-span-3"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Word</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this word? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5" />
              Review History for "{historyWord?.word}"
            </DialogTitle>
            <DialogDescription>
              Review history shows when and how you rated this card in past sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {!historyWord?.history || historyWord.history.length === 0 ? (
              <p className="text-center text-muted-foreground">No review history available for this word.</p>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground flex justify-between px-2 mb-2">
                  <span>Date</span>
                  <span>Rating</span>
                </div>
                {historyWord.history.slice().reverse().map((entry, index) => (
                  <div key={index} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-50">
                    <span>{new Date(entry.date).toLocaleString()}</span>
                    <span className={getQualityColorClass(entry.quality)}>
                      {getQualityDescription(entry.quality)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => setIsHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

