"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
// Import the Heart icon
import { CheckCircle, Lock, Book, Headphones, Mic, Eye, Dumbbell } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Define module types
type ModuleType = "reading" | "listening" | "speaking" | "watching" | "exercise"

interface Module {
  id: number
  type: ModuleType
  completed: boolean
}

// Move this function outside of the component so it can be used by LessonDialog
const getModuleTypeName = (type: ModuleType) => {
  switch (type) {
    case "reading":
      return "Reading"
    case "listening":
      return "Listening"
    case "speaking":
      return "Speaking"
    case "watching":
      return "Watching"
    case "exercise":
      return "Exercise"
  }
}

// Move this function outside of the component so it can be used by LessonDialog
const getModuleIcon = (type: ModuleType) => {
  switch (type) {
    case "reading":
      return <Book className="w-10 h-10 text-white" />
    case "listening":
      return <Headphones className="w-10 h-10 text-white" />
    case "speaking":
      return <Mic className="w-10 h-10 text-white" />
    case "watching":
      return <Eye className="w-10 h-10 text-white" />
    case "exercise":
      return <Dumbbell className="w-10 h-10 text-white" />
  }
}

// Update the component signature to accept props
export default function GameMode({
  state = { selectedModule: null },
  setState = () => {},
}: {
  state?: { selectedModule: number | null }
  setState?: (state: { selectedModule: number | null }) => void
} = {}) {
  // Update to mark all modules except the last one as completed
  const [completedModules, setCompletedModules] = useState([1, 2, 3, 4, 5])
  const [isRedoDialogOpen, setIsRedoDialogOpen] = useState(false)
  const [isLessonOpen, setIsLessonOpen] = useState(false)

  const modules: Module[] = [
    { id: 1, type: "reading", completed: true },
    { id: 2, type: "listening", completed: true },
    { id: 3, type: "speaking", completed: true },
    { id: 4, type: "watching", completed: true },
    { id: 5, type: "exercise", completed: true },
    { id: 6, type: "exercise", completed: false },
  ]

  // Replace the selectedModule state with a derived state from props
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(state.selectedModule)
  const selectedModule = selectedModuleId ? modules.find((m) => m.id === selectedModuleId) || null : null

  // Update the handleModuleClick function
  const handleModuleClick = (module: Module) => {
    setSelectedModuleId(module.id)
    setState({ selectedModule: module.id })

    if (completedModules.includes(module.id)) {
      // Module is completed, ask if user wants to redo
      setIsRedoDialogOpen(true)
    } else if (completedModules.includes(module.id - 1) || module.id === 1) {
      // Module is unlocked, open lesson
      setIsLessonOpen(true)
    }
  }

  const handleRedoLesson = () => {
    setIsRedoDialogOpen(false)
    setIsLessonOpen(true)
  }

  const handleCompleteLesson = () => {
    if (selectedModule && !completedModules.includes(selectedModule.id)) {
      setCompletedModules((prev) => [...prev, selectedModule.id])
    }
    setIsLessonOpen(false)
  }

  return (
    // Add hearts to the header
    <div className="flex flex-col items-center py-8">
      <div className="w-full mb-8">
        <h2 className="text-3xl font-bold text-primary">Learning Path</h2>
      </div>

      <div className="relative w-full max-w-md">
        {/* S-shaped path */}
        <svg className="absolute w-full h-full" style={{ top: 0, left: 0, zIndex: 0 }}>
          <path
            d="M 150,20 
               C 250,100 50,180 150,260 
               C 250,340 50,420 150,500 
               C 250,580 50,660 150,740"
            stroke="#D8B4FE"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Modules */}
        <div className="relative z-10">
          {modules.map((module, index) => {
            const isUnlocked = completedModules.includes(module.id - 1) || module.id === 1
            const isCompleted = completedModules.includes(module.id)

            // Calculate position based on index for S-shape
            const isEven = index % 2 === 0
            const xPos = isEven ? "30%" : "70%"
            const yPos = `${index * 120}px`

            return (
              <motion.div
                key={module.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.1 }}
                className="absolute"
                style={{
                  left: xPos,
                  top: yPos,
                  transform: "translate(-50%, 0)",
                }}
              >
                <motion.div
                  whileHover={isUnlocked ? { scale: 1.05 } : {}}
                  onClick={() => isUnlocked && handleModuleClick(module)}
                  className={`relative flex items-center justify-center w-32 h-32 rounded-full shadow-lg cursor-pointer
                    ${isCompleted ? "bg-green-500" : isUnlocked ? "bg-primary" : "bg-gray-300"}`}
                >
                  {!isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black bg-opacity-30">
                      <Lock className="w-10 h-10 text-white" />
                    </div>
                  )}

                  {isCompleted && (
                    <div className="absolute top-0 right-0 -mr-2 -mt-2">
                      <CheckCircle className="w-8 h-8 text-white bg-green-600 rounded-full" />
                    </div>
                  )}

                  <div className="text-center">
                    {getModuleIcon(module.type)}
                    <p className="text-sm text-white mt-2">{getModuleTypeName(module.type)}</p>
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Redo Dialog */}
      <Dialog open={isRedoDialogOpen} onOpenChange={setIsRedoDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Redo Lesson</DialogTitle>
            <DialogDescription>
              You've already completed this {selectedModule ? getModuleTypeName(selectedModule.type) : ""} lesson. Would
              you like to do it again?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRedoDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRedoLesson}>Redo Lesson</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      {selectedModule && (
        <LessonDialog
          isOpen={isLessonOpen}
          onClose={() => setIsLessonOpen(false)}
          moduleType={selectedModule.type}
          onComplete={handleCompleteLesson}
        />
      )}
    </div>
  )
}

