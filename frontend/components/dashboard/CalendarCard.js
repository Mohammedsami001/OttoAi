export default function CalendarCard({ calendar, meet }) {
  if (!calendar) return null
  const events = calendar.upcoming_events || []
  const meetings = meet?.scheduled_meetings || []

  return (
    <article className="card p-5">
      <h3 className="text-xs text-brand-orange uppercase tracking-[0.15em] mb-2">Calendar & Meet</h3>
      <p className="text-2xl font-semibold">{calendar.event_count ?? 0} upcoming</p>
      <ul className="mt-3 text-sm text-brand-white/70 space-y-2">
        {events.slice(0, 3).map((evt) => (
          <li key={`${evt.title}-${evt.start}`}>• {evt.title}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-brand-white/60">Meet links found: {meetings.length}</p>
    </article>
  )
}
