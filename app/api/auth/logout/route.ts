import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateCsrf, REFRESH_COOKIE } from "../_helpers";

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  const cookieStore = await cookies();
  const refresh = cookieStore.get(REFRESH_COOKIE)?.value;

  // Blacklist the refresh token on the backend
  // Django backend requires IsAuthenticated for logout,
  // and expects { refresh: "<token>" } in the body.
  // We also pass the access token from the request header if available.
  if (refresh) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
      const authHeader = request.headers.get("authorization") ?? "";
      await fetch(`${apiUrl}/auth/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({ refresh }),
      });
    } catch {
      // Best-effort — still clear the cookie
    }
  }

  cookieStore.delete(REFRESH_COOKIE);
  return NextResponse.json({ ok: true });
}