// Lesson Dialog Component
interface LessonDialogProps {
  isOpen: boolean
  onClose: () => void
  moduleType: ModuleType
  onComplete: () => void
}

// Update the LessonDialog component to show hearts
function LessonDialog({ isOpen, onClose, moduleType, onComplete }: LessonDialogProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [hasAnswered, setHasAnswered] = useState(false)

  // Reset step when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0)
      setHasAnswered(false)
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentStep < getLessonContent(moduleType, setHasAnswered).length - 1) {
      setCurrentStep(currentStep + 1)
      setHasAnswered(false)
    } else {
      onComplete()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getModuleTypeName(moduleType)} Lesson</DialogTitle>
        </DialogHeader>

        <div className="py-4">{getLessonContent(moduleType, setHasAnswered)[currentStep]}</div>

        <DialogFooter>
          {hasAnswered && (
            <Button onClick={handleNext}>
              {currentStep < getLessonContent(moduleType, setHasAnswered).length - 1 ? "Next" : "Complete"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Update the LessonProps interface
interface LessonProps {
  onAnswer: () => void
}

// Update the getLessonContent function to include setLocalLives
function getLessonContent(moduleType: ModuleType, setHasAnswered: (value: boolean) => void) {
  switch (moduleType) {
    case "reading":
      return [
        <ReadingLesson key="reading-1" onAnswer={() => setHasAnswered(true)} />,
        <ReadingLesson2 key="reading-2" onAnswer={() => setHasAnswered(true)} />,
      ]
    case "listening":
      return [
        <ListeningLesson key="listening-1" onAnswer={() => setHasAnswered(true)} />,
        <ListeningLesson2 key="listening-2" onAnswer={() => setHasAnswered(true)} />,
      ]
    case "speaking":
      return [
        <SpeakingLesson key="speaking-1" onAnswer={() => setHasAnswered(true)} />,
        <SpeakingLesson2 key="speaking-2" onAnswer={() => setHasAnswered(true)} />,
      ]
    case "watching":
      return [
        <WatchingLesson key="watching-1" onAnswer={() => setHasAnswered(true)} />,
        <WatchingLesson2 key="watching-2" onAnswer={() => setHasAnswered(true)} />,
      ]
    case "exercise":
      return [
        <ExerciseLesson key="exercise-1" onAnswer={() => setHasAnswered(true)} />,
        <ExerciseLesson2 key="exercise-2" onAnswer={() => setHasAnswered(true)} />,
        <ExerciseLesson3 key="exercise-3" onAnswer={() => setHasAnswered(true)} />,
      ]
    default:
      return [<div key="default">Lesson content not available</div>]
  }
}

// Example lesson components for each type

// Update the ReadingLesson component to use lives
function ReadingLesson({ onAnswer }: LessonProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)

  // Call onAnswer when an answer is selected
  useEffect(() => {
    if (selectedAnswer) {
      setHasAnswered(true)
      onAnswer()
    }
  }, [selectedAnswer, onAnswer])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Read the following text and answer the question:</h3>

      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="mb-4">
          Marie aime beaucoup lire. Chaque jour, elle va à la bibliothèque pour emprunter un nouveau livre. Aujourd'hui,
          elle a choisi un roman d'aventure qui se déroule en Afrique.
        </p>

        <p>
          Elle s'installe confortablement dans son fauteuil préféré avec une tasse de thé et commence à lire. Elle est
          tellement absorbée par l'histoire qu'elle ne voit pas le temps passer.
        </p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">Où Marie va-t-elle chaque jour?</p>

        <div className="space-y-2">
          {["Au café", "À la bibliothèque", "Au parc", "À l'école"].map((answer) => (
            <div
              key={answer}
              className={`p-3 border rounded-lg ${hasAnswered ? "cursor-not-allowed" : "cursor-pointer"} ${
                selectedAnswer === answer
                  ? answer === "À la bibliothèque"
                    ? "bg-green-100 border-green-500"
                    : "bg-red-100 border-red-500"
                  : hasAnswered
                    ? "opacity-50"
                    : "hover:bg-gray-50"
              }`}
              onClick={() => !hasAnswered && setSelectedAnswer(answer)}
            >
              {answer}
            </div>
          ))}
        </div>

        {selectedAnswer && (
          <div
            className={`p-3 rounded-lg mt-4 ${selectedAnswer === "À la bibliothèque" ? "bg-green-100" : "bg-red-100"}`}
          >
            {selectedAnswer === "À la bibliothèque"
              ? "Correct! Marie goes to the library every day."
              : "Incorrect. Marie goes to the library (la bibliothèque) every day."}
          </div>
        )}
      </div>
    </div>
  )
}

// Update the ReadingLesson2 component to prevent editing answers
function ReadingLesson2({ onAnswer }: LessonProps) {
  const [userAnswer, setUserAnswer] = useState("")
  const [isChecked, setIsChecked] = useState(false)

  const checkAnswer = () => {
    setIsChecked(true)
    onAnswer()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Complete the sentence with the correct word:</h3>

      <div className="p-4 bg-gray-50 rounded-lg">
        <p>Le weekend, j'aime aller au ________ pour nager et me détendre.</p>
      </div>

      <div className="space-y-2">
        <Input
          placeholder="Type your answer here"
          value={userAnswer}
          onChange={(e) => !isChecked && setUserAnswer(e.target.value)}
          disabled={isChecked}
          className={isChecked ? "opacity-70" : ""}
        />

        <Button onClick={checkAnswer} disabled={isChecked || !userAnswer.trim()}>
          Check Answer
        </Button>

        {isChecked && (
          <div
            className={`p-3 rounded-lg mt-4 ${userAnswer.toLowerCase() === "piscine" ? "bg-green-100" : "bg-red-100"}`}
          >
            {userAnswer.toLowerCase() === "piscine"
              ? "Correct! 'Piscine' means 'swimming pool'."
              : `The correct answer is 'piscine' (swimming pool).`}
          </div>
        )}
      </div>
    </div>
  )
}

// Update the ListeningLesson component to prevent editing answers
function ListeningLesson({ onAnswer }: LessonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)

  // Call onAnswer when an answer is selected
  useEffect(() => {
    if (selectedAnswer) {
      setHasAnswered(true)
      onAnswer()
    }
  }, [selectedAnswer, onAnswer])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Listen to the audio and answer the question:</h3>

      <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
        <Button
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? "Pause Audio" : "Play Audio"}
          {isPlaying ? <span className="text-xs">(Simulated)</span> : <Headphones className="h-5 w-5" />}
        </Button>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg text-blue-700 text-sm">
        <p>In a real application, this would play an audio clip saying:</p>
        <p className="italic mt-1">"Bonjour! Je m'appelle Pierre. J'ai vingt-cinq ans et j'habite à Paris."</p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">Where does Pierre live?</p>

        <div className="space-y-2">
          {["Lyon", "Marseille", "Paris", "Bordeaux"].map((answer) => (
            <div
              key={answer}
              className={`p-3 border rounded-lg ${hasAnswered ? "cursor-not-allowed" : "cursor-pointer"} ${
                selectedAnswer === answer
                  ? answer === "Paris"
                    ? "bg-green-100 border-green-500"
                    : "bg-red-100 border-red-500"
                  : hasAnswered
                    ? "opacity-50"
                    : "hover:bg-gray-50"
              }`}
              onClick={() => !hasAnswered && setSelectedAnswer(answer)}
            >
              {answer}
            </div>
          ))}
        </div>

        {selectedAnswer && (
          <div className={`p-3 rounded-lg mt-4 ${selectedAnswer === "Paris" ? "bg-green-100" : "bg-red-100"}`}>
            {selectedAnswer === "Paris" ? "Correct! Pierre lives in Paris." : "Incorrect. Pierre lives in Paris."}
          </div>
        )}
      </div>
    </div>
  )
}

