// frontend/src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/admin", "/forms"];
const AUTH_PATHS = ["/login", "/auth/verify"];

function hasAccessToken(request: NextRequest): boolean {
  return request.cookies.get("access_token") !== undefined;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = hasAccessToken(request);

  // Redirect authenticated users away from login/verify pages
  if (AUTH_PATHS.some((p) => pathname.startsWith(p)) && isAuthenticated) {
    return NextResponse.redirect(new URL("/forms", request.url));
  }

  // Block unauthenticated users from protected pages
  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/forms/:path*", "/login", "/auth/verify"],
};
