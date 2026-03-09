import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Si el usuario está autenticado y trata de acceder a /login o /
    if (token && (pathname === '/login' || pathname === '/')) {
      return NextResponse.redirect(new URL('/ideatecfactus', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // ✅ Todas las rutas son accesibles sin autenticación
    },
    pages: {
      signIn: '/login',
    },
  }
)

export const config = {
  matcher: [
    '/ideatecfactus/:path*',
    '/login',
    '/',
  ],
}