// Update the ListeningLesson2 component to prevent editing answers
function ListeningLesson2({ onAnswer }: LessonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [userInput, setUserInput] = useState("")
  const [isChecked, setIsChecked] = useState(false)

  const checkAnswer = () => {
    setIsChecked(true)
    onAnswer()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Listen to the numbers and write them down:</h3>

      <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
        <Button
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
          onClick={() => setIsPlaying(!isPlaying)}
        >
          {isPlaying ? "Pause Audio" : "Play Audio"}
          {isPlaying ? <span className="text-xs">(Simulated)</span> : <Headphones className="h-5 w-5" />}
        </Button>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg text-blue-700 text-sm">
        <p>In a real application, this would play an audio clip saying:</p>
        <p className="italic mt-1">"Quatre-vingt-dix-sept"</p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">Write the number you hear:</p>

        <Input
          placeholder="Type the number"
          value={userInput}
          onChange={(e) => !isChecked && setUserInput(e.target.value)}
          disabled={isChecked}
          className={isChecked ? "opacity-70" : ""}
        />

        <Button onClick={checkAnswer} disabled={isChecked || !userInput.trim()}>
          Check Answer
        </Button>

        {isChecked && (
          <div className={`p-3 rounded-lg mt-4 ${userInput === "97" ? "bg-green-100" : "bg-red-100"}`}>
            {userInput === "97"
              ? "Correct! 'Quatre-vingt-dix-sept' is 97."
              : "Incorrect. 'Quatre-vingt-dix-sept' is 97."}
          </div>
        )}
      </div>
    </div>
  )
}

