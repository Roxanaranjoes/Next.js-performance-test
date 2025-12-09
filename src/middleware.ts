import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware guards dashboard and ticket routes, redirecting unauthenticated users.
export async function middleware(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to login when no valid session token is found.
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  const pathname = req.nextUrl.pathname;
  const role = (token as any)?.role as string | undefined;

  // Enforce role-based dashboards and ticket creation routes.
  if (pathname.startsWith("/dashboard/admin") && role !== "admin") {
    const redirectUrl = new URL("/dashboard", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (
    pathname.startsWith("/dashboard/agent") &&
    role !== "agent" &&
    role !== "admin"
  ) {
    const redirectUrl = new URL("/dashboard/client", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/dashboard/client") && role !== "client") {
    const redirectUrl = new URL(
      role === "admin" ? "/dashboard/admin" : "/dashboard/agent",
      req.url
    );
    return NextResponse.redirect(redirectUrl);
  }

  if (pathname.startsWith("/tickets/new") && role !== "client") {
    const redirectUrl = new URL("/dashboard/agent", req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next(); // Allow the request when authenticated.
}

// Apply only to dashboard and tickets routes (including nested paths).
export const config = {
  matcher: ["/dashboard/:path*", "/tickets/:path*"],
};
