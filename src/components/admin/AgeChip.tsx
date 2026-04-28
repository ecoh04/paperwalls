// SLA chip: how long an order has been at its current status. Green when
// fresh, amber once it crosses the 'should have moved by now' threshold,
// red once it's clearly stuck. Thresholds per status are tuned to our
// 5-business-day production promise.
//
// Source-of-truth field is last_activity_at (updated whenever the operator
// touches the order). Fallback to updated_at, then created_at — that way
// a freshly-imported order without activity still reads sensibly.

import type { OrderStatus } from "@/types/order";

type Props = {
  status:           OrderStatus;
  lastActivityAt:   string | null;
  updatedAt:        string;
  createdAt:        string;
};

// Thresholds in hours: green up to `ok`, amber from `ok` → `warn`, red beyond.
const THRESHOLDS: Partial<Record<OrderStatus, { ok: number; warn: number; alertCopy: string }>> = {
  new:           { ok: 24,  warn: 48,  alertCopy: "Move to production"   },
  in_production: { ok: 96,  warn: 144, alertCopy: "Should be shipped" },     // 4d / 6d
  shipped:       { ok: 168, warn: 240, alertCopy: "Check tracking"     },     // 7d / 10d
};

function fmtAge(hours: number): string {
  if (hours < 1)  return "just now";
  if (hours < 24) return `${Math.floor(hours)}h`;
  const days = hours / 24;
  if (days < 14)  return `${Math.floor(days)}d`;
  return `${Math.floor(days / 7)}w`;
}

export function AgeChip({ status, lastActivityAt, updatedAt, createdAt }: Props) {
  const ts =
    lastActivityAt
      ? new Date(lastActivityAt).getTime()
      : updatedAt
        ? new Date(updatedAt).getTime()
        : new Date(createdAt).getTime();
  const hours = (Date.now() - ts) / (60 * 60 * 1000);

  const thresholds = THRESHOLDS[status];

  // Statuses we don't actively track SLA on: pending (abandoned-at-PayFast),
  // delivered (done), cancelled. Just show muted age.
  if (!thresholds) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-500">
        {fmtAge(hours)} in {status === "in_production" ? "production" : status}
      </span>
    );
  }

  let cls = "bg-green-50 text-green-800 ring-1 ring-green-200";
  let title = `Within SLA (${Math.round(hours)}h)`;
  if (hours > thresholds.warn) {
    cls = "bg-red-50 text-red-800 ring-1 ring-red-200";
    title = `Past SLA: ${thresholds.alertCopy}`;
  } else if (hours > thresholds.ok) {
    cls = "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
    title = `Approaching SLA: ${thresholds.alertCopy}`;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}
      title={title}
    >
      {fmtAge(hours)}
    </span>
  );
}
