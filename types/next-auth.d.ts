import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id:       string;
      plan:     "free" | "pro";
      is_admin: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    plan?:     "free" | "pro";
    is_admin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id:       string;
    plan:     "free" | "pro";
    is_admin: boolean;
  }
}
