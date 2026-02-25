import { api } from "./client";
import type { User, LoginPayload, LoginResponse, RegisterPayload } from "@/types";

/** Dev-mock auth flag — matches the server-side _dev-mock.ts check. */
const DEV_AUTH =
  process.env.NEXT_PUBLIC_DEV_AUTH === "true" &&
  process.env.NODE_ENV !== "production";

const DEV_USER: User = {
  id: "dev-user-001",
  email: "test@example.com",
  full_name: "Dev User",
  plan: "free",
  is_active: true,
  created_at: new Date().toISOString(),
  name: "Dev User",
};

const CSRF_HEADERS = {
  "Content-Type": "application/json",
  "X-Requested-With": "XMLHttpRequest",
};

const getAuthBase = () =>
  typeof window !== "undefined" ? "" : process.env.NEXT_PUBLIC_APP_URL ?? "";

/** Login via Next.js API route (sets httpOnly refresh cookie). */
export async function loginWithCredentials(
  payload: LoginPayload
): Promise<LoginResponse> {
  const res = await fetch(`${getAuthBase()}/api/auth/login`, {
    method: "POST",
    headers: CSRF_HEADERS,
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.detail ?? "Login failed"), { response: { data } });
  return data;
}

/** Register via Next.js API route (sets httpOnly refresh cookie). */
export async function registerWithCredentials(
  payload: RegisterPayload
): Promise<LoginResponse> {
  const res = await fetch(`${getAuthBase()}/api/auth/register`, {
    method: "POST",
    headers: CSRF_HEADERS,
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.detail ?? "Registration failed"), { response: { data } });
  return data;
}

/** Refresh access token via Next.js API route (uses httpOnly cookie). */
export async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch(`${getAuthBase()}/api/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return null;
  return data.access ?? null;
}

/**
 * Fetch the current user profile from the Django backend.
 * Endpoint: GET /api/v1/auth/profile/
 * Returns envelope: { success: true, data: { id, email, full_name, plan, ... } }
 * The api.get helper unwraps the envelope automatically.
 */
export async function fetchCurrentUser(): Promise<User | null> {
  // In dev-mock mode, skip the backend call entirely
  if (DEV_AUTH) return DEV_USER;
  try {
    const user = await api.get<User>("/auth/profile/");
    // Add convenience 'name' alias from 'full_name'
    if (user && !user.name && user.full_name) {
      user.name = user.full_name;
    }
    return user;
  } catch {
    return null;
  }
}

/** Logout: clear httpOnly cookie via Next.js API route. */
export async function logoutClient(): Promise<void> {
  try {
    // Include access token from in-memory store for backend authorization
    const { getAccessToken } = await import("./client");
    const token = getAccessToken();
    await fetch(`${getAuthBase()}/api/auth/logout`, {
      method: "POST",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
    });
  } catch {
    // ignore
  }
}
