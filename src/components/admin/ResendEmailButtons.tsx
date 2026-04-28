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
  orderId: string;
  status:  string;
  hasTracking: boolean;
};

export function ResendEmailButtons({ orderId, status, hasTracking }: Props) {
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
    <div className="flex flex-wrap items-center gap-2">
      {types.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => handle(t)}
          disabled={isPending}
          className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-800 disabled:opacity-50"
        >
          {busy === t ? "Queueing…" : LABELS[t]}
        </button>
      ))}
      {feedback && <span className="text-xs text-stone-600">{feedback}</span>}
    </div>
  );
}
