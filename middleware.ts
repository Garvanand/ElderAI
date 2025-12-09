import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  const publicRoutes = ['/', '/auth', '/api']
  if (publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // DEV MODE: Bypass auth checks
  if (DEV_BYPASS_AUTH) {
    return NextResponse.next()
  }

  // Check for auth token in cookies
  const sessionToken = request.cookies.get('sb-access-token') || 
                       request.cookies.get('supabase-auth-token')

  // Protected routes
  const protectedRoutes = ['/elder', '/caregiver']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !sessionToken) {
    // Redirect to home if not authenticated
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

