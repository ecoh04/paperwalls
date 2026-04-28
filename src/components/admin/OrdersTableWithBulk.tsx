"use client";

import { useState } from "react";
import Link from "next/link";
import { formatZarCents } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";
import { OrderRowActions } from "./OrderRowActions";
import { OrdersBulkBar } from "./OrdersBulkBar";
import { OrderTypeBadge } from "./OrderTypeBadge";
import {
  updateOrderStatus,
  bulkUpdateStatus,
} from "@/app/admin/orders/actions";

type OrderRow = {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  total_cents: number;
  created_at: string;
  updated_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  wall_count: number;
  wall_width_m: number | null;
  wall_height_m: number | null;
  total_sqm?: number | null;
  quantity?: number;
  wallpaper_style: string | null;
  application_method?: string | null;
  product_type?: string;
  customer_email?: string;
  utm_source?: string | null;
  last_activity_at: string | null;
  last_activity_preview: string | null;
  refunded_at: string | null;
};

const FINISH_LABEL: Record<string, string> = {
  satin:    "Satin",
  matte:    "Matte",
  linen:    "Linen",
  textured: "Textured",
  premium:  "Premium",
};

function describeOrderSpec(row: OrderRow): string {
  if (row.product_type === "sample_pack") {
    return `Sample pack · qty ${row.quantity ?? 1}`;
  }
  const parts: string[] = [];
  if (row.wall_count) parts.push(`${row.wall_count} wall${row.wall_count === 1 ? "" : "s"}`);
  if (row.total_sqm)  parts.push(`${Number(row.total_sqm).toFixed(1)} m²`);
  if (row.wallpaper_style) parts.push(FINISH_LABEL[row.wallpaper_style] ?? row.wallpaper_style);
  return parts.join(" · ") || "—";
}

type Props = {
  orders: OrderRow[];
  isAdmin: boolean;
};

export function OrdersTableWithBulk({ orders, isAdmin }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-12 text-center text-stone-500 shadow-sm">
        No orders match the current filters.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <OrdersBulkBar
          selectedIds={Array.from(selectedIds)}
          bulkUpdateStatus={bulkUpdateStatus}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead>
              <tr className="bg-stone-50">
                {isAdmin && (
                  <th className="w-10 px-2 py-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === orders.length}
                      onChange={toggleAll}
                      className="rounded border-stone-300"
                    />
                  </th>
                )}
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                  Spec
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                  Created
                </th>
                <th className="relative w-20 px-4 py-3 sm:px-6">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {orders.map((row) => {
                const status   = (row.status ?? "pending") as OrderStatus;
                const isSample = row.product_type === "sample_pack";
                // Left-edge accent so even a glance at the table separates
                // sample-pack orders (sky) from wallpaper orders (amber).
                const accentClass = isSample
                  ? "border-l-4 border-l-sky-400"
                  : "border-l-4 border-l-amber-400";
                // Status-driven row tint. Pending = amber (urgent: why
                // hasn't this paid?). Delivered = stone (done, fade back).
                const tint =
                  status === "pending"   ? "bg-amber-50/60"
                  : status === "delivered" ? "bg-stone-50/40"
                  : "bg-white";
                return (
                  <tr
                    key={row.id}
                    className={`${tint} transition hover:bg-stone-50 ${accentClass} ${
                      row.refunded_at ? "opacity-60" : ""
                    }`}
                  >
                    {isAdmin && (
                      <td className="w-10 px-2 py-3">
                        {status !== "cancelled" && (
                          <input
                            type="checkbox"
                            checked={selectedIds.has(row.id)}
                            onChange={() => toggle(row.id)}
                            className="rounded border-stone-300"
                          />
                        )}
                      </td>
                    )}
                    <td className="whitespace-nowrap px-3 py-3">
                      <OrderTypeBadge type={row.product_type} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-medium text-stone-900 sm:px-6">
                      {row.order_number}
                    </td>
                    <td className="max-w-[160px] truncate px-4 py-3 text-sm text-stone-600 sm:px-6">
                      {row.customer_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-stone-700 sm:px-6">
                      <div className="flex items-center gap-1.5">
                        <span>{describeOrderSpec(row)}</span>
                        {row.application_method === "pro_installer" && (
                          <span
                            title="Pro installer required — arrange externally; we may ship to the installer or they collect"
                            className="inline-flex items-center gap-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-800 ring-1 ring-purple-200"
                          >
                            <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M11.49 3.17a.75.75 0 011.06 0l4.28 4.28a.75.75 0 010 1.06l-9.42 9.42a.75.75 0 01-.32.19l-4.28 1.21a.75.75 0 01-.92-.92l1.21-4.28a.75.75 0 01.19-.32l9.42-9.64z" />
                            </svg>
                            Pro
                          </span>
                        )}
                        {row.product_type === "wallpaper" && row.application_method === "diy" && (
                          <span className="text-[10px] font-medium text-stone-400">DIY</span>
                        )}
                      </div>
                    </td>
                    <OrderRowActions
                      orderId={row.id}
                      currentStatus={status}
                      updateStatus={updateOrderStatus}
                      createdAt={row.created_at}
                      isAdmin={isAdmin}
                    />
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-medium text-stone-900 sm:px-6">
                      {formatZarCents(Number(row.total_cents))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-stone-500 sm:px-6">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                      <Link
                        href={`/admin/orders/${row.id}`}
                        className="text-sm font-medium text-amber-600 hover:text-amber-700"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
