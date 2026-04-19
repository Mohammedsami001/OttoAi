export const dynamic = 'force-dynamic';
import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "../../../../lib/mongodb";

function createNoCacheResponse(data, options = {}) {
  const response = Response.json(data, options)
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')
  return response
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
    });

    if (res.ok) {
      const data = await res.json();
      const newToken = data.access_token;
      const newExpiry = Math.floor(Date.now() / 1000) + (data.expires_in || 3600);

      // Update token in DB
      await db.collection("accounts").updateOne(
        { _id: account._id },
        { $set: { access_token: newToken, expires_at: newExpiry } }
      );
      return newToken;
    }
  } catch (e) {
    console.error("Token refresh failed:", e);
  }
  return null;
}

async function getValidToken(account, db) {
  // Check if token is expired or expiring within 5 minutes
  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && now >= account.expires_at - 300) {
    if (account.refresh_token) {
      const newToken = await refreshAccessToken(account, db);
      if (newToken) return newToken;
    }
  }
  return account.access_token;
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("personal-ops");

    const user = await db.collection("users").findOne({ email: session.user.email });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const installedApps = Array.isArray(user.installed_apps) ? user.installed_apps : null;
    const calendarEnabled = !installedApps || installedApps.includes("google-calendar");
    if (!calendarEnabled) {
      return Response.json({ error: "Google Calendar integration is disabled in Settings." }, { status: 403 });
    }

    const account = await db.collection("accounts").findOne({ userId: user._id, provider: "google" });

    if (!account || !account.access_token) {
      return Response.json({ events: [] });
    }

    // Get a valid (possibly refreshed) token
    const accessToken = await getValidToken(account, db);
    if (!accessToken) {
      return Response.json({ error: "Unable to refresh token. Please sign out and sign back in." }, { status: 401 });
    }

    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const gcalRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=25`,
      { headers: { "Authorization": `Bearer ${accessToken}` } }
    );

    if (!gcalRes.ok) {
      const errText = await gcalRes.text();
      console.error("Calendar API error:", errText);
      
      // If 401, try refreshing once more
      if (gcalRes.status === 401 && account.refresh_token) {
        const freshToken = await refreshAccessToken(account, db);
        if (freshToken) {
          const retryRes = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&maxResults=25`,
            { headers: { "Authorization": `Bearer ${freshToken}` } }
          );
          if (retryRes.ok) {
            const retryData = await retryRes.json();
            const events = retryData.items?.map(item => ({
              id: item.id,
              summary: item.summary,
              start: item.start?.dateTime || item.start?.date,
              end: item.end?.dateTime || item.end?.date,
              link: item.htmlLink,
              meet: item.hangoutLink || null,
              status: item.status || 'confirmed'
            })) || [];
            return Response.json({ events });
          }
        }
      }
      
      return Response.json({ error: "Failed to fetch calendar events. Try signing out and back in." }, { status: 500 });
    }

    const data = await gcalRes.json();
    const formattedEvents = data.items?.map(item => ({
      id: item.id,
      summary: item.summary,
      start: item.start?.dateTime || item.start?.date,
      end: item.end?.dateTime || item.end?.date,
      link: item.htmlLink,
      meet: item.hangoutLink || null,
      status: item.status || 'confirmed'
    })) || [];

    return Response.json({ events: formattedEvents });

  } catch (e) {
    console.error("Calendar route error:", e);
    return Response.json({ error: e.message }, { status: 500 });
  }
}
