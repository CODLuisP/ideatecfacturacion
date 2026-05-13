import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    // Redirigir usuarios autenticados fuera del login (que ahora es /)
    if (token && pathname === "/") {
      return NextResponse.redirect(
        new URL("/factufly/dashboard", req.url),
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

        if (pathname.startsWith("/factufly")) {
          return !!token;
        }
        return true;
      },
    },
    pages: {
      signIn: "/", // ✅ Ahora la raíz es el login
    },
  },
);

export const config = {
  matcher: [
    "/factufly/:path*",
    '/docs/:path*',
    "/",
  ],
};
