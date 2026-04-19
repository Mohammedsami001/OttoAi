import { Activity } from "lucide-react"
import { Skeleton } from "boneyard-js/react"

export function HealthCard({ stats, loading, error, connected }) {
  if (loading) {
    return (
      <Skeleton
        name="health-card"
        loading
        fallback={
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="h-5 w-28 rounded bg-gray-200 mb-4" />
            <div className="h-16 rounded bg-gray-100 mb-4" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 rounded bg-gray-100" />
              <div className="h-12 rounded bg-gray-100" />
            </div>
          </div>
        }
      >
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" />
      </Skeleton>
    )
  }

  if (!connected || error) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Daily Steps</h3>
        </div>
        <p className="text-xs text-gray-500">
          {error || "Connect Google Fit to track steps"}
        </p>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-900">Daily Steps</h3>
          </div>
          <p className="mt-1 text-xs text-gray-500">7-day average</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between">
            <div className="text-3xl font-bold text-gray-900">{stats.todaySteps?.toLocaleString()}</div>
            <div className="text-xs text-gray-500">today</div>
          </div>
          <div className="mt-1 text-sm text-gray-500">
            Avg: {stats.avgSteps?.toLocaleString()} steps/day
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {stats.dailySteps?.slice(-7).map((day, idx) => {
            const maxSteps = stats.maxSteps || 10000
            const height = Math.max(20, (day.steps / maxSteps) * 100)
            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className="w-full bg-emerald-400 rounded-t"
                  style={{ height: `${height}px`, minHeight: "4px" }}
                />
                <div className="text-xs text-gray-400 mt-1">{day.day}</div>
              </div>
            )
          })}
        </div>

        <div className="pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="text-gray-500">Total (7d)</div>
              <div className="font-semibold text-gray-900">{stats.totalSteps?.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Peak</div>
              <div className="font-semibold text-gray-900">{stats.maxSteps?.toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
