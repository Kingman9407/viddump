"use client";

import { useEffect, useState } from "react";

interface DriveStatus {
  configured: boolean;
  passcodeRequired: boolean;
  missing: string[];
}

const ENV_VARS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REFRESH_TOKEN",
  "GOOGLE_DRIVE_FOLDER_ID",
];

export function SetupGuide() {
  const [status, setStatus] = useState<DriveStatus | null>(null);

  useEffect(() => {
    fetch("/api/drive/status")
      .then((res) => res.json())
      .then((data: DriveStatus) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          Environment Status
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Check which variables are currently loaded from{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
            .env.local
          </code>
          .
        </p>

        <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {ENV_VARS.map((key) => {
            const isMissing = status ? status.missing.includes(key) : true;
            return (
              <li
                key={key}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs dark:border-slate-800"
              >
                <code className="font-mono font-medium text-slate-800 dark:text-slate-200">
                  {key}
                </code>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    status === null
                      ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      : isMissing
                        ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  }`}
                >
                  {status === null ? "Checking..." : isMissing ? "Missing" : "Set"}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          How to Connect Your Google Drive (5 minutes)
        </h2>

        <ol className="list-decimal space-y-3 pl-5 text-sm text-slate-700 dark:text-slate-300">
          <li>
            Create a folder in your Google Drive (e.g.{" "}
            <strong>Friend Video Uploads</strong>) and copy its Folder ID from the
            URL:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              drive.google.com/drive/folders/&lt;FOLDER_ID&gt;
            </code>
            .
          </li>
          <li>
            In <strong>Google Cloud Console</strong>, create a project, enable the{" "}
            <strong>Google Drive API</strong>, and create an{" "}
            <strong>OAuth 2.0 Client ID</strong> (Web application) with{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              https://developers.google.com/oauthplayground
            </code>{" "}
            as an authorized redirect URI.
          </li>
          <li>
            Open <strong>OAuth 2.0 Playground</strong>, click the gear icon → check{" "}
            <em>Use your own OAuth credentials</em>, paste your Client ID &amp;
            Secret, authorize scope{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              https://www.googleapis.com/auth/drive.file
            </code>{" "}
            (or{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              https://www.googleapis.com/auth/drive
            </code>{" "}
            to also list existing files), and exchange for a{" "}
            <strong>Refresh Token</strong>.
          </li>
          <li>
            Copy{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              .env.example
            </code>{" "}
            to{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              .env.local
            </code>{" "}
            (or Vercel Environment Variables) and fill in your values. Optionally
            set{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              UPLOAD_PASSCODE
            </code>{" "}
            for upload protection and{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800">
              DISCORD_WEBHOOK_URL
            </code>{" "}
            to post a Discord notification on every upload.
          </li>
          <li>Restart the Next.js dev server and start uploading!</li>
        </ol>
      </section>
    </div>
  );
}
