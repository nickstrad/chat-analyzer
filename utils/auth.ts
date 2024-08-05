import { getServerSession, type NextAuthOptions } from "next-auth";
import TwitchProvider from "next-auth/providers/twitch";

const provider = TwitchProvider({
  clientId: process.env.TWITCH_CLIENT_ID!,
  clientSecret: process.env.TWITCH_CLIENT_SECRET!,
  authorization: {
    params: { scope: "openid user:read:email chat:read" },
  },
});

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET!,
  providers: [provider],
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
        session.refreshToken = token.other.refresh_token;
        session.other = token.other;
      }

      return session;
    },
    async jwt({ token, user, account, profile, isNewUser }) {
      if (user) {
        token.id = user.id;
      }
      if (account) {
        const { access_token, ...rest } = account;
        token.accessToken = access_token;
        token.other = rest;
      }
      return token;
    },
  },
};

const CHECK_API_SESSION = /true/i.test(process.env.CHECK_API_SESSION ?? "");

export const validateUserAgainstSession = async (username: string) => {
  if (CHECK_API_SESSION) {
    const session = await getServerSession(authOptions);

    if (!session) {
      return Response.json({ error: "Not signed in" }, { status: 401 });
    }
    return username === session?.user?.name;
  }
  return true;
};
