"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { resendCustomerEmail } from "@/app/admin/orders/actions";

type EmailType = "order_confirmed" | "order_shipped" | "order_delivered";

const LABELS: Record<EmailType, string> = {
  order_confirmed: "Resend confirmation",
  order_shipped:   "Resend shipped",
  order_delivered: "Resend delivered",
};

type Props = {
  orderId:     string;
  status:      string;
  hasTracking: boolean;
  /** ISO timestamp of the most recent successful send for each type. */
  lastSent?:   Partial<Record<EmailType, string>>;
};

function timeAgo(iso?: string): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0)             return null;
  const min = Math.floor(ms / 60000);
  if (min < 1)            return "just now";
  if (min < 60)           return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24)            return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  if (d < 14)             return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export function ResendEmailButtons({ orderId, status, hasTracking, lastSent = {} }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busy, setBusy] = useState<EmailType | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Only show buttons that make sense for the order's current state
  const types: EmailType[] = [];
  types.push("order_confirmed");
  if (status === "shipped" || status === "delivered") {
    if (hasTracking) types.push("order_shipped");
  }
  if (status === "delivered") types.push("order_delivered");

  function handle(type: EmailType) {
    if (!confirm(`Re-send ${type.replace("_", " ")} email to the customer?`)) return;
    setBusy(type);
    setFeedback(null);
    startTransition(async () => {
      const result = await resendCustomerEmail(orderId, type);
      setBusy(null);
      if (result.error) {
        setFeedback(result.error);
        return;
      }
      setFeedback("Queued — sends within 5 min.");
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {types.map((t) => {
          const ago = timeAgo(lastSent[t]);
          return (
            <button
              key={t}
              type="button"
              onClick={() => handle(t)}
              disabled={isPending}
              className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-left text-xs font-medium text-stone-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"
              title={lastSent[t] ? `Last sent ${new Date(lastSent[t]!).toLocaleString("en-ZA")}` : "Never sent"}
            >
              <span className="block">{busy === t ? "Queueing…" : LABELS[t]}</span>
              {ago && (
                <span className="block text-[10px] font-normal text-stone-500">last sent {ago}</span>
              )}
            </button>
          );
        })}
      </div>
      {feedback && <span className="text-xs text-stone-600">{feedback}</span>}
    </div>
  );
}
