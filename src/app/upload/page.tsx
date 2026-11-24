import type { Metadata } from "next";
import { UploadForm } from "@/components/UploadForm";

export const metadata: Metadata = {
  title: "Upload Video — DriveDrop",
  description: "Upload a video directly to the shared Google Drive folder.",
};

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Upload a video
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Select a video file, add your name, and send it straight to Google
          Drive.
        </p>
      </div>

      <UploadForm />
    </div>
  );
}
