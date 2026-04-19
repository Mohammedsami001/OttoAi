export const dynamic = 'force-dynamic';
import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import clientPromise from "../../../lib/mongodb";

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
      await db.collection("accounts").updateOne(
        { _id: account._id },
        { $set: { access_token: data.access_token, expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600) } }
      );
      return data.access_token;
    }
  } catch (e) { console.error("Token refresh failed:", e); }
  return null;
}

function categorizeEmail(from, subject) {
  const f = (from || '').toLowerCase();
  const s = (subject || '').toLowerCase();
  if (f.includes('github') || s.includes('pull request') || s.includes('commit')) return 'Dev Tools';
  if (f.includes('google') || f.includes('security') || s.includes('security') || s.includes('sign-in') || s.includes('password')) return 'Security';
  if (f.includes('openai') || f.includes('anthropic') || s.includes('ai') || s.includes('gpt')) return 'AI';
  if (f.includes('discord') || f.includes('slack') || f.includes('teams')) return 'Social';
  if (f.includes('spotify') || f.includes('netflix') || f.includes('youtube')) return 'Entertainment';
  if (s.includes('invoice') || s.includes('payment') || s.includes('receipt') || s.includes('subscription')) return 'Finance';
  if (s.includes('newsletter') || s.includes('digest') || s.includes('weekly')) return 'Newsletters';
  return 'Other';
}

async function summarizeWithMistral(emails) {
  const cleanAiSummary = (text) => {
    if (!text) return null;

    return text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/^\s{0,3}#{1,6}\s*/gm, "")
      .replace(/^\s*[-*_]{3,}\s*$/gm, "")
      .replace(/^\s*>\s?/gm, "")
      .replace(/`/g, "")
      .replace(/^\s*[-*]\s+/gm, "- ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  };

  const mistralApiKey = process.env.MISTRAL_API_KEY || process.env.GEMINI_API_KEY;
  console.log("[Mistral] API key present:", !!mistralApiKey, "| Emails count:", emails.length);
  if (!mistralApiKey) return "⚠️ MISTRAL_API_KEY is not configured.";
  if (emails.length === 0) return null;

  const emailList = emails.slice(0, 15).map((e, i) => 
    `${i + 1}. From: ${e.from}\n   Subject: ${e.subject}\n   Snippet: ${e.snippet}`
  ).join('\n\n');

  try {
    const prompt = `You are a smart email assistant. Analyze these ${emails.length} emails and produce a clean, structured briefing in plain text.

Rules:
  - Group emails by category: Security, Offers & Promotions, Developer, AI, Other
  - For each category, list key emails with sender name and one-line summary
  - End with a Quick Actions section if any emails need attention
  - Be concise. Max 15 lines total. No filler
  - Output must be plain text only
  - Do not use markdown symbols like #, ##, ###, **, __, or ---

Emails:
${emailList}`;

    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${mistralApiKey}`,
      },
      body: JSON.stringify({
        model: process.env.MISTRAL_MODEL || "mistral-small-latest",
        messages: [
          { role: "system", content: "You are a concise and structured email assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500,
      })
    });

    if (res.ok) {
      const data = await res.json();
      return cleanAiSummary(data.choices?.[0]?.message?.content?.trim()) || null;
    } else {
      console.error("Mistral failed Details:", await res.text());
      return "⚠️ Expected AI summary but the AI engine hit a rate limit or error (Quota exhausted). Please try again later.";
    }
  } catch (e) { 
    console.error("Mistral summary failed:", e); 
    return "⚠️ Failed to connect to AI engine.";
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("personal-ops");
    const user = await db.collection("users").findOne({ email: session.user.email });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const installedApps = Array.isArray(user.installed_apps) ? user.installed_apps : null;
    const gmailEnabled = !installedApps || installedApps.includes("gmail");
    if (!gmailEnabled) {
      return Response.json({ error: "Gmail integration is disabled in Settings." }, { status: 403 });
    }

    const account = await db.collection("accounts").findOne({ userId: user._id, provider: "google" });
    if (!account || !account.access_token) {
      return Response.json({ error: "Google account not connected" }, { status: 400 });
    }

    // Get fresh token
    let accessToken = account.access_token;
    if (account.refresh_token) {
      const fresh = await refreshAccessToken(account, db);
      if (fresh) accessToken = fresh;
    }

    // Fetch recent emails from Gmail API
    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?" + new URLSearchParams({
        maxResults: "15",
        q: "in:inbox"
      }),
      { headers: { "Authorization": `Bearer ${accessToken}` } }
    );

    if (!listRes.ok) {
      const err = await listRes.text();
      if (err.includes("insufficientPermissions")) {
        return Response.json({ error: "Missing Gmail permission. Please sign out and sign back in.", needsReauth: true }, { status: 403 });
      }
      return Response.json({ error: "Gmail API error" }, { status: listRes.status });
    }

    const listData = await listRes.json();
    const messageIds = (listData.messages || []).map(m => m.id);

    if (messageIds.length === 0) {
      return Response.json({ summary: { emails: [], ai_summary: "Your inbox is empty!", categories: {} } });
    }

    // Fetch each email's details
    const emails = [];
    for (const id of messageIds) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { "Authorization": `Bearer ${accessToken}` } }
      );
      if (msgRes.ok) {
        const msg = await msgRes.json();
        const headers = msg.payload?.headers || [];
        const from = headers.find(h => h.name === 'From')?.value || '';
        const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
        const date = headers.find(h => h.name === 'Date')?.value || '';
        const category = categorizeEmail(from, subject);
        
        emails.push({
          id: msg.id,
          from,
          subject,
          snippet: msg.snippet || '',
          date,
          category,
          is_read: !msg.labelIds?.includes('UNREAD')
        });
      }
    }

    // Count categories
    const categories = {};
    emails.forEach(e => {
      categories[e.category] = (categories[e.category] || 0) + 1;
    });

    // Generate AI summary
    const ai_summary = await summarizeWithMistral(emails);

    return Response.json({
      summary: {
        emails,
        ai_summary: ai_summary || `You have ${emails.length} emails in your inbox.`,
        categories,
        last_synced: new Date().toISOString()
      }
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
