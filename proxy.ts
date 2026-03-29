import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });

  // Logged-in users visiting signin/signup → redirect to dashboard
  if (token && (path === "/auth/signin" || path === "/auth/signup")) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/dashboard";
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  // Not logged in visiting protected routes → redirect to signin
  if (!token && (path.startsWith("/dashboard") || path.startsWith("/admin"))) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(signInUrl);
  }

  // Non-admin visiting admin routes → redirect to dashboard
  if (token && path.startsWith("/admin") && !token.is_admin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/signin", "/auth/signup"],
};
