import { NextResponse as Response } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const accessToken = session.accessToken
    if (!accessToken) {
      return Response.json(
        { error: "No Google access token available. Reconnect Google account." },
        { status: 401 }
      )
    }

    // Fetch steps data from Google Fit API
    // Google Fit API: https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const requestBody = {
      aggregateBy: [
        {
          dataTypeName: "com.google.step_count.delta",
          dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
        },
      ],
      bucketByTime: { durationMillis: 86400000 }, // 1 day
      startTimeMillis: Math.floor(sevenDaysAgo.getTime()),
      endTimeMillis: Math.floor(now.getTime()),
    }

    const fitnessResponse = await fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      }
    )

    if (!fitnessResponse.ok) {
      if (fitnessResponse.status === 401) {
        return Response.json(
          { error: "Google Fit access expired. Please reconnect." },
          { status: 401 }
        )
      }
      return Response.json(
        { error: "Failed to fetch Google Fit data" },
        { status: 500 }
      )
    }

    const fitData = await fitnessResponse.json()

    // Parse the steps data
    const dailySteps = (fitData.bucket || []).map((bucket) => {
      const dateMillis = parseInt(bucket.startTimeMillis)
      const date = new Date(dateMillis)
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
      const steps =
        bucket.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0

      return {
        day: days[date.getDay()],
        date: date.toISOString().split("T")[0],
        steps,
      }
    })

    // Calculate stats
    const totalSteps = dailySteps.reduce((sum, day) => sum + day.steps, 0)
    const avgSteps = Math.round(totalSteps / (dailySteps.length || 1))
    const maxSteps = Math.max(...dailySteps.map((d) => d.steps), 0)
    const today_steps = dailySteps[dailySteps.length - 1]?.steps || 0

    return Response.json({
      dailySteps,
      stats: {
        totalSteps,
        avgSteps,
        maxSteps,
        todaySteps: today_steps,
        daysTracked: dailySteps.length,
      },
    })
  } catch (error) {
    console.error("Google Health error:", error)
    return Response.json(
      { error: error.message || "Failed to fetch health data" },
      { status: 500 }
    )
  }
}
