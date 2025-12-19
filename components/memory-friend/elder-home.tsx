"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, HelpCircle, Clock, Loader2, Sparkles, BookOpen } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
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
        setError("We couldn't find your account. Please sign in again, or ask a caregiver for help.")
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
        const errorMsg = err instanceof Error ? err.message : "We couldn't load your information. Please try refreshing the page."
        setError(errorMsg)
        toast({
          title: "Something went wrong",
          description: errorMsg,
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
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardContent className="p-6 flex items-center gap-3 text-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
              <span className="text-lg">Preparing your daily summary...</span>
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
            <CardContent className="p-6 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">
                No summary generated yet for today. Your daily summary will appear here once you&apos;ve added some memories.
              </p>
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
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-2">
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-32" />
                </CardContent>
              </Card>
            ))}
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
      ) : !isLoadingMemories && elderId ? (
        <section className="w-full max-w-2xl mb-12" aria-labelledby="recent-memories-heading">
          <h2 id="recent-memories-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
            Recent Memories
          </h2>
          <Card className="border-2 border-dashed">
            <CardContent className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-2">
                You haven&apos;t added any memories yet.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Start by saving something important - a person's name, a place you visited, or a daily routine.
              </p>
              <Button onClick={onAddMemory} size="lg" className="gap-2">
                <Plus className="h-5 w-5" />
                Add Your First Memory
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : null}

      {/* Recent Questions */}
      {isLoadingQuestions ? (
        <section className="w-full max-w-2xl" aria-labelledby="recent-questions-heading">
          <h2 id="recent-questions-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
            Recent Questions
          </h2>
          <div className="flex flex-col gap-4">
            {[1, 2].map((i) => (
              <Card key={i} className="border-2">
                <CardContent className="p-6 space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-24" />
                </CardContent>
              </Card>
            ))}
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
      ) : !isLoadingQuestions && elderId ? (
        <section className="w-full max-w-2xl" aria-labelledby="recent-questions-heading">
          <h2 id="recent-questions-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
            Recent Questions
          </h2>
          <Card className="border-2 border-dashed">
            <CardContent className="p-8 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg text-muted-foreground mb-4">
                You haven&apos;t asked any questions yet.
              </p>
              <Button onClick={onAskQuestion} size="lg" variant="secondary" className="gap-2">
                <HelpCircle className="h-5 w-5" />
                Ask Your First Question
              </Button>
            </CardContent>
          </Card>
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
