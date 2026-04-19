import { NextResponse as Response } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import { BetaAnalyticsDataClient } from "@google-analytics/data"

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
        { status: 500 }
      )
    }

    // Parse the service account key from environment variable
    const serviceAccount = parseServiceAccountKey(serviceAccountKey)
    if (!serviceAccount?.client_email || !serviceAccount?.private_key) {
      return Response.json(
        { error: "Invalid GA4_SERVICE_ACCOUNT_KEY format" },
        { status: 500 }
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

    // Fetch feature usage (last 30 days)
    const featureUsageResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      ...userFilter,
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
    const dailyUsersResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      ...userFilter,
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
    const browserResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      ...userFilter,
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
    const osResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      ...userFilter,
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
    const deviceResponse = await analyticsDataClient.runReport({
      property: `properties/${propertyId}`,
      ...userFilter,
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
    const featureUsage = featureUsageResponse[0].rows
      ?.map((row) => ({
        name: row.dimensions[0]?.split("/").pop()?.slice(0, 20) || "page",
        value: parseInt(row.metrics[0].values[0]) || 0,
      }))
      .filter((item) => item.value > 0)
      .slice(0, 5) || []

    // Parse daily users
    const dailyUsage = dailyUsersResponse[0].rows?.map((row) => {
      const dateStr = row.dimensions[0]
      const date = new Date(
        dateStr.slice(0, 4),
        parseInt(dateStr.slice(4, 6)) - 1,
        dateStr.slice(6, 8)
      )
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      return {
        day: days[date.getDay()],
        value: parseInt(row.metrics[0].values[0]) || 0,
      }
    }) || []

    // Parse browser data
    const browserData = (
      browserResponse[0].rows?.map((row) => ({
        name: row.dimensions[0] || "Other",
        value: parseInt(row.metrics[0].values[0]) || 0,
      })) || []
    ).slice(0, 4)

    // Parse OS data
    const osData = (
      osResponse[0].rows?.map((row) => ({
        name: row.dimensions[0] || "Other",
        value: parseInt(row.metrics[0].values[0]) || 0,
      })) || []
    ).slice(0, 4)

    // Parse device data
    const deviceData = deviceResponse[0].rows?.map((row) => ({
      name: row.dimensions[0]?.charAt(0).toUpperCase() +
        row.dimensions[0]?.slice(1) || "Other",
      value: parseInt(row.metrics[0].values[0]) || 0,
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
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
