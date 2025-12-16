import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/src/integrations/supabase/types"

interface LinkElderBody {
  elderEmail: string
}

function parseBody(body: unknown): LinkElderBody | null {
  if (typeof body !== "object" || body === null) return null
  const b = body as Record<string, unknown>
  const email = typeof b.elderEmail === "string" ? b.elderEmail.trim() : ""
  if (!email || !email.includes("@")) return null
  return { elderEmail: email }
}

export async function POST(request: NextRequest) {
  const raw = await request.json().catch(() => null)
  const body = parseBody(raw)

  if (!body) {
    return NextResponse.json({ error: "Invalid body: elderEmail is required" }, { status: 400 })
  }

  const cookieStore = cookies()
  const accessToken =
    cookieStore.get("sb-access-token")?.value ??
    cookieStore.get("supabase-auth-token")?.value ??
    null

  if (!accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
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
    return NextResponse.json({ error: "Could not resolve user" }, { status: 401 })
  }

  const { error: rpcError } = await supabase.rpc("link_caregiver_to_elder_by_email", {
    caregiver_uid: user.id,
    elder_email: body.elderEmail,
  } as any)

  if (rpcError) {
    return NextResponse.json(
      {
        error: "Failed to link elder",
        details: rpcError.message,
      },
      { status: 400 },
    )
  }

  return NextResponse.json({ success: true })
}


