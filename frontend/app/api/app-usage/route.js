import { NextResponse as Response } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import clientPromise from "../../../lib/mongodb"

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { appName, duration = 0 } = body

    if (!appName) {
      return Response.json({ error: "App name required" }, { status: 400 })
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

    return Response.json({ success: true })
  } catch (error) {
    console.error("App usage logging error:", error)
    return Response.json(
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
      totalMinutes: Math.round(item.totalDuration / 60),
      accessCount: item.count,
    }))

    return Response.json({
      stats,
      totalApps: stats.length,
      period: "last 24 hours",
    })
  } catch (error) {
    console.error("App usage fetch error:", error)
    return Response.json({
      stats: [],
      totalApps: 0,
      period: "last 24 hours",
    })
  }
}
