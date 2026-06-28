"use client"

import { useEffect, useState } from "react"
import { dashboardService } from "../lib/api/dashboardService"

export default function useDashboard() {
  const [data, setData] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const userId = "demo-user" // hardcoded for demo, normally from auth context
        const [summaryBody, categoriesBody] = await Promise.all([
          dashboardService.getSummary(userId),
          dashboardService.getCategories(userId)
        ])
        setData(summaryBody)
        setCategories(categoriesBody.items || [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return { data, categories, loading }
}
