"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface StatusResponse {
  configured: boolean;
}

export function DriveStatusBadge() {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/drive/status")
      .then((res) => res.json())
      .then((data: StatusResponse) => {
        if (active) setConfigured(data.configured);
      })
      .catch(() => {
        if (active) setConfigured(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (configured === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        Checking Drive...
      </span>
    );
  }

  if (configured) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
        Drive Connected
      </span>
    );
  }

  return (
    <Link
      href="/setup"
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/60"
    >
      <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
      Setup Needed
    </Link>
  );
}
