"use client"

import { SessionProvider } from "next-auth/react"
import { AppUsageProvider } from "./AppUsageProvider"
import GoogleAnalyticsTracker from "./GoogleAnalyticsTracker"

export default function AuthProvider({ children }) {
  return (
    <SessionProvider>
      <AppUsageProvider>
        <GoogleAnalyticsTracker />
        {children}
      </AppUsageProvider>
    </SessionProvider>
  )
}
