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
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl

        // Permitir acceso a /login y / sin autenticación
        if (pathname === '/login' || pathname === '/') {
          return true
        }

        // Rutas protegidas requieren token
        if (pathname.startsWith('/ideatecfactus')) {
          return !!token
        }

        return true
      },
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