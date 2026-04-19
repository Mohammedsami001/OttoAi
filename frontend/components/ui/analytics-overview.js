"use client"

import { BarChart, Bar, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip } from 'recharts'

const featureUsage = [
  { name: 'Gmail', value: 42 },
  { name: 'Calendar', value: 31 },
  { name: 'Docs', value: 18 },
  { name: 'Bookings', value: 27 },
  { name: 'Profile', value: 9 },
]

const dailyUsage = [
  { day: 'Mon', value: 16 },
  { day: 'Tue', value: 22 },
  { day: 'Wed', value: 28 },
  { day: 'Thu', value: 24 },
  { day: 'Fri', value: 34 },
  { day: 'Sat', value: 18 },
  { day: 'Sun', value: 12 },
]

const browserData = [
  { name: 'Chrome', value: 62, color: '#2563eb' },
  { name: 'Safari', value: 18, color: '#0f766e' },
  { name: 'Firefox', value: 10, color: '#f97316' },
  { name: 'Edge', value: 10, color: '#7c3aed' },
]

const osData = [
  { name: 'macOS', value: 49, color: '#111827' },
  { name: 'Windows', value: 27, color: '#2563eb' },
  { name: 'iOS', value: 15, color: '#16a34a' },
  { name: 'Android', value: 9, color: '#f59e0b' },
]

const deviceData = [
  { name: 'Desktop', value: 68, color: '#111827' },
  { name: 'Mobile', value: 28, color: '#2563eb' },
  { name: 'Tablet', value: 4, color: '#94a3b8' },
]

function chartTooltipStyle() {
  return {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
  }
}

export function AnalyticsOverview() {
  return (
    <section className="space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Google Analytics Overview</h2>
          <p className="text-sm text-gray-500">Feature usage, daily tracking, browser mix, OS mix, and device split.</p>
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Demo layout, ready for GA4 data</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr,1fr]">
        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Feature usage</p>
              <p className="text-xs text-gray-500">Which product areas users touch most</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={featureUsage}>
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
            <p className="text-xs text-gray-500">Activity over the last 7 days</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyUsage}>
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
