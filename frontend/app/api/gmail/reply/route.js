import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "../../../../lib/mongodb";

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

    const body = await req.json();
    const { action } = body;

    // === AI REPLY GENERATION ===
    if (action === "generate") {
      const { subject, snippet, senderName } = body;
      const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
      
      if (!GEMINI_API_KEY) {
        // Fallback: generate a template reply without AI
        const reply = `Hi ${senderName?.split(' ')[0] || 'there'},\n\nThank you for your email regarding "${subject}".\n\nI've reviewed your message and will get back to you shortly with more details.\n\nBest regards,\n${session.user.name || 'User'}`;
        return Response.json({ reply, aiGenerated: false });
      }

      try {
        const prompt = `You are a professional email assistant. Generate a concise, polite reply to this email.

From: ${senderName}
Subject: ${subject}
Content: ${snippet}

Write a reply from "${session.user.name || 'User'}". Keep it brief (2-4 sentences), professional, and directly relevant. Do not include the subject line or "Re:" prefix. Just write the email body.`;

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 300 }
            })
          }
        );

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const aiReply = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (aiReply) {
            return Response.json({ reply: aiReply.trim(), aiGenerated: true });
          }
        }
        
        // Fallback if Gemini fails
        const reply = `Hi ${senderName?.split(' ')[0] || 'there'},\n\nThank you for your email regarding "${subject}". I'll review this and get back to you shortly.\n\nBest,\n${session.user.name || 'User'}`;
        return Response.json({ reply, aiGenerated: false });
      } catch (e) {
        const reply = `Hi ${senderName?.split(' ')[0] || 'there'},\n\nThank you for your message. I'll get back to you soon.\n\nBest,\n${session.user.name || 'User'}`;
        return Response.json({ reply, aiGenerated: false });
      }
    }

    // === SEND REPLY ===
    if (action === "send") {
      const { to, subject, body: replyBody, messageId, threadId } = body;

      if (!to || !replyBody) {
        return Response.json({ error: "Missing 'to' and 'body'" }, { status: 400 });
      }

      // Build raw RFC 2822 email
      const emailLines = [
        `To: ${to}`,
        `Subject: Re: ${subject}`,
        `Content-Type: text/plain; charset=utf-8`,
        `In-Reply-To: ${messageId || ''}`,
        `References: ${messageId || ''}`,
        '',
        replyBody
      ];
      const rawEmail = emailLines.join('\r\n');
      const encodedEmail = Buffer.from(rawEmail).toString('base64url');

      const sendUrl = threadId
        ? `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`
        : `https://gmail.googleapis.com/gmail/v1/users/me/messages/send`;

      const sendPayload = { raw: encodedEmail };
      if (threadId) sendPayload.threadId = threadId;

      const sendRes = await fetch(sendUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${account.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(sendPayload)
      });

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        return Response.json({ error: `Gmail Send error: ${errText}` }, { status: sendRes.status });
      }

      const sentData = await sendRes.json();
      return Response.json({ success: true, messageId: sentData.id });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
