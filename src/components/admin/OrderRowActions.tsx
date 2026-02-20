"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

const STATUSES: OrderStatus[] = ["new", "in_production", "shipped", "delivered"];

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
  updateStatus: (orderId: string, status: string) => Promise<{ error?: string }>;
  createdAt: string;
  isAdmin: boolean;
};

export function OrderRowActions({
  orderId,
  currentStatus,
  updateStatus,
  createdAt,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const daysInStatus =
    currentStatus === "new" || currentStatus === "in_production"
      ? Math.floor(
          (Date.now() - new Date(createdAt).getTime()) / (24 * 60 * 60 * 1000)
        )
      : null;
  const isOverdue = daysInStatus !== null && daysInStatus >= 5;

  function handleStatusChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as OrderStatus;
    startTransition(async () => {
      const result = await updateStatus(orderId, status);
      if (!result?.error) router.refresh();
    });
  }

  const badgeClass =
    currentStatus === "cancelled"
      ? "rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600"
      : currentStatus === "pending"
        ? "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
        : "rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700";

  return (
    <td className="whitespace-nowrap px-4 py-3 sm:px-6">
      <span className="inline-flex items-center gap-1.5">
        {isOverdue && (
          <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
            {daysInStatus}d
          </span>
        )}
        {currentStatus === "pending" || currentStatus === "cancelled" || !isAdmin ? (
          <span className={badgeClass}>{ORDER_STATUS_LABELS[currentStatus]}</span>
        ) : (
          <select
            value={currentStatus}
            onChange={handleStatusChange}
            disabled={isPending}
            className="rounded border border-stone-300 bg-white px-2 py-1 text-xs font-medium text-stone-900 disabled:opacity-50"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        )}
      </span>
    </td>
  );
}
