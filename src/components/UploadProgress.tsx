"use client";

import { useId } from "react";

interface UploadProgressProps {
  status: "idle" | "preparing" | "uploading" | "success" | "error";
  progress: number;
  statusMessage?: string;
}

export function UploadProgress({
  status,
  progress,
  statusMessage,
}: UploadProgressProps) {
  const progressId = useId();

  if (status === "idle") {
    return null;
  }

  const isPreparing = status === "preparing";
  const rounded = Math.round(progress);

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/70">
      <div className="flex items-center justify-between gap-2 text-sm">
        <label
          htmlFor={progressId}
          className="font-medium text-slate-800 dark:text-slate-200"
        >
          {status === "preparing" && "Preparing Google Drive upload..."}
          {status === "uploading" && "Uploading directly to Google Drive..."}
          {status === "success" && "Upload complete"}
          {status === "error" && "Upload failed"}
        </label>
        {!isPreparing && status !== "error" && (
          <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
            {rounded}%
          </span>
        )}
      </div>

      <progress
        id={progressId}
        className={`block h-2.5 w-full appearance-none overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-blue-600 [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:rounded-full [&::-moz-progress-bar]:bg-blue-600 ${
          isPreparing ? "animate-pulse" : ""
        }`}
        max={100}
        {...(isPreparing ? {} : { value: rounded })}
      />

      <p
        role="status"
        aria-live="polite"
        className={`text-xs ${
          status === "error"
            ? "text-red-600 dark:text-red-400"
            : status === "success"
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-slate-600 dark:text-slate-400"
        }`}
      >
        {statusMessage}
      </p>
    </div>
  );
}
