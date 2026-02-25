export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface-50 dark:bg-surface-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600 text-lg font-bold text-white">
        IS
      </div>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
    </div>
  );
}
