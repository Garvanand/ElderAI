"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, HelpCircle, Clock } from "lucide-react"
import type { Question } from "./types"

interface ElderHomeProps {
  userName: string
  recentQuestions: Question[]
  onAddMemory: () => void
  onAskQuestion: () => void
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`
}

export function ElderHome({ userName, recentQuestions, onAddMemory, onAskQuestion }: ElderHomeProps) {
  const lastThreeQuestions = recentQuestions.slice(0, 3)

  return (
    <main className="min-h-screen bg-background flex flex-col items-center px-6 py-12">
      {/* Greeting */}
      <h1 className="text-4xl md:text-5xl font-bold text-foreground text-center mb-12">
        Hello, <span className="text-primary">{userName}</span>!
      </h1>

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

      {/* Recent Questions */}
      {lastThreeQuestions.length > 0 && (
        <section className="w-full max-w-2xl" aria-labelledby="recent-questions-heading">
          <h2 id="recent-questions-heading" className="text-2xl md:text-3xl font-semibold text-foreground mb-6">
            Recent Questions
          </h2>
          <div className="flex flex-col gap-4">
            {lastThreeQuestions.map((q) => (
              <Card key={q.id} className="border-2">
                <CardContent className="p-6">
                  <p className="text-lg md:text-xl font-medium text-foreground mb-2">{q.question}</p>
                  <p className="text-base md:text-lg text-muted-foreground mb-3 line-clamp-2">{q.answer}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" aria-hidden="true" />
                    <time dateTime={q.answeredAt.toISOString()}>{formatTimeAgo(q.answeredAt)}</time>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
