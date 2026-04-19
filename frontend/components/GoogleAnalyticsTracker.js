"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"

export default function GoogleAnalyticsTracker() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

  useEffect(() => {
    if (!measurementId || typeof window === "undefined" || typeof window.gtag !== "function") {
      return
    }

    const userId = session?.user?.id || session?.user?.email || undefined
    window.gtag("config", measurementId, {
      page_path: pathname,
      user_id: userId,
    })
  }, [measurementId, pathname, session?.user?.email, session?.user?.id])

  return null
}
