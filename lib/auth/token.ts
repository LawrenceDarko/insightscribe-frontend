/**
 * Lightweight JWT decode utilities.
 * Only decodes the payload — does NOT verify signatures.
 * Safe for client-side expiration checks.
 */

interface JwtPayload {
  exp?: number;
  iat?: number;
  sub?: string;
  user_id?: string;
  [key: string]: unknown;
}

/**
 * Base64url-decode a JWT payload without verifying the signature.
 * Returns null if the token is malformed.
 */
export function decodeTokenPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // Base64url → Base64
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json =
      typeof atob === "function"
        ? atob(base64)
        : Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Check whether a JWT expires within `bufferSeconds` from now.
 * Returns true if expired or un-decodable.
 */
export function isTokenExpired(
  token: string,
  bufferSeconds = 30
): boolean {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return true;
  return Date.now() >= (payload.exp - bufferSeconds) * 1000;
}

/**
 * Get the expiration Date of a JWT token, or null if un-decodable.
 */
export function getTokenExpiresAt(token: string): Date | null {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return null;
  return new Date(payload.exp * 1000);
}

/**
 * Milliseconds until token expiry (minus optional buffer).
 * Returns 0 if already expired or un-decodable.
 */
export function msUntilExpiry(
  token: string,
  bufferSeconds = 60
): number {
  const payload = decodeTokenPayload(token);
  if (!payload?.exp) return 0;
  const ms = (payload.exp - bufferSeconds) * 1000 - Date.now();
  return Math.max(0, ms);
}
