import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET!,
  providers: [
    TwitchProvider({
      clientId: process.env.TWITCH_USER_CLIENT_ID!,
      clientSecret: process.env.TWITCH_USER_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({
      session,
      token,
      user,
    }: {
      session: any;
      token: any;
      user: any;
    }) {
      if (token.id) {
        if (!session.user) {
          session.user = {};
        }
        session.user.id = token.id;
      }

      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }

      return session;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
