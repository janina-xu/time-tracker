'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'sleep', label: '😴 Sleep', color: 'bg-purple-100 text-purple-800' },
  { value: 'work', label: '💼 Work', color: 'bg-blue-100 text-blue-800' },
  { value: 'study', label: '📚 Study', color: 'bg-green-100 text-green-800' },
  { value: 'fitness', label: '🏋️ Fitness', color: 'bg-red-100 text-red-800' },
  { value: 'other', label: '⭐ Other', color: 'bg-gray-100 text-gray-800' },
]

type RecordType = {
  id: number
  category: string
  startTime: string
  endTime: string | null
  note: string | null
  date: string
}

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

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLabel(dateStr: string) {
  const today = getToday()
  const d = new Date(dateStr + 'T00:00:00')
  const label = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  return dateStr === today ? `Today · ${label}` : label
}

export default function Home() {
  const [date, setDate] = useState(getToday())
  const [records, setRecords] = useState<RecordType[]>([])
  const [category, setCategory] = useState('sleep')
  const [startTime, setStartTime] = useState('08:00')
  const [endTime, setEndTime] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [endTimeInputs, setEndTimeInputs] = useState<{ [key: number]: string }>({})

  useEffect(() => {
    fetchRecords()
  }, [date])

  async function fetchRecords() {
    const res = await fetch(`/api/records?date=${date}`)
    const data = await res.json()
    setRecords(data)
  }

  async function addRecord() {
    if (!startTime) return
    setLoading(true)
    await fetch('/api/records', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category, startTime, endTime: endTime || null, note, date }),
    })
    setNote('')
    setEndTime('')
    await fetchRecords()
    setLoading(false)
  }

  async function updateEndTime(id: number, time: string) {
    await fetch(`/api/records/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endTime: time }),
    })
    setEndTimeInputs(prev => {
      const next = { ...prev }
      delete next[id]
      return next
    })
    await fetchRecords()
  }

  async function deleteRecord(id: number) {
    await fetch(`/api/records/${id}`, { method: 'DELETE' })
    await fetchRecords()
  }

  function changeDate(offset: number) {
    const d = new Date(date + 'T00:00:00')
    d.setDate(d.getDate() + offset)
    setDate(d.toISOString().slice(0, 10))
  }

  const totals = CATEGORIES.reduce((acc, cat) => {
    const mins = records
      .filter(r => r.category === cat.value && r.endTime)
      .reduce((sum, r) => {
        let d = toMins(r.endTime!) - toMins(r.startTime)
        if (d < 0) d += 1440
        return sum + d
      }, 0)
    acc[cat.value] = mins
    return acc
  }, {} as { [key: string]: number })

  return (
    <main className="max-w-lg mx-auto px-4 py-8 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Daily Time Tracker</h1>
        <Link href="/stats" className="text-sm text-blue-500 hover:underline">Statistics →</Link>
      </div>
      {/* Date Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => changeDate(-1)} className="px-3 py-1 rounded-lg border hover:bg-gray-100 text-lg">←</button>
        <span className="font-medium text-gray-700">{formatDateLabel(date)}</span>
        <button onClick={() => changeDate(1)} className="px-3 py-1 rounded-lg border hover:bg-gray-100 text-lg">→</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {CATEGORIES.filter(c => c.value !== 'other').map(cat => (
          <div key={cat.value} className="bg-gray-50 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">{cat.label.split(' ')[1]}</div>
            <div className="font-semibold text-sm">{minsToHours(totals[cat.value] || 0)}</div>
          </div>
        ))}
      </div>

      {/* Add Record */}
      <div className="bg-white border rounded-2xl p-4 mb-6 shadow-sm">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Category</label>
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)}
              placeholder="e.g. Morning run 5km"
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Start time</label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">End time (optional)</label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <button onClick={addRecord} disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50">
          {loading ? 'Adding...' : '+ Add Record'}
        </button>
      </div>

      {/* Record List */}
      <div className="space-y-2">
        {records.length === 0 && (
          <div className="text-center text-gray-400 py-8">No records yet. Add your first entry above!</div>
        )}
        {records.map(r => {
          const cat = CATEGORIES.find(c => c.value === r.category)
          let dur = 0
          if (r.endTime) {
            dur = toMins(r.endTime) - toMins(r.startTime)
            if (dur < 0) dur += 1440
          }
          return (
            <div key={r.id} className="bg-white border rounded-xl px-4 py-3 shadow-sm">
              <div className="flex items-center">
                <div className="flex-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat?.color}`}>
                    {cat?.label}
                  </span>
                  {r.note && <span className="text-xs text-gray-400 ml-2">{r.note}</span>}
                </div>
                <div className="text-right mr-3">
                  {r.endTime ? (
                    <>
                      <div className="text-sm font-medium">{minsToHours(dur)}</div>
                      <div className="text-xs text-gray-400">{r.startTime}–{r.endTime}</div>
                    </>
                  ) : (
                    <div className="text-xs text-orange-400 font-medium">In progress · {r.startTime}</div>
                  )}
                </div>
                <button onClick={() => deleteRecord(r.id)}
                  className="text-gray-400 hover:text-red-400 text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50">×</button>
              </div>
              {!r.endTime && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t">
                  <input
                    type="time"
                    value={endTimeInputs[r.id] || ''}
                    onChange={e => setEndTimeInputs(prev => ({ ...prev, [r.id]: e.target.value }))}
                    className="border rounded-lg px-2 py-1 text-xs flex-1"
                  />
                  <button
                    onClick={() => {
                      if (endTimeInputs[r.id]) updateEndTime(r.id, endTimeInputs[r.id])
                    }}
                    className="text-xs bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600">
                    Save
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </main>
  )
}