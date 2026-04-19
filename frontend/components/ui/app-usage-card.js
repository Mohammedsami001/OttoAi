import { Zap } from "lucide-react"

export function AppUsageCard({ stats, loading, error }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
        <div className="space-y-2">
          <div className="h-4 bg-gray-100 rounded" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
        </div>
      </div>
    )
  }

  if (error || !stats || stats.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">App Usage</h3>
        </div>
        <p className="text-xs text-gray-500">No app activity tracked yet today</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-4 w-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-gray-900">App Usage (24h)</h3>
      </div>

      <div className="space-y-3">
        {stats.slice(0, 5).map((item, idx) => {
          const maxMinutes = Math.max(...stats.map((s) => s.totalMinutes), 60)
          const percentage = (item.totalMinutes / maxMinutes) * 100

          return (
            <div key={idx}>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-gray-700">{item.app}</p>
                <p className="text-xs text-gray-500">{item.totalMinutes}m</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {stats.length > 5 && (
        <p className="mt-3 text-xs text-gray-400">+{stats.length - 5} more apps</p>
      )}
    </div>
  )
}
