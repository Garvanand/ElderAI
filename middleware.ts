import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const DEV_BYPASS_AUTH = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes (always allowed)
  const publicRoutes = ['/', '/auth', '/api']
  const isPublic = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // DEV MODE: Bypass auth checks for all non-public routes
  if (DEV_BYPASS_AUTH) {
    return NextResponse.next()
  }

  const sessionToken = request.cookies.get('sb-access-token') ||
                       request.cookies.get('supabase-auth-token')

  // Routes that require authentication
  const protectedRoutes = ['/elder', '/caregiver']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !sessionToken) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
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

