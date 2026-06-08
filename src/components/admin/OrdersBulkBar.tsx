"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

type BulkResult = {
  error?: string;
  moved?: number;
  skipped?: { id: string; error: string }[];
};

type Props = {
  selectedIds: string[];
  bulkUpdateStatus: (orderIds: string[], status: string) => Promise<BulkResult>;
  onClearSelection: () => void;
};

export function OrdersBulkBar({ selectedIds, bulkUpdateStatus, onClearSelection }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusValue, setStatusValue] = useState<OrderStatus>("new");
  const [notice, setNotice] = useState<string | null>(null);

  if (selectedIds.length === 0) return null;

  function handleBulkStatus() {
    setNotice(null);
    startTransition(async () => {
      const res = await bulkUpdateStatus(selectedIds, statusValue);
      if (res?.error) {
        setNotice(res.error);
        return;
      }
      const skipped = res?.skipped?.length ?? 0;
      if (skipped > 0) {
        // Surface partial failures instead of silently clearing — e.g. orders
        // blocked by the in-production pre-flight gate or the delivered guard.
        setNotice(`${res?.moved ?? 0} updated, ${skipped} skipped (${res!.skipped![0].error})`);
        router.refresh();
        return;
      }
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
      {notice && (
        <p className="w-full text-sm font-medium text-amber-900">{notice}</p>
      )}
    </div>
  );
}
