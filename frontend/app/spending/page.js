'use client'

import { useState, useEffect } from 'react'
import { BellRing, Trash2, Loader2 } from 'lucide-react'

export default function SpendingPage() {
  const [subs, setSubs] = useState([])
  const [isLoadingSubs, setIsLoadingSubs] = useState(true)

  const [subName, setSubName] = useState('')
  const [subAmount, setSubAmount] = useState('')
  const [subStartDate, setSubStartDate] = useState('')
  const [subCycle, setSubCycle] = useState('monthly')
  const [subNextDate, setSubNextDate] = useState('')
  const [deletingIdx, setDeletingIdx] = useState(null)

  useEffect(() => {
    async function loadSubs() {
      try {
        const res = await fetch('/api/subscriptions')
        const data = await res.json()
        if (data.subscriptions) setSubs(data.subscriptions)
      } catch (e) { console.error(e) }
      finally { setIsLoadingSubs(false) }
    }
    loadSubs()
  }, [])

  const handleAddSub = async (e) => {
    e.preventDefault()
    if (!subName || !subAmount || !subStartDate || !subNextDate) return
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: subName, amount: subAmount, start_date: subStartDate,
          billing_cycle: subCycle, next_billing_date: subNextDate
        })
      })
      const data = await res.json()
      if (data.success) {
        setSubs([...subs, data.subscription])
        setSubName(''); setSubAmount(''); setSubStartDate(''); setSubNextDate('');
      }
    } catch (e) { console.error(e) }
  }

  const handleDeleteSub = async (idx) => {
    setDeletingIdx(idx)
    try {
      const sub = subs[idx]
      await fetch('/api/subscriptions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sub.name })
      })
      setSubs(subs.filter((_, i) => i !== idx))
    } catch (e) { console.error(e) }
    finally { setDeletingIdx(null) }
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-8 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-3">
          <BellRing className="w-6 h-6 text-gray-700" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Smart Subscriptions</h1>
            <p className="text-sm text-gray-500">The AI agent monitors your subscriptions and sends alerts before they renew.</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <form onSubmit={handleAddSub} className="space-y-4 border border-gray-200 p-6 rounded-xl bg-white shadow-sm h-fit">
          <h3 className="font-semibold text-gray-900">Track New Subscription</h3>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">Service Name</label>
            <input value={subName} onChange={e => setSubName(e.target.value)} required type="text" placeholder="e.g. Netflix, Spotify, ChatGPT"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Amount (₹)</label>
              <input value={subAmount} onChange={e => setSubAmount(e.target.value)} required type="number" step="0.01" placeholder="199"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Billing Cycle</label>
              <select value={subCycle} onChange={e => setSubCycle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors">
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Start Date</label>
              <input value={subStartDate} onChange={e => setSubStartDate(e.target.value)} required type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">Next Billing Date</label>
              <input value={subNextDate} onChange={e => setSubNextDate(e.target.value)} required type="date"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" />
            </div>
          </div>
          <button type="submit" className="w-full bg-black text-white hover:bg-gray-800 rounded-lg py-2.5 text-sm font-medium transition-colors mt-2 shadow-sm">
            Track Subscription
          </button>
        </form>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 mb-4">Active Subscriptions</h3>
          {isLoadingSubs ? (
            <div className="flex items-center gap-2 text-sm text-gray-500 p-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : subs.length === 0 ? (
            <div className="text-sm text-gray-500 border border-gray-200 p-6 rounded-xl bg-gray-50 text-center">
              <p className="font-medium text-gray-700 mb-1">No subscriptions yet</p>
              <p>Add one to activate agent renewal alerts.</p>
            </div>
          ) : (
            subs.map((s, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-xl flex items-center justify-between text-sm hover:border-gray-300 transition-colors bg-white shadow-sm group">
                <div>
                  <div className="font-semibold text-gray-900 flex items-center gap-2">
                    {s.name}
                    <span className="text-[10px] font-medium bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Active</span>
                  </div>
                  <div className="text-gray-500 mt-1 capitalize">{s.billing_cycle} · Started {new Date(s.start_date).toLocaleDateString()}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-bold text-gray-900">₹{s.amount}</div>
                    <div className="text-xs text-orange-600 font-medium mt-0.5">Renews {new Date(s.next_billing_date).toLocaleDateString()}</div>
                  </div>
                  <button onClick={() => handleDeleteSub(idx)} disabled={deletingIdx === idx}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                    {deletingIdx === idx ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
