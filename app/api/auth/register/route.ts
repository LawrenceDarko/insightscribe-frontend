import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { validateCsrf, REFRESH_COOKIE, refreshCookieOptions } from "../_helpers";
import {
  DEV_AUTH_ENABLED,
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
    if (DEV_AUTH_ENABLED && body.email === DEV_USER.email) {
      const cookieStore = await cookies();
      cookieStore.set(REFRESH_COOKIE, DEV_REFRESH_TOKEN, refreshCookieOptions());
      return NextResponse.json({
        access: createDevAccessToken(),
        user: DEV_USER,
      });
    }

    // Transform frontend payload to match Django backend serializer:
    // Backend expects: { email, password, password_confirm, full_name }
    const backendPayload = {
      email: body.email,
      password: body.password,
      password_confirm: body.password_confirm ?? body.password,
      full_name: body.full_name ?? body.name ?? "",
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";
    const res = await fetch(`${apiUrl}/auth/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(backendPayload),
    });
    const envelope = await res.json().catch(() => ({}));

    if (!res.ok) {
      // Extract error message from Django envelope
      const errMsg = envelope?.error?.message ?? envelope?.detail ?? "Registration failed";
      const details = envelope?.error?.details;

      // Surface the first field-level validation error for a user-friendly message
      let detail = errMsg;
      if (details && typeof details === "object") {
        const firstKey = Object.keys(details).find(
          (k) => Array.isArray(details[k]) && details[k].length > 0
        );
        if (firstKey) {
          detail = details[firstKey][0];
        }
      }

      return NextResponse.json({ detail, details }, { status: res.status });
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
      { detail: "Registration failed" },
      { status: 500 }
    );
  }
}
