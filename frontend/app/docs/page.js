'use client'

import { FileText, ExternalLink, RefreshCw, Users, Clock, Plus, AlertTriangle, LogOut, Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { Skeleton } from 'boneyard-js/react'

function getTimeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function DocsPage() {
  const [docs, setDocs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [needsReauth, setNeedsReauth] = useState(false)
  const [summaries, setSummaries] = useState({})
  const [loadingSummary, setLoadingSummary] = useState({})
  const [expandedDoc, setExpandedDoc] = useState(null)

  const waitForMinimumSkeleton = async (startedAt, minMs = 600) => {
    const elapsed = Date.now() - startedAt
    if (elapsed < minMs) {
      await new Promise((resolve) => setTimeout(resolve, minMs - elapsed))
    }
  }

  const loadDocs = async () => {
    const startedAt = Date.now()
    setIsLoading(true)
    try {
      const res = await fetch('/api/google/docs')
      const data = await res.json()
      if (data.needsReauth) {
        setNeedsReauth(true)
        setError(data.error)
      } else if (data.error) {
        setError(data.error)
      } else if (data.docs) {
        setDocs(data.docs)
        setError(null)
        // Stagger AI summary requests to avoid rate limits
        const docsToSummarize = data.docs.slice(0, 5)
        for (let i = 0; i < docsToSummarize.length; i++) {
          setTimeout(() => fetchSummary(docsToSummarize[i].id), i * 2500) // 2.5s apart
        }
      }
    } catch (e) {
      setError('Failed to fetch documents')
    } finally {
      await waitForMinimumSkeleton(startedAt)
      setIsLoading(false)
    }
  }

  const fetchSummary = async (docId) => {
    if (summaries[docId]) return // already have it
    setLoadingSummary(prev => ({ ...prev, [docId]: true }))
    try {
      const res = await fetch(`/api/google/docs/${docId}`)
      const data = await res.json()
      if (data.summary) {
        setSummaries(prev => ({
          ...prev,
          [docId]: { summary: data.summary, wordCount: data.wordCount, preview: data.preview }
        }))
      }
    } catch (e) {
      console.error('Failed to fetch summary for', docId)
    } finally {
      setLoadingSummary(prev => ({ ...prev, [docId]: false }))
    }
  }

  useEffect(() => { loadDocs() }, [])

  if (isLoading) {
    return (
      <Skeleton
        name="docs-page"
        loading
        fallback={
          <div className="max-w-5xl">
            <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-100 rounded-lg"></div>
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
      <div className="mb-8 border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Google Docs</h1>
            <p className="text-sm text-gray-500">Your recent documents with AI-powered summaries.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.open('https://docs.google.com/document/create', '_blank')}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm">
              <Plus className="w-4 h-4" /> New Doc
            </button>
            <button onClick={() => { setSummaries({}); loadDocs() }}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {needsReauth && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">Google Drive permission needed</p>
              <p className="text-sm text-amber-800 mt-1">Sign out and sign back in to grant Drive read access.</p>
              <button onClick={() => signOut({ callbackUrl: 'https://otto-ai-frontend.vercel.app/' })}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm">
                <LogOut className="w-4 h-4" /> Sign Out &amp; Re-authenticate
              </button>
            </div>
          </div>
        </div>
      )}

      {error && !needsReauth && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          <p className="font-medium">Error loading documents</p>
          <p className="mt-1 text-xs">{typeof error === 'string' ? error.slice(0, 200) : 'Something went wrong.'}</p>
        </div>
      )}

      {docs.length === 0 && !error ? (
        <div className="text-center p-12 border border-gray-200 rounded-lg bg-gray-50">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="font-medium text-gray-900">No Documents Found</h3>
          <p className="text-sm text-gray-500 mt-1">Create a Google Doc to see it here.</p>
        </div>
      ) : docs.length > 0 && (
        <div className="space-y-3">
          {docs.map((doc, idx) => {
            const hasSummary = summaries[doc.id]
            const isSummaryLoading = loadingSummary[doc.id]
            const isExpanded = expandedDoc === doc.id
            const isInTop5 = idx < 5

            return (
              <div key={doc.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 text-sm truncate">{doc.title}</h3>
                        {isInTop5 && hasSummary && (
                          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-100 flex-shrink-0">
                            <Sparkles className="w-3 h-3" /> AI Summary
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {getTimeAgo(doc.modified)}
                        </span>
                        {doc.shared && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="w-3 h-3" /> Shared
                          </span>
                        )}
                        {hasSummary?.wordCount > 0 && (
                          <span className="text-xs text-gray-400">{hasSummary.wordCount.toLocaleString()} words</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {isInTop5 && (hasSummary || isSummaryLoading) && (
                      <button onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    )}
                    {!isInTop5 && !hasSummary && !isSummaryLoading && (
                      <button onClick={() => { fetchSummary(doc.id); setExpandedDoc(doc.id) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
                        <Sparkles className="w-3 h-3" /> Summarize
                      </button>
                    )}
                    <a href={doc.link} target="_blank" rel="noreferrer"
                      className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* AI Summary Panel */}
                {(isExpanded || (isInTop5 && !expandedDoc && idx === 0 && hasSummary)) && (
                  <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-4">
                    {isSummaryLoading ? (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        <span>Generating AI summary...</span>
                      </div>
                    ) : hasSummary ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">AI Summary</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{hasSummary.summary}</p>
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
