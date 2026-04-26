/**
 * Centralized environment config.
 * Provide NEXT_PUBLIC_API_URL in .env.local or at build time.
 */
function getApiUrl(): string {
  const value = process.env.NEXT_PUBLIC_API_URL;
  if (typeof value !== "string" || !value.trim()) {
    return "http://localhost:8000/api/v1";
  }
  return value.trim();
}

function getAppUrl(): string {
  const value = process.env.NEXT_PUBLIC_APP_URL;
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }
  return value.trim();
}

export const env = {
  apiUrl: getApiUrl().replace(/\/$/, ""),
  appUrl:
    getAppUrl().replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
} as const;
