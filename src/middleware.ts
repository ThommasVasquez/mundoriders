import { auth } from "@/lib/auth"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Rutas protegidas que requieren sesión activa
  const protectedPaths = ["/autopista", "/garage", "/intercom", "/centro-motero"]
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p))

  if (isProtected && !req.auth) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return Response.redirect(loginUrl)
  }
})

export const config = {
  // Excluir explícitamente API routes, archivos estáticos y assets de Next.js
  matcher: [
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
