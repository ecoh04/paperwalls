// Pure data + types for the analytics period selector. Lives outside the
// client component so server components (analytics/page.tsx) can import it
// without crossing the use-client serialization boundary.

export const WINDOW_PRESETS = [
  { value: "today",      label: "Today" },
  { value: "yesterday",  label: "Yesterday" },
  { value: "7d",         label: "Last 7 days" },
  { value: "30d",        label: "Last 30 days" },
  { value: "90d",        label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "last_month", label: "Last month" },
  { value: "this_year",  label: "This year" },
] as const;

// Kept as an alias for any older imports.
export const WINDOW_OPTIONS = WINDOW_PRESETS;

export type WindowValue = typeof WINDOW_PRESETS[number]["value"];

export function isWindowValue(s: string | undefined | null): s is WindowValue {
  return !!s && WINDOW_PRESETS.some((o) => o.value === s);
}

/** A YYYY-MM-DD string (loose check — full validity is enforced server-side). */
export function isYmd(s: string | undefined | null): s is string {
  return !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
}
