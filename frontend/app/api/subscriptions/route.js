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

    const subs = await db.collection("subscriptions").find({ user_email: session.user.email }).toArray();
    return Response.json({ subscriptions: subs });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const client = await clientPromise;
    const db = client.db("personal-ops");

    const sub = {
        user_email: session.user.email,
        name: data.name,
        amount: parseFloat(data.amount),
        start_date: data.start_date,
        billing_cycle: data.billing_cycle,
        next_billing_date: data.next_billing_date,
        notifications_enabled: true
    };

    await db.collection("subscriptions").insertOne(sub);
    return Response.json({ success: true, subscription: sub });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    const client = await clientPromise;
    const db = client.db("personal-ops");

    await db.collection("subscriptions").deleteOne({
      user_email: session.user.email,
      name: data.name
    });

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
