// Snapshot of every transactional email queued or sent for this order.
// Server component — reads scheduled_emails directly via the SSR Supabase
// client. Sits next to the activity log so support can answer "did the
// customer get the confirmation?" without checking Supabase by hand.

import { createClient } from "@/lib/supabase/server";

type Row = {
  id:               string;
  type:             string;
  status:           string;
  subject:          string | null;
  send_at:          string;
  sent_at:          string | null;
  last_attempt_at:  string | null;
  attempts:         number;
  error:            string | null;
};

const TYPE_LABELS: Record<string, string> = {
  order_confirmed:  "Order confirmed",
  order_shipped:    "Shipped",
  order_delivered:  "Delivered",
  abandoned_cart:   "Abandoned cart",
  review_request:   "Review request",
  win_back:         "Win-back",
};

const STATUS_STYLES: Record<string, string> = {
  sent:      "bg-green-100 text-green-800",
  pending:   "bg-amber-100 text-amber-800",
  failed:    "bg-red-100 text-red-800",
  cancelled: "bg-stone-200 text-stone-700",
};

function fmt(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-ZA", {
    day:   "numeric",
    month: "short",
    hour:   "2-digit",
    minute: "2-digit",
  });
}

export async function EmailHistoryPanel({ orderId }: { orderId: string }) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scheduled_emails")
    .select("id, type, status, subject, send_at, sent_at, last_attempt_at, attempts, error")
    .eq("order_id", orderId)
    .order("send_at", { ascending: false });

  const rows = (data ?? []) as Row[];

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-stone-900">Customer emails</h2>
        <span className="text-xs text-stone-500">{rows.length} on file</span>
      </div>
      <p className="mt-1 text-sm text-stone-500">
        What we&rsquo;ve queued or sent to this customer for this order. Drainer runs every 5 min.
      </p>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-stone-500">
          No transactional emails for this order yet.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-200">
          {rows.map((r) => (
            <li key={r.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-stone-900">
                    {TYPE_LABELS[r.type] ?? r.type}
                  </span>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      STATUS_STYLES[r.status] ?? "bg-stone-100 text-stone-700"
                    }`}
                  >
                    {r.status}
                  </span>
                  {r.attempts > 0 && r.status === "pending" && (
                    <span className="text-xs text-stone-500">
                      attempt {r.attempts}
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-500">
                  {r.status === "sent"
                    ? `sent ${fmt(r.sent_at)}`
                    : r.status === "pending"
                      ? `due ${fmt(r.send_at)}`
                      : r.status === "failed"
                        ? `failed ${fmt(r.last_attempt_at)}`
                        : fmt(r.send_at)}
                </span>
              </div>
              {r.subject && (
                <p className="mt-1 text-xs text-stone-600 line-clamp-1" title={r.subject}>
                  {r.subject}
                </p>
              )}
              {r.error && (
                <p className="mt-1 rounded-md bg-red-50 px-2 py-1 text-xs text-red-800">
                  {r.error}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
