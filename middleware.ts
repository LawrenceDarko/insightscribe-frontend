import { NextRequest, NextResponse } from "next/server";

const REFRESH_COOKIE = "insightscribe_refresh";

/** Dev-mock refresh cookie sentinel — must match app/api/auth/_dev-mock.ts */
const DEV_REFRESH_TOKEN = "dev-mock-refresh-token";

/** Routes that require authentication. */
const PROTECTED_PREFIXES = ["/dashboard", "/projects"];

/** Routes only accessible to unauthenticated users. */
const AUTH_ROUTES = ["/login", "/register"];

/**
 * Quick check: does the refresh cookie exist and contain a
 * plausible (3-part) JWT that hasn't obviously expired?
 * We do NOT verify the signature — that happens when the
 * client-side AuthContext calls /api/auth/refresh.
 */
function hasPlausibleRefreshToken(request: NextRequest): boolean {
  const token = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!token) return false;

  // Accept the dev-mock sentinel token
  if (token === DEV_REFRESH_TOKEN) return true;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    const payload = JSON.parse(json) as { exp?: number };
    if (payload.exp && Date.now() >= payload.exp * 1000) return false;
  } catch {
    return false;
  }

  return true;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = hasPlausibleRefreshToken(request);

  // Unauthenticated user hitting a protected route → redirect to login
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !hasToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting auth pages → redirect to dashboard
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname === r);
  if (isAuthRoute && hasToken) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  /*
   * Match all routes EXCEPT:
   * - _next/static, _next/image (static assets)
   * - favicon.ico, sitemap.xml, robots.txt
   * - API routes (handled by their own auth)
   * - Public assets
   */
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|api/).*)",
  ],
};
