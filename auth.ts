import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import type { NextAuthConfig } from "next-auth";
import bcrypt from "bcryptjs";

// Import db lazily inside callbacks to avoid module-level issues during build.
// Returns null if database is unavailable (Vercel/read-only filesystem).
function getDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const db = require("./lib/db").default;
  return db; // may be null on Vercel
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
        if (!db) return null; // DB unavailable (Vercel)

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
          plan:     (user.plan as "free" | "pro") ?? "free",
          is_admin: user.is_admin === 1,
        };
      },
    }),

    // Google OAuth — enable when AUTH_GOOGLE_ID is set
    ...(process.env.AUTH_GOOGLE_ID?.trim()
      ? [
          Google({
            clientId:     process.env.AUTH_GOOGLE_ID.trim(),
            clientSecret: process.env.AUTH_GOOGLE_SECRET!.trim(),
          }),
        ]
      : []),

    // GitHub OAuth — enable when AUTH_GITHUB_ID is set
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
    // Handle social login providers (Google + GitHub)
    if (account?.provider === "google" || account?.provider === "github") {
      const db = getDb();
      if (!db) return true; // DB unavailable, allow sign-in anyway

      // Check if user already exists
      const existing = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(user.email) as { id: string } | undefined;

      // If new user → create them in DB
      if (!existing) {
        db.prepare(`
          INSERT INTO users (id, email, name, plan, is_admin)
          VALUES (?, ?, ?, 'free', 0)
        `).run(crypto.randomUUID(), user.email, user.name ?? null);
      }

      // Attach id + plan + is_admin to user object
      const row = db
        .prepare("SELECT id, plan, is_admin FROM users WHERE email = ?")
        .get(user.email) as { id: string; plan: string; is_admin: number } | undefined;

      if (row) {
        user.id = row.id;
        (user as Record<string, unknown>).plan     = row.plan;
        (user as Record<string, unknown>).is_admin = row.is_admin === 1;
      }
    }

    return true;
  },

  jwt: async ({ token, user }) => {
    if (user) {
      token.id       = user.id as string;
      token.plan     = ((user as Record<string, unknown>).plan as "free" | "pro") ?? "free";
      token.is_admin = Boolean((user as Record<string, unknown>).is_admin);
    }
    return token;
  },

  session: async ({ session, token }) => {
    if (token) {
      session.user.id       = token.id as string;
      session.user.plan     = (token.plan as "free" | "pro") ?? "free";
      session.user.is_admin = Boolean(token.is_admin);
    }
    return session;
  },
},

  pages: {
    signIn: "/auth/signin",
    error:  "/auth/signin",
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
