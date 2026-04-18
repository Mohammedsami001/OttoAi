export default function DocsCard({ docs }) {
  if (!docs) return null
  const rows = docs.recent_docs || []

  return (
    <article className="card p-5">
      <h3 className="text-xs text-brand-orange uppercase tracking-[0.15em] mb-2">Google Docs</h3>
      <ul className="space-y-2 text-sm text-brand-white/70">
        {rows.slice(0, 3).map((doc) => (
          <li key={doc.name}>• {doc.name} · {doc.last_modified}</li>
        ))}
      </ul>
    </article>
  )
}
