"use client";

import { useState } from "react";
import Link from "next/link";
import { ORDER_STATUS_LABELS, formatZarCents, STYLE_LABELS } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";
import { OrderRowActions } from "./OrderRowActions";
import { OrdersBulkBar } from "./OrdersBulkBar";
import {
  updateOrderStatus,
  bulkUpdateStatus,
  bulkAssignFactory,
} from "@/app/admin/orders/actions";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  new: "bg-emerald-100 text-emerald-800",
  in_production: "bg-blue-100 text-blue-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-stone-200 text-stone-700",
  cancelled: "bg-stone-200 text-stone-600",
};

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
  assigned_factory_id: string | null;
  wall_count: number;
  wall_width_m: number;
  wall_height_m: number;
  wallpaper_style: string;
  last_activity_at: string | null;
  last_activity_preview: string | null;
  refunded_at: string | null;
  factories: { code: string; name: string } | null;
};

type Props = {
  orders: OrderRow[];
  factories: { id: string; name: string }[];
  isAdmin: boolean;
};

export function OrdersTableWithBulk({ orders, factories, isAdmin }: Props) {
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
          factories={factories}
          bulkUpdateStatus={bulkUpdateStatus}
          bulkAssignFactory={bulkAssignFactory}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      )}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead>
              <tr className="bg-stone-50">
                <th className="w-10 px-2 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === orders.length}
                    onChange={toggleAll}
                    className="rounded border-stone-300"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                  Customer
                </th>
                {isAdmin && (
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Factory
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                  Spec
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                  Last activity
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
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                  Shipped
                </th>
                <th className="relative px-4 py-3 sm:px-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {orders.map((row) => {
                const status = (row.status ?? "pending") as OrderStatus;
                return (
                  <tr
                    key={row.id}
                    className={`bg-white transition hover:bg-stone-50/80 ${
                      row.refunded_at ? "opacity-75" : ""
                    }`}
                  >
                    <td className="w-10 px-2 py-4">
                      {status !== "cancelled" && (
                        <input
                          type="checkbox"
                          checked={selectedIds.has(row.id)}
                          onChange={() => toggle(row.id)}
                          className="rounded border-stone-300"
                        />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-sm font-medium text-stone-900 sm:px-6">
                      {row.order_number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-600 sm:px-6">
                      {row.customer_name}
                    </td>
                    {isAdmin && (
                      <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-500 sm:px-6">
                        {row.factories?.name ?? "—"}
                      </td>
                    )}
                    <OrderRowActions
                      orderId={row.id}
                      orderNumber={row.order_number}
                      currentStatus={status}
                      updateStatus={updateOrderStatus}
                      wallCount={row.wall_count}
                      wallWidth={row.wall_width_m}
                      wallHeight={row.wall_height_m}
                      wallpaperStyle={row.wallpaper_style}
                      lastActivityPreview={row.last_activity_preview}
                      createdAt={row.created_at}
                    />
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-stone-900 sm:px-6">
                      {formatZarCents(Number(row.total_cents))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-500 sm:px-6">
                      {row.created_at
                        ? new Date(row.created_at).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-500 sm:px-6">
                      {row.shipped_at
                        ? new Date(row.shipped_at).toLocaleDateString("en-ZA", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"}
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