function SpeakingLesson({ onAnswer }: LessonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [hasRecorded, setHasRecorded] = useState(false)

  const startRecording = () => {
    setIsRecording(true)

    // Simulate recording for 3 seconds
    setTimeout(() => {
      setIsRecording(false)
      setHasRecorded(true)
      onAnswer()
    }, 3000)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Practice pronouncing the following phrase:</h3>

      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-xl font-medium mb-2">Je voudrais un café, s'il vous plaît.</p>
        <p className="text-sm text-gray-500">I would like a coffee, please.</p>
      </div>

      <div className="flex justify-center p-4">
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className="flex items-center gap-2"
          onClick={startRecording}
          disabled={isRecording || hasRecorded}
        >
          {isRecording ? "Recording..." : hasRecorded ? "Recorded" : "Start Speaking"}
          <Mic className="h-5 w-5" />
        </Button>
      </div>

      {hasRecorded && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="font-medium mb-2">Feedback:</p>
          <p>In a real application, we would analyze your pronunciation and provide feedback.</p>
          <p className="mt-2 text-green-600">Great job! Your pronunciation is good.</p>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="font-medium mb-2">Tips for pronunciation:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Pay attention to the "r" sound in "voudrais"</li>
          <li>The "s'il vous plaît" should flow smoothly</li>
          <li>Practice the nasal sound in "un"</li>
        </ul>
      </div>
    </div>
  )
}

function SpeakingLesson2({ onAnswer }: LessonProps) {
  const [currentPhrase, setCurrentPhrase] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const phrases = [
    { french: "Bonjour, comment allez-vous?", english: "Hello, how are you?" },
    { french: "Je m'appelle...", english: "My name is..." },
    { french: "Merci beaucoup", english: "Thank you very much" },
  ]

  const startRecording = () => {
    setIsRecording(true)

    // Simulate recording for 2 seconds
    setTimeout(() => {
      setIsRecording(false)
      if (currentPhrase < phrases.length - 1) {
        setCurrentPhrase(currentPhrase + 1)
      } else {
        setIsComplete(true)
        onAnswer()
      }
    }, 2000)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Repeat the following phrases:</h3>

      <div className="p-4 bg-gray-50 rounded-lg text-center">
        <p className="text-xl font-medium mb-2">{phrases[currentPhrase].french}</p>
        <p className="text-sm text-gray-500">{phrases[currentPhrase].english}</p>
      </div>

      <div className="flex justify-center p-4">
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          className="flex items-center gap-2"
          onClick={startRecording}
          disabled={isRecording || isComplete}
        >
          {isRecording ? "Recording..." : isComplete ? "Complete" : "Repeat Phrase"}
          <Mic className="h-5 w-5" />
        </Button>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg">
        <p className="font-medium mb-2">Progress:</p>
        <p>
          Phrase {currentPhrase + 1} of {phrases.length}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
          <div
            className="bg-primary h-2.5 rounded-full"
            style={{ width: `${((currentPhrase + 1) / phrases.length) * 100}%` }}
          ></div>
        </div>
      </div>

      {isComplete && (
        <div className="p-3 rounded-lg bg-green-100 mt-4">
          <p className="font-medium">Great job!</p>
          <p>You've completed all the phrases.</p>
        </div>
      )}
    </div>
  )
}

// Add the missing WatchingLesson component after the SpeakingLesson2 component and before the WatchingLesson2 component

function WatchingLesson({ onAnswer }: LessonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)

  // Call onAnswer when an answer is selected
  useEffect(() => {
    if (selectedAnswer) {
      setHasAnswered(true)
      onAnswer()
    }
  }, [selectedAnswer, onAnswer])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Watch the video and answer the question:</h3>

      <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? "Pause Video" : "Play Video"}
          </Button>
          <p className="text-white text-sm mt-2">{isPlaying ? "Video playing (simulated)" : "Click to play video"}</p>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg text-blue-700 text-sm">
        <p>In a real application, this would play a video showing a conversation in French.</p>
        <p className="italic mt-1">The video shows two people greeting each other and discussing the weather.</p>
      </div>

      <div className="space-y-2">
        <p className="font-medium">What is the weather like according to the conversation?</p>

        <div className="space-y-2">
          {["Rainy", "Sunny", "Snowy", "Cloudy"].map((answer) => (
            <div
              key={answer}
              className={`p-3 border rounded-lg ${hasAnswered ? "cursor-not-allowed" : "cursor-pointer"} ${
                selectedAnswer === answer
                  ? answer === "Sunny"
                    ? "bg-green-100 border-green-500"
                    : "bg-red-100 border-red-500"
                  : hasAnswered
                    ? "opacity-50"
                    : "hover:bg-gray-50"
              }`}
              onClick={() => !hasAnswered && setSelectedAnswer(answer)}
            >
              {answer}
            </div>
          ))}
        </div>

        {selectedAnswer && (
          <div className={`p-3 rounded-lg mt-4 ${selectedAnswer === "Sunny" ? "bg-green-100" : "bg-red-100"}`}>
            {selectedAnswer === "Sunny"
              ? "Correct! The people in the video mention 'Il fait beau' (It's nice weather) and 'Le soleil brille' (The sun is shining)."
              : "Incorrect. The people in the video mention that it's sunny ('Il fait beau' and 'Le soleil brille')."}
          </div>
        )}
      </div>
    </div>
  )
}

