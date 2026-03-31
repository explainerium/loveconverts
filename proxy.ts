import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  let token = null;
  try {
    token = await getToken({
      req: request,
      secret: process.env.AUTH_SECRET,
    });
  } catch {
    // Token decode failed (secret mismatch, corrupted cookie, etc.)
    // Clear the bad cookie and redirect to signin
    const response = NextResponse.redirect(
      new URL("/auth/signin?callbackUrl=" + encodeURIComponent(path), request.url)
    );
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    return response;
  }

  // Not logged in → redirect to signin
  if (!token) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(signInUrl);
  }

  // Non-admin visiting admin routes → redirect to dashboard
  if (path.startsWith("/admin") && !token.is_admin) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
