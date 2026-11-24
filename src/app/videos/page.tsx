import type { Metadata } from "next";
import { VideoList } from "@/components/VideoList";

export const metadata: Metadata = {
  title: "Uploaded Videos — DriveDrop",
  description: "View videos uploaded to the shared Google Drive folder.",
};

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Uploaded videos
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Videos stored in your connected Google Drive folder.
        </p>
      </div>

      <VideoList />
    </div>
  );
}
