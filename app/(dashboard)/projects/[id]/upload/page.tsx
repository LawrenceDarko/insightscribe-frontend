import { UploadInterview } from "@/features/upload/UploadInterview";

export default function UploadPage({ params }: { params: { id: string } }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
          Upload interviews
        </h1>
        <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
          Add interviews using one of three methods: upload audio/video files,
          paste manual transcript text, or submit a direct media URL.
        </p>
      </div>
      <UploadInterview projectId={params.id} />
    </div>
  );
}
