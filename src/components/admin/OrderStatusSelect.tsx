"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

const STATUSES: OrderStatus[] = ["new", "in_production", "shipped", "delivered"];

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  updateStatus: (orderId: string, status: string) => Promise<{ error?: string; note?: string }>;
};

export function OrderStatusSelect({ orderId, currentStatus, updateStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as OrderStatus;
    setError(null);
    setNote(null);
    startTransition(async () => {
      const result = await updateStatus(orderId, status);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (result?.note) {
        setNote(result.note);
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={currentStatus}
        onChange={handleChange}
        disabled={isPending}
        className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {error && (
        <p className="max-w-xs rounded-md bg-red-50 px-2 py-1 text-right text-xs font-medium text-red-800 ring-1 ring-red-200">
          {error}
        </p>
      )}
      {note && (
        <p className="max-w-xs rounded-md bg-amber-50 px-2 py-1 text-right text-xs font-medium text-amber-800 ring-1 ring-amber-200">
          {note}
        </p>
      )}
    </div>
  );
}
