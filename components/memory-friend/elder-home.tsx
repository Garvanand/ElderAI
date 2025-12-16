"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, HelpCircle, Clock, Loader2 } from "lucide-react"
import { getMemories, getQuestions, getDailySummary, getElderContext } from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import type { Memory as DBMemory, Question as DBQuestion, DailySummary } from "@/src/types"

interface ElderHomeProps {
  userName: string
  onAddMemory: () => void
  onAskQuestion: () => void
}

function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
}

export function ElderHome({ userName, onAddMemory, onAskQuestion }: ElderHomeProps) {
  const [memories, setMemories] = useState<DBMemory[]>([])
  const [questions, setQuestions] = useState<DBQuestion[]>([])
  const [isLoadingMemories, setIsLoadingMemories] = useState(true)
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true)
  const [isLoadingSummary, setIsLoadingSummary] = useState(true)
  const [todaySummary, setTodaySummary] = useState<DailySummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [elderId, setElderId] = useState<string | null>(null)
  const { toast } = useToast()

  const todayLocalDate = () => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, "0")
    const dd = String(now.getDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }

  useEffect(() => {
    const fetchData = async () => {
      const context = await getElderContext()

      if (!context.elderId) {
        setError("No elder selected. Please sign in as an elder or ask a caregiver to link you.")
        setIsLoadingMemories(false)
        setIsLoadingQuestions(false)
        setIsLoadingSummary(false)
        return
      }

      setElderId(context.elderId)

      try {
        // Fetch memories and questions in parallel
        const [memoriesData, questionsData, summaryData] = await Promise.all([
          getMemories(context.elderId).catch(() => []),
          getQuestions(context.elderId, 5).catch(() => []),
          getDailySummary(context.elderId, todayLocalDate()).catch(() => null),
        ])
        
        setMemories(memoriesData.slice(0, 5))
        setQuestions(questionsData)
        setTodaySummary(summaryData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data")
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load data",
          variant: "destructive",
        })
      } finally {
        setIsLoadingMemories(false)
        setIsLoadingQuestions(false)
        setIsLoadingSummary(false)
      }
    }

    fetchData()
  }, [toast])

  const lastFiveMemories = memories.slice(0, 5)
  const lastFiveQuestions = questions.slice(0, 5)

  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-6 py-12">
      {/* Greeting */}
      <h1 className="text-4xl md:text-5xl font-bold text-foreground text-center mb-12">
        Hello, <span className="text-primary">{userName}</span>!
      </h1>

      {/* Today's Summary */}
      <section className="w-full max-w-2xl mb-10" aria-labelledby="todays-summary-heading">
        <h2 id="todays-summary-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
          Today’s Summary
        </h2>
        {isLoadingSummary ? (
          <Card className="border-2">
            <CardContent className="p-6 flex items-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>Loading today’s summary...</span>
            </CardContent>
          </Card>
        ) : todaySummary ? (
          <Card className="border-2">
            <CardContent className="p-6">
              <p className="text-lg md:text-xl text-foreground leading-relaxed whitespace-pre-wrap">
                {todaySummary.summary_text}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border border-dashed">
            <CardContent className="p-6 text-muted-foreground">
              No summary generated yet for today.
            </CardContent>
          </Card>
        )}
      </section>

      {/* Primary Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl mb-16">
        <Button
          onClick={onAddMemory}
          size="lg"
          className="flex-1 h-20 text-xl md:text-2xl font-semibold gap-3"
          aria-label="Add a new memory"
        >
          <Plus className="h-7 w-7" aria-hidden="true" />
          Add a Memory
        </Button>
        <Button
          onClick={onAskQuestion}
          size="lg"
          variant="secondary"
          className="flex-1 h-20 text-xl md:text-2xl font-semibold gap-3 border-2 border-primary/20"
          aria-label="Ask a question"
        >
          <HelpCircle className="h-7 w-7" aria-hidden="true" />
          Ask a Question
        </Button>
      </div>

      {/* Recent Memories */}
      {isLoadingMemories ? (
        <section className="w-full max-w-2xl" aria-labelledby="recent-memories-heading">
          <h2 id="recent-memories-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
            Recent Memories
          </h2>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          </div>
        </section>
      ) : lastFiveMemories.length > 0 ? (
        <section className="w-full max-w-2xl mb-12" aria-labelledby="recent-memories-heading">
          <h2 id="recent-memories-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
            Recent Memories
          </h2>
          <div className="flex flex-col gap-4">
            {lastFiveMemories.map((m) => (
              <Card key={m.id} className="border-2">
                <CardContent className="p-6 space-y-3">
                  {m.image_url && (
                    <img
                      src={m.image_url}
                      alt="Memory"
                      className="w-full max-h-64 object-cover rounded-md border"
                    />
                  )}
                  <p className="text-lg md:text-xl font-medium text-foreground">{m.raw_text}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    <time dateTime={m.created_at}>{formatTimeAgo(m.created_at)}</time>
                    {m.tags.length > 0 && (
                      <>
                        <span className="mx-2">•</span>
                        <span>{m.tags.join(", ")}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Recent Questions */}
      {isLoadingQuestions ? (
        <section className="w-full max-w-2xl" aria-labelledby="recent-questions-heading">
          <h2 id="recent-questions-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
            Recent Questions
          </h2>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          </div>
        </section>
      ) : lastFiveQuestions.length > 0 ? (
        <section className="w-full max-w-2xl" aria-labelledby="recent-questions-heading">
          <h2 id="recent-questions-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
            Recent Questions
          </h2>
          <div className="flex flex-col gap-4">
            {lastFiveQuestions.map((q) => (
              <Card key={q.id} className="border-2">
                <CardContent className="p-6">
                  <p className="text-lg md:text-xl font-medium text-foreground mb-2">{q.question_text}</p>
                  {q.answer_text && (
                    <p className="text-base md:text-lg text-muted-foreground mb-3 line-clamp-2">{q.answer_text}</p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    <time dateTime={q.created_at}>{formatTimeAgo(q.created_at)}</time>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-2xl p-4 rounded-md bg-destructive/10 border border-destructive/20 text-destructive">
          <p className="text-base">{error}</p>
        </div>
      )}
    </main>
  )
}
