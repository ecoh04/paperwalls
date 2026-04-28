// Pure data + types for the analytics window toggle. Lives outside the
// client component so server components (analytics/page.tsx) can import
// it without crossing the use-client serialization boundary.

export const WINDOW_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d",    label: "7 days" },
  { value: "30d",   label: "30 days" },
  { value: "90d",   label: "90 days" },
] as const;

export type WindowValue = typeof WINDOW_OPTIONS[number]["value"];
