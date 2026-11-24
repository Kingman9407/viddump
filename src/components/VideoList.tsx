"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useId, useState } from "react";
import type { DriveVideoFile } from "@/lib/google-drive";

interface DriveStatus {
  configured: boolean;
  passcodeRequired: boolean;
}

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
  const passcodeId = useId();
  const passcodeErrId = useId();

  const [status, setStatus] = useState<DriveStatus | null>(null);
  const [passcode, setPasscode] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FilesResponse | null>(null);

  const loadVideos = useCallback(async (code: string) => {
    setLoading(true);
    setAuthError("");
    try {
      const res = await fetch("/api/drive/files", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code }),
        cache: "no-store",
      });

      const json = (await res.json()) as FilesResponse;
      if (res.status === 401) {
        setUnlocked(false);
        setAuthError(json.error || "Incorrect passcode.");
        setData(null);
        return;
      }

      setUnlocked(true);
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
    let active = true;
    fetch("/api/drive/status")
      .then((res) => res.json())
      .then((driveStatus: DriveStatus) => {
        if (!active) return;
        setStatus(driveStatus);
        if (!driveStatus.passcodeRequired) {
          loadVideos("");
        } else {
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setStatus({ configured: false, passcodeRequired: false });
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loadVideos]);

  const handleUnlock = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setAuthError("Please enter the shared passcode.");
      return;
    }
    loadVideos(passcode.trim());
  };

  if (status?.passcodeRequired && !unlocked) {
    return (
      <form
        noValidate
        onSubmit={handleUnlock}
        className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-950"
      >
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Enter passcode to view &amp; download
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Videos are protected by your shared passcode.
          </p>
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={passcodeId}
            className="block text-sm font-medium text-slate-900 dark:text-slate-100"
          >
            Shared passcode
          </label>
          <input
            id={passcodeId}
            name="passcode"
            type="password"
            required
            autoComplete="current-password"
            value={passcode}
            aria-invalid={authError ? "true" : undefined}
            aria-describedby={authError ? passcodeErrId : undefined}
            onChange={(e) => {
              setPasscode(e.target.value);
              if (authError) setAuthError("");
            }}
            placeholder="Enter shared passcode"
            className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          {authError && (
            <p id={passcodeErrId} className="text-sm text-red-600 dark:text-red-400">
              {authError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="min-h-12 w-full rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Checking..." : "Unlock Videos"}
        </button>
      </form>
    );
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
        Loading videos from Google Drive...
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
          onClick={() => loadVideos(passcode.trim())}
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
          {files.length} {files.length === 1 ? "video" : "videos"} in Google Drive
        </p>
        <button
          type="button"
          onClick={() => loadVideos(passcode.trim())}
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
          {files.map((file) => {
            const downloadParams = new URLSearchParams({ fileId: file.id });
            if (passcode.trim()) {
              downloadParams.set("passcode", passcode.trim());
            }
            const downloadHref = `/api/drive/download?${downloadParams.toString()}`;

            return (
              <li
                key={file.id}
                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-950"
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

                <div className="flex flex-wrap gap-2">
                  <a
                    href={downloadHref}
                    download={file.name}
                    className="min-h-10 flex-1 inline-flex items-center justify-center rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
                  >
                    Download
                  </a>
                  {file.webViewLink && (
                    <a
                      href={file.webViewLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-10 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                    >
                      Open in Drive ↗
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
