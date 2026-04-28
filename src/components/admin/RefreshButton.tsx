"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// Manual refresh trigger for any server-rendered admin page. Shows a small
// "loaded HH:mm" timestamp so the operator can tell at a glance how stale
// the view is. Auto-poll was rejected to keep this thing dumb and predictable.

export function RefreshButton({ initialLoadedAt }: { initialLoadedAt: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadedAt, setLoadedAt] = useState(initialLoadedAt);

  function handle() {
    startTransition(() => {
      router.refresh();
      setLoadedAt(Date.now());
    });
  }

  const time = new Date(loadedAt).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-2 text-sm text-stone-500">
      <span>Loaded {time}</span>
      <button
        type="button"
        onClick={handle}
        disabled={isPending}
        className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"
      >
        <svg
          className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {isPending ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
