export default function GmailCard({ gmail }) {
  if (!gmail) return null
  return (
    <article className="card p-5">
      <h3 className="text-xs text-brand-orange uppercase tracking-[0.15em] mb-2">Gmail</h3>
      <p className="text-3xl font-semibold">{gmail.unread_count ?? 0}</p>
      <p className="text-brand-white/70 mt-2 text-sm">{gmail.summary_text || "No summary yet"}</p>
    </article>
  )
}
