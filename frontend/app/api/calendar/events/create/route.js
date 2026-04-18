import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";
import clientPromise from "../../../../../lib/mongodb";

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
      await db.collection("accounts").updateOne(
        { _id: account._id },
        { $set: { access_token: newToken, expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600) } }
      );
      return newToken;
    }
  } catch (e) {
    console.error("Token refresh failed:", e);
  }
  return null;
}

async function getValidToken(account, db) {
  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && now >= account.expires_at - 300) {
    if (account.refresh_token) {
      const newToken = await refreshAccessToken(account, db);
      if (newToken) return newToken;
    }
  }
  return account.access_token;
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("personal-ops");

    const user = await db.collection("users").findOne({ email: session.user.email });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const account = await db.collection("accounts").findOne({ userId: user._id, provider: "google" });
    if (!account || !account.access_token) {
      return Response.json({ error: "Google account not connected" }, { status: 400 });
    }

    const accessToken = await getValidToken(account, db);
    if (!accessToken) {
      return Response.json({ error: "Unable to refresh token. Please sign out and sign back in." }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, startDate, startTime, endTime, addMeet, attendees } = body;

    if (!title || !startDate || !startTime || !endTime) {
      return Response.json({ error: "Missing required fields" }, { status: 400 });
    }

    const startDateTime = `${startDate}T${startTime}:00`;
    const endDateTime = `${startDate}T${endTime}:00`;
    const timeZone = body.timeZone || "Asia/Kolkata";

    const event = {
      summary: title,
      description: description || "",
      start: { dateTime: startDateTime, timeZone },
      end: { dateTime: endDateTime, timeZone },
    };

    if (addMeet) {
      event.conferenceData = {
        createRequest: {
          requestId: `ottoai-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" }
        }
      };
    }

    if (attendees && attendees.length > 0) {
      event.attendees = attendees
        .split(",")
        .map(e => e.trim())
        .filter(e => e.includes("@"))
        .map(email => ({ email }));
    }

    const calUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events${addMeet ? '?conferenceDataVersion=1' : ''}`;

    let gcalRes = await fetch(calUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(event),
    });

    // Retry with refreshed token on 401
    if (gcalRes.status === 401 && account.refresh_token) {
      const freshToken = await refreshAccessToken(account, db);
      if (freshToken) {
        gcalRes = await fetch(calUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${freshToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        });
      }
    }

    if (!gcalRes.ok) {
      const errBody = await gcalRes.text();
      return Response.json({ error: `Google Calendar API error: ${errBody}` }, { status: gcalRes.status });
    }

    const created = await gcalRes.json();

    return Response.json({
      success: true,
      event: {
        id: created.id,
        summary: created.summary,
        start: created.start?.dateTime,
        end: created.end?.dateTime,
        link: created.htmlLink,
        meet: created.hangoutLink || null,
      }
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
