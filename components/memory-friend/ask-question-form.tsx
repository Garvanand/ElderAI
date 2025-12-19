"use client"

import type React from "react"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Loader2, AlertCircle, Volume2 } from "lucide-react"
import { answerQuestion, getElderContext } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"

const MAX_QUESTION_LENGTH = 500

interface AskQuestionFormProps {
  onSuccess?: () => void
}

export function AskQuestionForm({ onSuccess }: AskQuestionFormProps) {
  const [question, setQuestion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [answer, setAnswer] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const speechSupported = useMemo(
    () => typeof window !== "undefined" && typeof window.speechSynthesis !== "undefined",
    []
  )

  // Read answer aloud when it changes
  useEffect(() => {
    if (!speechSupported || !answer) return
    const utterance = new SpeechSynthesisUtterance(answer)
    utterance.rate = 0.85
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }, [answer, speechSupported])

  const speakAnswer = () => {
    if (!speechSupported || !answer) {
      toast({
        title: "Audio not available",
        description: "Your device doesn't support reading aloud. You can read the answer on screen.",
        variant: "destructive",
      })
      return
    }
    const utterance = new SpeechSynthesisUtterance(answer)
    utterance.rate = 0.85
    utterance.pitch = 1
    utterance.volume = 1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Client-side validation
    const trimmedQuestion = question.trim()
    if (!trimmedQuestion) {
      setError("Please tell us what you'd like to know.")
      return
    }
    
    if (trimmedQuestion.length > MAX_QUESTION_LENGTH) {
      setError(`That's a bit too long. Please keep your question shorter - under ${MAX_QUESTION_LENGTH} characters.`)
      return
    }
    
    if (isLoading) return

    setIsLoading(true)
    setAnswer(null)
    setError(null)

    try {
      const context = await getElderContext()
      if (!context.elderId) {
        throw new Error("We couldn't find your account. Please sign in again, or ask a caregiver for help.")
      }
      const result = await answerQuestion(context.elderId, trimmedQuestion)
      setAnswer(result.answer)
      
      // Show success message
      toast({
        title: "Answer found! ✨",
        description: "I found an answer based on your saved memories.",
        variant: "success",
      })
      
      // Call success callback if provided
      if (onSuccess) {
        onSuccess()
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "I couldn't find an answer in your memories. Try asking differently, or add more memories first."
      setError(errorMessage)
      setAnswer(null)
      toast({
        title: "Couldn't find an answer",
        description: errorMessage,
        variant: "destructive",
      })
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
            onChange={(e) => {
              setQuestion(e.target.value)
              setError(null)
            }}
            placeholder="Type your question here..."
            className="h-16 text-lg md:text-xl px-4"
            disabled={isLoading}
            aria-describedby="question-hint"
            maxLength={MAX_QUESTION_LENGTH}
            required
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{question.length} / {MAX_QUESTION_LENGTH} characters</span>
          </div>
          <div id="question-hint" className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-base text-foreground font-medium mb-1">💡 Tip:</p>
            <p className="text-sm text-muted-foreground">
              Ask about anything you've saved - names, places, events, or reminders. I'll look through your memories to find the answer.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
            <AlertCircle className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <p className="text-base">{error}</p>
          </div>
        )}

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
        <Card className="border-2 border-primary animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CardContent className="p-8">
            <h2 className="text-lg font-semibold text-muted-foreground mb-3">Answer</h2>
            <p className="text-xl md:text-2xl text-foreground leading-relaxed">{answer}</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="h-12 text-lg bg-transparent gap-2"
                onClick={speakAnswer}
                aria-label="Read answer aloud"
              >
                <Volume2 className="h-5 w-5" />
                🔊 Read aloud
              </Button>
              <Button
                onClick={handleNewQuestion}
                variant="outline"
                size="lg"
                className="h-12 text-lg bg-transparent"
              >
                Ask another question
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
