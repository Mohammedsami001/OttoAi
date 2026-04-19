"use client"

import { useEffect, useState } from 'react'
import { BarChart, Bar, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip } from 'recharts'
import { Skeleton } from 'boneyard-js/react'

const defaultBrowserColors = { Chrome: '#2563eb', Safari: '#0f766e', Firefox: '#f97316', Edge: '#7c3aed' }
const defaultOsColors = { macOS: '#111827', Windows: '#2563eb', iOS: '#16a34a', Android: '#f59e0b' }
const defaultDeviceColors = { desktop: '#111827', mobile: '#2563eb', tablet: '#94a3b8' }

function chartTooltipStyle() {
  return {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  }
}

export function AnalyticsOverview() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/analytics')
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          throw new Error(errorBody?.error || 'Failed to fetch analytics')
        }
        const analytics = await response.json()
        setData(analytics)
        setError(null)
      } catch (err) {
        console.error('Analytics fetch error:', err)
        setError(err.message)
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <Skeleton
        name="analytics-overview"
        loading
        fallback={
          <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2">
                <div className="h-5 w-52 rounded bg-gray-200" />
                <div className="h-4 w-72 rounded bg-gray-100" />
              </div>
              <div className="h-3 w-24 rounded bg-gray-100" />
            </div>
            <div className="grid gap-4 xl:grid-cols-[1.5fr,1fr]">
              <div className="h-64 rounded-xl bg-gray-100" />
              <div className="h-64 rounded-xl bg-gray-100" />
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-60 rounded-xl bg-gray-100" />
              ))}
            </div>
          </section>
        }
      >
        <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm" />
      </Skeleton>
    )
  }

  if (error) {
    return (
      <section className="space-y-4 rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-yellow-900">Google Analytics</h2>
          <p className="text-sm text-yellow-700">{error}</p>
        </div>
      </section>
    )
  }

  const featureUsage = data?.featureUsage || []
  const dailyUsage = data?.dailyUsage || []

    const hasData = featureUsage.length > 0 || dailyUsage.length > 0 || data?.browserData?.length > 0

    if (!hasData) {
      return (
        <section className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-blue-900">Google Analytics</h2>
            <p className="text-sm text-blue-700">GA4 is connected and ready! Once you add the Measurement ID to Vercel and deploy, tracking will begin collecting data from your users.</p>
          </div>
        </section>
      )
    }

  const browserData = (data?.browserData || []).map((item) => ({
    ...item,
    color: defaultBrowserColors[item.name] || '#9ca3af',
  }))
  const osData = (data?.osData || []).map((item) => ({
    ...item,
    color: defaultOsColors[item.name] || '#9ca3af',
  }))
  const deviceData = (data?.deviceData || []).map((item) => ({
    ...item,
    color:
      defaultDeviceColors[item.name?.toLowerCase()] ||
      defaultDeviceColors[item.name] ||
      '#9ca3af',
  }))

  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Google Analytics Overview</h2>
          <p className="text-sm text-gray-500">Feature usage, daily tracking, browser mix, OS mix, and device split.</p>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Live GA4 data</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr,1fr]">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Feature usage</p>
              <p className="text-xs text-gray-500">Top pages by event count (30 days)</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureUsage.length > 0 ? featureUsage : [{ name: 'No data', value: 0 }]}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} stroke="#9ca3af" />
                <YAxis tickLine={false} axisLine={false} stroke="#9ca3af" />
                <Tooltip contentStyle={chartTooltipStyle()} />
                <Bar dataKey="value" fill="#111827" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="mb-3">
            <p className="text-sm font-semibold text-gray-900">Daily tracking</p>
            <p className="text-xs text-gray-500">Active users over last 7 days</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyUsage.length > 0 ? dailyUsage : [{ day: 'N/A', value: 0 }]}>
                <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#9ca3af" />
                <YAxis tickLine={false} axisLine={false} stroke="#9ca3af" />
                <Tooltip contentStyle={chartTooltipStyle()} />
                <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <DonutCard title="Browsers" description="Desktop browser share" data={browserData} />
        <DonutCard title="Operating systems" description="Visitor OS distribution" data={osData} />
        <DonutCard title="Device split" description="Desktop vs mobile usage" data={deviceData} centerLabel="Users" />
      </div>
    </section>
  )
}

function DonutCard({ title, description, data, centerLabel = 'Traffic' }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <p className="text-sm font-semibold text-gray-900">{title}</p>
      <p className="text-xs text-gray-500">{description}</p>
      <div className="mt-3 h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={4}>
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={chartTooltipStyle()} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-gray-500">{centerLabel}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {data.map((item) => (
          <span key={item.name} className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-1 text-[11px] font-medium text-gray-600 border border-gray-200">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
        ))}
      </div>
    </div>
  )
}
