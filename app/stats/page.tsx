'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'sleep', label: 'Sleep', color: '#8b5cf6' },
  { value: 'work', label: 'Work', color: '#3b82f6' },
  { value: 'study', label: 'Study', color: '#22c55e' },
  { value: 'fitness', label: 'Fitness', color: '#ef4444' },
  { value: 'other', label: 'Other', color: '#9ca3af' },
]

function toMins(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minsToHours(m: number) {
  if (m <= 0) return '0m'
  const h = Math.floor(m / 60)
  const rem = m % 60
  if (h === 0) return `${rem}m`
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`
}

function getLast7Days() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return d.toISOString().slice(0, 10)
  })
}

export default function Stats() {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    async function fetchAll() {
      const days = getLast7Days()
      const results = await Promise.all(
        days.map(date => fetch(`/api/records?date=${date}`).then(r => r.json()))
      )
      const chartData = days.map((date, i) => {
        const records = results[i]
        const d = new Date(date + 'T00:00:00')
        const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        const row: any = { date: label }
        CATEGORIES.forEach(cat => {
          const mins = records
            .filter((r: any) => r.category === cat.value && r.endTime)
            .reduce((sum: number, r: any) => {
              let diff = toMins(r.endTime) - toMins(r.startTime)
              if (diff < 0) diff += 1440
              return sum + diff
            }, 0)
          row[cat.value] = parseFloat((mins / 60).toFixed(1))
        })
        return row
      })
      setData(chartData)
    }
    fetchAll()
  }, [])

  const totals = CATEGORIES.map(cat => ({
    name: cat.label,
    value: data.reduce((sum, d) => sum + (d[cat.value] || 0), 0),
    color: cat.color,
  })).filter(d => d.value > 0)

  return (
    <main className="max-w-lg mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Statistics</h1>
        <Link href="/" className="text-sm text-blue-500 hover:underline">← Back</Link>
      </div>

      {/* Bar Chart */}
      <div className="bg-white border rounded-2xl p-4 mb-6 shadow-sm">
        <h2 className="text-sm font-medium text-gray-600 mb-4">Last 7 Days (hours)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.split(',')[0]} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip formatter={(v: any) => `${v}h`} />
            {CATEGORIES.map(cat => (
              <Bar key={cat.value} dataKey={cat.value} stackId="a" fill={cat.color} name={cat.label} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Pie Chart */}
      <div className="bg-white border rounded-2xl p-4 mb-6 shadow-sm">
        <h2 className="text-sm font-medium text-gray-600 mb-4">7-Day Breakdown</h2>
        {totals.length === 0 ? (
          <div className="text-center text-gray-400 py-8 text-sm">No data yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={totals} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                label={({ name, value }) => `${name} ${value.toFixed(1)}h`} labelLine={false}>
                {totals.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Summary Table */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <h2 className="text-sm font-medium text-gray-600 mb-3">7-Day Total</h2>
        <div className="space-y-2">
          {CATEGORIES.map(cat => {
            const total = data.reduce((sum, d) => sum + (d[cat.value] || 0), 0)
            const avg = total / 7
            return (
              <div key={cat.value} className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                <div className="flex-1 text-sm text-gray-700">{cat.label}</div>
                <div className="text-sm font-medium">{minsToHours(total * 60)}</div>
                <div className="text-xs text-gray-400">avg {minsToHours(avg * 60)}/day</div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}