import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../auth/[...nextauth]/route";
import clientPromise from "../../../../../../lib/mongodb";

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
      return await refreshAccessToken(account, db) || account.access_token;
    }
  }
  return account.access_token;
}

export async function DELETE(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { eventId } = await params;
    if (!eventId) return Response.json({ error: "Missing event ID" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("personal-ops");

    const user = await db.collection("users").findOne({ email: session.user.email });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const account = await db.collection("accounts").findOne({ userId: user._id, provider: "google" });
    if (!account || !account.access_token) {
      return Response.json({ error: "Google account not connected" }, { status: 400 });
    }

    const accessToken = await getValidToken(account, db);

    const gcalRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${accessToken}` }
      }
    );

    // 204 = success, 410 = already deleted
    if (gcalRes.status === 204 || gcalRes.status === 410) {
      return Response.json({ success: true });
    }

    // Retry with refreshed token on 401
    if (gcalRes.status === 401 && account.refresh_token) {
      const freshToken = await refreshAccessToken(account, db);
      if (freshToken) {
        const retryRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${freshToken}` }
          }
        );
        if (retryRes.status === 204 || retryRes.status === 410) {
          return Response.json({ success: true });
        }
      }
    }

    const errText = await gcalRes.text();
    return Response.json({ error: `Failed to delete: ${errText}` }, { status: gcalRes.status });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
