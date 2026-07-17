import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

// Middleware ligero: solo verifica el JWT sin tocar la base de datos.
// Las API routes hacen su propia verificación con auth() internamente.
export async function middleware(request: NextRequest) {
  // Solo aplica a rutas de páginas (no /api/)
  const { pathname } = request.nextUrl

  // Rutas protegidas que requieren sesión activa
  const protectedPaths = ["/autopista", "/garage", "/intercom", "/centro-motero"]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (!isProtected) {
    return NextResponse.next()
  }

  try {
    const token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET || "build-time-and-module-evaluation-fallback-secret",
    })

    if (!token) {
      // No autenticado → redirigir al login
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  } catch {
    // Si la verificación del JWT falla por cualquier razón,
    // redirigir al login de forma segura (nunca crashear el Worker)
    const loginUrl = new URL("/login", request.url)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  // Solo aplica a páginas — NUNCA a /api/, _next, o assets estáticos
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
