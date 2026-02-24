import { NextAuthOptions, Session, User } from "next-auth";
import { JWT } from "next-auth/jwt";
import { Account } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "gakunin",
      name: "GakuNin RDM",
      type: "oauth",
      clientId: process.env.GAKUNIN_CLIENT_ID,
      clientSecret: process.env.GAKUNIN_CLIENT_SECRET,
      authorization: {
        url: "https://accounts.rdm.nii.ac.jp/oauth2/authorize",
        params: {
          client_id: process.env.GAKUNIN_CLIENT_ID,
          scope: "osf.full_read osf.full_write",
          response_type: "code",
          redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/gakunin`,
        },
      },
      token: {
        url: "https://accounts.rdm.nii.ac.jp/oauth2/token",
        async request(context: { params: { code?: string } }) {
          const body = new URLSearchParams({
            client_id: process.env.GAKUNIN_CLIENT_ID!,
            client_secret: process.env.GAKUNIN_CLIENT_SECRET!,
            code: context.params.code as string,
            grant_type: "authorization_code",
            redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/gakunin`,
          });

          const res = await fetch(
            "https://accounts.rdm.nii.ac.jp/oauth2/token",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body,
            }
          );

          const json = await res.json();
          if (!res.ok) {
            throw new Error(`Token request failed: ${res.statusText}`);
          }

          return { tokens: json };
        },
      },
      userinfo: "https://api.rdm.nii.ac.jp/v2/users/me/",
      profile(profile: {
        data?: {
          id?: string;
          attributes?: { full_name?: string; email?: string };
        };
      }) {
        if (!profile.data || !profile.data.attributes) {
          throw new Error("Invalid user profile structure");
        }
        return {
          id: profile.data.id || "unknown",
          name: profile.data.attributes.full_name || "No Name",
          email: profile.data.attributes.email || "No Email",
        };
      },
    },
  ],
  callbacks: {
    async session({
      session,
      token,
    }: {
      session: Session;
      token: JWT;
    }) {
      session.accessToken = token.accessToken as string;
      session.user = {
        ...session.user,
        id: token.id as string,
      };
      if (token.exp) {
        const expiryTime = (token.exp as number) * 1000;
        session.expires = new Date(expiryTime).toISOString();
        if (Date.now() >= expiryTime) {
          session.error = "TokenExpiredError";
        }
      }
      return session;
    },
    async jwt({
      token,
      account,
      user,
    }: {
      token: JWT;
      account: Account | null;
      user: User;
    }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      if (user) {
        token.id = user.id;
      }
      if (token.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        if (currentTime >= (token.exp as number)) {
          token.error = "TokenExpiredError";
        }
      }
      return token;
    },
  },
};
