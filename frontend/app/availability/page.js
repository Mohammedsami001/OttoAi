'use client'

import { Plus, Settings, Save, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const dayMap = [
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
  { id: 7, label: 'Sun' }
]

export default function Availability() {
  const [hours, setHours] = useState(null)
  const [tz, setTz] = useState('Loading...')
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editDays, setEditDays] = useState([1, 2, 3, 4, 5])
  const [editStart, setEditStart] = useState('09:00')
  const [editEnd, setEditEnd] = useState('17:00')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadAvail() {
      try {
        const res = await fetch('/api/user/preferences')
        const data = await res.json()
        if (data.user?.working_hours) {
          setHours(data.user.working_hours)
          setEditDays(data.user.working_hours.days || [1, 2, 3, 4, 5])
          setEditStart(data.user.working_hours.start || '09:00')
          setEditEnd(data.user.working_hours.end || '17:00')
          setTz(data.user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone)
        } else {
          setTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
        }
      } catch (e) {
        console.error(e)
        setTz(Intl.DateTimeFormat().resolvedOptions().timeZone)
      } finally {
        setLoading(false)
      }
    }
    loadAvail()
  }, [])

  const toggleDay = (dayId) => {
    if (editDays.includes(dayId)) {
      setEditDays(editDays.filter(d => d !== dayId))
    } else {
      setEditDays([...editDays, dayId])
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch('/api/user/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          working_hours: { days: editDays, start: editStart, end: editEnd },
          timezone: tz
        })
      })
      setHours({ days: editDays, start: editStart, end: editEnd })
      setIsEditing(false)
    } catch (e) {
      console.error(e)
    } finally {
      setIsSaving(false)
    }
  }

  const getDayLabels = (dayIds) => {
    if (!dayIds) return ''
    return dayIds.map(id => dayMap.find(d => d.id === id)?.label || '').filter(Boolean).join(', ')
  }

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Availability</h1>
          <p className="text-sm text-gray-500">Configure times when you are available for bookings.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
        {/* Display Mode */}
        {!isEditing && (
          <div className="p-5 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">Working Hours</h3>
                <span className="bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded font-medium border border-gray-200">Default ({tz})</span>
              </div>
              <p className="text-sm text-gray-600 font-medium mt-1">
                 {loading ? "Loading from DB..." : (
                   hours 
                    ? `${getDayLabels(hours.days)} | ${hours.start} - ${hours.end}`
                    : "Not configured yet. Click edit to set your hours."
                 )}
              </p>
            </div>
            
            <button 
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Edit Working Hours</h3>
              <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Timezone */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">Timezone:</span>
              <span className="font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">{tz}</span>
            </div>

            {/* Day Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Working Days</label>
              <div className="flex gap-2">
                {dayMap.map((day) => {
                  const isActive = editDays.includes(day.id)
                  return (
                    <button 
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`px-3 py-2 border rounded-md text-sm font-medium transition-colors ${
                        isActive 
                          ? 'border-gray-900 bg-gray-900 text-white' 
                          : 'border-gray-200 bg-white text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Hours</label>
              <div className="flex items-center gap-4">
                <input 
                  type="time" 
                  value={editStart} 
                  onChange={e => setEditStart(e.target.value)} 
                  className="border border-gray-300 outline-none rounded-md p-2 bg-white text-center focus:border-black"
                />
                <span className="text-gray-400 font-medium">to</span>
                <input 
                  type="time" 
                  value={editEnd} 
                  onChange={e => setEditEnd(e.target.value)} 
                  className="border border-gray-300 outline-none rounded-md p-2 bg-white text-center focus:border-black"
                />
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-3 pt-2">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="bg-black text-white px-5 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-sm font-medium text-gray-600 hover:text-black transition-colors px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
