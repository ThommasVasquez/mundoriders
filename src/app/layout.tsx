import type { Metadata } from "next"
import { Comfortaa, Geist_Mono } from "next/font/google"
import { Providers } from "@/components/Providers"
import "./globals.css"

const comfortaa = Comfortaa({
  variable: "--font-comfortaa",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Rider — Red Social de Motociclistas (Colombia)",
  description: "Estructura para la comunidad biker en Colombia. Feed social, rodadas, rutas y seguridad.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${comfortaa.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
