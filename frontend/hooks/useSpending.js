"use client"

import { useEffect, useMemo, useState } from "react"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export default function useSpending() {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    const run = async () => {
      const [txRes, sumRes] = await Promise.all([
        fetch(`${API_BASE}/spending/transactions`, {
          headers: { "x-user-id": "demo-user" },
          cache: "no-store"
        }),
        fetch(`${API_BASE}/spending/summary?period=daily`, {
          headers: { "x-user-id": "demo-user" },
          cache: "no-store"
        })
      ])
      const txBody = await txRes.json()
      const sumBody = await sumRes.json()
      setTransactions(txBody.items || [])
      setSummary(sumBody)
    }
    run()
  }, [])

  const chartData = useMemo(() => {
    const map = {}
    for (const row of transactions) {
      const category = row.category || "other"
      map[category] = (map[category] || 0) + (row.amount || 0)
    }
    return Object.entries(map).map(([name, total]) => ({ name, total }))
  }, [transactions])

  return { transactions, summary, chartData }
}
