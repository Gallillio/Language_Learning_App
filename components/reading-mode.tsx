"use client"

import type React from "react"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Book, ArrowLeft, X, Sparkles, Upload, Edit, Trash2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useWordBank } from "@/contexts/word-bank-context"
import { useStories } from "@/contexts/story-context"
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
import { useToast } from "@/components/ui/use-toast"

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
  existingWordData: {
    id: number | null
    meaning: string
    confidence: number
    learned: boolean
    exampleSentence?: string
    exampleSentenceTranslation?: string
  } | null
  onUpdate: () => void
  tempConfidence: number | null
  setTempConfidence: (confidence: number | null) => void
  tempLearned: boolean | null
  setTempLearned: (learned: boolean | null) => void
  meaningInputHighlight?: 'none' | 'blue' | 'red'
  setMeaningInputHighlight?: (highlight: 'none' | 'blue' | 'red') => void
  setSelectedWordData: React.Dispatch<React.SetStateAction<{
    id: number | null
    meaning: string
    confidence: number
    learned: boolean
    exampleSentence?: string
    exampleSentenceTranslation?: string
  } | null>>
  triggerSave?: boolean
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
  meaningInputHighlight,
  setMeaningInputHighlight,
  setSelectedWordData,
  triggerSave = false,
}: WordSidebarProps) {
  const { addWord, updateWord, markAsLearned, unmarkAsLearned, deleteWord, learningWords, learnedWords } = useWordBank()
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

  // Add state for delete confirmation
  const [showDeleteWarning, setShowDeleteWarning] = useState(false)

  // Define saveChanges with useCallback
  const saveChanges = useCallback(() => {
    // Special case: If user is marking a word as mastered (learned),
    // we don't require a meaning to be provided
    const isMarkedAsLearned = isLearned && tempLearned !== false;
    
    // Check if meaning is required but not provided
    if (!isMarkedAsLearned && !meaning.trim()) {
      setShowMeaningWarning(true);
      setMeaningInputHighlight?.('red');
      return;
    }

    // Log the current form state for debugging
    console.log('Saving word with current form data:', {
      id: existingWordData?.id,
      word: word,
      meaning: meaning,
      exampleSentence: exampleSentence,
      exampleSentenceTranslation: exampleSentenceTranslation,
      confidence: confidence,
      learned: isLearned
    });

    if (existingWordData) {
      // Make sure ID is not null before using it
      if (existingWordData.id !== null && existingWordData.id !== -1) {
        // Update existing word with all fields
        const updatedData = {
          meaning,
          exampleSentence,
          exampleSentenceTranslation,
          confidence,
        };
        
        // Log the update operation to debug
        console.log('Updating word with ID', existingWordData.id, updatedData);
        
        updateWord(existingWordData.id, updatedData);

        // If the learned status changed, handle that separately
        if (isLearned !== existingWordData.learned) {
          if (isLearned) {
            markAsLearned(existingWordData.id)
          } else {
            unmarkAsLearned(existingWordData.id)
          }
        }
        
        // Update the existingWordData to reflect the new values to prevent detecting changes 
        // after save (which would leave isChanged as true)
        const newExistingWordData = {
          ...existingWordData,
          meaning,
          exampleSentence,
          exampleSentenceTranslation,
          confidence,
          learned: isLearned
        };
        
        // Update parent component state with the updated data
        setSelectedWordData(newExistingWordData);
        
        // Force refresh to ensure changes are reflected immediately
        onUpdate();
      } else if (existingWordData.id === -1) {
        // This is a word that was just added with a temporary ID
        // We need to find the real word in the word bank
        console.log('Handling word with temporary ID, searching for real ID');
        
        // Only proceed if we have an actual meaning or the word is marked as learned
        if (meaning.trim() || isLearned) {
          setTimeout(() => {
            // After editing the word with temp ID, find it in the word bank
            const wordInBank = isLearned 
              ? learnedWords.find((w: { word: string }) => w.word === word)
              : learningWords.find((w: { word: string }) => w.word === word);
            
            if (wordInBank) {
              console.log('Found word in bank with real ID:', wordInBank.id);
              
              // Now update the word with the current form values
              const updatedData = {
                meaning,
                exampleSentence,
                exampleSentenceTranslation,
                confidence,
              };
              
              updateWord(wordInBank.id, updatedData);
              
              // Handle learned status
              if (isLearned !== wordInBank.learned) {
                if (isLearned) {
                  markAsLearned(wordInBank.id);
                } else {
                  unmarkAsLearned(wordInBank.id);
                }
              }
              
              // Create a new object to update the state with the real ID and current form values
              const newExistingWordData = {
                id: wordInBank.id,
                word: word,
                meaning: meaning,
                confidence: confidence,
                learned: isLearned,
                exampleSentence: exampleSentence,
                exampleSentenceTranslation: exampleSentenceTranslation,
              };
              
              // Update parent component state with the real ID and current form values
              setSelectedWordData(newExistingWordData);
              
              // Force a UI refresh
              onUpdate();
            } else {
              console.warn('Could not find word in bank after adding it');
            }
          }, 100);
        }
      } else {
        // If ID is null, treat it as a new word with the same word text
        console.log('Adding new word', word);
        
        // Only add word if it has a meaning or is marked as learned
        if (meaning.trim() || isLearned) {
          // Add the word and then update the parent's state with the newly created word ID
          const wordToAdd = {
            word,
            meaning,
            exampleSentence,
            exampleSentenceTranslation,
            confidence,
            learned: isLearned,
            language: "French",
          };
          
          // First, indicate we're saving
          setIsChanged(false);
          
          // Create a completely new object to ensure React detects the change
          const temporaryWord = {
            id: -1, // Temporary ID that will be replaced with real ID soon
            word: word,
            meaning: meaning,
            confidence: confidence,
            learned: isLearned,
            exampleSentence: exampleSentence,
            exampleSentenceTranslation: exampleSentenceTranslation,
          };
          
          // Update parent component state with the SAME data that's in the form,
          // but with a temporary ID to show edit mode
          setSelectedWordData(temporaryWord);
          
          // Force an update to show the Edit UI immediately
          onUpdate();
          
          addWord(wordToAdd).then(result => {
            if (result.success) {
              // Force a refresh to ensure word bank is updated
              onUpdate();
              
              // Immediately find the newly added word
              setTimeout(() => {
                // After successfully adding the word, find it in the word bank
                const newlyAddedWord = isLearned 
                  ? learnedWords.find((w: { word: string }) => w.word === word)
                  : learningWords.find((w: { word: string }) => w.word === word);
                
                if (newlyAddedWord) {
                  console.log('Found newly added word:', newlyAddedWord);
                  
                  // Create a new object to update the state with the real ID
                  const newExistingWordData = {
                    id: newlyAddedWord.id,
                    word: word,
                    meaning: meaning,
                    confidence: confidence,
                    learned: isLearned,
                    exampleSentence: exampleSentence,
                    exampleSentenceTranslation: exampleSentenceTranslation,
                  };
                  
                  // Update parent component state with a COMPLETELY NEW OBJECT
                  // to ensure React detects the change
                  setSelectedWordData(newExistingWordData);
                  
                  // Force a UI refresh
                  onUpdate();
                }
              }, 100);
            }
          });
        } else {
          setShowMeaningWarning(true);
          setMeaningInputHighlight?.('red');
          return;
        }
      }
    } else {
      // Only add new word if meaning is provided or word is marked as learned
      if (meaning.trim() || isLearned) {
        console.log('Adding brand new word', word);
        
        // Add the word and then update the parent's state with the newly created word ID
        const wordToAdd = {
          word,
          meaning,
          exampleSentence,
          exampleSentenceTranslation,
          confidence,
          learned: isLearned,
          language: "French",
        };
        
        // First, indicate we're saving
        setIsChanged(false);
        
        // Create a temporary placeholder object to immediately update the UI
        const temporaryWord = {
          id: -1, // Temporary ID that will be replaced with real ID soon
          word: word,
          meaning: meaning,
          confidence: confidence,
          learned: isLearned,
          exampleSentence: exampleSentence,
          exampleSentenceTranslation: exampleSentenceTranslation,
        };
        
        // Update parent component state with temporary data
        setSelectedWordData(temporaryWord);
        
        // Force an update to show the Edit UI immediately
        onUpdate();
        
        addWord(wordToAdd).then(result => {
          if (result.success) {
            // Force a refresh to ensure word bank is updated
            onUpdate();
            
            // Immediately find the newly added word
            setTimeout(() => {
              // After successfully adding the word, find it in the word bank
              const newlyAddedWord = isLearned 
                ? learnedWords.find((w: { word: string }) => w.word === word)
                : learningWords.find((w: { word: string }) => w.word === word);
              
              if (newlyAddedWord) {
                console.log('Found newly added word:', newlyAddedWord);
                
                // Create a new object to update the state
                const newExistingWordData = {
                  id: newlyAddedWord.id,
                  word: word,
                  meaning: meaning,
                  confidence: confidence,
                  learned: isLearned,
                  exampleSentence: exampleSentence,
                  exampleSentenceTranslation: exampleSentenceTranslation,
                };
                
                // Update parent component state
                setSelectedWordData(newExistingWordData);
                
                // Force a UI refresh
                onUpdate();
              }
            }, 100);
          }
        });
      } else {
        setShowMeaningWarning(true);
        setMeaningInputHighlight?.('red');
        return;
      }
    }

    // Clear temporary states
    setMeaningInputHighlight?.('none');
    setTempConfidence(null);
    setTempLearned(null);
    setIsChanged(false);
  }, [meaning, exampleSentence, exampleSentenceTranslation, confidence, isLearned, existingWordData, word, tempLearned, setMeaningInputHighlight, setTempConfidence, setTempLearned, onUpdate, addWord, updateWord, markAsLearned, unmarkAsLearned, setSelectedWordData, learningWords, learnedWords]);

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
    console.log('existingWordData updated:', existingWordData);
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
      // Don't close the sidebar if the delete warning is showing
      if (showDeleteWarning) {
        return;
      }
      
      // Check if word change confirmation is showing (through a data attribute on body or a similar approach)
      const isWordChangeConfirmationOpen = document.body.classList.contains('word-change-confirmation-open');
      if (isWordChangeConfirmationOpen) {
        return;
      }
      
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
  }, [meaning, confidence, exampleSentence, exampleSentenceTranslation, isLearned, isChanged, handleClose, hasValidMeaning, showDeleteWarning])

  // Track changes to form fields
  useEffect(() => {
    const originalLearned = existingWordData?.learned || false;
    const formChanged = 
      meaning !== (existingWordData?.meaning || "") ||
      exampleSentence !== (existingWordData?.exampleSentence || "") ||
      exampleSentenceTranslation !== (existingWordData?.exampleSentenceTranslation || "") ||
      confidence !== (existingWordData?.confidence || 1) ||
      isLearned !== originalLearned;

    console.log('Change detection:', {
      current: { 
        meaning, 
        exampleSentence, 
        exampleSentenceTranslation, 
        confidence, 
        isLearned 
      },
      original: { 
        meaning: existingWordData?.meaning || "", 
        exampleSentence: existingWordData?.exampleSentence || "", 
        exampleSentenceTranslation: existingWordData?.exampleSentenceTranslation || "", 
        confidence: existingWordData?.confidence || 1, 
        learned: originalLearned
      },
      changed: formChanged,
      learnedChanged: isLearned !== originalLearned
    });
    
    if (formChanged) {
      console.log('Form fields changed, setting isChanged to true');
      setIsChanged(true);
    } else {
      console.log('Form fields match existingWordData, no changes detected');
      setIsChanged(false);
    }
  }, [meaning, exampleSentence, exampleSentenceTranslation, confidence, isLearned, existingWordData]);

  // Watch for triggerSave from parent component
  useEffect(() => {
    if (triggerSave && isChanged) {
      // Only save if there are changes
      saveChanges();
    }
  }, [triggerSave, isChanged, saveChanges]);

  const saveAndClose = () => {
    if (!existingWordData && !hasValidMeaning) {
      setShowMeaningWarning(true)
      return
    }
    saveChanges()
    handleClose()
  }

  const handleCloseClick = () => {
    if (isChanged && hasValidMeaning) {
      setShowWarning(true)
    } else {
      handleClose()
    }
  }

  const handleMarkAsLearned = () => {
    console.log('Marking word as learned:', { 
      before: isLearned, 
      word, 
      existingWordData: existingWordData 
    });
    
    setIsLearned(true);
    setTempLearned(true);
    
    // Force isChanged to update immediately
    setIsChanged(true);
    
    // If the word already has a real ID (greater than 0) and is not marked as learned,
    // we can immediately update it in the word bank
    if (existingWordData?.id && existingWordData.id > 0 && !existingWordData.learned) {
      console.log('Marking existing word as learned in word bank with ID:', existingWordData.id);
      markAsLearned(existingWordData.id);
      
      // Update the existingWordData to reflect the change
      const updatedWordData = {
        ...existingWordData,
        learned: true
      };
      
      // Update parent state to reflect the change
      setSelectedWordData(updatedWordData);
      
      // Force a UI refresh
      onUpdate();
    }
    // If the word has a temporary ID (-1), we need to find its real ID in the word bank
    else if (existingWordData?.id === -1) {
      console.log('Word has temporary ID, searching for real ID in word bank for:', word);
      
      // Look for the word in both word banks
      setTimeout(() => {
        const wordInLearning = learningWords.find((w: { word: string }) => 
          w.word && w.word.toLowerCase() === word.toLowerCase()
        );
        const wordInLearned = learnedWords.find((w: { word: string }) => 
          w.word && w.word.toLowerCase() === word.toLowerCase()
        );
        const wordInBank = wordInLearning || wordInLearned;
        
        if (wordInBank) {
          console.log('Found word in word bank with real ID:', wordInBank.id);
          
          // Mark the word as learned in the word bank
          markAsLearned(wordInBank.id);
          
          // Create an updated word data object with the real ID
          const updatedWordData = {
            ...existingWordData,
            id: wordInBank.id,  // Replace temporary ID with real ID
            learned: true
          };
          
          // Update parent state
          setSelectedWordData(updatedWordData);
          
          // Force UI refresh
          onUpdate();
        } else {
          console.log('Could not find newly added word in word bank, trying direct save...');
          
          // If we can't find the word, try to save changes directly
          saveChanges();
        }
      }, 100);
    }
    // If the word doesn't have an ID (completely new), we'll handle it when saved
    else {
      console.log('New word or no ID available, changes will be applied on save');
    }
  }

  const handleUnmarkAsLearned = () => {
    console.log('Unmarking word as learned:', { 
      before: isLearned, 
      word,
      existingWordData: existingWordData 
    });
    
    setIsLearned(false);
    setTempLearned(false);
    
    // Force isChanged to update immediately
    setIsChanged(true);
    
    // If the word already has a real ID (greater than 0) and is marked as learned,
    // we can immediately update it in the word bank
    if (existingWordData?.id && existingWordData.id > 0 && existingWordData.learned) {
      console.log('Unmarking existing word as learned in word bank with ID:', existingWordData.id);
      unmarkAsLearned(existingWordData.id);
      
      // Update the existingWordData to reflect the change
      const updatedWordData = {
        ...existingWordData,
        learned: false
      };
      
      // Update parent state to reflect the change
      setSelectedWordData(updatedWordData);
      
      // Force a UI refresh
      onUpdate();
    }
    // If the word has a temporary ID (-1), we need to find its real ID in the word bank
    else if (existingWordData?.id === -1) {
      console.log('Word has temporary ID, searching for real ID in word bank for:', word);
      
      // Look for the word in both word banks
      setTimeout(() => {
        const wordInLearning = learningWords.find((w: { word: string }) => 
          w.word && w.word.toLowerCase() === word.toLowerCase()
        );
        const wordInLearned = learnedWords.find((w: { word: string }) => 
          w.word && w.word.toLowerCase() === word.toLowerCase()
        );
        const wordInBank = wordInLearning || wordInLearned;
        
        if (wordInBank) {
          console.log('Found word in word bank with real ID:', wordInBank.id);
          
          // Unmark the word as learned in the word bank
          unmarkAsLearned(wordInBank.id);
          
          // Create an updated word data object with the real ID
          const updatedWordData = {
            ...existingWordData,
            id: wordInBank.id,  // Replace temporary ID with real ID
            learned: false
          };
          
          // Update parent state
          setSelectedWordData(updatedWordData);
          
          // Force UI refresh
          onUpdate();
        } else {
          console.log('Could not find newly added word in word bank, trying direct save...');
          
          // If we can't find the word, try to save changes directly
          saveChanges();
        }
      }, 100);
    }
    // If the word doesn't have an ID (completely new), we'll handle it when saved
    else {
      console.log('New word or no ID available, changes will be applied on save');
    }
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

  // Add keyboard shortcut support for the sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard shortcuts when sidebar is open
      if (!sidebarRef.current) return;
      
      // Ignore if user is typing in an input field
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      
      // Process number keys 1-5 for confidence levels
      if (e.key >= '1' && e.key <= '5') {
        e.preventDefault();
        const confidenceLevel = parseInt(e.key);
        handleConfidenceChange(confidenceLevel);
      }
      
      // Process 'i' key for marking as learned/mastered (toggle)
      if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        if (isLearned) {
          handleUnmarkAsLearned();
        } else {
          handleMarkAsLearned();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLearned, handleConfidenceChange, handleMarkAsLearned, handleUnmarkAsLearned]);

  // In the WordSidebar component, update handleSidebarUpdate function
  const handleSidebarUpdate = useCallback(() => {
    // Perform a more robust refresh to ensure UI updates
    console.log('Performing sidebar update');
    
    // Call parent's update function
    onUpdate();
    
    // Force a re-render of the sidebar
    setIsChanged(false);
    
    // If we have an ID now, update the UI to reflect we're editing an existing word
    if (existingWordData?.id) {
      console.log('Sidebar now editing existing word with ID:', existingWordData.id, 'and data:', existingWordData);
    }
  }, [onUpdate, existingWordData]);

  // Add handleDelete function
  const handleDelete = () => {
    if (existingWordData?.id) {
      deleteWord(existingWordData.id).then(() => {
        onUpdate()
        handleClose()
      })
    }
    setShowDeleteWarning(false)
  }

  return (
    <>
      <div 
        className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg z-50 overflow-y-auto" 
        ref={sidebarRef}
        data-changes={isChanged && hasValidMeaning ? "true" : "false"}
        data-word-id={existingWordData?.id || "new"}
        data-word-data={`meaning:${meaning.substring(0, 20)}`}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold">
              {existingWordData && existingWordData.id !== null ? "Edit Word" : "Add New Word"}
            </h3>
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
                onChange={(e) => {
                  setMeaning(e.target.value);
                  // If meaning is added, clear any blue highlight
                  if (e.target.value.trim() && meaningInputHighlight === 'blue') {
                    setMeaningInputHighlight?.('none');
                  }
                }}
                className={
                  showMeaningWarning 
                    ? "border-red-500" 
                    : meaningInputHighlight === 'blue'
                      ? "border-blue-500 focus:ring-blue-500"
                      : meaningInputHighlight === 'red'
                        ? "border-red-500"
                        : ""
                }
              />
              {showMeaningWarning && (
                <p className="text-sm text-red-500 mt-1">Please add a meaning for this word</p>
              )}
              {meaningInputHighlight === 'blue' && !showMeaningWarning && (
                <p className="text-sm text-blue-500 mt-1">Please add a meaning for this word</p>
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
                <Button onClick={handleUnmarkAsLearned} variant="outline" className="flex-1 border-primary text-primary">
                  <span className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-primary"></span>
                    Unmark as Mastered
                  </span>
                </Button>
              ) : (
                <Button onClick={handleMarkAsLearned} variant="outline" className="flex-1">
                  Mark as Mastered
                </Button>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button 
                onClick={saveChanges} 
                variant="default" 
                className={`flex-1 ${isLearned ? 'bg-primary' : ''}`}
                disabled={!isChanged}
                data-is-changed={isChanged}
                data-is-learned={isLearned}
              >
                {isLearned ? 'Save as Mastered' : 'Save Changes'}
              </Button>
              <Button onClick={handleCloseClick} variant="outline" className="flex-1">
                Close
              </Button>
            </div>

            {existingWordData?.id && (
              <div className="pt-4">
                <Button 
                  onClick={() => setShowDeleteWarning(true)} 
                  variant="destructive" 
                  className="w-full flex items-center justify-center gap-2"
                >
                  <Trash2 className="h-4 w-4" /> Delete Word
                </Button>
              </div>
            )}
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
            <Button variant="outline" onClick={() => {
              setShowWarning(false);
              handleClose();
            }}>
              Discard Changes
            </Button>
            <Button onClick={saveAndClose}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={showDeleteWarning}
        onOpenChange={(open) => {
          // Never auto-close the dialog
          if (open === true) {
            setShowDeleteWarning(true);
          }
          // We ignore attempts to close the dialog automatically
          // Only the Cancel and Delete buttons should close it
        }}
      >
        <DialogContent 
          className="sm:max-w-[425px]"
          // Prevent closing on outside pointer events
          onPointerDownOutside={(e) => e.preventDefault()}
          // Prevent closing on escape key and outside clicks
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Delete Word</DialogTitle>
            <DialogDescription>Are you sure you want to delete "{word}"? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setShowDeleteWarning(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
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
  const { stories, userLibrary, loading: storiesLoading, fetchStories, fetchUserLibrary, addToLibrary } = useStories()
  const { learningWords, learnedWords, addWord, updateWord, updateConfidence, markAsLearned, unmarkAsLearned, getWordStatus, deleteWord } = useWordBank()
  const { toast } = useToast()

  // First, declare the stories state
  const [availableStories, setAvailableStories] = useState<Story[]>([])

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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [meaningInputHighlight, setMeaningInputHighlight] = useState<'none' | 'blue' | 'red'>('none')
  
  // Add state for word change confirmation
  const [showWordChangeConfirmation, setShowWordChangeConfirmation] = useState(false)
  const [tempSelectedWord, setTempSelectedWord] = useState<string | null>(null)
  
  // Add state to trigger a save from outside the sidebar
  const [triggerSave, setTriggerSave] = useState(false)
  
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
    setAvailableStories(storiesWithStats)
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
  const [isEditingMultiSelect, setIsEditingMultiSelect] = useState(false)

  const [sidebarJustClosed, setSidebarJustClosed] = useState(false)

  // Handle word span mouse down - start selection
  const handleWordSpanMouseDown = (word: string) => {
    setIsEditingMultiSelect(true)
    setSelectedWordSpans([word])
  }

  // Handle word span mouse enter - continue selection if mouse is down
  const handleWordSpanMouseEnter = (word: string) => {
    if (isEditingMultiSelect && !selectedWordSpans.includes(word)) {
      setSelectedWordSpans((prev) => [...prev, word])
    }
  }

  // Handle mouse up - end selection
  useEffect(() => {
    const handleMouseUp = () => {
      setIsEditingMultiSelect(false)
    }

    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [])

  useEffect(() => {
    const handleMouseUp = () => {
      setIsEditingMultiSelect(false)

      // Only open the sidebar if it wasn't just closed and we have multiple words selected
      if (selectedWordSpans.length > 1 && !sidebarJustClosed && !selectedWord) {
        const phrase = selectedWordSpans.join(" ")

        // Find if phrase exists in either bank
        const learningWord = learningWords.find((w) => w.word && w.word.toLowerCase() === phrase.toLowerCase())
        const learnedWord = learnedWords.find((w) => w.word && w.word.toLowerCase() === phrase.toLowerCase())
        const foundWord = learningWord || learnedWord

        if (foundWord) {
          setSelectedWordData({
            id: foundWord.id,
            word: foundWord.word,
            meaning: foundWord.meaning || "",
            confidence: foundWord.confidence,
            learned: foundWord.learned || false,
            exampleSentence: foundWord.exampleSentence || "",
            exampleSentenceTranslation: foundWord.exampleSentenceTranslation || "",
          })
        } else {
          setSelectedWordData({
            id: null,
            word: phrase,
            meaning: "",
            confidence: 1,
            learned: false,
            exampleSentence: "",
            exampleSentenceTranslation: "",
          })
        }

        setSelectedWord(phrase)
        setSidebarOpen(true)
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
  }, [selectedWordSpans, learningWords, learnedWords, sidebarJustClosed, selectedWord, setSelectedWordData, setSelectedWord, setSidebarOpen])

  // Add a state to track which word was affected by keyboard shortcuts
  const [lastShortcutWord, setLastShortcutWord] = useState<string | null>(null);

  // Add keyboard shortcut handler for the currently hovered word
  useEffect(() => {
    // Only process if a story is selected
    if (!selectedStory) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only process if we have a hovered word and not editing multiple words or no sidebar open
      if (!hoveredWord || isEditingMultiSelect || selectedWord) return;
      
      const word = hoveredWord.toLowerCase();
      const foundLearningWord = learningWords.find(w => w.word && w.word.toLowerCase() === word);
      const foundLearnedWord = learnedWords.find(w => w.word && w.word.toLowerCase() === word);
      const foundWord = foundLearningWord || foundLearnedWord;
      
      // Process number keys 1-5 for confidence levels
      if (e.key >= '1' && e.key <= '5') {
        const confidenceLevel = parseInt(e.key);
        
        // Track which word this shortcut affects
        setLastShortcutWord(word);
        
        if (foundWord) {
          // Update existing word's confidence directly
          if (foundWord.id) {
            // If word is currently mastered, unmark it first
            if (foundWord.learned) {
              console.log('Unmastering word before setting confidence:', word);
              unmarkAsLearned(foundWord.id);
              
              // Need a small delay to ensure unmark completes before setting confidence
              setTimeout(() => {
                updateConfidence(foundWord.id, confidenceLevel);
                // Set temporary states to show the changes
                setTempLearned(false);
                setTempConfidence(confidenceLevel);
                // Force refresh to show the change
                forceRefresh();
              }, 50);
            } else {
              // Word is not mastered, just update confidence
              updateConfidence(foundWord.id, confidenceLevel);
              // Set temporary states to show the change
              setTempConfidence(confidenceLevel);
              // Force refresh to show the change
              forceRefresh();
            }
          }
        } else {
          // New word - open sidebar with preset confidence
          setSelectedWordData({
            id: null,
            word: word,
            meaning: "",
            confidence: confidenceLevel,
            learned: false,
            exampleSentence: "",
            exampleSentenceTranslation: "",
          });
          setSelectedWord(word);
          setSidebarOpen(true);
          setTempConfidence(confidenceLevel);
          // Highlight meaning input to indicate input is needed
          setMeaningInputHighlight('blue');
        }
      }
      
      // Process 'i' key for marking as learned/mastered (toggle behavior)
      if (e.key.toLowerCase() === 'i') {
        // Track which word this shortcut affects
        setLastShortcutWord(word);
        
        if (foundWord && foundWord.id) {
          // Toggle learned status
          if (foundWord.learned) {
            // If already learned, unmark it
            console.log('Unmarking word as learned:', word);
            unmarkAsLearned(foundWord.id);
            setTempLearned(false);
          } else {
            // If not learned, mark it
            console.log('Marking word as learned:', word);
            markAsLearned(foundWord.id);
            setTempLearned(true);
          }
          forceRefresh();
          
          // Show a toast notification
          toast({
            title: foundWord.learned ? "Word Unmastered" : "Word Mastered",
            description: `"${word}" was ${foundWord.learned ? "removed from" : "added to"} your mastered words.`,
            duration: 2000,
          });
        } else {
          // New word - add directly to word bank as mastered without opening sidebar
          console.log('Adding new word as mastered:', word);
          addWord({
            word: word,
            meaning: "", // Empty meaning is allowed for mastered words
            exampleSentence: "",
            exampleSentenceTranslation: "",
            confidence: 1,
            learned: true,
            language: "French",
          });
          
          // Set temporary state to show visual feedback, but don't open sidebar
          setTempLearned(true);
          forceRefresh();
          
          // Show a toast notification to confirm the word was added
          toast({
            title: "Word Mastered",
            description: `"${word}" was added to your mastered words.`,
            duration: 2000,
          });
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [hoveredWord, isEditingMultiSelect, selectedWord, learningWords, learnedWords, updateConfidence, markAsLearned, unmarkAsLearned, forceRefresh, selectedStory, toast]);

  // Define handleWordClick and other functions before they're used
  const handleWordClick = useCallback((e: React.MouseEvent, word: string) => {
    // Prevent default to stop any other click handlers
    e.preventDefault();
    e.stopPropagation();
    
    if (isEditingMultiSelect) return;
    
    // Don't do anything if we're already showing the word change confirmation
    if (showWordChangeConfirmation) return;

    const clickedWord = word.toLowerCase();
    
    // Don't do anything if clicking the same word
    if (selectedWord === clickedWord && sidebarOpen) return;
    
    // Reset temporary states when clicking on a new word
    // This prevents shortcuts from one word affecting another
    setTempConfidence(null);
    setTempLearned(null);
    setMeaningInputHighlight('none');
    setLastShortcutWord(null); // Clear the last shortcut word
    
    // If sidebar is open and there are unsaved changes, show warning
    if (sidebarOpen && selectedWord) {
      // Check if there are unsaved changes in the current word's sidebar
      const sidebarElement = document.querySelector('.fixed.top-0.right-0.h-full.w-80');
      const wordSidebarHasChanges = sidebarElement?.getAttribute('data-changes') === 'true';
      
      if (wordSidebarHasChanges) {
        // Store the word user is trying to click on
        setTempSelectedWord(clickedWord);
        // Show the confirmation dialog
        setShowWordChangeConfirmation(true);
        return;
      }
    }
    
    // If we're here, it means there are no unsaved changes or no sidebar is open
    // Search for the word in both learning and learned word lists
    const foundLearningWord = learningWords.find(w => w.word?.toLowerCase() === clickedWord);
    const foundLearnedWord = learnedWords.find(w => w.word?.toLowerCase() === clickedWord);
    const foundWord = foundLearningWord || foundLearnedWord;
    
    if (foundWord) {
      // If word exists in the wordbank, use its data
      setSelectedWordData({
        id: foundWord.id,
        word: foundWord.word,
        meaning: foundWord.meaning || "",
        confidence: foundWord.confidence,
        learned: foundWord.learned || false,
        exampleSentence: foundWord.exampleSentence || "",
        exampleSentenceTranslation: foundWord.exampleSentenceTranslation || "",
      });
    } else {
      // If word is not in wordbank, set a new word with default values
      setSelectedWordData({
        id: null,
        word: clickedWord,
        meaning: "",
        confidence: 1,
        learned: false,
        exampleSentence: "",
        exampleSentenceTranslation: "",
      });
    }
    
    setSelectedWord(clickedWord);
    setSidebarOpen(true);
  }, [isEditingMultiSelect, showWordChangeConfirmation, selectedWord, sidebarOpen, learningWords, learnedWords, setSelectedWordData, setSelectedWord, setSidebarOpen, setTempSelectedWord, setShowWordChangeConfirmation, setTempConfidence, setTempLearned, setMeaningInputHighlight, setLastShortcutWord]);

  function handleWordHover(word: string) {
    setHoveredWord(word)
  }

  function handleWordHoverLeave() {
    setHoveredWord(null)
  }

  // Now, define checkForPhrase and renderStoryContent
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
          // Add null checks to prevent "Cannot read properties of undefined" errors
          const learningPhrase = learningWords.find(w => w.word && w.word.toLowerCase() === cleanPhrase)
          const learnedPhrase = learnedWords.find(w => w.word && w.word.toLowerCase() === cleanPhrase)

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
          // Only apply temp changes if this was the word the shortcut was used on
          const shouldApplyTempChanges = hasTempChanges || (phrase === lastShortcutWord && (tempConfidence !== null || tempLearned !== null))

          if (shouldApplyTempChanges) {
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
          // Only apply temp changes if this was the word the shortcut was used on
          const shouldApplyTempChanges = hasTempChanges || (cleanToken === lastShortcutWord && (tempConfidence !== null || tempLearned !== null))

          if (shouldApplyTempChanges) {
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
                      onClick={(e) => handleWordClick(e, cleanToken)}
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
                onClick={(e) => handleWordClick(e, cleanToken)}
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
      handleWordSpanMouseDown,
      handleWordSpanMouseEnter,
      lastShortcutWord
    ],
  )

  // Finally, remove the floating button for selected phrases since we now open the sidebar automatically
  // Remove this code:

  // Update the setSelectedStory calls
  // Replace this:
  // setSelectedStory(story)
  // With this:
  const handleSelectStory = async (story: Story) => {
    setSelectedStoryId(story.id)
    setSelectedStory(story)
    setState({ selectedStory: story.id })
    
    // If story is not in user library, add it
    if (!userLibrary.some(s => s.id === story.id)) {
      const result = await addToLibrary(story.id)
      if (!result.success) {
        toast({
          title: "Error",
          description: result.message || "Failed to add story to your library",
          variant: "destructive"
        })
      }
    }
  }

  // Update the useEffect to find the selected story
  useEffect(() => {
    if (selectedStoryId && availableStories.length > 0) {
      const story = availableStories.find((s) => s.id === selectedStoryId) || null
      setSelectedStory(story)
    }
  }, [selectedStoryId, availableStories])

  // Add these handlers for the word change confirmation
  const handleDiscardAndSwitchWord = useCallback(() => {
    // First close the confirmation dialog
    setShowWordChangeConfirmation(false);
    
    // Reset temporary states to prevent shortcuts from affecting the new word
    setTempConfidence(null);
    setTempLearned(null);
    setMeaningInputHighlight('none');
    setLastShortcutWord(null); // Clear the last shortcut word
    
    if (tempSelectedWord) {
      // Immediately close any current sidebar
      setSelectedWord(null);
      setSidebarOpen(false);
      
      // Small delay to ensure the sidebar is closed before opening the new one
      setTimeout(() => {
        // Follow the same process as in handleWordClick but for tempSelectedWord
        const clickedWord = tempSelectedWord;
        
        // Search for the word in both learning and learned word lists
        const foundLearningWord = learningWords.find(w => w.word?.toLowerCase() === clickedWord)
        const foundLearnedWord = learnedWords.find(w => w.word?.toLowerCase() === clickedWord)
        const foundWord = foundLearningWord || foundLearnedWord
        
        if (foundWord) {
          // If word exists in the wordbank, use its data
          setSelectedWordData({
            id: foundWord.id,
            word: foundWord.word,
            meaning: foundWord.meaning || "",
            confidence: foundWord.confidence,
            learned: foundWord.learned || false,
            exampleSentence: foundWord.exampleSentence || "",
            exampleSentenceTranslation: foundWord.exampleSentenceTranslation || "",
          })
        } else {
          // If word is not in wordbank, set a new word with default values
          setSelectedWordData({
            id: null,
            word: clickedWord,
            meaning: "",
            confidence: 1,
            learned: false,
            exampleSentence: "",
            exampleSentenceTranslation: "",
          })
        }
        
        // Then open the sidebar for the new word
        setSelectedWord(clickedWord);
        setSidebarOpen(true);
        
        // Clear the temp selected word
        setTempSelectedWord(null);
      }, 100);
    }
  }, [tempSelectedWord, learningWords, learnedWords, setSelectedWordData, setSelectedWord, setSidebarOpen, setTempSelectedWord, setTempConfidence, setTempLearned, setMeaningInputHighlight]);

  const handleSaveAndSwitchWord = useCallback(() => {
    // First close the confirmation dialog
    setShowWordChangeConfirmation(false);
    
    // Trigger the save in the sidebar by setting the triggerSave flag
    setTriggerSave(true);
    
    // Wait a short moment to allow the save to complete, then switch words
    setTimeout(() => {
      // Reset the trigger
      setTriggerSave(false);
      
      // Close the current sidebar
      setSelectedWord(null);
      setSidebarOpen(false);
      
      // Reset temporary states to prevent shortcuts from affecting the new word
      setTempConfidence(null);
      setTempLearned(null);
      setMeaningInputHighlight('none');
      
      // Short delay before opening the new sidebar
      setTimeout(() => {
        if (tempSelectedWord) {
          // Process the new word
          const clickedWord = tempSelectedWord;
          
          // Search for the word in both learning and learned word lists
          const foundLearningWord = learningWords.find(w => w.word?.toLowerCase() === clickedWord)
          const foundLearnedWord = learnedWords.find(w => w.word?.toLowerCase() === clickedWord)
          const foundWord = foundLearningWord || foundLearnedWord
          
          if (foundWord) {
            // If word exists in the wordbank, use its data
            setSelectedWordData({
              id: foundWord.id,
              word: foundWord.word,
              meaning: foundWord.meaning || "",
              confidence: foundWord.confidence,
              learned: foundWord.learned || false,
              exampleSentence: foundWord.exampleSentence || "",
              exampleSentenceTranslation: foundWord.exampleSentenceTranslation || "",
            })
          } else {
            // If word is not in wordbank, set a new word with default values
            setSelectedWordData({
              id: null,
              word: clickedWord,
              meaning: "",
              confidence: 1,
              learned: false,
              exampleSentence: "",
              exampleSentenceTranslation: "",
            })
          }
          
          // Open the new word's sidebar
          setSelectedWord(clickedWord);
          setSidebarOpen(true);
          
          // Clear the temp selected word
          setTempSelectedWord(null);
        }
      }, 100);
    }, 300); // A longer wait to ensure the save completes
  }, [tempSelectedWord, learningWords, learnedWords, setSelectedWordData, setSelectedWord, setSidebarOpen, setTempSelectedWord, setTriggerSave, setTempConfidence, setTempLearned, setMeaningInputHighlight]);

  // Add effect to toggle class on body when word change confirmation is shown
  useEffect(() => {
    if (showWordChangeConfirmation) {
      document.body.classList.add('word-change-confirmation-open');
    } else {
      document.body.classList.remove('word-change-confirmation-open');
    }
    
    return () => {
      // Clean up on unmount
      document.body.classList.remove('word-change-confirmation-open');
    };
  }, [showWordChangeConfirmation]);

  // Add a new handler for the X button in the word change confirmation dialog
  const handleCancelWordChange = useCallback(() => {
    // Close the confirmation dialog
    setShowWordChangeConfirmation(false);
    
    // Clear the temporary selected word
    setTempSelectedWord(null);
    
    // Keep the original sidebar open
    // (We don't need to do anything else since we're just canceling the operation)
  }, [setShowWordChangeConfirmation, setTempSelectedWord]);

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
            key={`word-sidebar-${selectedWordData?.id || 'new'}-${selectedWordData?.meaning || 'empty'}-${refreshTrigger}`}
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
            meaningInputHighlight={meaningInputHighlight}
            setMeaningInputHighlight={setMeaningInputHighlight}
            setSelectedWordData={setSelectedWordData}
            triggerSave={triggerSave}
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

        {/* Add Word Change Confirmation Dialog */}
        <Dialog 
          open={showWordChangeConfirmation} 
          onOpenChange={(open) => {
            // If dialog is closing via X button, call the cancel handler
            if (open === false) {
              handleCancelWordChange();
              return;
            }
            setShowWordChangeConfirmation(open);
          }}
        >
          <DialogContent 
            className="sm:max-w-[425px]"
            // Prevent closing on outside click or escape key
            onPointerDownOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => e.preventDefault()}
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Unsaved Changes</DialogTitle>
              <DialogDescription>
                You have unsaved changes for "{selectedWord}". Do you want to save these changes before viewing "{tempSelectedWord}"?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button variant="outline" onClick={handleDiscardAndSwitchWord}>
                Discard Changes
              </Button>
              <Button onClick={handleSaveAndSwitchWord}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
        {availableStories.map((story) => (
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

  function handleAddStory(newStoryData: Omit<Story, "id" | "progress" | "wordCount" | "lastRead" | "wordStats">) {
    const apiStoryData = {
      title: newStoryData.title,
      content: newStoryData.content,
      language: "French", // Use a proper language selection in the UI
      difficulty: "intermediate", // Use a proper difficulty selection in the UI
      tags: "" // Add tags support if needed
    }
    
    // Use an appropriate API call here
    // For now, we'll just close the dialog
    setIsAddStoryDialogOpen(false)
  }

  function handleEditStory(updatedStory: Story) {
    const updatedStories = availableStories.map((story) =>
      story.id === updatedStory.id ? { ...updatedStory, ...calculateWordStats(updatedStory.content) } : story,
    )
    setAvailableStories(updatedStories)
    setSelectedStory(updatedStory)
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

