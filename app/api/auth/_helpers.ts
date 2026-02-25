import { NextRequest, NextResponse } from "next/server";

/**
 * CSRF protection: verify the custom header is present.
 * Browsers will NOT send custom headers on cross-origin requests unless
 * CORS preflight allows it, so this blocks CSRF attacks from foreign origins.
 *
 * Our client-side code always sends `X-Requested-With: XMLHttpRequest`.
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  const xrw = request.headers.get("x-requested-with");
  if (xrw !== "XMLHttpRequest") {
    return NextResponse.json(
      { detail: "Missing or invalid CSRF header" },
      { status: 403 }
    );
  }
  return null;
}

export const REFRESH_COOKIE = "insightscribe_refresh";

/** Cookie options for the refresh token. */
export function refreshCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  };
}
