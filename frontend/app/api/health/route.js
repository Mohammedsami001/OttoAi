import { NextResponse as Response } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]/route"
import clientPromise from "../../../lib/mongodb"

function parseGoogleApiError(errorText) {
  try {
    const parsed = JSON.parse(errorText)
    const message = parsed?.error?.message || ""
    const reasons = (parsed?.error?.errors || []).map((err) => String(err?.reason || ""))
    return { message, reasons }
  } catch {
    return { message: errorText || "", reasons: [] }
  }
}

async function getTokenInfo(accessToken) {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    )
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function refreshAccessToken(account, db) {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: account.refresh_token,
        grant_type: "refresh_token",
      }),
    })

    if (res.ok) {
      const data = await res.json()
      const newToken = data.access_token
      const newExpiry = Math.floor(Date.now() / 1000) + (data.expires_in || 3600)

      await db.collection("accounts").updateOne(
        { _id: account._id },
        { $set: { access_token: newToken, expires_at: newExpiry } }
      )

      return newToken
    }
  } catch (error) {
    console.error("Google Fit token refresh failed:", error)
  }

  return null
}

async function getValidToken(account, db) {
  const now = Math.floor(Date.now() / 1000)
  if (account.expires_at && now >= account.expires_at - 300 && account.refresh_token) {
    const freshToken = await refreshAccessToken(account, db)
    if (freshToken) return freshToken
  }

  return account.access_token || null
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return Response.json({ error: "Unauthorized" }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db("personal-ops")

    const user = await db.collection("users").findOne({ email: session.user.email })
    if (!user?._id) {
      return Response.json({
        connected: false,
        error: "Google account not found for current user",
      })
    }

    const account = await db.collection("accounts").findOne({
      userId: user._id,
      provider: "google",
    })

    if (!account?.access_token) {
      return Response.json({
        connected: false,
        error: "Google Fit not connected",
      })
    }

    const accessToken = await getValidToken(account, db)
    if (!accessToken) {
      return Response.json({
        connected: false,
        error: "Google Fit not connected",
      })
    }

    const tokenInfo = await getTokenInfo(accessToken)
    const expectedClientId = process.env.GOOGLE_CLIENT_ID || ""
    const tokenAudience = String(tokenInfo?.aud || "")
    if (expectedClientId && tokenAudience && tokenAudience !== expectedClientId) {
      return Response.json(
        {
          connected: false,
          needsReauth: true,
          error: "Google token was issued for a different OAuth client. Reconnect using the same Google Cloud project client configured in this app.",
        },
        { status: 200 }
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
      const fitError = await fitnessResponse.text()
      if (fitnessResponse.status === 401) {
        return Response.json(
          { connected: false, error: "Google Fit access expired. Please reconnect.", needsReauth: true },
          { status: 200 }
        )
      }

      if (fitnessResponse.status === 403) {
        const parsedError = parseGoogleApiError(fitError)
        const combined = `${parsedError.message} ${parsedError.reasons.join(" ")} ${fitError}`.toLowerCase()
        const missingScope =
          combined.includes("insufficientpermissions") ||
          combined.includes("insufficient authentication scopes") ||
          combined.includes("scope")
        const apiDisabled =
          combined.includes("accessnotconfigured") ||
          combined.includes("has not been used in project") ||
          combined.includes("api has not been used") ||
          combined.includes("is disabled")

        if (apiDisabled) {
          return Response.json(
            {
              connected: false,
              needsReauth: false,
              error: "Google Fitness API is disabled for this Google Cloud project. Enable Google Fitness API in the same project as your OAuth client.",
            },
            { status: 200 }
          )
        }

        return Response.json(
          {
            connected: false,
            needsReauth: missingScope,
            error: missingScope
              ? "Missing Google Fit permission. Reconnect Google Fit to grant fitness scope."
              : parsedError.message || "Google Fit API permission denied. Verify Google Fitness API is enabled and OAuth app scopes are approved.",
          },
          { status: 200 }
        )
      }

      return Response.json(
        { connected: false, error: `Failed to fetch Google Fit data (${fitnessResponse.status})` },
        { status: 200 }
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
      connected: true,
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
