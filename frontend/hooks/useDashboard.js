"use client"

import { useEffect, useState } from "react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export default function useDashboard() {
  const [data, setData] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        const [summaryRes, categoriesRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/summary`, {
            headers: { "x-user-id": "demo-user" },
            cache: "no-store"
          }),
          fetch(`${API_BASE}/spending/categories`, {
            headers: { "x-user-id": "demo-user" },
            cache: "no-store"
          })
        ])
        const body = await summaryRes.json()
        const categoriesBody = await categoriesRes.json()
        setData(body)
        setCategories(categoriesBody.items || [])
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  return { data, categories, loading }
}
