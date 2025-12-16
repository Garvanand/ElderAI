"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Heart, Brain, Users } from "lucide-react"

import { supabase } from "@/src/integrations/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { UserRole } from "@/src/types"
import { useToast } from "@/components/ui/use-toast"

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<UserRole>("elder")
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Welcome back!",
            description: "You have been signed in successfully.",
          })
          router.push("/")
        }
      } else {
        if (!fullName.trim()) {
          toast({
            title: "Name required",
            description: "Please enter your full name.",
            variant: "destructive",
          })
          setLoading(false)
          return
        }

        const redirectUrl = `${window.location.origin}/`

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              full_name: fullName,
              role,
            },
          },
        })

        if (error) {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Account created!",
            description: "Welcome to Memory Friend.",
          })
          router.push("/")
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-warm flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-button">
              <Brain className="w-9 h-9 text-primary-foreground" />
            </div>
          </Link>
          <h1 className="text-3xl font-display font-bold text-foreground">Memory Friend</h1>
          <p className="text-muted-foreground text-lg mt-2">Your caring memory companion</p>
        </div>

        <Card className="shadow-card">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">{isLogin ? "Welcome Back" : "Create Account"}</CardTitle>
            <CardDescription>{isLogin ? "Sign in to continue" : "Join Memory Friend today"}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
                <>
                  <div className="space-y-2">
                    <label className="text-lg font-medium">Your Name</label>
                    <Input
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="text-lg font-medium">I am a...</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRole("elder")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          role === "elder"
                            ? "border-primary bg-primary/10 shadow-soft"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Heart
                          className={`w-8 h-8 mx-auto mb-2 ${
                            role === "elder" ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`text-lg font-medium ${
                            role === "elder" ? "text-primary" : "text-foreground"
                          }`}
                        >
                          Memory User
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole("caregiver")}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          role === "caregiver"
                            ? "border-primary bg-primary/10 shadow-soft"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <Users
                          className={`w-8 h-8 mx-auto mb-2 ${
                            role === "caregiver" ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span
                          className={`text-lg font-medium ${
                            role === "caregiver" ? "text-primary" : "text-foreground"
                          }`}
                        >
                          Caregiver
                        </span>
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-lg font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-lg font-medium">Password</label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-lg text-primary hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


