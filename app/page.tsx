"use client"

import { useState } from "react"
import { ElderHome } from "@/components/memory-friend/elder-home"
import { MemoryForm } from "@/components/memory-friend/memory-form"
import { AskQuestionForm } from "@/components/memory-friend/ask-question-form"
import { CaregiverDashboard } from "@/components/memory-friend/caregiver-dashboard"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users } from "lucide-react"
import type { Memory, Question } from "@/components/memory-friend/types"

// Sample data for demonstration
const sampleMemories: Memory[] = [
  {
    id: "1",
    text: "Doctor's appointment is at 2pm on Thursdays at the medical center",
    type: "reminder",
    tags: ["health", "appointments"],
    createdAt: new Date(Date.now() - 86400000),
  },
  {
    id: "2",
    text: "Grandson Michael's birthday is March 15th - he loves dinosaurs",
    type: "event",
    tags: ["family", "birthdays"],
    createdAt: new Date(Date.now() - 172800000),
  },
  {
    id: "3",
    text: "Reading glasses are kept in the top drawer of the nightstand",
    type: "object",
    tags: ["items", "bedroom"],
    createdAt: new Date(Date.now() - 259200000),
  },
  {
    id: "4",
    text: "Neighbor Sarah walks the dog every morning - she has the spare key",
    type: "other",
    tags: ["neighbors", "pets"],
    createdAt: new Date(Date.now() - 345600000),
  },
]

const sampleQuestions: Question[] = [
  {
    id: "1",
    question: "Where are my reading glasses?",
    answer: "Your reading glasses are in the top drawer of your nightstand.",
    answeredAt: new Date(Date.now() - 3600000),
  },
  {
    id: "2",
    question: "When is Michael's birthday?",
    answer: "Michael's birthday is March 15th. He loves dinosaurs!",
    answeredAt: new Date(Date.now() - 7200000),
  },
  {
    id: "3",
    question: "What time is my doctor's appointment?",
    answer: "Your doctor's appointment is at 2pm on Thursdays at the medical center.",
    answeredAt: new Date(Date.now() - 86400000),
  },
]

type View = "home" | "add-memory" | "ask-question" | "caregiver"

export default function DemoPage() {
  const [currentView, setCurrentView] = useState<View>("home")
  const [memories, setMemories] = useState<Memory[]>(sampleMemories)
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions)

  const handleAddMemory = (data: { text: string; type?: Memory["type"] }) => {
    const newMemory: Memory = {
      id: Date.now().toString(),
      text: data.text,
      type: data.type || "other",
      tags: [],
      createdAt: new Date(),
    }
    setMemories((prev) => [newMemory, ...prev])
    setCurrentView("home")
  }

  const handleAskQuestion = async (question: string): Promise<string> => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Simple mock response based on keywords
    const lowerQuestion = question.toLowerCase()
    let answer = "I don't have information about that yet."

    if (lowerQuestion.includes("glasses")) {
      answer = "Your reading glasses are in the top drawer of your nightstand."
    } else if (lowerQuestion.includes("michael") || lowerQuestion.includes("birthday")) {
      answer = "Michael's birthday is March 15th. He loves dinosaurs!"
    } else if (lowerQuestion.includes("doctor") || lowerQuestion.includes("appointment")) {
      answer = "Your doctor's appointment is at 2pm on Thursdays at the medical center."
    } else if (lowerQuestion.includes("sarah") || lowerQuestion.includes("key")) {
      answer = "Neighbor Sarah has the spare key. She walks the dog every morning."
    }

    const newQuestion: Question = {
      id: Date.now().toString(),
      question,
      answer,
      answeredAt: new Date(),
    }
    setQuestions((prev) => [newQuestion, ...prev])

    return answer
  }

  // Caregiver Dashboard View
  if (currentView === "caregiver") {
    return (
      <div>
        <header className="border-b bg-background sticky top-0 z-10">
          <div className="flex items-center gap-4 px-6 py-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => setCurrentView("home")}
              className="gap-2"
              aria-label="Back to home"
            >
              <ArrowLeft className="h-5 w-5" />
              Back
            </Button>
            <h1 className="text-xl font-semibold">Caregiver Dashboard</h1>
          </div>
        </header>
        <CaregiverDashboard memories={memories} questions={questions} />
      </div>
    )
  }

  // Add Memory View
  if (currentView === "add-memory") {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setCurrentView("home")}
          className="mb-8 gap-2 text-lg"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">Add a Memory</h1>
        <MemoryForm onSubmit={handleAddMemory} />
      </div>
    )
  }

  // Ask Question View
  if (currentView === "ask-question") {
    return (
      <div className="min-h-screen bg-background px-6 py-8">
        <Button
          variant="ghost"
          size="lg"
          onClick={() => setCurrentView("home")}
          className="mb-8 gap-2 text-lg"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </Button>
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">Ask a Question</h1>
        <AskQuestionForm onSubmit={handleAskQuestion} />
      </div>
    )
  }

  // Home View
  return (
    <div>
      <header className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCurrentView("caregiver")}
          className="gap-2"
          aria-label="Open caregiver dashboard"
        >
          <Users className="h-5 w-5" />
          Caregiver View
        </Button>
      </header>
      <ElderHome
        userName="Margaret"
        recentQuestions={questions}
        onAddMemory={() => setCurrentView("add-memory")}
        onAskQuestion={() => setCurrentView("ask-question")}
      />
    </div>
  )
}
