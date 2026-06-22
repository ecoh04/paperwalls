"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WINDOW_PRESETS } from "./window-options";

// Period selector for the analytics dashboard. Presets (Today, Last 30 days,
// This month, Last month, This year, …) plus a custom from/to date range.
// Updates the URL (?window= or ?from=&to=) so views are shareable and the
// server component reads the selection from searchParams.

type Props = {
  /** Current preset value, or "custom". */
  active: string;
  /** Human label for the current selection (e.g. "Last 30 days" or "1 Jun – 15 Jun 2026"). */
  activeLabel: string;
  from?: string;
  to?:   string;
};

export function PeriodPicker({ active, activeLabel, from, to }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const go = (href: string) => { setOpen(false); router.push(href, { scroll: false }); };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    const [a, b] = customFrom <= customTo ? [customFrom, customTo] : [customTo, customFrom];
    go(`/admin/analytics?from=${a}&to=${b}`);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
      >
        <svg aria-hidden width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        {activeLabel}
        <svg aria-hidden width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={open ? "rotate-180 transition-transform" : "transition-transform"}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-stone-200 bg-white p-2 shadow-lg">
          <div className="grid grid-cols-2 gap-1">
            {WINDOW_PRESETS.map((opt) => {
              const href = opt.value === "30d" ? "/admin/analytics" : `/admin/analytics?window=${opt.value}`;
              const isActive = active === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => go(href)}
                  className={[
                    "rounded-md px-2.5 py-1.5 text-left text-sm transition-colors",
                    isActive ? "bg-stone-900 text-white" : "text-stone-700 hover:bg-stone-100",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div className="mt-2 border-t border-stone-100 pt-2">
            <p className="px-1 pb-1.5 text-xs font-medium uppercase tracking-wider text-stone-500">Custom range</p>
            <div className="flex items-center gap-1.5 px-1">
              <input
                type="date" max={today} value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-700 focus:border-pw-accent focus:outline-none"
              />
              <span className="text-xs text-stone-400">to</span>
              <input
                type="date" max={today} value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-stone-300 px-2 py-1 text-xs text-stone-700 focus:border-pw-accent focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={applyCustom}
              disabled={!customFrom || !customTo}
              className="mt-2 w-full rounded-md bg-pw-accent px-2.5 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {active === "custom" ? "Update range" : "Apply range"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
