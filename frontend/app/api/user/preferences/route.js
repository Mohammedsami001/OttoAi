import { NextResponse as Response } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";
import clientPromise from "../../../../lib/mongodb";

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const client = await clientPromise;
    const db = client.db("personal-ops");

    // NextAuth saves users via their email. We inject preferences into the user doc.
    await db.collection("users").updateOne(
      { email: session.user.email },
      { $set: data }
    );

    return Response.json({ success: true });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("personal-ops");

    const user = await db.collection("users").findOne(
      { email: session.user.email }
    );

    return Response.json({ user });
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
