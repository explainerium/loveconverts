import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Use NextAuth's auth() which handles all cookie variations (HTTP/HTTPS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let session: any = null;
  try {
    session = await auth();
  } catch {
    // Auth failed — treat as unauthenticated
  }

  // Not logged in → redirect to signin
  if (!session?.user) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(signInUrl);
  }

  // Non-admin visiting admin routes → redirect to dashboard
  if (path.startsWith("/admin") && !session.user.is_admin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
