"use client"

import { useState } from "react"
import { DndProvider, useDrag, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

// Drag and drop item types
const ItemTypes = {
  WORD: "word",
}

// Draggable Word component
interface DraggableWordProps {
  word: string
  index: number
  isPlaced: boolean
}

function DraggableWord({ word, index, isPlaced }: DraggableWordProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.WORD,
    item: () => ({ word, index }), // Use item as a function instead of begin
    canDrag: !isPlaced,
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  return (
    <div
      ref={drag}
      className={`p-2 bg-primary text-white rounded cursor-move ${
        isPlaced ? "opacity-50" : ""
      } ${isDragging ? "opacity-30" : ""}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {word}
    </div>
  )
}

// Droppable Slot component
interface DroppableSlotProps {
  index: number
  word: string | null
  onDrop: (index: number, word: string, wordIndex: number) => void
  isComplete: boolean
  isCorrect: boolean
  correctWord: string | null
}

function DroppableSlot({ index, word, onDrop, isComplete, isCorrect, correctWord }: DroppableSlotProps) {
  const [{ isOver, canDrop }, drop] = useDrop(() => ({
    accept: ItemTypes.WORD,
    drop: (item: { word: string; index: number }) => {
      onDrop(index, item.word, item.index)
    },
    canDrop: () => word === null,
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
      canDrop: !!monitor.canDrop(),
    }),
  }))

  let className = `p-2 border-2 border-dashed rounded min-w-20 h-10 flex items-center justify-center ${
    word ? "border-gray-300 bg-white" : "border-gray-200"
  }`

  if (isOver && canDrop) {
    className += " border-primary bg-primary/10"
  } else if (isComplete && !isCorrect && correctWord !== word) {
    className += " bg-red-100"
  }

  return (
    <div ref={drop} className={className}>
      {word}
    </div>
  )
}

// Drag and Drop Sentence Builder
export function DragDropSentenceBuilder({
  englishSentence,
  words,
  correctOrder,
  onComplete,
}: {
  englishSentence: string
  words: string[]
  correctOrder: string[]
  onComplete: () => void
}) {
  const [sentence, setSentence] = useState<(string | null)[]>(Array(correctOrder.length).fill(null))
  const [isComplete, setIsComplete] = useState(false)
  const [wordUsage, setWordUsage] = useState<boolean[]>(Array(words.length).fill(false))

  const handleDrop = (slotIndex: number, word: string, wordIndex: number) => {
    // Update the sentence
    const newSentence = [...sentence]
    newSentence[slotIndex] = word
    setSentence(newSentence)

    // Mark the word as used
    const newWordUsage = [...wordUsage]
    newWordUsage[wordIndex] = true
    setWordUsage(newWordUsage)

    // Check if sentence is complete
    if (!newSentence.includes(null)) {
      setIsComplete(true)
      onComplete()
    }
  }

  const isCorrect = JSON.stringify(sentence) === JSON.stringify(correctOrder)

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Arrange the words to form a correct French translation:</h3>

        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="font-medium text-center mb-2">Translate this sentence:</p>
          <p className="text-center text-lg">{englishSentence}</p>
        </div>

        <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg min-h-16">
          {sentence.map((word, index) => (
            <DroppableSlot
              key={index}
              index={index}
              word={word}
              onDrop={handleDrop}
              isComplete={isComplete}
              isCorrect={isCorrect}
              correctWord={correctOrder[index]}
            />
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {words.map((word, index) => (
            <DraggableWord key={`${word}-${index}`} word={word} index={index} isPlaced={wordUsage[index]} />
          ))}
        </div>

        {isComplete && (
          <div className={`p-3 rounded-lg ${isCorrect ? "bg-green-100" : "bg-red-100"}`}>
            {isCorrect
              ? `Correct! '${correctOrder.join(" ")}' means '${englishSentence}'.`
              : `Not quite right. The correct order is: ${correctOrder.join(" ")} (${englishSentence}).`}
          </div>
        )}
      </div>
    </DndProvider>
  )
}

