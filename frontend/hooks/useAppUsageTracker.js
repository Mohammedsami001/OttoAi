import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const APP_NAMES = {
  '/gmail': 'Gmail',
  '/calendar': 'Google Calendar',
  '/docs': 'Google Docs',
  '/bookings': 'Bookings',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/spending': 'Spending',
  '/dashboard': 'Dashboard',
  '/integrations': 'Integrations',
  '/onboarding': 'Onboarding',
  '/tasks': 'Tasks',
  '/memories': 'Memories',
}

export function useAppUsageTracker() {
  const pathname = usePathname()
  const startTimeRef = useRef(Date.now())
  const lastPathRef = useRef(pathname)

  useEffect(() => {
    // Only log if path actually changed
    if (lastPathRef.current === pathname) return

    // Log usage for the previous app/page
    const previousPath = lastPathRef.current
    const appName = Object.entries(APP_NAMES).find(([path]) =>
      previousPath.startsWith(path)
    )?.[1]

    if (appName) {
      const duration = Math.round((Date.now() - startTimeRef.current) / 1000) // in seconds
      
      // Log to backend
      fetch('/api/app-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appName, duration }),
      }).catch((err) => console.error('Failed to log app usage:', err))
    }

    // Update refs for new page
    lastPathRef.current = pathname
    startTimeRef.current = Date.now()
  }, [pathname])
}
