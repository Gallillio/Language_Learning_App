"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { PlusCircle, BookOpen, Sparkles } from "lucide-react"
import { useWordBank } from "@/contexts/word-bank-context"

export default function AddNewWordsMode({
  state = { editingWordId: null },
  setState = () => {},
}: {
  state?: { editingWordId: number | null }
  setState?: (state: { editingWordId: number | null }) => void
} = {}) {
  // Replace the editingWordId state with a derived state from props
  const [editingWordId, setEditingWordId] = useState<number | null>(state.editingWordId)
  const [newWord, setNewWord] = useState("")
  const [meaning, setMeaning] = useState("")
  const [exampleSentence, setExampleSentence] = useState("")
  const [exampleSentenceTranslation, setExampleSentenceTranslation] = useState("")
  const [confidence, setConfidence] = useState(1)
  const { addWord, updateWord, learningWords, learnedWords } = useWordBank()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (newWord.trim() === "") return
    
    // Require meaning unless the word is marked as learned
    // In this component, we don't have an option to mark as learned directly
    // So we always require meaning
    if (meaning.trim() === "") {
      alert("Please provide a meaning for the word before adding it.");
      return;
    }

    if (editingWordId) {
      // Update existing word
      updateWord(editingWordId, {
        word: newWord,
        meaning: meaning,
        exampleSentence: exampleSentence,
        exampleSentenceTranslation: exampleSentenceTranslation,
        confidence: confidence,
      })

      // Reset form and editing state
      resetForm()
    } else {
      // Add new word
      addWord({
        word: newWord,
        meaning: meaning,
        exampleSentence: exampleSentence,
        exampleSentenceTranslation: exampleSentenceTranslation,
        confidence: confidence,
        learned: false,
        language: "French",
      })

      // Reset form
      resetForm()
    }
  }

  // Update the resetForm function
  const resetForm = () => {
    setNewWord("")
    setMeaning("")
    setExampleSentence("")
    setExampleSentenceTranslation("")
    setConfidence(1)
    setEditingWordId(null)
    setState({ editingWordId: null })
  }

  // Update the handleEditWord function
  const handleEditWord = (word: any) => {
    setNewWord(word.word)
    setMeaning(word.meaning)
    setExampleSentence(word.exampleSentence || "")
    setExampleSentenceTranslation(word.exampleSentenceTranslation || "")
    setConfidence(word.confidence)
    setEditingWordId(word.id)
    setState({ editingWordId: word.id })
  }

  const recentWords = [...learningWords].sort((a, b) => b.id - a.id).slice(0, 5)

  const getConfidenceColor = (confidence: number) => {
    switch (confidence) {
      case 1:
        return "text-red-500"
      case 2:
        return "text-orange-500"
      case 3:
        return "text-amber-500"
      case 4:
        return "text-blue-500" // Changed from yellow to blue
      case 5:
        return "text-green-500"
      default:
        return "text-gray-500"
    }
  }

  const handleGenerateAI = (field: string) => {
    // This is just a placeholder for the AI generation feature
    alert(`AI would generate content for the ${field} field here.`)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <h2 className="text-3xl font-bold mb-6 text-primary">{editingWordId ? "Edit Word" : "Add New Words"}</h2>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>{editingWordId ? "Edit Word" : "New Word"}</CardTitle>
              <CardDescription>
                {editingWordId
                  ? "Edit this word in your collection"
                  : "Add a new word you've learned to your collection"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="word">Word</Label>
                <Input
                  id="word"
                  placeholder="Enter the new word"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
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
                  required
                />
              </div>

              <div className="space-y-2">
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

              <div className="space-y-2">
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

              <div className="space-y-2">
                <Label htmlFor="confidence">Confidence Level (1-5)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <Button
                      key={level}
                      type="button"
                      variant={confidence === level ? "default" : "outline"}
                      onClick={() => setConfidence(level)}
                      className="flex-1"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              {editingWordId && (
                <Button type="button" variant="outline" className="flex-1" onClick={resetForm}>
                  Cancel
                </Button>
              )}
              <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600">
                <PlusCircle className="mr-2 h-4 w-4" /> {editingWordId ? "Update Word" : "Add Word"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      <div>
        <h2 className="text-3xl font-bold mb-6 text-primary">Recently Added</h2>

        {recentWords.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <BookOpen className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>No words added yet. Start building your vocabulary!</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {recentWords.map((word) => (
              <Card
                key={word.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleEditWord(word)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{word.word}</CardTitle>
                      <CardDescription>{word.meaning}</CardDescription>
                    </div>
                    <div className="flex">
                      <span className={`font-bold ${getConfidenceColor(word.confidence)}`}>{word.confidence}/5</span>
                    </div>
                  </div>
                </CardHeader>
                {word.exampleSentence && (
                  <CardContent className="pb-2">
                    <p className="text-sm italic">"{word.exampleSentence}"</p>
                    {word.exampleSentenceTranslation && (
                      <p className="text-sm mt-1">"{word.exampleSentenceTranslation}"</p>
                    )}
                  </CardContent>
                )}
                <CardFooter className="pt-0">
                  <p className="text-xs text-muted-foreground">Confidence: {word.confidence}/5</p>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

