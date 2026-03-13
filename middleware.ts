import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Redirigir usuarios autenticados fuera del login
    if (token && (pathname === "/login" || pathname === "/")) {
      return NextResponse.redirect(
        new URL("/ideatecfactus/dashboard", req.url),
      );
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Rutas públicas
        if (pathname.startsWith("/docs")) {
          return true;
        }

        if (pathname.startsWith("/ideatecfactus")) {
          return !!token;
        }
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/ideatecfactus/:path*", // ✅ Cubre /ideatecfactus/dashboard y cualquier subruta
    '/docs/:path*',
    "/login",
    "/",
  ],
};
