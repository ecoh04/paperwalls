"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

type Factory = { id: string; name: string };

type Props = {
  selectedIds: string[];
  factories: Factory[];
  bulkUpdateStatus: (orderIds: string[], status: string) => Promise<{ error?: string }>;
  bulkAssignFactory: (orderIds: string[], factoryId: string | null) => Promise<{ error?: string }>;
  onClearSelection: () => void;
};

export function OrdersBulkBar({
  selectedIds,
  factories,
  bulkUpdateStatus,
  bulkAssignFactory,
  onClearSelection,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [statusValue, setStatusValue] = useState<OrderStatus>("new");
  const [factoryValue, setFactoryValue] = useState<string>("");

  if (selectedIds.length === 0) return null;

  function handleBulkStatus() {
    startTransition(async () => {
      await bulkUpdateStatus(selectedIds, statusValue);
      onClearSelection();
      router.refresh();
    });
  }

  function handleBulkAssign() {
    const fid = factoryValue === "" ? null : factoryValue;
    startTransition(async () => {
      await bulkAssignFactory(selectedIds, fid);
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
      {factories.length > 0 && (
        <>
          <select
            value={factoryValue}
            onChange={(e) => setFactoryValue(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Unassigned</option>
            {factories.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleBulkAssign}
            disabled={isPending}
            className="rounded-lg bg-stone-700 px-4 py-2 text-sm font-medium text-white hover:bg-stone-600 disabled:opacity-50"
          >
            Assign factory
          </button>
        </>
      )}
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
