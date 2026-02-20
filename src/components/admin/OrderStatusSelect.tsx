"use client";

import { useRouter } from "next/navigation";
import { ORDER_STATUS_LABELS } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

const STATUSES: OrderStatus[] = ["new", "in_production", "shipped", "delivered"];

type Props = {
  orderId: string;
  currentStatus: OrderStatus;
};

export function OrderStatusSelect({ orderId, currentStatus }: Props) {
  const router = useRouter();

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const status = e.target.value as OrderStatus;
    const res = await fetch(`/api/admin/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <select
      value={currentStatus}
      onChange={handleChange}
      className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {ORDER_STATUS_LABELS[s]}
        </option>
      ))}
    </select>
  );
}
