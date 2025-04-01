"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
// Import the Flame icon
import { Menu, X, Flame } from "lucide-react"
import GameMode from "@/components/game-mode"
import ReadingMode from "@/components/reading-mode"
import FlashCardsMode from "@/components/flash-cards-mode"
import AddNewWordsMode from "@/components/add-new-words-mode"
import WordBank from "@/components/word-bank"
import Navbar from "@/components/navbar"
import AuthGuard from "@/components/auth-guard"

export default function LanguageLearningApp() {
  const [activeTab, setActiveTab] = useState("game")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Add state variables to track the state of each tab
  // Add these after the existing state variables

  const [readingModeState, setReadingModeState] = useState<{ selectedStory: number | null }>({ selectedStory: null })
  const [wordBankState, setWordBankState] = useState<{ searchQuery: string }>({ searchQuery: "" })
  const [flashCardsState, setFlashCardsState] = useState<{ activeTab: string }>({ activeTab: "today" })
  const [gameModeState, setGameModeState] = useState<{ selectedModule: number | null }>({ selectedModule: null })
  const [addWordsState, setAddWordsState] = useState<{ editingWordId: number | null }>({ editingWordId: null })

  // Check if screen is mobile on mount and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 800)
    }

    // Initial check
    checkIfMobile()

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile)

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile)
  }, [])

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setIsMobileMenuOpen(false)
  }

  // Add the streak counter in the header
  return (
    <>
      <Navbar />
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50">
          <header className="bg-white shadow-md py-4">
            <div className="container mx-auto px-4 flex justify-between items-center">
              <h1 className="text-3xl font-bold text-primary">Language Buddy</h1>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1 rounded-full">
                  <Flame className="h-5 w-5 text-amber-500 fill-amber-500" />
                  <span className="font-bold">3</span>
                  <span className="text-xs hidden sm:inline">days</span>
                </div>

                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    aria-label="Toggle menu"
                  >
                    {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                  </Button>
                )}
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              {/* Desktop Navigation */}
              {!isMobile && (
                <TabsList className="grid w-full grid-cols-5 mb-8">
                  <TabsTrigger value="game" className="text-lg">
                    Game Mode
                  </TabsTrigger>
                  <TabsTrigger value="reading" className="text-lg">
                    Reading Mode
                  </TabsTrigger>
                  <TabsTrigger value="flashcards" className="text-lg">
                    Flash Cards
                  </TabsTrigger>
                  <TabsTrigger value="wordbank" className="text-lg">
                    Word Bank
                  </TabsTrigger>
                  <TabsTrigger value="addwords" className="text-lg">
                    Add New Words
                  </TabsTrigger>
                </TabsList>
              )}

              {/* Mobile Navigation */}
              {isMobile && isMobileMenuOpen && (
                <div className="fixed inset-0 bg-white z-50 pt-20">
                  <div className="container mx-auto px-4 flex flex-col gap-4">
                    <Button
                      variant={activeTab === "game" ? "default" : "ghost"}
                      onClick={() => handleTabChange("game")}
                      className="w-full justify-start text-lg py-4"
                    >
                      Game Mode
                    </Button>
                    <Button
                      variant={activeTab === "reading" ? "default" : "ghost"}
                      onClick={() => handleTabChange("reading")}
                      className="w-full justify-start text-lg py-4"
                    >
                      Reading Mode
                    </Button>
                    <Button
                      variant={activeTab === "flashcards" ? "default" : "ghost"}
                      onClick={() => handleTabChange("flashcards")}
                      className="w-full justify-start text-lg py-4"
                    >
                      Flash Cards
                    </Button>
                    <Button
                      variant={activeTab === "wordbank" ? "default" : "ghost"}
                      onClick={() => handleTabChange("wordbank")}
                      className="w-full justify-start text-lg py-4"
                    >
                      Word Bank
                    </Button>
                    <Button
                      variant={activeTab === "addwords" ? "default" : "ghost"}
                      onClick={() => handleTabChange("addwords")}
                      className="w-full justify-start text-lg py-4"
                    >
                      Add New Words
                    </Button>
                  </div>
                </div>
              )}

              {/* Tab Content */}
              <TabsContent value="game" className="mt-6">
                <GameMode state={gameModeState} setState={setGameModeState} />
              </TabsContent>

              <TabsContent value="reading" className="mt-6">
                <ReadingMode state={readingModeState} setState={setReadingModeState} />
              </TabsContent>

              <TabsContent value="flashcards" className="mt-6">
                <FlashCardsMode state={flashCardsState} setState={setFlashCardsState} />
              </TabsContent>

              <TabsContent value="wordbank" className="mt-6">
                <WordBank state={wordBankState} setState={setWordBankState} />
              </TabsContent>

              <TabsContent value="addwords" className="mt-6">
                <AddNewWordsMode state={addWordsState} setState={setAddWordsState} />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </AuthGuard>
    </>
  )
}

