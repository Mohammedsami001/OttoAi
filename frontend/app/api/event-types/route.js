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
    const user = await db.collection("users").findOne({ email: session.user.email });
    
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    return Response.json({ eventTypes: user.event_types || [] });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const client = await clientPromise;
    const db = client.db("personal-ops");
    const body = await req.json();
    const { action, eventType, index } = body;

    const user = await db.collection("users").findOne({ email: session.user.email });
    if (!user) return Response.json({ error: "User not found" }, { status: 404 });

    let eventTypes = user.event_types || [];

    if (action === "add") {
      eventTypes.push({
        ...eventType,
        slug: eventType.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        active: true,
        createdAt: new Date().toISOString()
      });
    } else if (action === "update" && typeof index === "number") {
      eventTypes[index] = { ...eventTypes[index], ...eventType };
    } else if (action === "delete" && typeof index === "number") {
      eventTypes.splice(index, 1);
    } else if (action === "toggle" && typeof index === "number") {
      eventTypes[index].active = !eventTypes[index].active;
    }

    await db.collection("users").updateOne(
      { email: session.user.email },
      { $set: { event_types: eventTypes } }
    );

    return Response.json({ success: true, eventTypes });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
