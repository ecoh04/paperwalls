import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { ORDER_STATUS_LABELS, formatZarCents } from "@/lib/admin-labels";
import type { OrderStatus } from "@/types/order";

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  new: "bg-emerald-100 text-emerald-800",
  in_production: "bg-blue-100 text-blue-800",
  shipped: "bg-violet-100 text-violet-800",
  delivered: "bg-stone-200 text-stone-700",
};

export const dynamic = "force-dynamic";

type SearchParams = { status?: string };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { status: statusFilter } = await searchParams;
  const validStatus = [
    "pending",
    "new",
    "in_production",
    "shipped",
    "delivered",
  ].includes(statusFilter ?? "")
    ? (statusFilter as OrderStatus)
    : null;

  if (!supabase) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-800">
        <p className="font-medium">Database not configured.</p>
        <p className="mt-1 text-sm">Add Supabase env vars and redeploy.</p>
      </div>
    );
  }

  let query = supabase
    .from("orders")
    .select("id, order_number, customer_name, status, total_cents, created_at")
    .order("created_at", { ascending: false });

  if (validStatus) {
    query = query.eq("status", validStatus);
  }

  const { data: orders, error } = await query;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <p className="font-medium">Error loading orders</p>
        <p className="mt-1 text-sm">{error.message}</p>
      </div>
    );
  }

  const list = orders ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Orders</h1>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/orders"
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              !validStatus
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
            }`}
          >
            All
          </Link>
          {(["new", "in_production", "shipped", "delivered", "pending"] as const).map((s) => (
            <Link
              key={s}
              href={`/admin/orders?status=${s}`}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                validStatus === s
                  ? "bg-stone-900 text-white"
                  : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"
              }`}
            >
              {ORDER_STATUS_LABELS[s]}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        {list.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            {validStatus
              ? `No orders with status "${ORDER_STATUS_LABELS[validStatus]}".`
              : "No orders yet."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200">
              <thead>
                <tr className="bg-stone-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Order
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-stone-500 sm:px-6">
                    Date
                  </th>
                  <th className="relative px-4 py-3 sm:px-6">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {list.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white transition hover:bg-stone-50/80"
                  >
                    <td className="whitespace-nowrap px-4 py-4 font-mono text-sm font-medium text-stone-900 sm:px-6">
                      {row.order_number}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-600 sm:px-6">
                      {row.customer_name}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 sm:px-6">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          STATUS_COLORS[(row.status as OrderStatus) ?? "pending"]
                        }`}
                      >
                        {ORDER_STATUS_LABELS[(row.status as OrderStatus) ?? "pending"]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium text-stone-900 sm:px-6">
                      {formatZarCents(Number(row.total_cents))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-stone-500 sm:px-6">
                      {new Date(row.created_at).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="whitespace-nowrap px-4 py-4 text-right sm:px-6">
                      <Link
                        href={`/admin/orders/${row.id}`}
                        className="text-sm font-medium text-amber-600 hover:text-amber-700"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
