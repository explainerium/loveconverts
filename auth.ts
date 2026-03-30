import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";
import bcrypt from "bcryptjs";

function getDb() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const db = require("./lib/db").default;
    return db;
  } catch {
    return null;
  }
}

const config: NextAuthConfig = {
  providers: [
    Credentials({
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const db = getDb();
        if (!db) return null;

        const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as {
          id: string; email: string; name: string | null;
          password_hash: string | null; plan: string; is_admin: number;
        } | undefined;

        if (!user || !user.password_hash) return null;

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return null;

        return {
          id:       user.id,
          email:    user.email,
          name:     user.name ?? undefined,
        };
      },
    }),

    ...(process.env.AUTH_GOOGLE_ID?.trim()
      ? [
          Google({
            clientId:     process.env.AUTH_GOOGLE_ID.trim(),
            clientSecret: process.env.AUTH_GOOGLE_SECRET!.trim(),
          }),
        ]
      : []),

    ...(process.env.AUTH_GITHUB_ID?.trim()
      ? [
          GitHub({
            clientId:     process.env.AUTH_GITHUB_ID.trim(),
            clientSecret: process.env.AUTH_GITHUB_SECRET!.trim(),
          }),
        ]
      : []),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    signIn: async ({ user, account }) => {
      if (account?.provider === "google" || account?.provider === "github") {
        try {
          const db = getDb();
          if (!db) return true;

          const existing = db
            .prepare("SELECT id FROM users WHERE email = ?")
            .get(user.email) as { id: string } | undefined;

          if (!existing) {
            db.prepare(
              "INSERT INTO users (id, email, name, plan, is_admin) VALUES (?, ?, ?, 'free', 0)"
            ).run(crypto.randomUUID(), user.email, user.name ?? null);
          }
        } catch {
          // DB error — still allow sign-in, JWT callback will handle missing user
        }
      }
      return true;
    },

    jwt: async ({ token, user, account }) => {
      // Only look up DB on initial sign-in (when user or account is present)
      // For subsequent requests, trust what's already in the token
      if (user || account) {
        try {
          const db = getDb();
          if (db) {
            const email = token.email || user?.email;
            if (email) {
              let row = db
                .prepare("SELECT id, plan, is_admin FROM users WHERE email = ?")
                .get(email) as { id: string; plan: string; is_admin: number } | undefined;

              if (!row) {
                // Create user if missing (OAuth edge case)
                const newId = crypto.randomUUID();
                try {
                  db.prepare(
                    "INSERT INTO users (id, email, name, plan, is_admin) VALUES (?, ?, ?, 'free', 0)"
                  ).run(newId, email, token.name || user?.name || null);
                  row = { id: newId, plan: "free", is_admin: 0 };
                } catch {
                  row = db.prepare("SELECT id, plan, is_admin FROM users WHERE email = ?")
                    .get(email) as { id: string; plan: string; is_admin: number } | undefined;
                }
              }

              if (row) {
                token.id       = row.id;
                token.plan     = row.plan as "free" | "pro";
                token.is_admin = row.is_admin === 1;
              }
            }
          }
        } catch {
          // DB error — use fallbacks below
        }
      }

      // Ensure token always has safe fallback values
      token.id       = token.id ?? token.sub ?? "";
      token.plan     = token.plan ?? "free";
      token.is_admin = token.is_admin ?? false;

      return token;
    },

    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id       = (token.id as string) || token.sub || "";
        session.user.plan     = (token.plan as "free" | "pro") || "free";
        session.user.is_admin = Boolean(token.is_admin);
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
