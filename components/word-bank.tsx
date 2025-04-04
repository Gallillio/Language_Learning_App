"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useWordBank, type Word } from "@/contexts/word-bank-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { SortAsc, SortDesc, Search, BookOpen, GraduationCap, Edit } from "lucide-react"
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Update the component signature to accept props
export default function WordBank({
  state = { searchQuery: "" },
  setState = () => {},
}: {
  state?: { searchQuery: string }
  setState?: (state: { searchQuery: string }) => void
} = {}) {
  // Replace the searchQuery state with a derived state from props
  const [searchQuery, setSearchQuery] = useState(state.searchQuery)
  const { learningWords, learnedWords, updateWord, updateConfidence, markAsLearned, unmarkAsLearned } = useWordBank()
  const [editingWord, setEditingWord] = useState<Word | null>(null)
  const [editedMeaning, setEditedMeaning] = useState("")
  const [editedExampleSentence, setEditedExampleSentence] = useState("")
  const [editedExampleSentenceTranslation, setEditedExampleSentenceTranslation] = useState("")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [filteredLearningWords, setFilteredLearningWords] = useState<Word[]>(learningWords)
  const [filteredLearnedWords, setFilteredLearnedWords] = useState<Word[]>(learnedWords)
  const [activeTab, setActiveTab] = useState("learning")
  const [sortBy, setSortBy] = useState<string>("default")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")

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
      case "id": // Sort by ID (most recently added)
        sortedWords.sort((a, b) => {
          const comparison = a.id - b.id
          return sortDirection === "asc" ? comparison : -comparison
        })
        break
      default:
        // Default sorting (no sorting)
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
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingWord) {
      updateWord(editingWord.id, {
        meaning: editedMeaning,
        exampleSentence: editedExampleSentence,
        exampleSentenceTranslation: editedExampleSentenceTranslation,
      })
      setIsEditDialogOpen(false)
      setEditingWord(null)
    }
  }

  const handleUnmarkAsLearned = (id: number) => {
    unmarkAsLearned(id, 5) // Default to confidence level 5 when unmarking
  }

  // Update the handleTabChange function to not reset search when changing tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value)
    // Focus the search input after tab change
    setTimeout(() => {
      searchInputRef.current?.focus()
    }, 0)
  }

  // Update the search input onChange handler
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setSearchQuery(newQuery)
    setState({ searchQuery: newQuery })
  }

  return (
    <div>
      <h2 className="text-3xl font-bold text-primary mb-6">My Word Bank</h2>

      <Tabs defaultValue="learning" value={activeTab} onValueChange={handleTabChange}>
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
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="alphabetical">Alphabetical</SelectItem>
                  <SelectItem value="confidence">Confidence Level</SelectItem>
                  <SelectItem value="length">Word Length</SelectItem>
                  <SelectItem value="id">Recently Added</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))}
                disabled={sortBy === "default"}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLearningWords.length === 0 ? (
              <div className="col-span-2 text-center p-8 bg-gray-50 rounded-lg">
                <p className="text-muted-foreground">No words found</p>
              </div>
            ) : (
              filteredLearningWords.map((word) => (
                <Card key={word.id} className={`border-2 ${getConfidenceColor(word.confidence)} relative`}>
                  <CardHeader className="pb-2">
                    <CardTitle>{word.word}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-2">{word.meaning}</p>
                    {word.exampleSentence && <p className="text-sm italic mb-4">"{word.exampleSentence}"</p>}
                    {word.exampleSentenceTranslation && (
                      <p className="text-sm mb-4">"{word.exampleSentenceTranslation}"</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <Button
                          key={level}
                          variant={word.confidence === level ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateConfidence(word, level)}
                        >
                          {level}
                        </Button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-auto"
                        onClick={() => handleMarkAsLearned(word.id)}
                      >
                        Mark as Mastered
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={(e) => handleEditClick(word, e)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                <Card key={word.id} className="bg-green-50 border-green-200 relative">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center">
                      <span>{word.word}</span>
                      <GraduationCap className="h-5 w-5 text-green-600" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{word.meaning}</p>
                    {word.exampleSentence && <p className="text-sm italic mt-2">"{word.exampleSentence}"</p>}
                    {word.exampleSentenceTranslation && (
                      <p className="text-sm mt-1">"{word.exampleSentenceTranslation}"</p>
                    )}
                    <div className="mt-2 flex justify-between">
                      <Button variant="outline" size="sm" onClick={() => handleUnmarkAsLearned(word.id)}>
                        Move to Learning
                      </Button>
                      <Button variant="outline" size="sm" onClick={(e) => handleEditClick(word, e)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
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
                  <Card
                    key={`learning-${word.id}`}
                    className={`border-2 ${getConfidenceColor(word.confidence)} relative`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between">
                        <span>{word.word}</span>
                        <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-full">Learning</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-2">{word.meaning}</p>
                      {word.exampleSentence && <p className="text-sm italic mb-2">"{word.exampleSentence}"</p>}
                      {word.exampleSentenceTranslation && (
                        <p className="text-sm mb-2">"{word.exampleSentenceTranslation}"</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <Button
                            key={level}
                            variant={word.confidence === level ? "default" : "outline"}
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleUpdateConfidence(word, level)
                            }}
                            className="flex-1 min-w-0 px-2"
                          >
                            {level}
                          </Button>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-auto"
                          onClick={(e) => handleEditClick(word, e)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {filteredLearnedWords.map((word) => (
                  <Card key={`mastered-${word.id}`} className="bg-green-50 border-green-200 relative">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex justify-between">
                        <span>{word.word}</span>
                        <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">Mastered</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>{word.meaning}</p>
                      {word.exampleSentence && <p className="text-sm italic mt-2">"{word.exampleSentence}"</p>}
                      {word.exampleSentenceTranslation && (
                        <p className="text-sm mt-1">"{word.exampleSentenceTranslation}"</p>
                      )}
                      <div className="flex justify-end mt-2">
                        <Button variant="outline" size="sm" onClick={(e) => handleEditClick(word, e)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
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
          </div>
          <DialogFooter>
            <Button type="button" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

