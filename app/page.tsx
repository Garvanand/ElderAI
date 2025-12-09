"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Heart, ArrowRight } from "lucide-react"
import { supabase } from "../src/integrations/supabase/client"

const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDevBanner, setShowDevBanner] = useState(false)

  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      setShowDevBanner(true)
      setLoading(false)
      return
    }

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is signed in OR dev bypass is enabled, show dashboard
  if (user || DEV_BYPASS_AUTH) {
    return (
      <div className="min-h-screen bg-background px-6 py-12">
        {showDevBanner && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-lg text-center text-yellow-800 dark:text-yellow-200">
            ⚠️ DEV MODE: Auth bypassed - You can access all routes
          </div>
        )}
        
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome to MemoryFriend
            </h1>
            <p className="text-xl text-muted-foreground">
              Choose your view to get started
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Heart className="h-8 w-8 text-primary" />
                  Elder View
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Record memories, ask questions, and view your daily summaries.
                </p>
                <Link href="/elder?elderId=default-elder-id">
                  <Button size="lg" className="w-full gap-2">
                    Go to Elder View
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <Users className="h-8 w-8 text-primary" />
                  Caregiver View
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  View memories, questions, and generate daily summaries.
                </p>
                <Link href="/caregiver?elderId=default-elder-id">
                  <Button size="lg" variant="secondary" className="w-full gap-2">
                    Go to Caregiver View
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // If not signed in, show login page
  return (
    <div className="min-h-screen bg-gradient-warm">
      <header className="p-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-button">
              <Heart className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-display font-bold text-foreground">Memory Friend</span>
          </div>
          <Link href="/auth">
            <Button variant="default">Sign In</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
            Your Caring<br />
            <span className="text-primary">Memory Companion</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-10">
            A gentle, easy-to-use app that helps you record memories, 
            ask questions, and stay connected with loved ones.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="w-full sm:w-auto gap-2">
                Get Started
                <ArrowRight className="w-6 h-6" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                I'm a Caregiver
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
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
        <CaregiverDashboard />
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
        <MemoryForm onSuccess={handleMemorySuccess} />
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
        <AskQuestionForm onSuccess={handleQuestionSuccess} />
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
        onAddMemory={() => setCurrentView("add-memory")}
        onAskQuestion={() => setCurrentView("ask-question")}
      />
    </div>
  )
}
