import type { Metadata } from "next";
import { VideoList } from "@/components/VideoList";

export const metadata: Metadata = {
  title: "Videos — DriveDrop",
  description: "View and download videos from your Google Drive folder.",
};

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Uploaded videos
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Download videos directly from your connected Google Drive folder.
        </p>
      </div>

      <VideoList />
    </div>
  );
}
