import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

const APP_NAMES = {
  '/gmail': 'Gmail',
  '/calendar': 'Google Calendar',
  '/docs': 'Google Docs',
  '/bookings': 'Bookings',
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

  const flushUsage = (path, startedAt) => {
    const appName = Object.entries(APP_NAMES).find(([route]) =>
      path?.startsWith(route)
    )?.[1]

    if (!appName) return

    const duration = Math.max(1, Math.round((Date.now() - startedAt) / 1000))

    fetch('/api/app-usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appName, duration }),
      keepalive: true,
    }).catch((err) => console.error('Failed to log app usage:', err))
  }

  useEffect(() => {
    if (lastPathRef.current === pathname) return

    flushUsage(lastPathRef.current, startTimeRef.current)
    lastPathRef.current = pathname
    startTimeRef.current = Date.now()
  }, [pathname])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      flushUsage(lastPathRef.current, startTimeRef.current)
      startTimeRef.current = Date.now()
    }, 30000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushUsage(lastPathRef.current, startTimeRef.current)
        startTimeRef.current = Date.now()
      }
    }

    window.addEventListener('pagehide', handleVisibilityChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      flushUsage(lastPathRef.current, startTimeRef.current)
      window.clearInterval(intervalId)
      window.removeEventListener('pagehide', handleVisibilityChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}
