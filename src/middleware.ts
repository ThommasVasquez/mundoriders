export { auth as middleware } from "@/lib/auth"

export const config = {
  matcher: ["/autopista", "/garage/:path*"],
}
