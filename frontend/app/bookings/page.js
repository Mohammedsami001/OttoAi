'use client'

import { Calendar, Clock, Video, Plus, X, Loader2, ExternalLink, Trash2, Inbox } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

export default function Bookings() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  // Create event form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('10:00')
  const [endTime, setEndTime] = useState('11:00')
  const [addMeet, setAddMeet] = useState(true)
  const [attendees, setAttendees] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createdEvent, setCreatedEvent] = useState(null)

  useEffect(() => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    setStartDate(`${yyyy}-${mm}-${dd}`)

    // Check URL params for quick booking
    if (searchParams?.get('create') === '1') {
      setShowCreate(true)
      if (searchParams.get('title')) setTitle(searchParams.get('title'))
      if (searchParams.get('meet') === '1') setAddMeet(true)
    }
  }, [searchParams])

  const loadEvents = async () => {
    try {
      const res = await fetch('/api/calendar/events')
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else if (data.events) {
        setEvents(data.events)
        setError(null)
      }
    } catch (e) {
      setError('Failed to connect to calendar API')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { loadEvents() }, [])

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    if (!title || !startDate || !startTime || !endTime) return
    setIsCreating(true)
    setCreatedEvent(null)
    try {
      const res = await fetch('/api/calendar/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, startDate, startTime, endTime, addMeet, attendees,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })
      const data = await res.json()
      if (data.success) {
        setCreatedEvent(data.event)
        await loadEvents()
        setTimeout(() => { setTitle(''); setDescription(''); setAttendees(''); setCreatedEvent(null) }, 6000)
      } else {
        setError(data.error || 'Failed to create event')
      }
    } catch (err) { setError('Failed to create event') }
    finally { setIsCreating(false) }
  }

  const handleDeleteEvent = async (eventId) => {
    if (!confirm('Delete this event from Google Calendar?')) return
    setDeletingId(eventId)
    try {
      const res = await fetch(`/api/calendar/events/${eventId}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setEvents(prev => prev.filter(e => e.id !== eventId))
      } else {
        setError(data.error || 'Failed to delete event')
      }
    } catch (e) { setError('Failed to delete event') }
    finally { setDeletingId(null) }
  }

  const now = new Date()
  const filteredEvents = events.filter(e => {
    const eventDate = new Date(e.start)
    return activeTab === 'upcoming' ? eventDate >= now : eventDate < now
  })

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
      <div className="mb-8 border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Bookings</h1>
            <p className="text-sm text-gray-500">Create, view, and manage your Google Calendar events.</p>
          </div>
          <button
            onClick={() => { setShowCreate(!showCreate); setCreatedEvent(null) }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
              showCreate ? 'bg-gray-100 text-gray-700' : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {showCreate ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Event</>}
          </button>
        </div>
        
        {!showCreate && (
          <div className="flex gap-6 mt-6">
            <button onClick={() => setActiveTab('upcoming')} className={`text-sm font-medium pb-3 px-1 transition-colors ${activeTab === 'upcoming' ? 'text-gray-900 border-b-2 border-black' : 'text-gray-500 hover:text-gray-900'}`}>
              Upcoming ({events.filter(e => new Date(e.start) >= now).length})
            </button>
            <button onClick={() => setActiveTab('past')} className={`text-sm font-medium pb-3 px-1 transition-colors ${activeTab === 'past' ? 'text-gray-900 border-b-2 border-black' : 'text-gray-500 hover:text-gray-900'}`}>
              Past ({events.filter(e => new Date(e.start) < now).length})
            </button>
          </div>
        )}
      </div>

      {/* Create Event Form */}
      {showCreate && (
        <div className="mb-8 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {createdEvent ? (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-lg">Event Created!</h3>
              <p className="text-sm text-gray-500 mt-1">&quot;{createdEvent.summary}&quot; has been added to your Google Calendar.</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                {createdEvent.meet && (
                  <a href={createdEvent.meet} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    <Video className="w-4 h-4" /> Meet Link
                  </a>
                )}
                <a href={createdEvent.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
                  <ExternalLink className="w-4 h-4" /> View in Calendar
                </a>
              </div>
              {createdEvent.meet && (
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-md mx-auto">
                  <p className="text-xs text-gray-500 mb-1 font-medium">Google Meet Link</p>
                  <p className="text-sm text-gray-900 font-mono select-all break-all">{createdEvent.meet}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateEvent} className="p-6 space-y-5">
              <h3 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" /> Create New Event
              </h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Team Standup, Coffee Chat" required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional — add notes or agenda" rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-colors resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black text-center transition-colors" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-black text-center transition-colors" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Attendees</label>
                <input type="text" value={attendees} onChange={e => setAttendees(e.target.value)} placeholder="email1@example.com, email2@example.com"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-black transition-colors" />
                <p className="text-xs text-gray-400 mt-1">Comma-separated email addresses (optional)</p>
              </div>
              <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Add Google Meet</p>
                    <p className="text-xs text-gray-500">Auto-generate a video conferencing link</p>
                  </div>
                </div>
                <button type="button" onClick={() => setAddMeet(!addMeet)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${addMeet ? 'bg-black' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${addMeet ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <button type="submit" disabled={isCreating || !title}
                className="w-full bg-black text-white py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
                {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><Plus className="w-4 h-4" /> Create Event</>}
              </button>
            </form>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm">
          <p className="font-medium">Calendar issue</p>
          <p className="mt-1">{error}</p>
        </div>
      )}

      {/* Events List */}
      {!showCreate && (
        <div className="space-y-3">
          {filteredEvents.length === 0 ? (
            <div className="text-center p-12 border border-gray-200 rounded-lg bg-gray-50">
              <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900">No {activeTab} events</h3>
              <p className="text-sm text-gray-500 mt-1">{activeTab === 'upcoming' ? 'No events in the next 7 days.' : 'No past events.'}</p>
              <button onClick={() => setShowCreate(true)} className="mt-4 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 mx-auto shadow-sm">
                <Plus className="w-4 h-4" /> Create Event
              </button>
            </div>
          ) : (
            filteredEvents.map((booking) => {
              const isDeleting = deletingId === booking.id
              return (
                <div key={booking.id} className={`flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-gray-300 transition-all ${isDeleting ? 'opacity-50' : ''}`}>
                  <div className="flex gap-6 items-center">
                    <div className="flex flex-col items-center justify-center min-w-[70px] py-2 px-3 bg-gray-50 rounded-lg hidden md:flex">
                      <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400">
                        {new Date(booking.start).toLocaleDateString('en-US', { month: 'short' })}
                      </span>
                      <span className="text-3xl font-bold text-gray-900 leading-none mt-0.5">
                        {new Date(booking.start).getDate()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${booking.status === 'cancelled' ? 'bg-red-500' : new Date(booking.end || booking.start) < now ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                        <h3 className="font-semibold text-gray-900 text-base">{booking.summary || "Busy"}</h3>
                        {booking.status === 'cancelled' ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">Cancelled</span>
                        ) : new Date(booking.end || booking.start) < now ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Completed</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">Confirmed</span>
                        )}
                      </div>
                      <div className="flex items-center gap-5 text-sm text-gray-500 ml-5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{new Date(booking.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {booking.end && <span>– {new Date(booking.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                        </div>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-400">
                          {new Date(booking.start).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 md:mt-0 flex items-center gap-3 ml-5 md:ml-0">
                    {booking.meet && (
                      <button onClick={() => window.open(booking.meet, '_blank')} className="px-4 py-2 border border-blue-200 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors flex items-center gap-2 shadow-sm">
                        <Video className="w-4 h-4" /> Join Meet
                      </button>
                    )}
                    <button onClick={() => window.open(booking.link, '_blank')} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-sm">
                      <ExternalLink className="w-4 h-4" /> Open
                    </button>
                    <button onClick={() => handleDeleteEvent(booking.id)} disabled={isDeleting}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50" title="Delete event">
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
