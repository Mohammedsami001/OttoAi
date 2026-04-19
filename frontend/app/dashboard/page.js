'use client'

import { useEffect, useMemo, useState } from 'react'
import { signIn } from 'next-auth/react'
import { CalendarDays, FileText, Inbox, Link2, Activity, RefreshCw, Sparkles } from 'lucide-react'
import { MiniChart } from '../../components/ui/mini-chart'
import { HealthCard } from '../../components/ui/health-card'

const integrationIds = ['google-calendar', 'google-meet', 'gmail', 'google-docs']

function isEnabled(installedApps, id) {
  if (!Array.isArray(installedApps)) return true
  return installedApps.includes(id)
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    emails: 0,
    docs: 0,
    upcomingEvents: 0,
    integrationsOn: 0,
  })
  const [installedApps, setInstalledApps] = useState(null)
  const [healthData, setHealthData] = useState(null)
  const [healthLoading, setHealthLoading] = useState(false)
  const [healthError, setHealthError] = useState(null)
  const [healthConnected, setHealthConnected] = useState(null)
  const [healthNeedsReauth, setHealthNeedsReauth] = useState(false)
  const [appUsage, setAppUsage] = useState(null)
  const [appUsageLoading, setAppUsageLoading] = useState(false)
  const [appUsageError, setAppUsageError] = useState(null)

  const handleReconnectGoogleFit = async () => {
    await signIn(
      'google',
      { callbackUrl: '/dashboard' },
      {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
        scope:
          'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/fitness.activity.read',
      }
    )
  }

  const loadLivePanels = async () => {
    setHealthLoading(true)
    setAppUsageLoading(true)

    try {
      const [healthRes, appUsageRes] = await Promise.all([
        fetch('/api/health'),
        fetch('/api/app-usage'),
      ])

      const healthData = await healthRes.json().catch(() => ({}))
      const appUsageData = await appUsageRes.json().catch(() => ({}))

      if (healthData?.stats && healthData?.connected) {
        setHealthData(healthData.stats)
        setHealthConnected(true)
        setHealthNeedsReauth(false)
        setHealthError(null)
      } else if (healthData?.connected === false) {
        setHealthConnected(false)
        setHealthNeedsReauth(Boolean(healthData?.needsReauth))
        setHealthError(healthData?.error || null)
        setHealthData(null)
      } else if (healthData?.error) {
        setHealthError(healthData.error)
        setHealthData(null)
        setHealthConnected(false)
        setHealthNeedsReauth(Boolean(healthData?.needsReauth))
      }

      if (appUsageData?.stats) {
        setAppUsage(appUsageData.stats)
        setAppUsageError(null)
      } else if (appUsageData?.error) {
        setAppUsageError(appUsageData.error)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setHealthLoading(false)
      setAppUsageLoading(false)
    }
  }

  const loadDashboard = async () => {
    setIsLoading(true)
    setHealthLoading(true)
    setAppUsageLoading(true)

    try {
      const [prefsRes, gmailRes, docsRes, bookingsRes, healthRes, appUsageRes] = await Promise.all([
        fetch('/api/user/preferences'),
        fetch('/api/gmail'),
        fetch('/api/google/docs'),
        fetch('/api/calendar/events'),
        fetch('/api/health'),
        fetch('/api/app-usage'),
      ])

      const prefsData = await prefsRes.json().catch(() => ({}))
      const gmailData = await gmailRes.json().catch(() => ({}))
      const docsData = await docsRes.json().catch(() => ({}))
      const bookingsData = await bookingsRes.json().catch(() => ({}))
      const healthData = await healthRes.json().catch(() => ({}))
      const appUsageData = await appUsageRes.json().catch(() => ({}))

      const apps = Array.isArray(prefsData?.user?.installed_apps)
        ? prefsData.user.installed_apps
        : integrationIds

      setInstalledApps(apps)
      setStats({
        emails: Array.isArray(gmailData?.summary?.emails) ? gmailData.summary.emails.length : 0,
        docs: Array.isArray(docsData?.docs) ? docsData.docs.length : 0,
        upcomingEvents: Array.isArray(bookingsData?.events) ? bookingsData.events.length : 0,
        integrationsOn: apps.length,
      })
      
      if (healthData?.stats && healthData?.connected) {
        setHealthData(healthData.stats)
        setHealthConnected(true)
        setHealthNeedsReauth(false)
        setHealthError(null)
      } else if (healthData?.connected === false) {
        setHealthConnected(false)
        setHealthNeedsReauth(Boolean(healthData?.needsReauth))
        setHealthError(healthData?.error || null)
        setHealthData(null)
      } else if (healthData?.error) {
        setHealthError(healthData.error)
        setHealthData(null)
        setHealthConnected(false)
        setHealthNeedsReauth(Boolean(healthData?.needsReauth))
      }

      if (appUsageData?.stats) {
        setAppUsage(appUsageData.stats)
        setAppUsageError(null)
      } else if (appUsageData?.error) {
        setAppUsageError(appUsageData.error)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsLoading(false)
      setHealthLoading(false)
      setAppUsageLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()

    const liveRefresh = window.setInterval(() => {
      loadLivePanels()
    }, 30000)

    return () => window.clearInterval(liveRefresh)
  }, [])

  const chartData = useMemo(() => {
    const filteredUsage = Array.isArray(appUsage)
      ? appUsage.filter((item) => String(item?.app || '').toLowerCase() !== 'settings')
      : []

    const usageMap = new Map(filteredUsage.map((item) => [item.app, item.totalMinutes]))
    const workflowScore = Math.min(100, stats.integrationsOn * 12 + stats.upcomingEvents * 2)

    return [
      { label: 'Gmail', value: usageMap.get('Gmail') ?? stats.emails },
      { label: 'Google Docs', value: usageMap.get('Google Docs') ?? stats.docs },
      { label: 'Calendar Events', value: stats.upcomingEvents },
      { label: 'Active Integrations', value: stats.integrationsOn },
      { label: 'Product Touchpoints', value: stats.emails + stats.docs + stats.upcomingEvents },
      { label: 'Workflow Score', value: workflowScore },
    ]
  }, [appUsage, stats])

  const hasUsageData = Array.isArray(appUsage) && appUsage.some((item) => String(item?.app || '').toLowerCase() !== 'settings')

  const platformSummary = useMemo(() => {
    return [
      { label: 'Product touchpoints', value: stats.emails + stats.docs + stats.upcomingEvents },
      { label: 'Connected apps', value: stats.integrationsOn },
      { label: 'Workflow score', value: Math.min(100, stats.integrationsOn * 12 + stats.upcomingEvents * 2) },
    ]
  }, [stats])

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center justify-between border-b border-gray-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">A quick pulse of your productivity stack and Google workflow.</p>
        </div>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Inbox Messages" value={stats.emails} icon={<Inbox className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Google Docs" value={stats.docs} icon={<FileText className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Upcoming Events" value={stats.upcomingEvents} icon={<CalendarDays className="h-4 w-4" />} loading={isLoading} />
        <StatCard title="Active Integrations" value={stats.integrationsOn} icon={<Link2 className="h-4 w-4" />} loading={isLoading} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {platformSummary.map((item) => (
          <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-gray-500">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">{item.label}</p>
            </div>
            {isLoading ? (
              <div className="h-8 w-16 rounded bg-gray-100" />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{item.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,3fr)]">
        <HealthCard
          stats={healthData}
          loading={healthLoading}
          error={healthError}
          connected={healthConnected}
          needsReauth={healthNeedsReauth}
          onReconnect={handleReconnectGoogleFit}
        />
        <MiniChart
          title="Automation Index"
          data={chartData}
          loading={isLoading || (appUsageLoading && !hasUsageData)}
          loadingBars={6}
          className="max-w-none"
        />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-4 w-4 text-gray-700" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-600">Integration Health</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <IntegrationRow
              name="Google Calendar"
              enabled={isEnabled(installedApps, 'google-calendar')}
              description="Scheduling and conflict checks"
            />
            <IntegrationRow
              name="Google Meet"
              enabled={isEnabled(installedApps, 'google-meet')}
              description="Meeting links for bookings"
            />
            <IntegrationRow
              name="Gmail"
              enabled={isEnabled(installedApps, 'gmail')}
              description="Inbox summaries and smart replies"
            />
            <IntegrationRow
              name="Google Docs"
              enabled={isEnabled(installedApps, 'google-docs')}
              description="AI-powered doc summaries"
            />
              <IntegrationRow
                name="Google Fit"
                enabled={healthConnected}
                description="Daily steps and health metrics"
              />
          </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon, loading }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center justify-between text-gray-500">
          <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
          {icon}
        </div>
        <div className="h-8 w-16 rounded bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between text-gray-500">
        <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

function IntegrationRow({ name, enabled, description }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{name}</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {enabled ? 'On' : 'Off'}
        </span>
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  )
}
