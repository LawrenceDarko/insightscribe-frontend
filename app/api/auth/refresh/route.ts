import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REFRESH_COOKIE, refreshCookieOptions } from "../_helpers";
import {
  DEV_AUTH_ENABLED,
  DEV_REFRESH_TOKEN,
  createDevAccessToken,
} from "../_dev-mock";

export async function POST(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refresh = cookieStore.get(REFRESH_COOKIE)?.value;
    if (!refresh) {
      return NextResponse.json({ detail: "No refresh token" }, { status: 401 });
    }

    /* ── Dev-mock shortcut ── */
    if (DEV_AUTH_ENABLED && refresh === DEV_REFRESH_TOKEN) {
      return NextResponse.json({ access: createDevAccessToken() });
    }

    // Django backend endpoint: POST /api/v1/auth/token/refresh/
    // Expects: { refresh: "<token>" }
    // Returns: { success: true, data: { tokens: { access, refresh } } }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
    const res = await fetch(`${apiUrl}/auth/token/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
    });
    const envelope = await res.json().catch(() => ({}));

    if (!res.ok) {
      cookieStore.delete(REFRESH_COOKIE);
      const errMsg = envelope?.error?.message ?? "Token refresh failed";
      const details = envelope?.error?.details;
      return NextResponse.json({ detail: errMsg, details }, { status: res.status });
    }

    // Django returns: { success: true, data: { tokens: { access, refresh } } }
    const payload = envelope?.data ?? envelope;
    const tokens = payload?.tokens ?? payload;

    // Rotate refresh token if the backend issues a new one
    if (tokens.refresh) {
      cookieStore.set(REFRESH_COOKIE, tokens.refresh, refreshCookieOptions());
    }

    return NextResponse.json({ access: tokens.access });
  } catch {
    return NextResponse.json(
      { detail: "Refresh failed" },
      { status: 500 }
    );
  }
}
