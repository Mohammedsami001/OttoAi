import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import clientPromise from "../../../lib/mongodb";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("personal-ops");

    const summary = await db.collection("gmail_summaries").findOne({ user_email: session.user.email });
    return Response.json({ summary: summary || null });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
