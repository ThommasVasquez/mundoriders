export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/feed", "/perfil/:path*"],
}
