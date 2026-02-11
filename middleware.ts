import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const currentUser = request.cookies.get('auth_user')?.value
  const { pathname } = request.nextUrl

  // Protected Routes: /ideatecfactus/*
  if (pathname.startsWith('/ideatecfactus')) {
    if (!currentUser) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Public Routes that redirect if logged in: /login and /
  if (pathname === '/login' || pathname === '/') {
    if (currentUser) {
      return NextResponse.redirect(new URL('/ideatecfactus', request.url))
    }
    // If accessing root and not logged in, go to login
    if (pathname === '/') {
       return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/ideatecfactus/:path*', '/login', '/'],
}
