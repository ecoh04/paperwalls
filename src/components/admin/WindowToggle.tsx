"use client";

import Link from "next/link";
import { WINDOW_OPTIONS, type WindowValue } from "./window-options";

// Window selector for the analytics dashboard. Renders as a segmented
// control. Each option is a real <Link> so the URL is shareable and
// browser back works as expected. Server component reads ?window= from
// searchParams.

export function WindowToggle({ active }: { active: WindowValue }) {
  return (
    <div className="inline-flex rounded-lg border border-stone-300 bg-white p-0.5">
      {WINDOW_OPTIONS.map((opt) => {
        const isActive = opt.value === active;
        return (
          <Link
            key={opt.value}
            href={opt.value === "30d" ? "/admin/analytics" : `/admin/analytics?window=${opt.value}`}
            scroll={false}
            className={[
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
            ].join(" ")}
          >
            {opt.label}
          </Link>
        );
      })}
    </div>
  );
}
