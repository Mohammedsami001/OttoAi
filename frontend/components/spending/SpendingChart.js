"use client"

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

export default function SpendingChart({ chartData }) {
  return (
    <div className="card p-6 h-80">
      <h3 className="text-xs text-gray-600 uppercase tracking-widest font-semibold mb-4">Category Breakdown</h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart data={chartData}>
          <XAxis dataKey="name" stroke="#d1d5db" />
          <YAxis stroke="#d1d5db" />
          <Tooltip
            contentStyle={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: 8 }}
            labelStyle={{ color: "#1a1a1a" }}
            cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
          />
          <Bar dataKey="total" fill="#3b82f6" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
