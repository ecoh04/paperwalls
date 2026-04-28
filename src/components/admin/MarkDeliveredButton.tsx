"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { markOrderDelivered } from "@/app/admin/orders/actions";

type Props = { orderId: string };

export function MarkDeliveredButton({ orderId }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    if (!confirm("Mark as delivered and email the customer?")) return;
    startTransition(async () => {
      const result = await markOrderDelivered(orderId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50"
      >
        {isPending ? "Working…" : "Mark delivered & notify customer"}
      </button>
      {error && <span className="text-sm font-medium text-red-700">{error}</span>}
    </div>
  );
}
