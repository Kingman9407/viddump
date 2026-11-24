import type { Metadata } from "next";
import { SetupGuide } from "@/components/SetupGuide";

export const metadata: Metadata = {
  title: "Drive Setup — DriveDrop",
  description: "Configure Google Drive OAuth2 credentials for video uploads.",
};

export default function SetupPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Google Drive Setup
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Connect your personal Google Drive folder once so you and your friend
          can upload videos anytime.
        </p>
      </div>

      <SetupGuide />
    </div>
  );
}
