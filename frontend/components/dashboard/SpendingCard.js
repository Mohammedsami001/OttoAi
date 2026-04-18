export default function SpendingCard({ spending }) {
  if (!spending) return null
  return (
    <article className="card p-5">
      <h3 className="text-xs text-brand-orange uppercase tracking-[0.15em] mb-2">Spending</h3>
      <p className="text-3xl font-semibold">INR {spending.total ?? 0}</p>
      <p className="text-brand-white/70 mt-2">Top category: {spending.top_category || "other"}</p>
      <p className="text-brand-white/60 text-sm mt-1">Transactions: {spending.transaction_count || 0}</p>
    </article>
  )
}
