import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "../../../../lib/mongodb";

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

export async function GET(req) {
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

    // Always get a fresh token
    let accessToken = account.access_token;
    if (account.refresh_token) {
      const freshToken = await refreshAccessToken(account, db);
      if (freshToken) accessToken = freshToken;
    }

    // Try listing Google Docs via Drive API
    const queryParams = new URLSearchParams({
      q: "mimeType='application/vnd.google-apps.document'",
      orderBy: "modifiedTime desc",
      pageSize: "20",
      fields: "files(id,name,modifiedTime,webViewLink,owners,shared,createdTime)",
      spaces: "drive",
      includeItemsFromAllDrives: "false",
      supportsAllDrives: "false"
    });

    let driveRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?" + queryParams,
      { headers: { "Authorization": `Bearer ${accessToken}` } }
    );

    if (!driveRes.ok) {
      const err = await driveRes.text();
      if (err.includes("insufficientPermissions") || err.includes("ACCESS_TOKEN_SCOPE_INSUFFICIENT")) {
        return Response.json({ 
          error: "Missing Google Drive permission. Please sign out and sign back in to grant access.",
          needsReauth: true
        }, { status: 403 });
      }
      if (err.includes("accessNotConfigured") || err.includes("SERVICE_DISABLED")) {
        return Response.json({
          error: "Google Drive API is not enabled. Please enable it at console.cloud.google.com",
          needsApiEnable: true
        }, { status: 403 });
      }
      return Response.json({ error: `Drive API error: ${err.slice(0, 200)}` }, { status: driveRes.status });
    }

    const driveData = await driveRes.json();
    let files = driveData.files || [];

    // If no docs found, try a broader query (all files, then filter)
    if (files.length === 0) {
      const fallbackRes = await fetch(
        "https://www.googleapis.com/drive/v3/files?" + new URLSearchParams({
          orderBy: "modifiedTime desc",
          pageSize: "30",
          fields: "files(id,name,mimeType,modifiedTime,webViewLink,owners,shared,createdTime)",
          spaces: "drive"
        }),
        { headers: { "Authorization": `Bearer ${accessToken}` } }
      );
      if (fallbackRes.ok) {
        const fallbackData = await fallbackRes.json();
        files = (fallbackData.files || []).filter(f => 
          f.mimeType === 'application/vnd.google-apps.document'
        );
      }
    }

    const docs = files.map(f => ({
      id: f.id,
      title: f.name,
      modified: f.modifiedTime,
      created: f.createdTime,
      link: f.webViewLink || `https://docs.google.com/document/d/${f.id}`,
      shared: f.shared || false,
      owner: f.owners?.[0]?.displayName || ""
    }));

    return Response.json({ docs });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
