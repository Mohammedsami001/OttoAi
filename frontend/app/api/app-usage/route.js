export const dynamic = 'force-dynamic';

import { NextResponse as Response } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import clientPromise from "../../../lib/mongodb"

function createNoCacheResponse(data, options = {}) {
  const response = Response.json(data, options)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return createNoCacheResponse({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { appName, duration = 0 } = body

    if (!appName) {
      return createNoCacheResponse({ error: "App name required" }, { status: 400 })
    }

    // Log app usage to MongoDB
    const client = await clientPromise
    const db = client.db("personal-ops")
    
    await db.collection("app_usage").insertOne({
      userEmail: session.user.email,
      appName,
      duration, // in seconds
      timestamp: new Date(),
    })

    return createNoCacheResponse({ success: true })
  } catch (error) {
    console.error("App usage logging error:", error)
    return createNoCacheResponse(
      { error: error.message || "Failed to log app usage" },
      { status: 500 }
    )
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("personal-ops")

    // Get app usage for the last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const appUsage = await db.collection("app_usage").aggregate([
      {
        $match: {
          userEmail: session.user.email,
          timestamp: { $gte: yesterday },
        },
      },
      {
        $group: {
          _id: "$appName",
          totalDuration: { $sum: "$duration" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { totalDuration: -1 },
      },
    ]).toArray()

    // Convert to more readable format
    const stats = appUsage.map((item) => ({
      app: item._id,
      totalMinutes: item.totalDuration > 0 ? Math.max(1, Math.ceil(item.totalDuration / 60)) : 0,
      accessCount: item.count,
    })).filter((item) => String(item.app || "").toLowerCase() !== "settings")

    return createNoCacheResponse({
      stats,
      totalApps: stats.length,
      period: "last 24 hours",
    })
  } catch (error) {
    console.error("App usage fetch error:", error)
    return createNoCacheResponse({
      stats: [],
      totalApps: 0,
      period: "last 24 hours",
    })
  }
}
