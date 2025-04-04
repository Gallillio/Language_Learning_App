"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useWordBank, type Word } from "@/contexts/word-bank-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SortAsc, SortDesc, Search, BookOpen, GraduationCap, Edit, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Update the component signature to accept props
export default function WordBank({
  state = { searchQuery: "", activeTab: "learning", sortBy: "id", sortDirection: "desc" },
  setState = () => {},
}: {
  state?: { searchQuery: string; activeTab: string; sortBy: string; sortDirection: "asc" | "desc" }
  setState?: (state: { searchQuery: string; activeTab: string; sortBy: string; sortDirection: "asc" | "desc" }) => void
} = {}) {
  // Replace the local state with derived state from props
  const [searchQuery, setSearchQuery] = useState(state.searchQuery)
  const { learningWords, learnedWords, updateWord, updateConfidence, markAsLearned, unmarkAsLearned, deleteWord } = useWordBank()
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [editedMeaning, setEditedMeaning] = useState("")
  const [editedExampleSentence, setEditedExampleSentence] = useState("")
  const [editedExampleSentenceTranslation, setEditedExampleSentenceTranslation] = useState("")
  const [editedNotes, setEditedNotes] = useState("")
  const [editedImageUrl, setEditedImageUrl] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [filteredLearningWords, setFilteredLearningWords] = useState<Word[]>(learningWords)
  const [filteredLearnedWords, setFilteredLearnedWords] = useState<Word[]>(learnedWords)
  const [activeTab, setActiveTab] = useState(state.activeTab)
  const [sortBy, setSortBy] = useState(state.sortBy)
  const [sortDirection, setSortDirection] = useState(state.sortDirection)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  const sortWords = (words: Word[]): Word[] => {
    const sortedWords = [...words]

    switch (sortBy) {
      case "alphabetical":
        sortedWords.sort((a, b) => {
          const comparison = a.word.localeCompare(b.word)
          return sortDirection === "asc" ? comparison : -comparison
        })
        break
      case "confidence":
        sortedWords.sort((a, b) => {
          const comparison = a.confidence - b.confidence
          return sortDirection === "asc" ? comparison : -comparison
        })
        break
      case "length":
        sortedWords.sort((a, b) => {
          const comparison = a.word.length - b.word.length
          return sortDirection === "asc" ? comparison : -comparison
        })
        break
      case "lastUpdated":
        sortedWords.sort((a, b) => {
          const aDate = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0
          const bDate = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0
          const comparison = aDate - bDate
          return sortDirection === "asc" ? comparison : -comparison
        })
        break
      case "id": // Sort by ID (most recently added)
        sortedWords.sort((a, b) => {
          const comparison = a.id - b.id
          return sortDirection === "asc" ? comparison : -comparison
        })
        break
      default:
        // Default to sorting by ID (Recently added)
        sortedWords.sort((a, b) => {
          const comparison = a.id - b.id
          return sortDirection === "asc" ? comparison : -comparison
        })
        break
    }

    return sortedWords
  }

  // Update filtered words when search query or words change
  useEffect(() => {
    let filteredLearning = learningWords
    let filteredLearned = learnedWords

    // Apply search filtering
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase()
      filteredLearning = learningWords.filter(
        (word) => word.word.toLowerCase().includes(query) || word.meaning.toLowerCase().includes(query),
      )
      filteredLearned = learnedWords.filter(
        (word) => word.word.toLowerCase().includes(query) || word.meaning.toLowerCase().includes(query),
      )
    }

    // Apply sorting
    setFilteredLearningWords(sortWords(filteredLearning))
    setFilteredLearnedWords(sortWords(filteredLearned))
  }, [searchQuery, learningWords, learnedWords, sortBy, sortDirection])

  const getConfidenceColor = (confidence: number) => {
    switch (confidence) {
      case 1:
        return "bg-red-100 border-red-200"
      case 2:
        return "bg-orange-100 border-orange-200"
      case 3:
        return "bg-amber-100 border-amber-200"
      case 4:
        return "bg-blue-100 border-blue-200" // Changed from yellow to blue
      case 5:
        return "bg-green-100 border-green-200"
      default:
        return "bg-gray-100 border-gray-200"
    }
  }

  // WordCard component to be reused across all tabs
  const WordCard = ({ 
    word, 
    tabName,
    keyPrefix = "" 
  }: { 
    word: Word, 
    tabName: "learning" | "mastered" | "all",
    keyPrefix?: string 
  }) => {
    const isLearned = word.learned;
    const cardKey = keyPrefix ? `${keyPrefix}-${word.id}` : `${word.id}`;
    
    // Determine card styling based on word status
    const cardClass = isLearned 
      ? "bg-green-50 border-green-200 relative" 
      : `border-2 ${getConfidenceColor(word.confidence)} relative`;
    
    // Format the lastUpdated date if it exists
    const formattedLastUpdated = word.lastUpdated 
      ? new Date(word.lastUpdated).toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'Never updated';
      
    return (
      <Card key={cardKey} className={cardClass}>
        <div className="flex flex-col h-full">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between">
              <span>{word.word}</span>
              {/* All badges and indicators removed as requested */}
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4 flex flex-col flex-grow">
            <div className="flex-grow">
              <p className="mb-2">{word.meaning}</p>
              {word.exampleSentence && <p className="text-sm italic mb-2">"{word.exampleSentence}"</p>}
              {word.exampleSentenceTranslation && (
                <p className="text-sm mb-2">"{word.exampleSentenceTranslation}"</p>
              )}
              
              {/* Display notes if available */}
              {word.notes && (
                <div className="mt-3 p-2 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Notes:</p>
                  <p className="text-sm">{word.notes}</p>
                </div>
              )}
              
              {/* Display image if available */}
              {word.imageUrl && (
                <div className="mt-3">
                  <img 
                    src={word.imageUrl} 
                    alt={word.word} 
                    className="rounded-lg w-full max-h-36 object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Error';
                    }}
                  />
                </div>
              )}
              
              <p className="text-xs text-gray-500 mt-2">Last updated: {formattedLastUpdated}</p>
            </div>
            
            {/* Buttons positioned at the bottom */}
            <div className="flex flex-wrap gap-2 mt-auto pt-4">
              {/* If the word is being learned, show confidence buttons that update confidence */}
              {!isLearned ? (
                <>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Button
                      key={level}
                      variant={word.confidence === level ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUpdateConfidence(word, level);
                      }}
                      className="flex-1 min-w-0 px-2"
                    >
                      {level}
                    </Button>
                  ))}
                  {tabName !== "all" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      onClick={() => handleMarkAsLearned(word.id)}
                    >
                      Mark as Mastered
                    </Button>
                  )}
                </>
              ) : (
                // If the word is mastered, use the same button design as learning words
                [1, 2, 3, 4, 5].map((level) => (
                  <Button
                    key={level}
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      unmarkAsLearned(word.id);
                      updateConfidence(word.id, level);
                    }}
                    className="flex-1 min-w-0 px-2"
                  >
                    {level}
                  </Button>
                ))
              )}
            </div>
          
            {/* Edit and Delete buttons - positioned the same for all cards */}
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleEditClick(word, e)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteClick(word, e)}
                className="text-red-500 hover:text-red-700 hover:bg-red-100"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  };

  const handleUpdateConfidence = (word: Word, newConfidence: number) => {
    updateConfidence(word.id, newConfidence)
  }

  const handleMarkAsLearned = (id: number) => {
    markAsLearned(id)
  }

  const handleEditClick = (word: Word, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click event
    setEditingWord(word)
    setEditedMeaning(word.meaning)
    setEditedExampleSentence(word.exampleSentence || "")
    setEditedExampleSentenceTranslation(word.exampleSentenceTranslation || "")
    setEditedNotes(word.notes || "")
    setEditedImageUrl(word.imageUrl || "")
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingWord) {
      updateWord(editingWord.id, {
        meaning: editedMeaning,
        exampleSentence: editedExampleSentence,
        exampleSentenceTranslation: editedExampleSentenceTranslation,
        notes: editedNotes,
        imageUrl: editedImageUrl,
      })
      setIsEditDialogOpen(false)
      setEditingWord(null)
    }
  }

  const handleUnmarkAsLearned = (id: number) => {
    unmarkAsLearned(id)
  }

  const handleDeleteClick = (word: Word, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click event
    setConfirmDeleteId(word.id)
    setIsDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (confirmDeleteId) {
      await deleteWord(confirmDeleteId)
      setIsDeleteDialogOpen(false)
      setConfirmDeleteId(null)
    }
  }

  // Update the handleTabChange function to not reset search when changing tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Update the state to persist the tab selection
    setState({ 
      searchQuery, 
      activeTab: value, 
      sortBy, 
      sortDirection 
    })
    // Focus the search input after tab change
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 0)
  }

  // Update the search input onChange handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setSearchQuery(newQuery)
    setState({ 
      searchQuery: newQuery, 
      activeTab, 
      sortBy, 
      sortDirection 
    })
  }
  
  // Add handlers for sortBy and sortDirection changes
  const handleSortByChange = (value: string) => {
    setSortBy(value)
    setState({
      searchQuery,
      activeTab,
      sortBy: value,
      sortDirection
    })
  }
  
  const handleSortDirectionToggle = () => {
    const newDirection = sortDirection === "asc" ? "desc" : "asc"
    setSortDirection(newDirection)
    setState({
      searchQuery,
      activeTab,
      sortBy,
      sortDirection: newDirection
    })
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-primary mb-6">My Word Bank</h2>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <TabsList className="mb-0">
            <TabsTrigger value="learning" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> Learning ({learningWords.length})
            </TabsTrigger>
            <TabsTrigger value="mastered" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" /> Mastered ({learnedWords.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex items-center gap-2">
              All ({learningWords.length + learnedWords.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={handleSortByChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">Recently Added</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="confidence">Confidence Level</SelectItem>
                  <SelectItem value="length">Word Length</SelectItem>
                  <SelectItem value="lastUpdated">Last Updated</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={handleSortDirectionToggle}
              >
                {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search words..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="pl-8"
                ref={searchInputRef}
              />
            </div>
          </div>
        </div>

        <TabsContent value="learning">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredLearningWords.length === 0 ? (
              <div className="col-span-3 text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-muted-foreground">No words found</p>
              </div>
            ) : (
              filteredLearningWords.map((word) => (
                WordCard({ word, tabName: "learning" })
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="mastered">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredLearnedWords.length === 0 ? (
              <div className="col-span-3 text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-muted-foreground">No words found</p>
              </div>
            ) : (
              filteredLearnedWords.map((word) => (
                WordCard({ word, tabName: "mastered" })
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLearningWords.length === 0 && filteredLearnedWords.length === 0 ? (
              <div className="col-span-3 text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-muted-foreground">No words found</p>
              </div>
            ) : (
              <>
                {filteredLearningWords.map((word) => (
                  WordCard({ word, tabName: "all", keyPrefix: "learning" })
                ))}
                {filteredLearnedWords.map((word) => (
                  WordCard({ word, tabName: "all", keyPrefix: "mastered" })
                ))}
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>

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
            
            {/* Add notes field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Textarea
                id="notes"
                value={editedNotes}
                onChange={(e) => setEditedNotes(e.target.value)}
                className="col-span-3"
                rows={2}
                placeholder="Additional notes about this word"
              />
            </div>
            
            {/* Add image URL field */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="imageUrl" className="text-right">
                Image URL
              </Label>
              <div className="col-span-3 space-y-2">
                <Input
                  id="imageUrl"
                  value={editedImageUrl}
                  onChange={(e) => setEditedImageUrl(e.target.value)}
                  placeholder="URL for an image related to this word"
                />
                {editedImageUrl && (
                  <div className="mt-2 border rounded-md overflow-hidden">
                    <img 
                      src={editedImageUrl} 
                      alt="Preview" 
                      className="w-full h-auto max-h-32 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Image+Error';
                      }}
                    />
                  </div>
                )}
              </div>
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
    </div>
  )
}

