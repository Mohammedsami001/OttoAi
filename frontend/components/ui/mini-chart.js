"use client"

import { useMemo, useState } from "react"
import { cn } from "../../lib/utils"

const defaultData = [
  { label: "Mon", value: 65 },
  { label: "Tue", value: 85 },
  { label: "Wed", value: 45 },
  { label: "Thu", value: 95 },
  { label: "Fri", value: 70 },
  { label: "Sat", value: 55 },
  { label: "Sun", value: 80 },
]

export function MiniChart({
  title = "Activity",
  suffix = "%",
  data = defaultData,
  loading = false,
  loadingBars = 6,
  className,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null)
  const [isHovering, setIsHovering] = useState(false)

  const maxValue = useMemo(() => Math.max(...data.map((d) => d.value), 1), [data])
  const displayValue = hoveredIndex !== null ? data[hoveredIndex]?.value : null

  if (loading) {
    return (
      <div className="group relative h-[230px] w-full min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
            <span className="h-3 w-28 rounded bg-gray-200" />
          </div>
          <div className="h-7 w-16 rounded bg-gray-200" />
        </div>

        <div className="flex h-36 items-end gap-2">
          {Array.from({ length: loadingBars }).map((_, index) => (
            <div key={`automation-skeleton-${index}`} className="relative flex h-full flex-1 flex-col items-center justify-end">
              <div className="w-full rounded-full bg-gray-100" style={{ height: `${32 + (index % 4) * 12}px` }} />
              <div className="mt-2 h-2 w-12 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => {
        setIsHovering(false)
        setHoveredIndex(null)
      }}
      className={cn(
        "group relative h-full min-h-[230px] w-full min-w-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-500 hover:border-gray-300",
        className,
      )}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</span>
        </div>
        <div className="h-7">
          <span
            className={cn(
              "text-lg font-semibold tabular-nums transition-all duration-300",
              isHovering && displayValue !== null ? "text-gray-900" : "text-gray-400",
            )}
          >
            {displayValue !== null ? displayValue : ""}
            <span className={cn("ml-0.5 text-xs font-normal text-gray-500", displayValue !== null ? "opacity-100" : "opacity-0")}>
              {suffix}
            </span>
          </span>
        </div>
      </div>

      <div className="flex h-24 items-end gap-1 sm:gap-2">
        {data.map((item, index) => {
          const heightPx = (item.value / maxValue) * 96
          const isHovered = hoveredIndex === index
          const isAnyHovered = hoveredIndex !== null
          const isNeighbor = hoveredIndex !== null && (index === hoveredIndex - 1 || index === hoveredIndex + 1)

          return (
            <div
              key={item.label}
              className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHoveredIndex(index)}
            >
              <div
                className={cn(
                  "w-full origin-bottom cursor-pointer rounded-full transition-all duration-300 ease-out",
                  isHovered
                    ? "bg-gray-900"
                    : isNeighbor
                      ? "bg-gray-400"
                      : isAnyHovered
                        ? "bg-gray-200"
                        : "bg-gray-300 group-hover:bg-gray-400",
                )}
                style={{
                  height: `${heightPx}px`,
                  transform: isHovered ? "scaleX(1.12) scaleY(1.02)" : isNeighbor ? "scaleX(1.04)" : "scaleX(1)",
                }}
              />

              <span className={cn("mt-2 w-full text-[9px] font-medium leading-tight transition-all duration-300 sm:text-[10px]", isHovered ? "text-gray-900" : "text-gray-400")}>
                <span className="block w-full truncate px-0.5 text-center" title={item.label}>
                  {item.label}
                </span>
              </span>

              <div
                className={cn(
                  "pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs font-medium text-white transition-all duration-200",
                  isHovered ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                )}
              >
                {item.value}
                {suffix}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
