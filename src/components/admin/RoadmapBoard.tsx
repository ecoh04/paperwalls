"use client";

import { useState } from "react";
import { RoadmapRow, type RoadmapItem } from "@/components/admin/RoadmapRow";
import type { RoadmapStatus } from "@/app/admin/roadmap/actions";

// Client board: holds the active status filter, renders the theme groups, and
// filters the rendered rows in place (no round-trip, instant on a phone). The
// rows themselves own their own save state via RoadmapRow.

// Fixed theme order the founder reads top to bottom.
const THEME_ORDER = [
  "Foundation & reliability",
  "Tracking & attribution",
  "Conversion",
  "Customer experience",
  "Retention & win-back",
  "Analytics",
  "Trust & compliance",
] as const;

type Filter = "all" | RoadmapStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all",    label: "All" },
  { value: "now",    label: "Now" },
  { value: "next",   label: "Next" },
  { value: "later",  label: "Later" },
  { value: "done",   label: "Done" },
  { value: "parked", label: "Parked" },
];

export function RoadmapBoard({ items }: { items: RoadmapItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const counts = items.reduce<Record<string, number>>((acc, it) => {
    acc[it.status] = (acc[it.status] ?? 0) + 1;
    return acc;
  }, {});

  const visible = filter === "all" ? items : items.filter((it) => it.status === filter);

  // Group visible items by theme, preserving the fixed theme order and the
  // incoming sort_order (the server already ordered the array).
  const groups: { theme: string; rows: RoadmapItem[] }[] = THEME_ORDER
    .map((theme) => ({ theme: theme as string, rows: visible.filter((it) => it.theme === theme) }))
    .filter((g) => g.rows.length > 0);

  // Any items whose theme is not in the fixed list still get shown, last.
  const extra = visible.filter((it) => !THEME_ORDER.includes(it.theme as (typeof THEME_ORDER)[number]));
  if (extra.length > 0) {
    const extraThemes: string[] = [];
    for (const it of extra) {
      if (!extraThemes.includes(it.theme)) extraThemes.push(it.theme);
    }
    for (const theme of extraThemes) {
      groups.push({ theme, rows: extra.filter((it) => it.theme === theme) });
    }
  }

  return (
    <div>
      {/* Filter chips, matching the analytics period chips. */}
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const n = f.value === "all" ? items.length : counts[f.value] ?? 0;
          const isActive = filter === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={[
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50",
              ].join(" ")}
            >
              {f.label}
              <span
                className={[
                  "rounded px-1 text-xs tabular-nums",
                  isActive ? "text-stone-300" : "text-stone-400",
                ].join(" ")}
              >
                {n}
              </span>
            </button>
          );
        })}
      </div>

      {groups.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
          Nothing here. Try another filter.
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.theme} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
              <header className="flex items-center justify-between border-b border-stone-100 bg-stone-50/60 px-4 py-2.5">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  {g.theme}
                </h2>
                <span className="text-xs tabular-nums text-stone-400">{g.rows.length}</span>
              </header>
              <ul className="divide-y divide-stone-100">
                {g.rows.map((it) => (
                  <RoadmapRow key={it.id} item={it} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
