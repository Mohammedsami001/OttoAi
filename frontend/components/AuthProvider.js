"use client"

import { SessionProvider } from "next-auth/react"
import { AppUsageProvider } from "./AppUsageProvider"

export default function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <AppUsageProvider>
        {children}
      </AppUsageProvider>
    </SessionProvider>
  )
}
