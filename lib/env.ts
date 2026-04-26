/**
 * Centralized environment config.
 * Provide NEXT_PUBLIC_API_URL in .env.local or at build time.
 */
function getEnv(key: "NEXT_PUBLIC_API_URL" | "NEXT_PUBLIC_APP_URL"): string {
  const value = process.env[key];
  if (typeof value !== "string" || !value.trim()) {
    return key === "NEXT_PUBLIC_API_URL" ? "NEXT_PUBLIC_API_URL" : "http://localhost:8000/api/v1";
  }
  return value.trim();
}

export const env = {
  apiUrl: getEnv("NEXT_PUBLIC_API_URL").replace(/\/$/, ""),
  appUrl:
    getEnv("NEXT_PUBLIC_APP_URL").replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"),
} as const;
