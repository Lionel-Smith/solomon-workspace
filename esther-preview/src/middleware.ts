/**
 * Next.js Edge Middleware — auth gate.
 *
 * Checks for the JWT httpOnly cookie on protected routes.
 * Unauthenticated visitors are redirected to /login.
 */

import { NextResponse, type NextRequest } from "next/server";
import { config as appConfig } from "@/lib/config";

const PROTECTED_PREFIXES = ["/pipelines", "/design-specs"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p),
  );
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get(appConfig.authCookieName);
  if (token?.value) return NextResponse.next();

  // Redirect to login, preserving the originally requested path.
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/pipelines/:path*", "/design-specs/:path*"],
};
