export default function ConnectionStatusCard({ status }) {
  if (!status) return null
  const items = Object.entries(status)

  return (
    <article className="card p-5">
      <h3 className="text-xs text-brand-orange uppercase tracking-[0.15em] mb-2">Connections</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {items.map(([name, connected]) => (
          <div key={name} className="flex items-center justify-between border border-white/10 rounded-lg px-3 py-2 bg-white/[0.02]">
            <span className="text-brand-white/70">{name.replace("_", " ")}</span>
            <span className={connected ? "text-brand-green" : "text-brand-red"}>{connected ? "On" : "Off"}</span>
          </div>
        ))}
      </div>
    </article>
  )
}
