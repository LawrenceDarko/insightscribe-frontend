/**
 * Dev-only mock auth helpers.
 *
 * When NEXT_PUBLIC_DEV_AUTH=true, the login/refresh API routes will accept
 * hardcoded credentials and return mock JWTs — no Django backend required.
 *
 * Credentials:
 *   email: test@example.com
 *   password: test
 */

export const DEV_AUTH_ENABLED =
  process.env.NEXT_PUBLIC_DEV_AUTH === "true" &&
  process.env.NODE_ENV !== "production";

export const DEV_USER = {
  id: "dev-user-001",
  email: "test@example.com",
  name: "Dev User",
};

const DEV_PASSWORD = "test";

/** Check if credentials match the dev test user. */
export function isDevCredentials(email: string, password: string): boolean {
  return email === DEV_USER.email && password === DEV_PASSWORD;
}

/** Sentinel value stored in the refresh cookie for dev-mock sessions. */
export const DEV_REFRESH_TOKEN = "dev-mock-refresh-token";

/**
 * Build a JWT-shaped token (header.payload.signature) with a real base64
 * payload so client-side `decodeTokenPayload()` and `msUntilExpiry()` work.
 *
 * This is NOT cryptographically signed — it's purely for local dev UX.
 */
export function createDevAccessToken(expiresInSeconds = 3600): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));

  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      sub: DEV_USER.id,
      user_id: DEV_USER.id,
      email: DEV_USER.email,
      name: DEV_USER.name,
      iat: now,
      exp: now + expiresInSeconds,
    })
  );

  const signature = base64url("dev-signature");

  return `${header}.${payload}.${signature}`;
}

function base64url(str: string): string {
  return Buffer.from(str)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
