"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isInitialized, user } = useAuth();

  // Redirect authenticated users away from login/register
  useEffect(() => {
    if (isInitialized && user) {
      router.replace("/dashboard");
    }
  }, [isInitialized, user, router]);

  // While initializing, show a centered spinner to prevent flash
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  // If user is authenticated, render nothing while redirecting
  if (user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
