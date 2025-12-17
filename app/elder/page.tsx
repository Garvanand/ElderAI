"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, ArrowLeft } from "lucide-react"
import { ElderHome } from "@/components/memory-friend/elder-home"
import { MemoryForm } from "@/components/memory-friend/memory-form"
import { AskQuestionForm } from "@/components/memory-friend/ask-question-form"
import { AppHeader } from "@/components/memory-friend/app-header"
import { getElderContext } from "@/lib/api"
import Link from "next/link"

type View = "home" | "add-memory" | "ask-question"

const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === "true"

export default function ElderPage() {
  const [currentView, setCurrentView] = useState<View>("home")
  const [refreshKey, setRefreshKey] = useState(0)
  const [showDevBanner, setShowDevBanner] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [role, setRole] = useState<"elder" | "caregiver" | null>(null)

  useEffect(() => {
    if (DEV_BYPASS_AUTH) {
      setShowDevBanner(true)
    }
    // Fetch user context for header
    getElderContext().then((ctx) => {
      setUserName(ctx.userName || null)
      setRole(ctx.role)
    })
  }, [])

  const handleMemorySuccess = () => {
    setCurrentView("home")
    setRefreshKey((prev) => prev + 1)
  }

  const handleQuestionSuccess = () => {
    setRefreshKey((prev) => prev + 1)
  }

  // Add Memory View
  if (currentView === "add-memory") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader userName={userName || "User"} role={role || "elder"} />
        <div className="px-6 py-8">
          {showDevBanner && (
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ DEV MODE: Auth bypassed
            </div>
          )}
          <Link href="/elder">
            <Button variant="ghost" size="lg" className="mb-8 gap-2 text-lg">
              <ArrowLeft className="h-5 w-5" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">Add a Memory</h1>
          <MemoryForm onSuccess={handleMemorySuccess} />
        </div>
      </div>
    )
  }

  // Ask Question View
  if (currentView === "ask-question") {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader userName={userName || "User"} role={role || "elder"} />
        <div className="px-6 py-8">
          {showDevBanner && (
            <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ DEV MODE: Auth bypassed
            </div>
          )}
          <Link href="/elder">
            <Button variant="ghost" size="lg" className="mb-8 gap-2 text-lg">
              <ArrowLeft className="h-5 w-5" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-center mb-10">Ask a Question</h1>
          <AskQuestionForm onSuccess={handleQuestionSuccess} />
        </div>
      </div>
    )
  }

  // Home View
  return (
    <div>
      <AppHeader userName={userName || "User"} role={role || "elder"} />
      {showDevBanner && (
        <div className="p-3 bg-yellow-100 dark:bg-yellow-900 border-b border-yellow-300 dark:border-yellow-700 text-sm text-yellow-800 dark:text-yellow-200 text-center">
          ⚠️ DEV MODE: Auth bypassed
        </div>
      )}
      <ElderHome
        userName={userName || "Friend"}
        onAddMemory={() => setCurrentView("add-memory")}
        onAskQuestion={() => setCurrentView("ask-question")}
      />
    </div>
  )
}

