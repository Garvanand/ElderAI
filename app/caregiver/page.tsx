"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2, RefreshCw } from "lucide-react"
import {
  getElderContext,
  getMemories,
  getQuestions,
  getRecentSummaries,
  generateDailySummaryApi,
  linkElderByEmail,
} from "@/lib/api"
import { useToast } from "@/components/ui/use-toast"
import { AppHeader } from "@/components/memory-friend/app-header"
import { supabase } from "../../src/integrations/supabase/client"
import type { Memory, Question, DailySummary } from "@/src/types"

const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true"

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString()
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function CaregiverPage() {
  const [memories, setMemories] = useState<Memory[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [summaries, setSummaries] = useState<DailySummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(!DEV_BYPASS_AUTH)
  const [elderId, setElderId] = useState<string | null>(null)
  const [linkEmail, setLinkEmail] = useState("")
  const [linking, setLinking] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [role, setRole] = useState<"elder" | "caregiver" | null>(null)
  const { toast } = useToast()

  // Check auth (skip in dev mode)
  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      setAuthLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const context = await getElderContext()
      if (!context.elderId) {
        setIsLoading(false)
        toast({
          title: "No elder selected",
          description: "Link this caregiver account to an elder to view their data.",
          variant: "destructive",
        })
        return
      }
      setElderId(context.elderId)

      const [memData, qData, sData] = await Promise.all([
        getMemories(context.elderId, { limit: 20 }).catch(() => []),
        getQuestions(context.elderId, 10).catch(() => []),
        getRecentSummaries(context.elderId, 7).catch(() => []),
      ])
      setMemories(memData)
      setQuestions(qData)
      setSummaries(sData)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load caregiver data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    // Fetch user context for header
    getElderContext().then((ctx) => {
      setUserName(ctx.userName || null)
      setRole(ctx.role)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleGenerateToday = async () => {
    if (!elderId) return
    setIsGenerating(true)
    try {
      await generateDailySummaryApi(elderId)
      toast({
        title: "Summary generated",
        description: "Today’s summary has been created.",
      })
      const refreshed = await getRecentSummaries(elderId, 7)
      setSummaries(refreshed)
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to generate summary",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleLinkElder = async () => {
    if (!linkEmail.trim()) {
      return
    }
    setLinking(true)
    try {
      await linkElderByEmail(linkEmail.trim())
      toast({
        title: "Linked",
        description: "The elder has been linked to your caregiver account.",
      })
      setLinkEmail("")
      await loadData()
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to link elder",
        variant: "destructive",
      })
    } finally {
      setLinking(false)
    }
  }

  // Show loading during auth check
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Show message if not authenticated (but allow in dev mode)
  if (!user && !DEV_BYPASS_AUTH) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Not Signed In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Please sign in to access the caregiver dashboard.
            </p>
            <p className="text-sm text-muted-foreground">
              Note: In development, you can set NEXT_PUBLIC_DEV_BYPASS_AUTH=true to bypass auth.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader userName={userName || "Caregiver"} role={role || "caregiver"} />
      <div className="px-4 py-8">
        {DEV_BYPASS_AUTH && (
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ DEV MODE: Auth bypassed
          </div>
        )}
        <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Caregiver Dashboard</h1>
          {elderId ? (
            <p className="text-muted-foreground mt-1">Elder ID: {elderId}</p>
          ) : (
            <p className="text-muted-foreground mt-1">No elder linked yet</p>
          )}
        </div>
        <Button onClick={handleGenerateToday} disabled={isGenerating} className="gap-2">
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Generate today’s summary
        </Button>
      </header>

      {/* At-a-glance stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Memories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{memories.length}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{questions.length}</p>
          </CardContent>
        </Card>
        <Card className="border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily summaries</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{summaries.length}</p>
          </CardContent>
        </Card>
      </div>

      {!elderId && (
        <Card className="border mb-8">
          <CardHeader>
            <CardTitle>Link to an elder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Enter the email address your elder used to sign up. You&apos;ll then be able to view their memories,
              questions, and summaries.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="email"
                placeholder="elder@example.com"
                value={linkEmail}
                onChange={(e) => setLinkEmail(e.target.value)}
                className="sm:max-w-xs"
              />
              <Button onClick={handleLinkElder} disabled={linking} className="sm:w-auto w-full gap-2">
                {linking ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Link elder
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading data...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Memories Timeline */}
          <section className="space-y-3">
            <Card className="border">
              <CardHeader>
                <CardTitle>Recent Memories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {memories.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No memories available yet.</p>
                    <p className="text-sm text-muted-foreground">
                      Memories will appear here once the elder starts adding them.
                    </p>
                  </div>
                ) : (
                  memories.map((m) => (
                    <div key={m.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                      {m.image_url && (
                        <img
                          src={m.image_url}
                          alt="Memory"
                          className="w-full max-h-40 object-cover rounded mb-2 border"
                        />
                      )}
                      <p className="text-foreground">{m.raw_text}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(m.created_at)} at {formatTime(m.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>

          {/* Right column */}
          <section className="space-y-6">
            <Card className="border">
              <CardHeader>
                <CardTitle>Recent Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {questions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No questions asked yet.</p>
                    <p className="text-sm text-muted-foreground">
                      Questions and answers will appear here once the elder starts asking.
                    </p>
                  </div>
                ) : (
                  questions.map((q) => (
                    <div key={q.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                      <p className="font-medium text-foreground">{q.question_text}</p>
                      {q.answer_text && <p className="text-sm text-muted-foreground mt-1">{q.answer_text}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(q.created_at)} at {formatTime(q.created_at)}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader>
                <CardTitle>Recent Summaries</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {summaries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-2">No summaries generated yet.</p>
                    <p className="text-sm text-muted-foreground">
                      Generate a daily summary using the button above to see activity highlights.
                    </p>
                  </div>
                ) : (
                  summaries.map((s) => (
                    <div key={s.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                      <p className="text-sm text-muted-foreground mb-1">{formatDate(s.date)}</p>
                      <p className="text-foreground text-sm">
                        {s.summary_text.length > 120 ? `${s.summary_text.slice(0, 120)}...` : s.summary_text}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </section>
        </div>
      )}
      </div>
    </div>
  )
}

