export const dynamic = 'force-dynamic';

import NextAuthRaw from "next-auth/next"
import GoogleProviderRaw from "next-auth/providers/google"
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "../../../../lib/mongodb"

const NextAuth = NextAuthRaw.default || NextAuthRaw;
const GoogleProvider = GoogleProviderRaw.default || GoogleProviderRaw;

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "MOCK_CLIENT_SECRET",
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive.readonly"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account }) {
      // Persist tokens into the accounts collection so the Python agent can read them
      if (account) {
        const client = await clientPromise;
        const db = client.db("personal-ops");
        // Match by provider + providerAccountId (always strings, avoids ObjectId mismatch)
        await db.collection("accounts").updateOne(
          { provider: account.provider, providerAccountId: account.providerAccountId },
          {
            $set: {
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            }
          }
        );
      }
      return true;
    },
    async session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
      }
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback_secret_for_local_dev",
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
