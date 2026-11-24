"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { DriveVideoFile } from "@/lib/google-drive";

interface FilesResponse {
  configured: boolean;
  files: DriveVideoFile[];
  error?: string;
}

function formatBytes(sizeStr?: string): string {
  const bytes = Number(sizeStr);
  if (!bytes || Number.isNaN(bytes)) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  return `${(bytes / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function VideoList() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FilesResponse | null>(null);

  const loadVideos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/drive/files", { cache: "no-store" });
      const json = (await res.json()) as FilesResponse;
      setData(json);
    } catch {
      setData({
        configured: false,
        files: [],
        error: "Could not fetch videos from the server.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVideos();
  }, [loadVideos]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        Loading videos from Google Drive...
      </div>
    );
  }

  if (data && !data.configured) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="font-semibold">Google Drive is not configured yet</p>
        <p className="mt-1">
          Once you connect your Drive folder in{" "}
          <code className="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs dark:bg-amber-900/60">
            .env.local
          </code>
          , all videos uploaded by you and your friend will appear here.
        </p>
        <Link
          href="/setup"
          className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-amber-900 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400"
        >
          Go to Drive Setup →
        </Link>
      </div>
    );
  }

  if (data?.error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
        <p className="font-semibold">Failed to load videos</p>
        <p className="mt-1">{data.error}</p>
        <button
          type="button"
          onClick={loadVideos}
          className="mt-4 min-h-10 rounded-xl bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  const files = data?.files ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {files.length} {files.length === 1 ? "video" : "videos"} in your Drive folder
        </p>
        <button
          type="button"
          onClick={loadVideos}
          className="min-h-10 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Refresh
        </button>
      </div>

      {files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
            No videos uploaded yet
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Upload your first video and it will appear right here.
          </p>
          <Link
            href="/upload"
            className="mt-4 inline-flex min-h-10 items-center rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            Upload a video
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950"
            >
              <div className="space-y-1.5">
                <h2
                  className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100"
                  title={file.name}
                >
                  {file.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatBytes(file.size)}
                  {file.createdTime ? ` · ${formatDate(file.createdTime)}` : ""}
                </p>
                {file.description && (
                  <p className="whitespace-pre-line rounded-lg bg-slate-50 p-2.5 text-xs text-slate-700 dark:bg-slate-900 dark:text-slate-300">
                    {file.description}
                  </p>
                )}
              </div>

              {file.webViewLink && (
                <a
                  href={file.webViewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Open in Google Drive ↗
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
