import Link from "next/link";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface-50 px-4 dark:bg-surface-900">
      <span className="text-6xl font-extrabold text-primary-600">404</span>
      <h1 className="mt-4 text-2xl font-bold text-surface-900 dark:text-surface-100">
        Page not found
      </h1>
      <p className="mt-2 text-surface-600 dark:text-surface-400 text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link href="/" className="mt-6">
        <Button>Go home</Button>
      </Link>
    </div>
  );
}
