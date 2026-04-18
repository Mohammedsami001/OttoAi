'use client'

import { Clock, Plus, X, Save, Trash2, Settings2, Eye, EyeOff, Video, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'

const DURATION_OPTIONS = ['15m', '30m', '45m', '60m', '90m', '120m']

export default function Dashboard() {
  const [eventTypes, setEventTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editIdx, setEditIdx] = useState(null)

  // Form state
  const [title, setTitle] = useState('')
  const [duration, setDuration] = useState('30m')
  const [description, setDescription] = useState('')
  const [addMeet, setAddMeet] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadData = async () => {
    try {
      const res = await fetch('/api/event-types')
      const data = await res.json()
      if (data.eventTypes) setEventTypes(data.eventTypes)
    } catch (e) { console.error(e) }
    finally { setIsLoading(false) }
  }

  useEffect(() => { loadData() }, [])

  const resetForm = () => {
    setTitle(''); setDuration('30m'); setDescription(''); setAddMeet(true)
    setShowCreate(false); setEditIdx(null)
  }

  const handleSave = async () => {
    if (!title.trim()) return
    setIsSaving(true)
    try {
      const eventType = { title, duration, description, addMeet }
      const action = editIdx !== null ? 'update' : 'add'
      const res = await fetch('/api/event-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, eventType, index: editIdx })
      })
      const data = await res.json()
      if (data.eventTypes) setEventTypes(data.eventTypes)
      resetForm()
    } catch (e) { console.error(e) }
    finally { setIsSaving(false) }
  }

  const handleDelete = async (idx) => {
    try {
      const res = await fetch('/api/event-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', index: idx })
      })
      const data = await res.json()
      if (data.eventTypes) setEventTypes(data.eventTypes)
    } catch (e) { console.error(e) }
  }

  const handleToggle = async (idx) => {
    try {
      const res = await fetch('/api/event-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', index: idx })
      })
      const data = await res.json()
      if (data.eventTypes) setEventTypes(data.eventTypes)
    } catch (e) { console.error(e) }
  }

  const startEdit = (idx) => {
    const et = eventTypes[idx]
    setTitle(et.title); setDuration(et.duration); setDescription(et.description || ''); setAddMeet(et.addMeet ?? true)
    setEditIdx(idx); setShowCreate(true)
  }

  const handleQuickBook = (et) => {
    // Navigate to bookings page with pre-filled data
    const params = new URLSearchParams({ title: et.title, duration: et.duration, meet: et.addMeet ? '1' : '0' })
    window.location.href = `/bookings?create=1&${params.toString()}`
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="h-64 bg-gray-100 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Event Types</h1>
          <p className="text-sm text-gray-500">Create reusable meeting templates to quickly book events.</p>
        </div>
        <button 
          onClick={() => { showCreate ? resetForm() : setShowCreate(true) }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
            showCreate ? 'bg-gray-100 text-gray-700' : 'bg-black text-white hover:bg-gray-800'
          }`}
        >
          {showCreate ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Type</>}
        </button>
      </div>

      {/* Create / Edit Form */}
      {showCreate && (
        <div className="mb-8 bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
          <h3 className="font-semibold text-gray-900 text-lg">
            {editIdx !== null ? 'Edit Event Type' : 'Create Event Type'}
          </h3>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Title *</label>
            <input
              type="text" value={title} onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Quick Chat, Project Review, Interview"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <input
              type="text" value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Optional — what is this meeting for?"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Duration</label>
            <div className="flex gap-2 flex-wrap">
              {DURATION_OPTIONS.map(d => (
                <button key={d} onClick={() => setDuration(d)}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                    duration === d ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Video className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Include Google Meet</p>
                <p className="text-xs text-gray-500">Auto-generate a Meet link when booking</p>
              </div>
            </div>
            <button type="button" onClick={() => setAddMeet(!addMeet)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${addMeet ? 'bg-black' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${addMeet ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <button onClick={handleSave} disabled={isSaving || !title.trim()}
            className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
          >
            {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> {editIdx !== null ? 'Update' : 'Create'} Event Type</>}
          </button>
        </div>
      )}

      {/* Event Types List */}
      {eventTypes.length === 0 && !showCreate ? (
        <div className="text-center p-12 border border-gray-200 rounded-lg bg-gray-50">
          <Clock className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900">No Event Types Yet</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Create meeting templates like &quot;15 Min Chat&quot; or &quot;Project Review&quot; to quickly book events.</p>
          <button onClick={() => setShowCreate(true)} className="mt-4 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto shadow-sm">
            <Plus className="w-4 h-4" /> Create Your First Type
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm divide-y divide-gray-100">
          {eventTypes.map((event, idx) => (
            <div key={idx} className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gray-50/50 transition-colors ${!event.active ? 'opacity-50' : ''}`}>
              <div className="mb-3 sm:mb-0">
                <div className="flex items-center gap-3 mb-1">
                  <div className={`w-2 h-2 rounded-full ${event.active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  <h3 className="font-semibold text-gray-900">{event.title}</h3>
                  {!event.active && <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-md font-medium">Hidden</span>}
                  {event.addMeet && <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-md font-medium border border-blue-100">Meet</span>}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-500 ml-5">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {event.duration}</span>
                  {event.description && <><span className="text-gray-300">·</span><span>{event.description}</span></>}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-5 sm:ml-0">
                <button onClick={() => handleQuickBook(event)}
                  className="px-3 py-1.5 bg-black text-white rounded-md text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Quick Book
                </button>
                <button onClick={() => handleToggle(idx)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors" title={event.active ? 'Hide' : 'Show'}>
                  {event.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(idx)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors" title="Edit">
                  <Settings2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(idx)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