// Update the WatchingLesson2 component to show red for wrong matches
function WatchingLesson2({ onAnswer }: LessonProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [matchedPairs, setMatchedPairs] = useState<number[]>([])
  const [selectedFrench, setSelectedFrench] = useState<number | null>(null)
  const [selectedEnglish, setSelectedEnglish] = useState<number | null>(null)
  const [wrongMatch, setWrongMatch] = useState<{ french: number | null; english: number | null }>({
    french: null,
    english: null,
  })

  const items = [
    { id: 1, french: "la pomme", english: "apple" },
    { id: 2, french: "la banane", english: "banana" },
    { id: 3, french: "l'orange", english: "orange" },
    { id: 4, french: "le raisin", english: "grape" },
  ]

  // Randomize the order of English items
  const [randomizedEnglishItems] = useState(() => {
    return [...items].sort(() => Math.random() - 0.5)
  })

  // Call onAnswer when all pairs are matched
  useEffect(() => {
    if (matchedPairs.length === items.length) {
      onAnswer()
    }
  }, [matchedPairs, items.length, onAnswer])

  const handleSelectFrench = (id: number) => {
    if (matchedPairs.includes(id)) return

    setSelectedFrench(id)

    // If English is already selected, check if it's a match
    if (selectedEnglish !== null) {
      const englishItem = randomizedEnglishItems.find((item) => item.id === selectedEnglish)

      if (englishItem && englishItem.id === id) {
        // It's a match!
        setMatchedPairs([...matchedPairs, id])
      } else {
        // Wrong match - show red feedback
        setWrongMatch({ french: id, english: selectedEnglish })

        // Reset wrong match after a delay
        setTimeout(() => {
          setWrongMatch({ french: null, english: null })
        }, 1000)
      }

      // Reset selections after a short delay
      setTimeout(() => {
        setSelectedFrench(null)
        setSelectedEnglish(null)
      }, 1000)
    }
  }

  const handleSelectEnglish = (id: number) => {
    if (matchedPairs.includes(id)) return

    setSelectedEnglish(id)

    // If French is already selected, check if it's a match
    if (selectedFrench !== null) {
      if (selectedFrench === id) {
        // It's a match!
        setMatchedPairs([...matchedPairs, id])
      } else {
        // Wrong match - show red feedback
        setWrongMatch({ french: selectedFrench, english: id })

        // Reset wrong match after a delay
        setTimeout(() => {
          setWrongMatch({ french: null, english: null })
        }, 1000)
      }

      // Reset selections after a short delay
      setTimeout(() => {
        setSelectedFrench(null)
        setSelectedEnglish(null)
      }, 1000)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Watch the video and match the fruits with their names:</h3>

      <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            className="bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? "Pause Video" : "Play Video"}
          </Button>
          <p className="text-white text-sm mt-2">{isPlaying ? "Video playing (simulated)" : "Click to play video"}</p>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-lg text-blue-700 text-sm">
        <p>In a real application, this would play a video showing different fruits with their French names.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="font-medium">French</p>
          {items.map((item) => (
            <div
              key={`french-${item.id}`}
              className={`p-3 border rounded-lg cursor-pointer ${
                matchedPairs.includes(item.id)
                  ? "bg-green-100 border-green-500"
                  : wrongMatch.french === item.id
                    ? "bg-red-100 border-red-500"
                    : selectedFrench === item.id
                      ? "bg-blue-100 border-blue-500"
                      : "hover:bg-gray-50"
              }`}
              onClick={() => handleSelectFrench(item.id)}
            >
              {item.french}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="font-medium">English</p>
          {randomizedEnglishItems.map((item) => (
            <div
              key={`english-${item.id}`}
              className={`p-3 border rounded-lg cursor-pointer ${
                matchedPairs.includes(item.id)
                  ? "bg-green-100 border-green-500"
                  : wrongMatch.english === item.id
                    ? "bg-red-100 border-red-500"
                    : selectedEnglish === item.id
                      ? "bg-blue-100 border-blue-500"
                      : "hover:bg-gray-50"
              }`}
              onClick={() => handleSelectEnglish(item.id)}
            >
              {item.english}
            </div>
          ))}
        </div>
      </div>

      {matchedPairs.length === items.length && (
        <div className="p-3 rounded-lg bg-green-100">Great job! You've matched all the fruits correctly.</div>
      )}
    </div>
  )
}

// Update the ExerciseLesson component to use the DragDropSentenceBuilder
// Remove the import for DragDropSentenceBuilder

// Exercise Lesson 1: Drag and drop sentence building
function ExerciseLesson({ onAnswer }: LessonProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)

  // Call onAnswer when an answer is selected
  useEffect(() => {
    if (selectedAnswer) {
      setHasAnswered(true)
      onAnswer()
    }
  }, [selectedAnswer, onAnswer])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Choose the correct translation for "I want to learn French":</h3>

      <div className="space-y-2">
        {["Je veux apprendre le français", "Je voudrais parler français", "J'aime le français", "Je suis français"].map(
          (answer) => (
            <div
              key={answer}
              className={`p-3 border rounded-lg ${hasAnswered ? "cursor-not-allowed" : "cursor-pointer"} ${
                selectedAnswer === answer
                  ? answer === "Je veux apprendre le français"
                    ? "bg-green-100 border-green-500"
                    : "bg-red-100 border-red-500"
                  : hasAnswered
                    ? "opacity-50"
                    : "hover:bg-gray-50"
              }`}
              onClick={() => !hasAnswered && setSelectedAnswer(answer)}
            >
              {answer}
            </div>
          ),
        )}
      </div>

      {selectedAnswer && (
        <div
          className={`p-3 rounded-lg mt-4 ${
            selectedAnswer === "Je veux apprendre le français" ? "bg-green-100" : "bg-red-100"
          }`}
        >
          {selectedAnswer === "Je veux apprendre le français"
            ? "Correct! 'Je veux apprendre le français' means 'I want to learn French'."
            : "Incorrect. 'Je veux apprendre le français' means 'I want to learn French'."}
        </div>
      )}
    </div>
  )
}

// Update the ExerciseLesson2 component to show red for wrong matches
function ExerciseLesson2({ onAnswer }: LessonProps) {
  const [selectedFrench, setSelectedFrench] = useState<number | null>(null)
  const [selectedEnglish, setSelectedEnglish] = useState<number | null>(null)
  const [matchedPairs, setMatchedPairs] = useState<number[]>([])
  const [wrongMatch, setWrongMatch] = useState<{ french: number | null; english: number | null }>({
    french: null,
    english: null,
  })

  const pairs = [
    { id: 1, french: "maison", english: "house" },
    { id: 2, french: "voiture", english: "car" },
    { id: 3, french: "chat", english: "cat" },
    { id: 4, french: "chien", english: "dog" },
    { id: 5, french: "livre", english: "book" },
  ]

  // Randomize the order of English items
  const [randomizedEnglishPairs] = useState(() => {
    return [...pairs].sort(() => Math.random() - 0.5)
  })

  // Call onAnswer when all pairs are matched
  useEffect(() => {
    if (matchedPairs.length === pairs.length) {
      onAnswer()
    }
  }, [matchedPairs, pairs.length, onAnswer])

  const handleSelectFrench = (id: number) => {
    if (matchedPairs.includes(id)) return

    setSelectedFrench(id)

    // If English is already selected, check if it's a match
    if (selectedEnglish !== null) {
      const englishPair = randomizedEnglishPairs.find((pair) => pair.id === selectedEnglish)

      if (englishPair && englishPair.id === id) {
        // It's a match!
        setMatchedPairs([...matchedPairs, id])
      } else {
        // Wrong match - show red feedback
        setWrongMatch({ french: id, english: selectedEnglish })

        // Reset wrong match after a delay
        setTimeout(() => {
          setWrongMatch({ french: null, english: null })
        }, 1000)
      }

      // Reset selections after a short delay
      setTimeout(() => {
        setSelectedFrench(null)
        setSelectedEnglish(null)
      }, 1000)
    }
  }

  const handleSelectEnglish = (id: number) => {
    if (matchedPairs.includes(id)) return

    setSelectedEnglish(id)

    // If French is already selected, check if it's a match
    if (selectedFrench !== null) {
      const frenchPair = pairs.find((pair) => pair.id === selectedFrench)

      if (frenchPair && frenchPair.id === id) {
        // It's a match!
        setMatchedPairs([...matchedPairs, id])
      } else {
        // Wrong match - show red feedback
        setWrongMatch({ french: selectedFrench, english: id })

        // Reset wrong match after a delay
        setTimeout(() => {
          setWrongMatch({ french: null, english: null })
        }, 1000)
      }

      // Reset selections after a short delay
      setTimeout(() => {
        setSelectedFrench(null)
        setSelectedEnglish(null)
      }, 1000)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Match the French words with their English translations:</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="font-medium">French</p>
          {pairs.map((pair) => (
            <div
              key={`french-${pair.id}`}
              className={`p-3 border rounded-lg cursor-pointer ${
                matchedPairs.includes(pair.id)
                  ? "bg-green-100 border-green-500"
                  : wrongMatch.french === pair.id
                    ? "bg-red-100 border-red-500"
                    : selectedFrench === pair.id
                      ? "bg-blue-100 border-blue-500"
                      : "hover:bg-gray-50"
              }`}
              onClick={() => handleSelectFrench(pair.id)}
            >
              {pair.french}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <p className="font-medium">English</p>
          {randomizedEnglishPairs.map((pair) => (
            <div
              key={`english-${pair.id}`}
              className={`p-3 border rounded-lg cursor-pointer ${
                matchedPairs.includes(pair.id)
                  ? "bg-green-100 border-green-500"
                  : wrongMatch.english === pair.id
                    ? "bg-red-100 border-red-500"
                    : selectedEnglish === pair.id
                      ? "bg-blue-100 border-blue-500"
                      : "hover:bg-gray-50"
              }`}
              onClick={() => handleSelectEnglish(pair.id)}
            >
              {pair.english}
            </div>
          ))}
        </div>
      </div>

      {matchedPairs.length === pairs.length && (
        <div className="p-3 rounded-lg bg-green-100">Great job! You've matched all the words correctly.</div>
      )}
    </div>
  )
}

// Add the ExerciseLesson3 component after the ExerciseLesson2 component
// Add this code right after the ExerciseLesson2 function:

function ExerciseLesson3({ onAnswer }: LessonProps) {
  const [userAnswer, setUserAnswer] = useState("")
  const [isChecked, setIsChecked] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const correctAnswer = "Je suis très content de vous rencontrer"

  const checkAnswer = () => {
    setIsChecked(true)

    // Check if answer is close enough (case insensitive)
    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()

    onAnswer()
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Translate the following sentence to French:</h3>

      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="font-medium">I am very happy to meet you.</p>
      </div>

      <div className="space-y-2">
        <Textarea
          placeholder="Type your translation here"
          value={userAnswer}
          onChange={(e) => !isChecked && setUserAnswer(e.target.value)}
          disabled={isChecked}
          className={isChecked ? "opacity-70" : ""}
          rows={3}
        />

        <div className="flex gap-2">
          <Button onClick={checkAnswer} disabled={isChecked || !userAnswer.trim()} className="flex-1">
            Check Answer
          </Button>

          {!isChecked && (
            <Button variant="outline" onClick={() => setShowHint(!showHint)} className="flex-1">
              {showHint ? "Hide Hint" : "Show Hint"}
            </Button>
          )}
        </div>

        {showHint && !isChecked && (
          <div className="p-3 rounded-lg bg-blue-50">
            <p className="font-medium">Hint:</p>
            <p>Start with "Je suis..." (I am)</p>
            <p>The word for "very" is "très"</p>
            <p>"Happy" is "content"</p>
            <p>"To meet you" is "de vous rencontrer"</p>
          </div>
        )}

        {isChecked && (
          <div
            className={`p-3 rounded-lg mt-4 ${
              userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim() ? "bg-green-100" : "bg-red-100"
            }`}
          >
            {userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
              ? "Correct! Great job!"
              : `The correct translation is: "${correctAnswer}"`}
          </div>
        )}
      </div>
    </div>
  )
}

