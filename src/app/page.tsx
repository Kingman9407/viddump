import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-slate-950 sm:p-12">
        <div className="max-w-2xl space-y-5">
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/70 dark:text-blue-300">
            Direct to Google Drive
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Share &amp; upload videos straight to Drive.
          </h1>
          <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Drop any video file, add a custom name and your name, and upload it
            directly to Google Drive with instant Discord notifications.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/upload"
              className="min-h-12 inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Upload a Video
            </Link>
            <Link
              href="/videos"
              className="min-h-12 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
            >
              Download Videos
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            1. Pick or Drop Video
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Drag and drop MP4, MOV, or WebM files with instant local preview
            before uploading.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            2. Resumable Drive Upload
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Videos stream straight from the browser to Google Drive with live
            progress tracking.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            3. Custom Name &amp; Discord
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Saves each video as{" "}
            <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs dark:bg-slate-800">
              Custom Name - Your Name
            </code>{" "}
            and notifies Discord via webhook.
          </p>
        </div>
      </section>
    </div>
  );
}
