const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"

export const dashboardService = {
  async getSummary(userId) {
    const res = await fetch(`${API_BASE}/dashboard/summary`, {
      headers: { "x-user-id": userId },
      cache: "no-store"
    })
    if (!res.ok) throw new Error("Failed to fetch dashboard summary")
    return res.json()
  },
  
  async getCategories(userId) {
    const res = await fetch(`${API_BASE}/spending/categories`, {
      headers: { "x-user-id": userId },
      cache: "no-store"
    })
    if (!res.ok) throw new Error("Failed to fetch categories")
    return res.json()
  }
}
