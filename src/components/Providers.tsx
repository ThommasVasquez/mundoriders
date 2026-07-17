"use client"

import { SessionProvider } from "next-auth/react"
import React from "react"
import { NotificationProvider } from "./NotificationProvider"
import FloatingIntercom from "./FloatingIntercom"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <NotificationProvider>
        {children}
        <FloatingIntercom />
      </NotificationProvider>
    </SessionProvider>
  )
}

