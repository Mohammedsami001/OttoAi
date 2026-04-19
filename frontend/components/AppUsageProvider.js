'use client'

import { createContext, useContext } from 'react'
import { useAppUsageTracker } from '../hooks/useAppUsageTracker'

const AppUsageContext = createContext(null)

export function AppUsageProvider({ children }) {
  // Start tracking usage globally
  useAppUsageTracker()

  return (
    <AppUsageContext.Provider value={{}}>
      {children}
    </AppUsageContext.Provider>
  )
}

export function useAppUsageContext() {
  return useContext(AppUsageContext)
}
