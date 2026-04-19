export const dynamic = 'force-dynamic';

import NextAuthRaw from "next-auth/next"
import GoogleProviderRaw from "next-auth/providers/google"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "../../../../lib/mongodb"

const NextAuth = NextAuthRaw.default || NextAuthRaw;
const GoogleProvider = GoogleProviderRaw.default || GoogleProviderRaw;

async function fetchGoogleGrantedScope(accessToken) {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    )

    if (res.ok) {
      const data = await res.json()
      return data.scope || null
    }
  } catch (error) {
    console.error("Failed to read Google token scope:", error)
  }

  return null
}

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signOut: "/",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "MOCK_CLIENT_SECRET",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/fitness.activity.read"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user?.id) {
        token.id = user.id;
      }
      if (user?.email) {
        token.email = user.email;
      }
      if (user?.name) {
        token.name = user.name;
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async signIn({ user, account }) {
      // Persist tokens into the accounts collection so the Python agent can read them
      if (account) {
        const client = await clientPromise;
        const db = client.db("personal-ops");
        const grantedScope = account.access_token
          ? await fetchGoogleGrantedScope(account.access_token)
          : null;
        // Match by provider + providerAccountId (always strings, avoids ObjectId mismatch)
        await db.collection("accounts").updateOne(
          { provider: account.provider, providerAccountId: account.providerAccountId },
          {
            $set: {
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: grantedScope || account.scope || "",
              id_token: account.id_token,
            }
          }
        );
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user && token?.id) {
        session.user.id = token.id;
      }
      if (session?.user && token?.email) {
        session.user.email = token.email;
      }
      if (session?.user && token?.name) {
        session.user.name = token.name;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_dev",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
