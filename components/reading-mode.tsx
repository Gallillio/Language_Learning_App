"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Book, ArrowLeft, X, Sparkles, Upload, Edit } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useWordBank } from "@/contexts/word-bank-context"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Story {
  id: number
  title: string
  description: string
  wordCount: number
  lastRead: string
  progress: number
  content: string
  wordStats?: {
    notLearned: number
    confidence1: number
    confidence2: number
    confidence3: number
    confidence4: number
    confidence5: number
    mastered: number
    total: number
  }
}

// Add the EditStoryDialog component
interface EditStoryDialogProps {
  isOpen: boolean
  onClose: () => void
  story: Story
  onSave: (updatedStory: Story) => void
}

function EditStoryDialog({ isOpen, onClose, story, onSave }: EditStoryDialogProps) {
  const [title, setTitle] = useState(story.title)
  const [description, setDescription] = useState(story.description)
  const [content, setContent] = useState(story.content)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setTitle(story.title)
      setDescription(story.description)
      setContent(story.content)
    }
  }, [isOpen, story])

  const handleSave = () => {
    if (title.trim() && description.trim() && content.trim()) {
      onSave({
        ...story,
        title,
        description,
        content,
      })
      onClose()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const fileContent = event.target?.result as string
      setContent(fileContent || "")
      setIsImporting(false)
    }
    reader.onerror = () => {
      alert("Error reading file")
      setIsImporting(false)
    }

    reader.readAsText(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Story</DialogTitle>
          <DialogDescription>Update the details of your story.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-title" className="text-right">
              Title
            </Label>
            <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-description" className="text-right">
              Description
            </Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="edit-content" className="text-right mt-2">
              Content
            </Label>
            <div className="col-span-3 space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={triggerFileInput}
                  disabled={isImporting}
                  className="flex items-center gap-1"
                >
                  <Upload className="h-4 w-4" />
                  {isImporting ? "Importing..." : "Import from file"}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".txt,.text,.md"
                  className="hidden"
                />
              </div>
              <Textarea
                id="edit-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="col-span-3"
                rows={12}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSave} disabled={!title || !description || !content}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface WordSidebarProps {
  word: string
  onClose: () => void
  existingWordData?: {
    id: number
    meaning: string
    confidence: number
    learned: boolean
    exampleSentence?: string
    exampleSentenceTranslation?: string
  } | null
  onUpdate: () => void
  tempConfidence: number | null
  setTempConfidence: (value: number | null) => void
  tempLearned: boolean | null
  setTempLearned: (value: boolean | null) => void
}

function WordSidebar({
  word,
  onClose,
  existingWordData,
  onUpdate,
  tempConfidence,
  setTempConfidence,
  tempLearned,
  setTempLearned,
}: WordSidebarProps) {
  const { addWord, updateWord, markAsLearned, unmarkAsLearned } = useWordBank()
  const [meaning, setMeaning] = useState(existingWordData?.meaning || "")
  const [exampleSentence, setExampleSentence] = useState(existingWordData?.exampleSentence || "")
  const [exampleSentenceTranslation, setExampleSentenceTranslation] = useState(
    existingWordData?.exampleSentenceTranslation || "",
  )
  const [confidence, setConfidence] = useState(existingWordData?.confidence || 1)
  const [isLearned, setIsLearned] = useState(existingWordData?.learned || false)
  const [originalConfidence, setOriginalConfidence] = useState(existingWordData?.confidence || 1)
  const [originalLearned, setOriginalLearned] = useState(existingWordData?.learned || false)
  const sidebarRef = useRef<HTMLDivElement>(null)
  const [isChanged, setIsChanged] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showMeaningWarning, setShowMeaningWarning] = useState(false)
  const [hasValidMeaning, setHasValidMeaning] = useState(false)

  // Update hasValidMeaning when meaning changes
  useEffect(() => {
    setHasValidMeaning(!!meaning.trim())
  }, [meaning])

  // Define handleClose before its usage
  const handleClose = useCallback(() => {
    // Reset temporary states to original values
    setTempConfidence(originalConfidence)
    setTempLearned(originalLearned)
    onClose()
  }, [onClose, setTempConfidence, setTempLearned, originalConfidence, originalLearned])

  // Update state when existingWordData changes
  useEffect(() => {
    setMeaning(existingWordData?.meaning || "")
    setExampleSentence(existingWordData?.exampleSentence || "")
    setExampleSentenceTranslation(existingWordData?.exampleSentenceTranslation || "")
    setConfidence(existingWordData?.confidence || 1)
    setIsLearned(existingWordData?.learned || false)
    setOriginalConfidence(existingWordData?.confidence || 1)
    setOriginalLearned(existingWordData?.learned || false)
    setTempConfidence(null)
    setTempLearned(null)
    setIsChanged(false)
  }, [existingWordData, word, setTempConfidence, setTempLearned])

  // Add this useEffect after the existing useEffect that updates state when existingWordData changes
  useEffect(() => {
    // Update the form fields when tempConfidence or tempLearned changes
    if (tempConfidence !== null) {
      setConfidence(tempConfidence)
    }
    if (tempLearned !== null) {
      setIsLearned(tempLearned)
    }

    // If either temp state has changed, mark the form as changed
    if (tempConfidence !== null || tempLearned !== null) {
      setIsChanged(true)
    }
  }, [tempConfidence, tempLearned])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        if (isChanged && hasValidMeaning) {
          setShowWarning(true)
        } else {
          handleClose()
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [meaning, confidence, exampleSentence, exampleSentenceTranslation, isLearned, isChanged, handleClose, hasValidMeaning])

  // Track changes to form fields
  useEffect(() => {
    if (
      meaning !== (existingWordData?.meaning || "") ||
      exampleSentence !== (existingWordData?.exampleSentence || "") ||
      exampleSentenceTranslation !== (existingWordData?.exampleSentenceTranslation || "") ||
      confidence !== (existingWordData?.confidence || 1) ||
      isLearned !== (existingWordData?.learned || false)
    ) {
      setIsChanged(true)
    }
  }, [meaning, exampleSentence, exampleSentenceTranslation, confidence, isLearned, existingWordData])

  const saveAndClose = () => {
    if (!existingWordData && !hasValidMeaning) {
      setShowMeaningWarning(true)
      return
    }
    saveChanges()
    handleClose()
  }

  const saveChanges = () => {
    if (!existingWordData && !hasValidMeaning) {
      setShowMeaningWarning(true)
      return
    }

    if (existingWordData) {
      // Update existing word with all fields
      updateWord(existingWordData.id, {
        meaning,
        exampleSentence,
        exampleSentenceTranslation,
        confidence,
      })

      // If the learned status changed, handle that separately
      if (isLearned !== existingWordData.learned) {
        if (isLearned) {
          markAsLearned(existingWordData.id)
        } else {
          unmarkAsLearned(existingWordData.id, confidence)
        }
      }
    } else if (hasValidMeaning) {
      // Only add new word if meaning is provided
      addWord({
        word,
        meaning,
        exampleSentence,
        exampleSentenceTranslation,
        confidence,
        learned: isLearned,
      })
    }

    // Clear temporary states
    setTempConfidence(null)
    setTempLearned(null)
    onUpdate()
    setIsChanged(false)
  }

  const handleCloseClick = () => {
    if (isChanged && hasValidMeaning) {
      setShowWarning(true)
    } else {
      handleClose()
    }
  }

  const handleMarkAsLearned = () => {
    setIsLearned(true)
    setTempLearned(true)
    setIsChanged(true)
  }

  const handleUnmarkAsLearned = () => {
    setIsLearned(false)
    setTempLearned(false)
    setIsChanged(true)
  }

  const handleConfidenceChange = (level: number) => {
    setConfidence(level)
    setTempConfidence(level)
    setIsChanged(true)

    // If the word is learned and user changes confidence, automatically unmark as learned
    if (isLearned) {
      setIsLearned(false)
      setTempLearned(false)
    }
  }

  const handleGenerateAI = (field: string) => {
    // This is just a placeholder for the AI generation feature
    alert(`AI would generate content for the ${field} field here.`)
  }

  return (
    <>
      <div className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 overflow-y-auto" ref={sidebarRef}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">{existingWordData ? "Edit Word" : "Add New Word"}</h3>
            <Button variant="ghost" size="icon" onClick={handleCloseClick}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="word">Word</Label>
              <Input id="word" value={word} disabled className="bg-gray-100" />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="meaning">Meaning</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleGenerateAI("meaning")}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generate with AI
                </Button>
              </div>
              <Input
                id="meaning"
                placeholder="What does it mean?"
                value={meaning}
                onChange={(e) => setMeaning(e.target.value)}
                className={showMeaningWarning ? "border-red-500" : ""}
              />
              {showMeaningWarning && (
                <p className="text-sm text-red-500 mt-1">Please add a meaning for the word</p>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="example">Example Sentence (optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleGenerateAI("example sentence")}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generate with AI
                </Button>
              </div>
              <Textarea
                id="example"
                placeholder="Write an example sentence using this word"
                value={exampleSentence}
                onChange={(e) => setExampleSentence(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <div className="flex justify-between items-center">
                <Label htmlFor="exampleTranslation">Example Sentence Translation (optional)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs"
                  onClick={() => handleGenerateAI("translation")}
                >
                  <Sparkles className="h-3 w-3 mr-1" />
                  Generate with AI
                </Button>
              </div>
              <Textarea
                id="exampleTranslation"
                placeholder="Translate the example sentence"
                value={exampleSentenceTranslation}
                onChange={(e) => setExampleSentenceTranslation(e.target.value)}
                rows={2}
              />
            </div>

            <div>
              <Label>Confidence Level (1-5)</Label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={confidence === level && !isLearned ? "default" : "outline"}
                    onClick={() => handleConfidenceChange(level)}
                    className="flex-1"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              {isLearned ? (
                <Button onClick={handleUnmarkAsLearned} variant="outline" className="flex-1">
                  Unmark as Mastered
                </Button>
              ) : (
                <Button onClick={handleMarkAsLearned} variant="outline" className="flex-1">
                  Mark as Mastered
                </Button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={saveChanges} variant="default" className="flex-1" disabled={!isChanged}>
                Save Changes
              </Button>
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Dialog */}
      <Dialog open={showWarning} onOpenChange={setShowWarning}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>You have unsaved changes. Do you want to save them before closing?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={handleClose}>
              Discard Changes
            </Button>
            <Button onClick={saveAndClose}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Define SegmentedProgressBar
interface SegmentedProgressBarProps {
  wordStats: {
    notLearned: number
    confidence1: number
    confidence2: number
    confidence3: number
    confidence4: number
    confidence5: number
    mastered: number
    total: number
  }
}

// Update the SegmentedProgressBar component to include tooltips with faster appearance
function SegmentedProgressBar({ wordStats }: SegmentedProgressBarProps) {
  const { notLearned, confidence1, confidence2, confidence3, confidence4, confidence5, mastered, total } = wordStats

  const getPercentage = (value: number) => {
    return (value / total) * 100
  }

  return (
    <div className="flex h-2 rounded-full overflow-hidden">
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-red-200" style={{ width: `${getPercentage(confidence1)}%` }}></div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Confidence Level 1: {confidence1} words</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-orange-200" style={{ width: `${getPercentage(confidence2)}%` }}></div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Confidence Level 2: {confidence2} words</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-amber-200" style={{ width: `${getPercentage(confidence3)}%` }}></div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Confidence Level 3: {confidence3} words</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-blue-200" style={{ width: `${getPercentage(confidence4)}%` }}></div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Confidence Level 4: {confidence4} words</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-green-200" style={{ width: `${getPercentage(confidence5)}%` }}></div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Confidence Level 5: {confidence5} words</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="bg-primary" style={{ width: `${getPercentage(mastered)}%` }}></div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mastered: {mastered} words</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

// Define AddStoryDialog
interface AddStoryDialogProps {
  isOpen: boolean
  onClose: () => void
  onAddStory: (newStory: Omit<Story, "id" | "progress" | "wordCount" | "lastRead" | "wordStats">) => void
}

// Update the AddStoryDialog component to include file import option
function AddStoryDialog({ isOpen, onClose, onAddStory }: AddStoryDialogProps) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (title.trim() && description.trim() && content.trim()) {
      onAddStory({ title, description, content })
      onClose()
      setTitle("")
      setDescription("")
      setContent("")
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsImporting(true)

    const reader = new FileReader()
    reader.onload = (event) => {
      const fileContent = event.target?.result as string
      setContent(fileContent || "")
      setIsImporting(false)
    }
    reader.onerror = () => {
      alert("Error reading file")
      setIsImporting(false)
    }

    reader.readAsText(file)
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Story</DialogTitle>
          <DialogDescription>Create a new story to add to your reading list.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Title
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="content" className="text-right mt-2">
              Content
            </Label>
            <div className="col-span-3 space-y-2">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={triggerFileInput}
                  disabled={isImporting}
                  className="flex items-center gap-1"
                >
                  <Upload className="h-4 w-4" />
                  {isImporting ? "Importing..." : "Import from file"}
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".txt,.text,.md"
                  className="hidden"
                />
              </div>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={8}
                placeholder="Enter story content or import from a file"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" onClick={handleSubmit} disabled={!title || !description || !content}>
            Add Story
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Update the component signature to accept props
export default function ReadingMode({
  state = { selectedStory: null },
  setState = () => {},
}: {
  state?: { selectedStory: number | null }
  setState?: (state: { selectedStory: number | null }) => void
} = {}) {
  // First, declare the stories state
  const [stories, setStories] = useState<Story[]>([])

  // Then use it in the derived state
  const [selectedStoryId, setSelectedStoryId] = useState<number | null>(state.selectedStory)
  const [selectedStory, setSelectedStory] = useState<Story | null>(null)

  const [selectedWord, setSelectedWord] = useState<string | null>(null)
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [selectedWordData, setSelectedWordData] = useState<any>(null)
  const [isAddStoryDialogOpen, setIsAddStoryDialogOpen] = useState(false)
  const [isEditStoryDialogOpen, setIsEditStoryDialogOpen] = useState(false)
  const [tempConfidence, setTempConfidence] = useState<number | null>(null)
  const [tempLearned, setTempLearned] = useState<boolean | null>(null)
  const {
    getWordStatus,
    learningWords,
    learnedWords,
    addWord,
    updateWord,
    updateConfidence,
    markAsLearned,
    unmarkAsLearned,
  } = useWordBank()
  const contentRef = useRef<HTMLDivElement>(null)

  // Add a refresh trigger - MOVED UP before it's used in useEffect
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to force refresh
  const forceRefresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  // Test story with mixed word types
  const testStory: Story = {
    id: 5,
    title: "Test Story with Mixed Words",
    description: "A story containing words of all confidence levels for testing",
    wordCount: 120,
    lastRead: "Today",
    progress: 50,
    content:
      "Bonjour et bienvenue dans cette histoire de test. Je vais au marché pour acheter du pain et du fromage. Le soleil brille aujourd'hui et c'est une belle journée. J'aime beaucoup me promener dans le parc quand il fait beau. Les oiseaux chantent dans les arbres. Enchanté de faire votre connaissance. Merci beaucoup pour votre aide. Au revoir, à demain! S'il vous plaît, pouvez-vous m'aider? Oui, je comprends. Non, je ne suis pas d'accord. Je voudrais apprendre le français. C'est très intéressant et amusant.",
  }

  const initialStories: Story[] = [
    {
      id: 1,
      title: "Le Petit Prince",
      description: "A poetic tale about a young prince who visits various planets in space",
      wordCount: 1250,
      lastRead: "2 days ago",
      progress: 65,
      content:
        "Lorsque j'avais six ans j'ai vu, une fois, une magnifique image, dans un livre sur la Forêt Vierge qui s'appelait 'Histoires Vécues'. Ça représentait un serpent boa qui avalait un fauve. Voilà la copie du dessin. On disait dans le livre: 'Les serpents boas avalent leur proie tout entière, sans la mâcher. Ensuite ils ne peuvent plus bouger et ils dorment pendant les six mois de leur digestion.' J'ai alors beaucoup réfléchi sur les aventures de la jungle et, à mon tour, j'ai réussi, avec un crayon de couleur, à tracer mon premier dessin. Mon dessin numéro 1. Il était comme ça.",
    },
    {
      id: 2,
      title: "La Tortue et le Lièvre",
      description: "A classic fable about a race between a tortoise and a hare",
      wordCount: 850,
      lastRead: "1 week ago",
      progress: 100,
      content:
        "Il était une fois un lièvre qui, se vantant de courir plus vite que quiconque, ne cessait de taquiner la tortue pour sa lenteur. Puis un jour, la tortue irritée répondit: 'Pour qui te prends-tu? Il est indéniable que tu es rapide, mais même toi tu peux être battu!' Le lièvre poussa un cri de rire. 'Battu dans une course? Par qui? Pas par toi, sûrement! Je parie qu'il n'y a personne au monde qui puisse gagner contre moi, je suis si rapide. Maintenant, pourquoi n'essaies-tu pas?'",
    },
    {
      id: 3,
      title: "Les Trois Petits Cochons",
      description: "A children's fable featuring three pigs and a big bad wolf",
      wordCount: 1050,
      lastRead: "3 days ago",
      progress: 30,
      content:
        "Il était une fois trois petits cochons. Un jour, leur mère leur dit: 'Vous êtes tous grands maintenant. Vous pouvez construire vos propres maisons, mais faites attention que le loup ne vous attrape pas.' Le premier petit cochon construisit une maison de paille. Le deuxième petit cochon construisit une maison de bois. Le troisième petit cochon construisit une maison de briques. Une nuit, le grand méchant loup vint à la première maison. 'Petit cochon, petit cochon, laisse-moi entrer', appela-t-il. 'Non, non, pas par les poils de mon menton', répondit le petit cochon. 'Alors je vais souffler et je vais démolir ta maison', dit le loup.",
    },
    {
      id: 4,
      title: "La Cigale et la Fourmi",
      description: "A fable about hard work and preparation",
      wordCount: 750,
      lastRead: "Never",
      progress: 0,
      content:
        "La Cigale, ayant chanté tout l'été, se trouva fort dépourvue quand la bise fut venue: Pas un seul petit morceau de mouche ou de vermisseau. Elle alla crier famine chez la Fourmi sa voisine, la priant de lui prêter quelque grain pour subsister jusqu'à la saison nouvelle. 'Je vous paierai, lui dit-elle, avant l'août, foi d'animal, intérêt et principal.' La Fourmi n'est pas prêteuse: c'est là son moindre défaut. 'Que faisiez-vous au temps chaud?' dit-elle à cette emprunteuse. 'Nuit et jour à tout venant je chantais, ne vous déplaise.' 'Vous chantiez? j'en suis fort aise. Eh bien! dansez maintenant.'",
    },
    testStory,
  ]

  // Initialize stories with word stats
  useEffect(() => {
    const storiesWithStats = initialStories.map((story) => ({
      ...story,
      ...calculateWordStats(story.content),
    }))
    setStories(storiesWithStats)
  }, [learningWords, learnedWords])

  // Calculate word stats for a story
  const calculateWordStats = (content: string) => {
    // Extract unique words from content
    const words = content
      .toLowerCase()
      .replace(/[,.!?;:'"()]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 1) // Filter out single letters and empty strings

    const uniqueWords = [...new Set(words)]
    const total = uniqueWords.length

    // Initialize counters
    let notLearned = 0
    let confidence1 = 0
    let confidence2 = 0
    let confidence3 = 0
    let confidence4 = 0
    let confidence5 = 0
    let mastered = 0

    // Count words in each category
    uniqueWords.forEach((word) => {
      const status = getWordStatus(word)

      if (!status) {
        notLearned++
      } else if (status.learned) {
        mastered++
      } else {
        switch (status.confidence) {
          case 1:
            confidence1++
            break
          case 2:
            confidence2++
            break
          case 3:
            confidence3++
            break
          case 4:
            confidence4++
            break
          case 5:
            confidence5++
            break
          default:
            break
        }
      }
    })

    // Calculate progress (percentage of words that are in the word bank)
    const knownWords = total - notLearned
    const progress = Math.round((knownWords / total) * 100)

    // Count actual words (not just unique)
    const wordCount = words.length

    return {
      progress,
      wordCount,
      wordStats: {
        notLearned,
        confidence1,
        confidence2,
        confidence3,
        confidence4,
        confidence5,
        mastered,
        total,
      },
      lastRead: "Today",
    }
  }

  // Update the handleBackToList function
  const handleBackToList = () => {
    setSelectedStoryId(null)
    setSelectedStory(null)
    setState({ selectedStory: null })
    setSelectedWord(null)
  }

  // First, add these new state variables after the existing state declarations:

  const [selectedWordSpans, setSelectedWordSpans] = useState<string[]>([])
  const [isSelectingWords, setIsSelectingWords] = useState(false)

  const [sidebarJustClosed, setSidebarJustClosed] = useState(false)

  // Handle word span mouse down - start selection
  const handleWordSpanMouseDown = (word: string) => {
    setIsSelectingWords(true)
    setSelectedWordSpans([word])
  }

  // Handle word span mouse enter - continue selection if mouse is down
  const handleWordSpanMouseEnter = (word: string) => {
    if (isSelectingWords && !selectedWordSpans.includes(word)) {
      setSelectedWordSpans((prev) => [...prev, word])
    }
  }

  // Handle mouse up - end selection
  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelectingWords(false)
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  useEffect(() => {
    const handleMouseUp = () => {
      setIsSelectingWords(false)

      // Only open the sidebar if it wasn't just closed and we have multiple words selected
      if (selectedWordSpans.length > 1 && !sidebarJustClosed && !selectedWord) {
        const phrase = selectedWordSpans.join(" ")

        // Find if phrase exists in either bank
        const learningWord = learningWords.find((w) => w.word.toLowerCase() === phrase.toLowerCase())
        const learnedWord = learnedWords.find((w) => w.word.toLowerCase() === phrase.toLowerCase())

        if (learningWord) {
          setSelectedWordData({
            id: learningWord.id,
            meaning: learningWord.meaning,
            confidence: learningWord.confidence,
            learned: false,
            exampleSentence: learningWord.exampleSentence,
            exampleSentenceTranslation: learningWord.exampleSentenceTranslation,
          })
        } else if (learnedWord) {
          setSelectedWordData({
            id: learnedWord.id,
            meaning: learnedWord.meaning,
            confidence: 5,
            learned: true,
            exampleSentence: learnedWord.exampleSentence,
            exampleSentenceTranslation: learnedWord.exampleSentenceTranslation,
          })
        } else {
          setSelectedWordData(null)
        }

        setSelectedWord(phrase)
      }

      // Reset the flag after handling the event
      if (sidebarJustClosed) {
        setSidebarJustClosed(false)
      }
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [selectedWordSpans, learningWords, learnedWords, sidebarJustClosed, selectedWord])

  // Now modify the renderStoryContent function to use these new handlers:
  // Find this part in the renderStoryContent function:

  // return (
  //   <span
  //     key={index}
  //     className={className}
  //     onClick={() => handleWordClick(cleanToken)}
  //     onMouseEnter={() => handleWordHover(cleanToken)}
  //     onMouseLeave={handleWordHoverLeave}
  //   >
  //     {token}
  //   </span>
  // )

  // And replace it with:

  // Also replace the TooltipTrigger span with this updated version:

  // Now replace the selectedText button with a button for selectedWordSpans:
  // Find this code:

  // And replace with:

  // Update the dependencies in the renderStoryContent useCallback:
  // Find this line:
  // [getWordStatus, refreshTrigger, hoveredWord, getConfidenceColor, selectedWord, tempConfidence, tempLearned],

  // And replace with:
  const checkForPhrase = useCallback(
    (token: string, index: number, tokens: string[]) => {
      // Clean the current token
      const cleanToken = token.replace(/[,.!?;:'"()]/g, "").toLowerCase()
      if (!cleanToken) return null

      // Check for phrases of different lengths (5 to 2 words)
      for (let phraseLength = 5; phraseLength >= 2; phraseLength--) {
        if (index + phraseLength <= tokens.length) {
          // Get the potential phrase tokens
          const phraseTokens = tokens.slice(index, index + phraseLength)
          
          // Clean and join the tokens
          const cleanPhrase = phraseTokens
            .map(t => t.replace(/[,.!?;:'"()]/g, "").toLowerCase())
            .filter(t => t.trim() && !/^[,.!?;:'"()]+$/.test(t))
            .join(" ")

          // Skip if the cleaned phrase is empty or too short
          if (!cleanPhrase || cleanPhrase.split(" ").length < 2) continue

          // Check if this phrase exists in word bank
          const learningPhrase = learningWords.find(w => w.word.toLowerCase() === cleanPhrase)
          const learnedPhrase = learnedWords.find(w => w.word.toLowerCase() === cleanPhrase)

          if (learningPhrase || learnedPhrase) {
            return {
              phrase: cleanPhrase,
              length: phraseLength,
              status: learningPhrase || learnedPhrase,
              originalText: phraseTokens.join("")
            }
          }
        }
      }

      return null
    },
    [learningWords, learnedWords]
  )

  const renderStoryContent = useCallback(
    (content: string) => {
      // Split content into words while preserving punctuation and spaces
      const tokens = content.split(/(\s+|[,.!?;:'"()])/g)
      const result = []

      // Track phrases to skip tokens that are part of a phrase
      const skipIndices = new Set()

      for (let i = 0; i < tokens.length; i++) {
        // Skip if this token is part of a phrase we've already processed
        if (skipIndices.has(i)) {
          continue
        }

        const token = tokens[i]

        // Skip rendering for whitespace and punctuation
        if (token.trim() === "" || /^[,.!?;:'"()]+$/.test(token)) {
          result.push(token)
          continue
        }

        // Check if this token starts a phrase
        const phraseInfo = checkForPhrase(token, i, tokens)

        if (phraseInfo?.status) {
          // This is the start of a phrase
          const { phrase, length, status, originalText } = phraseInfo

          // Mark tokens to skip
          for (let j = 1; j < length; j++) {
            skipIndices.add(i + j)
          }

          // Determine styling based on status
          let className = "px-1 py-0.5 rounded hover:underline cursor-pointer select-text"

          // Check if there are temporary changes for this phrase
          const isPhraseSelected = selectedWord === phrase
          const hasTempChanges = isPhraseSelected && (tempConfidence !== null || tempLearned !== null)

          if (hasTempChanges) {
            // Use temporary states for the selected phrase
            const isCurrentlyLearned = tempLearned !== null ? tempLearned : status.learned || false
            const currentConfidence = tempConfidence !== null ? tempConfidence : status.confidence || 1

            if (isCurrentlyLearned) {
              // Phrase is temporarily marked as learned
              className += " text-primary"
            } else {
              // Phrase has temporary confidence level
              className += ` ${getConfidenceColor(currentConfidence)}`
            }
            
            // Add a ring to indicate it's selected
            className += " ring-2 ring-primary"
          } else if (status.learned) {
            className += " text-primary"
          } else if (status.confidence) {
            className += ` ${getConfidenceColor(status.confidence)}`
          } else {
            className += " bg-purple-100"
          }

          // Check if this is the selected phrase (but not if it already has temp changes)
          if (selectedWord === phrase && !hasTempChanges) {
            className += " ring-2 ring-primary"
          }

          // Add to result with tooltip
          result.push(
            <TooltipProvider key={`phrase-${i}`} delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={className}
                    onClick={() => {
                      setSelectedWord(phrase)
                      setSelectedWordData({
                        id: status.id,
                        meaning: status.meaning,
                        confidence: status.confidence,
                        learned: status.learned,
                        exampleSentence: status.exampleSentence,
                        exampleSentenceTranslation: status.exampleSentenceTranslation,
                      })
                    }}
                  >
                    {originalText}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <span>
                    {status.learned ? "Mastered" : status.confidence ? status.meaning : "Click to add meaning"}
                  </span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )
        } else {
          // Process as a single word
          const cleanToken = token.replace(/[,.!?;:'"()]/g, "").toLowerCase()
          const status = getWordStatus(cleanToken)

          let className = "px-1 py-0.5 rounded hover:underline cursor-pointer select-text"

          // Check if this is the currently selected word with temporary changes
          const isSelectedWord = selectedWord === cleanToken
          const hasTempChanges = isSelectedWord && (tempConfidence !== null || tempLearned !== null)

          if (hasTempChanges) {
            // Use temporary states for the selected word
            const isCurrentlyLearned = tempLearned !== null ? tempLearned : status?.learned || false
            const currentConfidence = tempConfidence !== null ? tempConfidence : status?.confidence || 1

            if (isCurrentlyLearned) {
              // Word is temporarily marked as learned
              className += " text-primary"
            } else {
              // Word has temporary confidence level
              className += ` ${getConfidenceColor(currentConfidence)}`
            }
            
            // Add a ring to indicate it's selected, but don't override the confidence background color
            className += " ring-2 ring-primary"
          } else if (status) {
            if (status.learned) {
              // Word is fully learned - no background
              className += " text-primary"
            } else {
              // Word is in learning - color based on confidence
              className += ` ${getConfidenceColor(status.confidence)}`
            }
          } else {
            // New word - not in either bank
            className += " bg-purple-100"
          }

          // Add hover class if this is the currently hovered word
          if (hoveredWord === cleanToken) {
            className += " ring-2 ring-primary"
          }

          // Add selection class if this word is in the selection (but not if it already has temp changes)
          if (selectedWordSpans.includes(cleanToken) && !hasTempChanges) {
            className += " bg-primary/20 ring-2 ring-primary"
          }

          // If the word is in learning (not mastered), wrap it in a tooltip
          if ((status && !status.learned) || (hasTempChanges && tempLearned === false)) {
            result.push(
              <TooltipProvider key={`word-${i}`} delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span
                      className={className}
                      onClick={() => handleWordClick(cleanToken)}
                      onMouseEnter={() => {
                        handleWordHover(cleanToken)
                        handleWordSpanMouseEnter(cleanToken)
                      }}
                      onMouseLeave={handleWordHoverLeave}
                      onMouseDown={(e) => {
                        e.preventDefault() // Prevent text selection
                        handleWordSpanMouseDown(cleanToken)
                      }}
                    >
                      {token}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <span>
                      {status?.learned ? "Mastered" : status?.confidence ? status.meaning : "Click to add meaning"}
                    </span>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>,
            )
          } else {
            result.push(
              <span
                key={`word-${i}`}
                className={className}
                onClick={() => handleWordClick(cleanToken)}
                onMouseEnter={() => {
                  handleWordHover(cleanToken)
                  handleWordSpanMouseEnter(cleanToken)
                }}
                onMouseLeave={handleWordHoverLeave}
                onMouseDown={(e) => {
                  e.preventDefault() // Prevent text selection
                  handleWordSpanMouseDown(cleanToken)
                }}
              >
                {token}
              </span>,
            )
          }
        }
      }

      return result
    },
    [
      getWordStatus,
      refreshTrigger,
      hoveredWord,
      getConfidenceColor,
      selectedWord,
      tempConfidence,
      tempLearned,
      selectedWordSpans,
      checkForPhrase,
      handleWordClick,
      handleWordHover,
      handleWordHoverLeave,
    ],
  )

  // Finally, remove the floating button for selected phrases since we now open the sidebar automatically
  // Remove this code:

  // Update the setSelectedStory calls
  // Replace this:
  // setSelectedStory(story)
  // With this:
  const handleSelectStory = (story: Story) => {
    setSelectedStoryId(story.id)
    setSelectedStory(story)
    setState({ selectedStory: story.id })
  }

  // Update the useEffect to find the selected story
  useEffect(() => {
    if (selectedStoryId && stories.length > 0) {
      const story = stories.find((s) => s.id === selectedStoryId) || null
      setSelectedStory(story)
    }
  }, [selectedStoryId, stories])

  if (selectedStory) {
    return (
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" onClick={handleBackToList} className="mb-4 flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to stories
        </Button>

        <Card>
          <CardHeader className="relative">
            <CardTitle className="text-2xl">{selectedStory.title}</CardTitle>
            <p className="text-muted-foreground">{selectedStory.description}</p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{selectedStory.wordCount} words</span>
              <span>•</span>
              <span>Last read: {selectedStory.lastRead}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 flex items-center gap-1"
              onClick={() => setIsEditStoryDialogOpen(true)}
            >
              <Edit className="h-4 w-4" />
              Edit Story
            </Button>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none" ref={contentRef}>
              <div className="leading-relaxed text-lg">{renderStoryContent(selectedStory.content)}</div>
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Legend:</h3>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 bg-green-200 rounded"></span>
                    <span>High confidence (5)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 bg-blue-200 rounded"></span>
                    <span>Good confidence (4)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 bg-amber-200 rounded"></span>
                    <span>Medium confidence (3)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 bg-orange-200 rounded"></span>
                    <span>Low confidence (2)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 bg-red-200 rounded"></span>
                    <span>Very low confidence (1)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 bg-purple-100 rounded"></span>
                    <span>New word</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block text-primary">Word</span>
                    <span>Mastered word</span>
                  </div>
                </div>
                <div className="mt-4 p-2 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-1">Keyboard Shortcuts:</h4>
                  <ul className="text-sm">
                    <li>
                      <kbd className="px-1 bg-gray-100 rounded">i</kbd> - Mark hovered word as mastered
                    </li>
                    <li>
                      <kbd className="px-1 bg-gray-100 rounded">1</kbd> to{" "}
                      <kbd className="px-1 bg-gray-100 rounded">5</kbd> - Set confidence level for hovered word
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedWord && (
          <WordSidebar
            word={selectedWord}
            onClose={() => {
              setSelectedWord(null)
              setTempConfidence(null)
              setTempLearned(null)
              setSelectedWordSpans([])
              setSidebarJustClosed(true)
            }}
            existingWordData={selectedWordData}
            onUpdate={forceRefresh}
            tempConfidence={tempConfidence}
            setTempConfidence={setTempConfidence}
            tempLearned={tempLearned}
            setTempLearned={setTempLearned}
          />
        )}

        {/* Edit Story Dialog */}
        {selectedStory && (
          <EditStoryDialog
            isOpen={isEditStoryDialogOpen}
            onClose={() => setIsEditStoryDialogOpen(false)}
            story={selectedStory}
            onSave={handleEditStory}
          />
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-primary">My Reading List</h2>
        <Button className="bg-green-500 hover:bg-green-600" onClick={() => setIsAddStoryDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Story
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map((story) => (
          // Update the story card onClick
          <Card
            key={story.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleSelectStory(story)}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5 text-primary" />
                {story.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground line-clamp-2">{story.description}</p>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex justify-between text-sm text-muted-foreground mb-1">
                <span>{story.wordCount} words</span>
                <span>{story.progress}% complete</span>
              </div>
              {story.wordStats ? (
                <SegmentedProgressBar wordStats={story.wordStats} />
              ) : (
                <Progress value={story.progress} className="h-2" />
              )}
            </CardContent>
            <CardFooter>
              <p className="text-xs text-muted-foreground">Last read: {story.lastRead}</p>
            </CardFooter>
          </Card>
        ))}
      </div>

      <AddStoryDialog
        isOpen={isAddStoryDialogOpen}
        onClose={() => setIsAddStoryDialogOpen(false)}
        onAddStory={handleAddStory}
      />
    </div>
  )

  function handleAddStory(newStory: Omit<Story, "id" | "progress" | "wordCount" | "lastRead" | "wordStats">) {
    const newId = stories.length > 0 ? Math.max(...stories.map((s) => s.id)) + 1 : 1
    const calculatedStats = calculateWordStats(newStory.content)
    const newStoryWithStats: Story = {
      id: newId,
      ...newStory,
      progress: calculatedStats.progress || 0,
      wordCount: calculatedStats.wordCount || 0,
      lastRead: "Never",
      wordStats: calculatedStats.wordStats,
    }

    setStories([...stories, newStoryWithStats])
  }

  function handleEditStory(updatedStory: Story) {
    const updatedStories = stories.map((story) =>
      story.id === updatedStory.id ? { ...updatedStory, ...calculateWordStats(updatedStory.content) } : story,
    )
    setStories(updatedStories)
    setSelectedStory(updatedStory)
  }

  function handleWordClick(word: string) {
    setSelectedWord(word)

    // Find if word exists in either bank
    const learningWord = learningWords.find((w) => w.word.toLowerCase() === word.toLowerCase())
    const learnedWord = learnedWords.find((w) => w.word.toLowerCase() === word.toLowerCase())

    if (learningWord) {
      setSelectedWordData({
        id: learningWord.id,
        meaning: learningWord.meaning,
        confidence: learningWord.confidence,
        learned: false,
        exampleSentence: learningWord.exampleSentence,
        exampleSentenceTranslation: learningWord.exampleSentenceTranslation,
      })
    } else if (learnedWord) {
      setSelectedWordData({
        id: learnedWord.id,
        meaning: learnedWord.meaning,
        confidence: 5,
        learned: true,
        exampleSentence: learnedWord.exampleSentence,
        exampleSentenceTranslation: learnedWord.exampleSentenceTranslation,
      })
    } else {
      setSelectedWordData(null)
    }
  }

  function handleWordHover(word: string) {
    setHoveredWord(word)
  }

  function handleWordHoverLeave() {
    setHoveredWord(null)
  }

  function getConfidenceColor(confidence: number) {
    switch (confidence) {
      case 1:
        return "bg-red-200"
      case 2:
        return "bg-orange-200"
      case 3:
        return "bg-amber-200"
      case 4:
        return "bg-blue-200"
      case 5:
        return "bg-green-200"
      default:
        return ""
    }
  }
}

