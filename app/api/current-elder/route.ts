import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/src/integrations/supabase/types"

// Resolve current elder context for the authenticated user.
// - If user is an elder: returns their own auth user id as elderId.
// - If user is a caregiver:
//   - If query ?elderId=... is present and linked, returns that.
//   - Else, returns the first linked elder (if any).
// Response: { elderId: string | null, role: "elder" | "caregiver" | null }

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const requestedElderId = url.searchParams.get("elderId") ?? null

  const cookieStore = cookies()
  const accessToken =
    cookieStore.get("sb-access-token")?.value ??
    cookieStore.get("supabase-auth-token")?.value ??
    null

  if (!accessToken) {
    return NextResponse.json(
      { elderId: null, role: null, error: "Not authenticated" },
      { status: 401 },
    )
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { elderId: null, role: null, error: "Supabase not configured" },
      { status: 500 },
    )
  }

  const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json(
      { elderId: null, role: null, error: "Could not resolve user" },
      { status: 401 },
    )
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profileError) {
    return NextResponse.json(
      { elderId: null, role: null, error: "Could not load profile" },
      { status: 500 },
    )
  }

  if (!profile) {
    return NextResponse.json(
      { elderId: null, role: null, error: "Profile not found" },
      { status: 404 },
    )
  }

  // If elder, their own auth user id is the elderId
  if (profile.role === "elder") {
    return NextResponse.json({ elderId: user.id, role: "elder" as const })
  }

  // If caregiver, check links
  if (profile.role === "caregiver") {
    // Fetch all elder links for this caregiver
    const { data: links, error: linksError } = await supabase
      .from("caregiver_elder_links")
      .select("*")
      .eq("caregiver_user_id", user.id)

    if (linksError) {
      return NextResponse.json(
        { elderId: null, role: "caregiver" as const, error: "Could not load caregiver links" },
        { status: 500 },
      )
    }

    if (!links || links.length === 0) {
      return NextResponse.json({ elderId: null, role: "caregiver" as const })
    }

    // If a specific elderId was requested, ensure it's linked
    if (requestedElderId) {
      const match = links.find((l) => l.elder_user_id === requestedElderId)
      if (match) {
        return NextResponse.json({ elderId: match.elder_user_id, role: "caregiver" as const })
      }
    }

    // Fallback: first linked elder
    return NextResponse.json({ elderId: links[0].elder_user_id, role: "caregiver" as const })
  }

  return NextResponse.json({ elderId: null, role: null, error: "Unknown role" }, { status: 400 })
}


