"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ORDER_STATUS_LABELS, STYLE_LABELS } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

const STATUSES: OrderStatus[] = ["new", "in_production", "shipped", "delivered"];

type Props = {
  orderId: string;
  orderNumber: string;
  currentStatus: OrderStatus;
  updateStatus: (orderId: string, status: string) => Promise<{ error?: string }>;
  wallCount: number;
  wallWidth: number;
  wallHeight: number;
  wallpaperStyle: string;
  lastActivityPreview: string | null;
  createdAt: string;
};

export function OrderRowActions({
  orderId,
  orderNumber,
  currentStatus,
  updateStatus,
  wallCount,
  wallWidth,
  wallHeight,
  wallpaperStyle,
  lastActivityPreview,
  createdAt,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const specSummary =
    wallCount === 1
      ? `1 wall · ${Number(wallWidth).toFixed(1)}×${Number(wallHeight).toFixed(1)} m · ${STYLE_LABELS[wallpaperStyle as keyof typeof STYLE_LABELS] ?? wallpaperStyle}`
      : `${wallCount} walls · ${STYLE_LABELS[wallpaperStyle as keyof typeof STYLE_LABELS] ?? wallpaperStyle}`;

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

  return (
    <>
      <td className="max-w-[140px] px-4 py-4 text-xs text-stone-500 sm:px-6">
        <span className="truncate" title={specSummary}>
          {specSummary}
        </span>
      </td>
      <td className="max-w-[160px] px-4 py-4 text-xs text-stone-500 sm:px-6">
        <span className="truncate block" title={lastActivityPreview ?? undefined}>
          {lastActivityPreview ?? "—"}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-4 sm:px-6">
        {currentStatus === "pending" || currentStatus === "cancelled" ? (
          <span
            className={
              currentStatus === "cancelled"
                ? "rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600"
                : "rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800"
            }
          >
            {ORDER_STATUS_LABELS[currentStatus]}
          </span>
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
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
        {isOverdue && (
          <span className="mr-2 rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
            {daysInStatus}d
          </span>
        )}
        <Link
          href={`/admin/orders/${orderId}`}
          className="text-sm font-medium text-amber-600 hover:text-amber-700"
        >
          Open →
        </Link>
      </td>
    </>
  );
}
