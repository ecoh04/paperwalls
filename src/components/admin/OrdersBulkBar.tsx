"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

type Props = {
  selectedIds: string[];
  bulkUpdateStatus: (orderIds: string[], status: string) => Promise<{ error?: string }>;
  onClearSelection: () => void;
};

export function OrdersBulkBar({ selectedIds, bulkUpdateStatus, onClearSelection }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusValue, setStatusValue] = useState<OrderStatus>("new");

  if (selectedIds.length === 0) return null;

  function handleBulkStatus() {
    startTransition(async () => {
      await bulkUpdateStatus(selectedIds, statusValue);
      onClearSelection();
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <span className="font-medium text-stone-900">
        {selectedIds.length} selected
      </span>
      <select
        value={statusValue}
        onChange={(e) => setStatusValue(e.target.value as OrderStatus)}
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
      >
        {(["new", "in_production", "shipped", "delivered"] as const).map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleBulkStatus}
        disabled={isPending}
        className="rounded-lg bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50"
      >
        Set status
      </button>
      <button
        type="button"
        onClick={onClearSelection}
        className="text-sm text-stone-500 hover:text-stone-900"
      >
        Clear selection
      </button>
    </div>
  );
}
