import { NextResponse as Response } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { BetaAnalyticsDataClient } from "@google-analytics/data"

function reportRows(reportResponse) {
  const report = Array.isArray(reportResponse) ? reportResponse[0] : reportResponse
  return Array.isArray(report?.rows) ? report.rows : []
}

function getDimension(row, index = 0, fallback = "") {
  const value = row?.dimensionValues?.[index]?.value ?? row?.dimensions?.[index]
  return typeof value === "string" ? value : fallback
}

function getMetricNumber(row, index = 0) {
  const raw = row?.metricValues?.[index]?.value ?? row?.metrics?.[index]?.values?.[0]
  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : 0
}

function parseServiceAccountKey(rawKey) {
  if (!rawKey) return null

  const candidates = [rawKey, rawKey.trim(), rawKey.replace(/\\n/g, "\n")]

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate)
    } catch {
      // try next format
    }
  }

  // Handle accidental wrapping quotes from env dashboards
  const stripped = rawKey.trim().replace(/^['"]|['"]$/g, "")
  try {
    return JSON.parse(stripped)
  } catch {
    return null
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session?.user?.id || session?.user?.email

    const propertyId = process.env.NEXT_PUBLIC_GA4_PROPERTY_ID
    const serviceAccountKey = process.env.GA4_SERVICE_ACCOUNT_KEY

    if (!propertyId || !serviceAccountKey) {
      return Response.json(
        { error: "GA4 credentials not configured" },
        { status: 200 }
      )
    }

    // Parse the service account key from environment variable
    const serviceAccount = parseServiceAccountKey(serviceAccountKey)
    if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
      return Response.json(
        { error: "Invalid GA4_SERVICE_ACCOUNT_KEY format" },
        { status: 200 }
      )
    }

    // Initialize the GA4 client
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
    })

    const userFilter = userId
      ? {
          dimensionFilter: {
            filter: {
              fieldName: "userId",
              stringFilter: {
                matchType: "EXACT",
                value: userId,
              },
            },
          },
        }
      : undefined

    const runReportWithFallback = async (request) => {
      try {
        return await analyticsDataClient.runReport({
          ...request,
          ...(userFilter || {}),
        })
      } catch (error) {
        const message = String(error?.message || "")
        if (message.includes("INVALID_ARGUMENT") && userFilter) {
          // Fallback to unfiltered report when userId dimension filtering is unsupported
          return await analyticsDataClient.runReport(request)
        }
        throw error
      }
    }

    // Fetch feature usage (last 30 days)
    const featureUsageResponse = await runReportWithFallback({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensions: [
        {
          name: "pagePath",
        },
      ],
      metrics: [
        {
          name: "eventCount",
        },
      ],
      limit: 10,
    })

    // Fetch daily active users (last 7 days)
    const dailyUsersResponse = await runReportWithFallback({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: "7daysAgo",
          endDate: "today",
        },
      ],
      dimensions: [
        {
          name: "date",
        },
      ],
      metrics: [
        {
          name: "activeUsers",
        },
      ],
    })

    // Fetch browser data
    const browserResponse = await runReportWithFallback({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensions: [
        {
          name: "browser",
        },
      ],
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      limit: 10,
    })

    // Fetch OS data
    const osResponse = await runReportWithFallback({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensions: [
        {
          name: "operatingSystem",
        },
      ],
      metrics: [
        {
          name: "activeUsers",
        },
      ],
      limit: 10,
    })

    // Fetch device category data
    const deviceResponse = await runReportWithFallback({
      property: `properties/${propertyId}`,
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "today",
        },
      ],
      dimensions: [
        {
          name: "deviceCategory",
        },
      ],
      metrics: [
        {
          name: "activeUsers",
        },
      ],
    })

    // Parse feature usage
    const featureUsage = reportRows(featureUsageResponse)
      ?.map((row) => ({
        name: getDimension(row, 0, "page").split("/").pop()?.slice(0, 20) || "page",
        value: getMetricNumber(row, 0),
      }))
      .filter((item) => item.value > 0)
      .slice(0, 5) || []

    // Parse daily users
    const dailyUsage = reportRows(dailyUsersResponse)?.map((row) => {
      const dateStr = getDimension(row, 0, "")
      if (!/^\d{8}$/.test(dateStr)) {
        return { day: "N/A", value: getMetricNumber(row, 0) }
      }
      const date = new Date(
        dateStr.slice(0, 4),
        parseInt(dateStr.slice(4, 6)) - 1,
        dateStr.slice(6, 8)
      )
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      return {
        day: days[date.getDay()],
        value: getMetricNumber(row, 0),
      }
    }) || []

    // Parse browser data
    const browserData = (
      reportRows(browserResponse)?.map((row) => ({
        name: getDimension(row, 0, "Other"),
        value: getMetricNumber(row, 0),
      })) || []
    ).slice(0, 4)

    // Parse OS data
    const osData = (
      reportRows(osResponse)?.map((row) => ({
        name: getDimension(row, 0, "Other"),
        value: getMetricNumber(row, 0),
      })) || []
    ).slice(0, 4)

    // Parse device data
    const deviceData = reportRows(deviceResponse)?.map((row) => ({
      name: (getDimension(row, 0, "Other").charAt(0).toUpperCase() +
        getDimension(row, 0, "Other").slice(1)) || "Other",
      value: getMetricNumber(row, 0),
    })) || []

    return Response.json({
      featureUsage,
      dailyUsage,
      browserData,
      osData,
      deviceData,
    })
  } catch (error) {
    console.error("GA4 Analytics error:", error)
    return Response.json(
      {
        error: error.message || "Failed to fetch analytics",
        featureUsage: [],
        dailyUsage: [],
        browserData: [],
        osData: [],
        deviceData: [],
      },
      { status: 200 }
    )
  }
}
