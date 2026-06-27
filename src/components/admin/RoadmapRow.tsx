"use client";

import { useState, useTransition } from "react";
import { setRoadmapStatus, type RoadmapStatus } from "@/app/admin/roadmap/actions";

// One roadmap item on the board. The founder taps one of the 5 status buttons
// to move the item; we fire the server action via a transition and show the
// same saving / saved feedback as SpendInput. Optimistic local state keeps the
// active button lit immediately so it feels instant on a phone.

export type RoadmapItem = {
  id: string;
  title: string;
  theme: string;
  status: RoadmapStatus;
  priority: "high" | "medium" | "low" | null;
  note: string | null;
};

// status -> { label, dot colour, active button styles }. done = green,
// now = terracotta (urgent), next = amber, later = stone, parked = muted.
const STATUS_META: Record<
  RoadmapStatus,
  { label: string; dot: string; active: string }
> = {
  now:    { label: "Now",    dot: "bg-pw-accent",  active: "bg-pw-accent text-white" },
  next:   { label: "Next",   dot: "bg-amber-500",  active: "bg-amber-500 text-white" },
  later:  { label: "Later",  dot: "bg-stone-400",  active: "bg-stone-500 text-white" },
  done:   { label: "Done",   dot: "bg-green-500",  active: "bg-green-600 text-white" },
  parked: { label: "Parked", dot: "bg-stone-300",  active: "bg-stone-400 text-white" },
};

const ORDER: RoadmapStatus[] = ["now", "next", "later", "done", "parked"];

export function RoadmapRow({ item }: { item: RoadmapItem }) {
  const [status, setStatus] = useState<RoadmapStatus>(item.status);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const change = (next: RoadmapStatus) => {
    if (next === status) return;
    const prev = status;
    setStatus(next); // optimistic
    setError(null);
    start(async () => {
      const res = await setRoadmapStatus(item.id, next);
      if (!res.ok) {
        setStatus(prev); // roll back
        setError(res.error ?? "Could not save");
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    });
  };

  const dimmed = status === "done" || status === "parked";

  return (
    <li
      className={[
        "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        dimmed ? "opacity-60" : "",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          aria-hidden
          className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_META[status].dot}`}
        />
        <div className="min-w-0">
          <p
            className={[
              "text-sm font-medium text-stone-900",
              status === "done" ? "line-through decoration-stone-300" : "",
            ].join(" ")}
          >
            {item.title}
            {item.priority === "high" && status !== "done" && status !== "parked" && (
              <span className="ml-2 inline-block rounded bg-pw-accent-soft px-1.5 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-pw-accent">
                High
              </span>
            )}
          </p>
          {item.note && (
            <p className="mt-0.5 text-xs leading-relaxed text-stone-500">{item.note}</p>
          )}
          {error && (
            <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:pl-4">
        <div className="inline-flex overflow-hidden rounded-lg border border-stone-200">
          {ORDER.map((s, i) => {
            const isActive = s === status;
            return (
              <button
                key={s}
                type="button"
                onClick={() => change(s)}
                disabled={pending}
                aria-pressed={isActive}
                className={[
                  "px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-wait",
                  i > 0 ? "border-l border-stone-200" : "",
                  isActive
                    ? STATUS_META[s].active
                    : "bg-white text-stone-500 hover:bg-stone-50 hover:text-stone-800",
                ].join(" ")}
              >
                {STATUS_META[s].label}
              </button>
            );
          })}
        </div>
        <span className="w-4 text-center text-xs" aria-live="polite">
          {pending ? (
            <span className="text-stone-400">…</span>
          ) : saved ? (
            <span aria-hidden className="text-green-600">✓</span>
          ) : null}
        </span>
      </div>
    </li>
  );
}
