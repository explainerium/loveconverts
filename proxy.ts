import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
  });

  // If user is logged in and visiting auth pages, redirect to dashboard
  if (token && (path.startsWith("/auth/signin") || path.startsWith("/auth/signup"))) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl") || "/dashboard";
    return NextResponse.redirect(new URL(callbackUrl, request.url));
  }

  // Protected routes: require login
  if (path.startsWith("/dashboard") || path.startsWith("/admin")) {
    if (!token) {
      const signInUrl = new URL("/auth/signin", request.url);
      signInUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(signInUrl);
    }

    // Admin routes require is_admin flag
    if (path.startsWith("/admin") && !token.is_admin) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/auth/signin", "/auth/signup"],
};
