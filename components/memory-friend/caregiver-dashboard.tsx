"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Clock, Calendar, MessageSquare, Filter, Search } from "lucide-react"
import type { Memory, Question } from "./types"

interface CaregiverDashboardProps {
  memories: Memory[]
  questions: Question[]
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

const memoryTypeLabels: Record<Memory["type"], string> = {
  object: "Object",
  event: "Event",
  reminder: "Reminder",
  other: "Other",
}

const memoryTypeColors: Record<Memory["type"], string> = {
  object: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  event: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  reminder: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
}

export function CaregiverDashboard({ memories, questions }: CaregiverDashboardProps) {
  const [typeFilter, setTypeFilter] = useState<Memory["type"] | "all">("all")
  const [tagFilter, setTagFilter] = useState("")

  // Get all unique tags from memories
  const allTags = Array.from(new Set(memories.flatMap((m) => m.tags)))

  // Filter memories
  const filteredMemories = memories.filter((memory) => {
    const matchesType = typeFilter === "all" || memory.type === typeFilter
    const matchesTag = !tagFilter || memory.tags.some((tag) => tag.toLowerCase().includes(tagFilter.toLowerCase()))
    return matchesType && matchesTag
  })

  // Sort memories by date (newest first)
  const sortedMemories = [...filteredMemories].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  // Sort questions by date (newest first)
  const sortedQuestions = [...questions].sort((a, b) => b.answeredAt.getTime() - a.answeredAt.getTime())

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row">
        {/* Left Sidebar - Filters */}
        <aside className="w-full lg:w-72 border-b lg:border-b-0 lg:border-r bg-muted/30 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Filter className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <h2 className="text-lg font-semibold text-foreground">Filters</h2>
          </div>

          {/* Type Filter */}
          <div className="space-y-3 mb-6">
            <Label htmlFor="type-filter" className="text-base font-medium">
              Memory Type
            </Label>
            <Select value={typeFilter} onValueChange={(value: Memory["type"] | "all") => setTypeFilter(value)}>
              <SelectTrigger id="type-filter" className="h-12">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="object">Object</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag Filter */}
          <div className="space-y-3">
            <Label htmlFor="tag-filter" className="text-base font-medium">
              Search Tags
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="tag-filter"
                type="text"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                placeholder="Filter by tag..."
                className="h-12 pl-10"
              />
            </div>
          </div>

          {/* Available Tags */}
          {allTags.length > 0 && (
            <div className="mt-6">
              <p className="text-sm font-medium text-muted-foreground mb-3">Available Tags</p>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 10).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => setTagFilter(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="flex flex-col xl:flex-row gap-8">
            {/* Memory Timeline */}
            <section className="flex-1" aria-labelledby="memories-heading">
              <div className="flex items-center gap-2 mb-6">
                <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 id="memories-heading" className="text-xl font-semibold text-foreground">
                  Memories ({sortedMemories.length})
                </h2>
              </div>

              {sortedMemories.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No memories match your filters.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" aria-hidden="true" />

                  {/* Timeline items */}
                  <div className="space-y-4">
                    {sortedMemories.map((memory) => (
                      <div key={memory.id} className="relative pl-10">
                        {/* Timeline dot */}
                        <div
                          className="absolute left-2.5 top-6 w-3 h-3 rounded-full bg-primary border-2 border-background"
                          aria-hidden="true"
                        />

                        <Card className="border">
                          <CardContent className="p-4">
                            {/* Date and Type */}
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <time dateTime={memory.createdAt.toISOString()} className="text-sm text-muted-foreground">
                                {formatDate(memory.createdAt)} at {formatTime(memory.createdAt)}
                              </time>
                              <Badge className={memoryTypeColors[memory.type]} variant="secondary">
                                {memoryTypeLabels[memory.type]}
                              </Badge>
                            </div>

                            {/* Memory text */}
                            <p className="text-base text-foreground">{memory.text}</p>

                            {/* Tags */}
                            {memory.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {memory.tags.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* Recent Questions Panel */}
            <aside className="w-full xl:w-96 xl:border-l xl:pl-8" aria-labelledby="questions-heading">
              <div className="flex items-center gap-2 mb-6">
                <MessageSquare className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 id="questions-heading" className="text-xl font-semibold text-foreground">
                  Recent Questions
                </h2>
              </div>

              {sortedQuestions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">No questions yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {sortedQuestions.map((q) => (
                    <Card key={q.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium">{q.question}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-2">{q.answer}</p>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          <time dateTime={q.answeredAt.toISOString()}>
                            {formatDate(q.answeredAt)} at {formatTime(q.answeredAt)}
                          </time>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </aside>
          </div>
        </main>
      </div>
    </div>
  )
}
