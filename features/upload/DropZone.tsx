"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  accept: string;
  maxSizeMB: number;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  onError: (message: string) => void;
  className?: string;
}

const VALID_EXTENSIONS = /\.(mp3|wav|mp4|m4a|webm|ogg)$/i;
const VALID_TYPES = new Set([
  "audio/mpeg",
  "audio/wav",
  "audio/mp3",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/ogg",
  "audio/webm",
  "video/mp4",
  "video/webm",
]);

export function DropZone({
  accept,
  maxSizeMB,
  multiple = false,
  disabled = false,
  onFiles,
  onError,
  className,
}: DropZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxBytes = maxSizeMB * 1024 * 1024;

  const validate = useCallback(
    (fileList: FileList | File[]): File[] => {
      const files = Array.from(fileList);
      const valid: File[] = [];

      for (const f of files) {
        const typeOk = VALID_TYPES.has(f.type) || VALID_EXTENSIONS.test(f.name);
        if (!typeOk) {
          onError(`"${f.name}" is not a supported format. Use MP3, WAV, or MP4.`);
          continue;
        }
        if (f.size > maxBytes) {
          onError(`"${f.name}" exceeds the ${maxSizeMB}MB limit.`);
          continue;
        }
        if (f.size === 0) {
          onError(`"${f.name}" is empty.`);
          continue;
        }
        valid.push(f);
      }

      return valid;
    },
    [maxBytes, maxSizeMB, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (disabled) return;

      const files = validate(e.dataTransfer.files);
      if (files.length) onFiles(multiple ? files : [files[0]]);
    },
    [disabled, validate, onFiles, multiple]
  );

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;
      const files = validate(e.target.files);
      if (files.length) onFiles(multiple ? files : [files[0]]);
      // Reset so the same file can be re-selected
      e.target.value = "";
    },
    [validate, onFiles, multiple]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900",
        dragOver
          ? "border-primary-500 bg-primary-50/60 dark:bg-primary-900/20"
          : "border-surface-300 hover:border-surface-400 dark:border-surface-600 dark:hover:border-surface-500",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      aria-label="Upload area"
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleSelect}
        className="sr-only"
        disabled={disabled}
        tabIndex={-1}
      />

      <UploadCloudIcon />

      <p className="mt-4 text-sm text-surface-700 dark:text-surface-300">
        <span className="font-semibold text-primary-600 dark:text-primary-400">
          Click to choose {multiple ? "files" : "a file"}
        </span>{" "}
        or drag and drop
      </p>
      <p className="mt-1 text-xs text-surface-500 dark:text-surface-400">
        MP3, WAV, MP4 — up to {maxSizeMB}MB {multiple ? "each" : ""}
      </p>
    </div>
  );
}

function UploadCloudIcon() {
  return (
    <svg
      className="h-10 w-10 text-surface-400 dark:text-surface-500"
      fill="none"
      viewBox="0 0 48 48"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 32a10 10 0 01-.6-20A12 12 0 0137 16a8 8 0 01-1 16H14z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M24 22v14M18 28l6-6 6 6" />
    </svg>
  );
}
