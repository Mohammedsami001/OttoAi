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
      await db.collection("accounts").updateOne(
        { _id: account._id },
        { $set: { access_token: data.access_token, expires_at: Math.floor(Date.now() / 1000) + (data.expires_in || 3600) } }
      );
      return data.access_token;
    }
  } catch (e) { console.error("Token refresh failed:", e); }
  return null;
}

async function getValidToken(account, db) {
  const now = Math.floor(Date.now() / 1000);
  if (account.expires_at && now >= account.expires_at - 300 && account.refresh_token) {
    return await refreshAccessToken(account, db) || account.access_token;
  }
  return account.access_token;
}

function extractText(doc) {
  const body = doc?.body?.content || [];
  let text = '';
  for (const elem of body) {
    if (elem.paragraph) {
      for (const el of elem.paragraph.elements || []) {
        if (el.textRun?.content) text += el.textRun.content;
      }
    }
    if (elem.table) {
      for (const row of elem.table.tableRows || []) {
        for (const cell of row.tableCells || []) {
          for (const cellContent of cell.content || []) {
            if (cellContent.paragraph) {
              for (const el of cellContent.paragraph.elements || []) {
                if (el.textRun?.content) text += el.textRun.content;
              }
            }
          }
          text += '\t';
        }
        text += '\n';
      }
    }
  }
  return text.trim();
}

async function summarizeWithGemini(title, text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return "AI summary unavailable (no API key configured).";

  const truncated = text.slice(0, 4000);
  if (!truncated || truncated.length < 20) return "Document is empty or too short to summarize.";

  const prompt = `You are a document summarizer. Summarize this Google Doc concisely in 2-3 sentences. Focus on the key points, decisions, or information in the document.\n\nDocument Title: "${title}"\n\nDocument Content:\n${truncated}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await new Promise(r => setTimeout(r, 3000)); // wait 3s before retry

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 200, temperature: 0.3 }
          })
        }
      );

      if (res.status === 429) {
        if (attempt === 0) continue; // retry once
        return "⏳ Rate limited — try again in a minute.";
      }
      if (!res.ok) return "Summary generation failed (API error).";

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "No summary generated.";
    } catch (e) {
      if (attempt === 0) continue;
      return "Summary generation failed.";
    }
  }
  return "Summary generation failed.";
}

export async function GET(req, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { docId } = await params;
    if (!docId) return Response.json({ error: "Missing doc ID" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db("personal-ops");
    const user = await db.collection("users").findOne({ email: session.user.email });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    const account = await db.collection("accounts").findOne({ userId: user._id, provider: "google" });
    if (!account) return Response.json({ error: "Google account not connected" }, { status: 400 });

    let accessToken = await getValidToken(account, db);

    // Fetch doc content from Google Docs API
    let docRes = await fetch(
      `https://docs.googleapis.com/v1/documents/${docId}`,
      { headers: { "Authorization": `Bearer ${accessToken}` } }
    );

    if ((docRes.status === 401 || docRes.status === 403) && account.refresh_token) {
      const freshToken = await refreshAccessToken(account, db);
      if (freshToken) {
        docRes = await fetch(
          `https://docs.googleapis.com/v1/documents/${docId}`,
          { headers: { "Authorization": `Bearer ${freshToken}` } }
        );
      }
    }

    if (!docRes.ok) {
      return Response.json({ error: "Failed to read document" }, { status: docRes.status });
    }

    const docData = await docRes.json();
    const text = extractText(docData);
    const title = docData.title || "Untitled";

    // Generate AI summary
    const summary = await summarizeWithGemini(title, text);

    return Response.json({
      id: docId,
      title,
      summary,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      preview: text.slice(0, 300)
    });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
