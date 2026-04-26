import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateCsrf, REFRESH_COOKIE, refreshCookieOptions } from "../_helpers";
import {
  DEV_AUTH_ENABLED,
  isDevCredentials,
  createDevAccessToken,
  DEV_REFRESH_TOKEN,
  DEV_USER,
} from "../_dev-mock";

export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request);
  if (csrfError) return csrfError;

  try {
    const body = await request.json();

    /* ── Dev-mock shortcut ── */
    if (DEV_AUTH_ENABLED && isDevCredentials(body.email, body.password)) {
      const cookieStore = await cookies();
      cookieStore.set(REFRESH_COOKIE, DEV_REFRESH_TOKEN, refreshCookieOptions());
      return NextResponse.json({
        access: createDevAccessToken(),
        user: DEV_USER,
      });
    }

    // const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const res = await fetch(`${apiUrl}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
    });
    const envelope = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Extract error message from Django envelope
      const errMsg = envelope?.error?.message ?? envelope?.detail ?? "Login failed";
      const details = envelope?.error?.details;
      return NextResponse.json({ detail: errMsg, details }, { status: res.status });
    }

    // Django returns: { success: true, data: { user: {...}, tokens: { access, refresh } } }
    const payload = envelope?.data ?? envelope;
    const tokens = payload?.tokens ?? {};
    const user = payload?.user;

    if (tokens.refresh) {
      const cookieStore = await cookies();
      cookieStore.set(REFRESH_COOKIE, tokens.refresh, refreshCookieOptions());
    }

    return NextResponse.json({ access: tokens.access, user });
  } catch {
    return NextResponse.json(
      { detail: "Login failed" },
      { status: 500 }
    );
  }
}
