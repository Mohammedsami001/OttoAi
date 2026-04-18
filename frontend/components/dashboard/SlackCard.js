export default function SlackCard({ slack }) {
  if (!slack) return null
  return (
    <article className="card p-5">
      <h3 className="text-xs text-brand-orange uppercase tracking-[0.15em] mb-2">Slack</h3>
      <p className="text-3xl font-semibold">{slack.unread_count ?? 0}</p>
      <p className="text-brand-white/70 mt-2 text-sm">{slack.summary_text || "No summary yet"}</p>
    </article>
  )
}
