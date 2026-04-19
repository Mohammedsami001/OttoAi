'use client'

import { Mail, RefreshCw, Zap, Inbox, Clock, Loader2, ChevronDown, ChevronUp, Reply, Send, Sparkles, X, Check } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Skeleton } from 'boneyard-js/react'

function extractSenderName(from) {
  if (!from) return 'Unknown'
  if (from.includes('<')) return from.split('<')[0].trim()
  return from
}

function extractSenderEmail(from) {
  if (!from) return ''
  const match = from.match(/<(.+?)>/)
  return match ? match[1] : from
}

function getTimeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Math.max(0, Date.now() - new Date(dateStr).getTime())
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function formatEmailDate(dateStr) {
  if (!dateStr) return 'Unknown date'
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return 'Unknown date'
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function getSenderColor(from) {
  if (!from) return 'bg-gray-500'
  const f = from.toLowerCase()
  if (f.includes('google')) return 'bg-blue-500'
  if (f.includes('spotify')) return 'bg-green-500'
  if (f.includes('openai') || f.includes('chatgpt')) return 'bg-emerald-600'
  if (f.includes('warp')) return 'bg-purple-500'
  if (f.includes('discord')) return 'bg-indigo-500'
  if (f.includes('github')) return 'bg-gray-800'
  return 'bg-gray-500'
}

function cleanSummaryText(text) {
  if (!text) return ''

  return text
    .replace(/^\s{0,3}#{1,6}\s*/gm, '')
    .replace(/^\s*[-*_]{3,}\s*$/gm, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/`/g, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*\d+\.\s+/gm, (m) => m.trim())
    .replace(/^\s*[-+*]\s+/gm, '- ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export default function GmailAssistant() {
  const [gmailData, setGmailData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshStatus, setRefreshStatus] = useState(null)
  const [expandedEmail, setExpandedEmail] = useState(null)

  // Reply state
  const [replyingTo, setReplyingTo] = useState(null) // index of email being replied to
  const [replyText, setReplyText] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState(null) // 'success' | 'error'

  const waitForMinimumSkeleton = async (startedAt, minMs = 600) => {
    const elapsed = Date.now() - startedAt
    if (elapsed < minMs) {
      await new Promise((resolve) => setTimeout(resolve, minMs - elapsed))
    }
  }

  const loadData = async () => {
    const startedAt = Date.now()
    setIsLoading(true)
    try {
      const resGmail = await fetch('/api/gmail')
      const dataGmail = await resGmail.json()
      if (dataGmail.summary) setGmailData(dataGmail.summary)
    } catch (e) { console.error(e) }
    finally {
      await waitForMinimumSkeleton(startedAt)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleForceRefresh = async () => {
    setIsRefreshing(true)
    setRefreshStatus(null)
    try {
      await loadData()
      setRefreshStatus('success')
    } catch (e) { setRefreshStatus('error') }
    finally {
      setIsRefreshing(false)
      setTimeout(() => setRefreshStatus(null), 5000)
    }
  }

  const handleReply = (idx) => {
    setReplyingTo(idx)
    setReplyText('')
    setSendStatus(null)
  }

  const handleGenerateAI = async () => {
    if (replyingTo === null) return
    const email = gmailData.emails[replyingTo]
    setIsGenerating(true)
    try {
      const res = await fetch('/api/gmail/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          subject: email.subject,
          snippet: email.snippet,
          senderName: extractSenderName(email.from)
        })
      })
      const data = await res.json()
      if (data.reply) setReplyText(data.reply)
    } catch (e) { console.error(e) }
    finally { setIsGenerating(false) }
  }

  const handleSendReply = async () => {
    if (replyingTo === null || !replyText.trim()) return
    const email = gmailData.emails[replyingTo]
    setIsSending(true)
    setSendStatus(null)
    try {
      const res = await fetch('/api/gmail/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send',
          to: extractSenderEmail(email.from),
          subject: email.subject,
          body: replyText,
          messageId: email.messageId,
          threadId: email.threadId
        })
      })
      const data = await res.json()
      if (data.success) {
        setSendStatus('success')
        setTimeout(() => { setReplyingTo(null); setSendStatus(null) }, 2000)
      } else {
        setSendStatus('error')
      }
    } catch (e) { setSendStatus('error') }
    finally { setIsSending(false) }
  }

  if (isLoading) {
    return (
      <Skeleton
        name="gmail-page"
        loading
        fallback={
          <div className="max-w-5xl">
            <div className="h-8 bg-gray-200 rounded w-56 mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
              ))}
            </div>
          </div>
        }
      >
        <div className="max-w-5xl" />
      </Skeleton>
    )
  }

  return (
    <div className="max-w-5xl">
      {/* Reply Modal */}
      {replyingTo !== null && gmailData?.emails?.[replyingTo] && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => { if (!isSending) setReplyingTo(null) }}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
            {sendStatus === 'success' ? (
              <div className="p-8 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg">Reply Sent!</h3>
                <p className="text-sm text-gray-500 mt-1">Your reply to {extractSenderName(gmailData.emails[replyingTo].from)} has been sent.</p>
              </div>
            ) : (
              <>
                <div className="p-5 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">Reply to {extractSenderName(gmailData.emails[replyingTo].from)}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 truncate max-w-sm">{gmailData.emails[replyingTo].subject}</p>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="text-gray-400 hover:text-gray-600 p-1">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs text-gray-500">To: {extractSenderEmail(gmailData.emails[replyingTo].from)}</span>
                    <button
                      onClick={handleGenerateAI}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg text-xs font-medium hover:from-violet-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-sm"
                    >
                      {isGenerating ? <><Loader2 className="w-3 h-3 animate-spin" /> Drafting...</> : <><Sparkles className="w-3 h-3" /> AI Draft</>}
                    </button>
                  </div>

                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    placeholder="Write your reply or click 'AI Draft' to generate one..."
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-black transition-colors resize-none"
                    autoFocus
                  />

                  {sendStatus === 'error' && (
                    <p className="text-xs text-red-500 mt-2">Failed to send. Check your Gmail permissions.</p>
                  )}
                </div>

                <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                  <button onClick={() => setReplyingTo(null)} className="text-sm text-gray-600 font-medium hover:text-black transition-colors">Cancel</button>
                  <button
                    onClick={handleSendReply}
                    disabled={isSending || !replyText.trim()}
                    className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {isSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Reply</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="mb-8 border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Gmail Assistant</h1>
            <p className="text-sm text-gray-500">AI-powered inbox with smart replies.</p>
          </div>
          <button
            onClick={handleForceRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm ${
              isRefreshing ? 'bg-gray-100 text-gray-400 cursor-wait' 
              : refreshStatus === 'success' ? 'bg-green-50 text-green-700 border border-green-200'
              : refreshStatus === 'error' ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-black text-white hover:bg-gray-800'
            }`}
          >
            {isRefreshing ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</>
            : refreshStatus === 'success' ? <><Mail className="w-4 h-4" /> Synced!</>
            : refreshStatus === 'error' ? <><RefreshCw className="w-4 h-4" /> Failed</>
            : <><RefreshCw className="w-4 h-4" /> Sync Now</>}
          </button>
        </div>
      </div>

      {gmailData ? (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Emails</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{gmailData.emails?.length || 0}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Last Synced</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{getTimeAgo(gmailData.last_synced)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Agent</p>
              <p className="text-2xl font-bold text-green-600 mt-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Active
              </p>
            </div>
          </div>

          {/* AI Summary */}
          {gmailData.ai_summary && (
            <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">AI Summary</span>
              </div>
              <p className="text-sm text-blue-900/80 leading-relaxed whitespace-pre-wrap font-medium">{cleanSummaryText(gmailData.ai_summary)}</p>
            </div>
          )}

          {/* Email List */}
          {gmailData.emails && gmailData.emails.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Messages ({gmailData.emails.length})
              </h2>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100 overflow-hidden">
                {gmailData.emails.map((email, idx) => {
                  const senderName = extractSenderName(email.from)
                  const isExpanded = expandedEmail === idx
                  return (
                    <div key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <div
                        onClick={() => setExpandedEmail(isExpanded ? null : idx)}
                        className="p-4 cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full ${getSenderColor(email.from)} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5`}>
                            {senderName.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">{senderName}</span>
                              <span className="text-xs text-gray-500 flex-shrink-0 text-right inline-flex items-center gap-2">
                                <span>{formatEmailDate(email.date)}</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3 text-gray-400" /> : <ChevronDown className="w-3 h-3 text-gray-400" />}
                              </span>
                            </div>
                            <p className="text-sm text-gray-800 truncate font-medium">{email.subject}</p>
                            {!isExpanded && <p className="text-xs text-gray-500 truncate mt-0.5">{email.snippet}</p>}
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 ml-11">
                          <div className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-md border border-gray-100 mb-3">
                            {email.snippet}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleReply(idx) }}
                            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors shadow-sm"
                          >
                            <Reply className="w-3.5 h-3.5" /> Reply with AI
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center p-12 border border-gray-200 rounded-lg bg-gray-50">
           <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-4" />
           <h3 className="font-medium text-gray-900">No Summaries Yet</h3>
           <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Click &quot;Sync Now&quot; to fetch your inbox.</p>
           <button onClick={handleForceRefresh} disabled={isRefreshing} className="mt-4 px-4 py-2 bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm flex items-center gap-2 mx-auto disabled:opacity-50">
             {isRefreshing ? <><Loader2 className="w-4 h-4 animate-spin" /> Syncing...</> : <><RefreshCw className="w-4 h-4" /> Fetch Emails</>}
           </button>
        </div>
      )}
    </div>
  )
}
