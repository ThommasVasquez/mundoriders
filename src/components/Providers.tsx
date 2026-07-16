"use client"

import { SessionProvider } from "next-auth/react"
import React from "react"
import { NotificationProvider } from "./NotificationProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </SessionProvider>
  )
}
