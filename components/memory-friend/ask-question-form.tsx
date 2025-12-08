"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Loader2 } from "lucide-react"

interface AskQuestionFormProps {
  onSubmit: (question: string) => Promise<string>
}

export function AskQuestionForm({ onSubmit }: AskQuestionFormProps) {
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!question.trim() || isLoading) return

    setIsLoading(true)
    setAnswer(null)

    try {
      const response = await onSubmit(question.trim())
      setAnswer(response)
    } catch {
      setAnswer("Sorry, I couldn't find an answer. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewQuestion = () => {
    setQuestion("")
    setAnswer(null)
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Question Input */}
        <div className="space-y-3">
          <Label htmlFor="question-input" className="text-xl md:text-2xl font-medium text-foreground">
            What would you like to ask?
          </Label>
          <Input
            id="question-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            className="h-16 text-lg md:text-xl px-4"
            disabled={isLoading}
            aria-describedby="question-hint"
            required
          />
          <p id="question-hint" className="text-base text-muted-foreground">
            Ask about anything you've saved - names, places, events, or reminders.
          </p>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-16 text-xl md:text-2xl font-semibold gap-3"
          disabled={!question.trim() || isLoading}
          aria-label={isLoading ? "Finding answer..." : "Ask this question"}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
              Finding answer...
            </>
          ) : (
            <>
              <Send className="h-6 w-6" aria-hidden="true" />
              Ask Question
            </>
          )}
        </Button>
      </form>

      {/* Loading State */}
      {isLoading && (
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-8 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" aria-hidden="true" />
            <p className="text-xl text-foreground text-center">Looking through your memories...</p>
          </CardContent>
        </Card>
      )}

      {/* Answer Display */}
      {answer && !isLoading && (
        <Card className="border-2 border-primary">
          <CardContent className="p-8">
            <h2 className="text-lg font-semibold text-muted-foreground mb-3">Answer</h2>
            <p className="text-xl md:text-2xl text-foreground leading-relaxed">{answer}</p>
            <Button
              onClick={handleNewQuestion}
              variant="outline"
              size="lg"
              className="mt-6 h-12 text-lg bg-transparent"
            >
              Ask another question
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
